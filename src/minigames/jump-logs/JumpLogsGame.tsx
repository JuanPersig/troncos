import React, { useEffect, useRef, useState } from 'react';
import { MiniGameProps } from '@/minigames/types';
import { GameResults } from '@/core/types';
import { socketService } from '@/services/socket';
import { eventBus } from '@/core/events';

import { JUMP_LOGS_CONFIG } from './config';
import { JumpLogsAudio } from './audio';
import { GroundDetail, Tronco, RunnerEntity, createRunner, getFromPool, mulberry32 } from './entities';
import { drawBackground, drawHUD } from './renderer';

interface GameEngineState {
    gameRunning: boolean;
    canRestart: boolean;
    score: number;
    gameSpeed: number;
    lastTime: number;
    obstaclePool: Tronco[];
    groundPool: GroundDetail[];
    spawnTimer: number;
    groundSpawnTimer: number;
    animationId: number;
    players: RunnerEntity[];
    hasStarted: boolean;
    dayNightTimer: number;
}

const JumpLogsGame: React.FC<MiniGameProps> = ({ roomCode, localSlot, players, isHost, localStream, onGameEnd }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [gameRunning, setGameRunning] = useState(true);
    const [canRestart, setCanRestart] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [score, setScore] = useState(0);

    const mutedRef = useRef(false);
    const startTimeRef = useRef(Date.now());

    useEffect(() => {
        mutedRef.current = isMuted;
    }, [isMuted]);

    const createInitialPlayers = () => [
        createRunner(0, players[0]?.name || 'P1'),
        createRunner(1, players[1]?.name || 'P2'),
        createRunner(2, players[2]?.name || 'P3'),
    ];

    const engineRef = useRef<GameEngineState>({
        gameRunning: true,
        canRestart: false,
        score: 0,
        gameSpeed: JUMP_LOGS_CONFIG.INITIAL_SPEED,
        lastTime: 0,
        obstaclePool: Array.from({ length: 12 }, () => new Tronco()),
        groundPool: Array.from({ length: 50 }, () => new GroundDetail()),
        spawnTimer: 0.5,
        groundSpawnTimer: 0,
        animationId: 0,
        players: createInitialPlayers(),
        hasStarted: true,
        dayNightTimer: 0
    });

    const rngRef = useRef<() => number>(mulberry32(123456));

    useEffect(() => {
        const engine = engineRef.current;
        players.forEach(p => {
            if (engine.players[p.slot]) {
                engine.players[p.slot].name = p.name;
                engine.players[p.slot].isBot = !!p.isBot;
            }
        });
    }, [players]);

    const checkGameOver = () => {
        const engine = engineRef.current;
        const activePlayers = engine.players.filter(p => p.lives > 0);
        if (activePlayers.length === 0 && engine.gameRunning) {
            engine.gameRunning = false;
            engine.canRestart = false;
            setGameRunning(false);

            setTimeout(() => {
                engine.canRestart = true;
                setCanRestart(true);
            }, 1000);
        }
    };

    const handlePlayerCollision = (player: RunnerEntity, tronco: Tronco) => {
        if (player.slot !== localSlot && (!player.isBot || !isHost)) return;
        if (player.lives <= 0 || player.invulnerableTimer > 0) return;

        const paddingX = 6;
        const paddingY = 4;
        if (
            player.x + paddingX < tronco.x + tronco.width - paddingX &&
            player.x + player.width - paddingX > tronco.x + paddingX &&
            player.y + paddingY < tronco.y + tronco.height - paddingY &&
            player.y + player.height - paddingY > tronco.y + paddingY
        ) {
            player.lives -= 1;
            player.invulnerableTimer = 1.2;

            if (!mutedRef.current) JumpLogsAudio.playHit();

            socketService.sendHit(roomCode, player.slot, player.lives);
        }
    };

    const spawnObstacle = (dt: number) => {
        const engine = engineRef.current;
        engine.spawnTimer -= dt;

        if (engine.spawnTimer <= 0) {
            const rng = rngRef.current;
            const r = rng();
            let type: 'single' | 'double' | 'large' = 'single';
            if (r > 0.75) type = 'double';
            else if (r > 0.5) type = 'large';

            const tronco = getFromPool(engine.obstaclePool, () => new Tronco());
            tronco.spawn(JUMP_LOGS_CONFIG.CANVAS_WIDTH, type);

            engine.spawnTimer = 1.4 + rng() * 1.6;

            if (engine.gameSpeed < JUMP_LOGS_CONFIG.MAX_SPEED) {
                engine.gameSpeed += JUMP_LOGS_CONFIG.SPEED_INCREMENT;
            }
        }
    };

    const spawnGroundDetails = (dt: number) => {
        const engine = engineRef.current;
        engine.groundSpawnTimer -= dt;
        if (engine.groundSpawnTimer <= 0) {
            const detail = getFromPool(engine.groundPool, () => new GroundDetail());
            detail.spawn(JUMP_LOGS_CONFIG.CANVAS_WIDTH);
            engine.groundSpawnTimer = 0.05 + Math.random() * 0.2;
        }
    };

    const runGameLoop = (timestamp: number) => {
        const engine = engineRef.current;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        if (!engine.lastTime) engine.lastTime = timestamp;
        const dt = Math.min((timestamp - engine.lastTime) / 1000, 0.1);
        engine.lastTime = timestamp;

        drawBackground(ctx, canvas, timestamp, dt, engine);

        if (engine.gameRunning) spawnGroundDetails(dt);
        for (let i = 0; i < engine.groundPool.length; i++) {
            const detail = engine.groundPool[i];
            if (detail.active) {
                if (engine.gameRunning) detail.update(dt, engine.gameSpeed);
                detail.draw(ctx);
            }
        }

        for (let i = 0; i < engine.players.length; i++) {
            const player = engine.players[i];
            
            if (engine.gameRunning) {
                if (player.isBot && player.lives > 0 && player.grounded) {
                    for (let j = 0; j < engine.obstaclePool.length; j++) {
                        const obs = engine.obstaclePool[j];
                        if (obs.active && obs.x > player.x && obs.x - player.x < 110 + Math.random() * 20) {
                            player.jump();
                            break;
                        }
                    }
                }

                player.update(dt, () => {
                    if (i === localSlot && !mutedRef.current) JumpLogsAudio.playStep();
                });
            }
            player.draw(ctx);
        }

        if (engine.gameRunning) {
            spawnObstacle(dt);
            for (let i = 0; i < engine.obstaclePool.length; i++) {
                const obs = engine.obstaclePool[i];
                if (obs.active) {
                    obs.update(dt, engine.gameSpeed);
                    obs.draw(ctx);

                    for (let p = 0; p < engine.players.length; p++) {
                        handlePlayerCollision(engine.players[p], obs);
                    }
                }
            }

            checkGameOver();

            engine.score += 60 * dt;
            const currentScore = Math.floor(engine.score / 10);
            setScore(currentScore);
            drawHUD(ctx, canvas, currentScore);
        }

        engine.animationId = requestAnimationFrame(runGameLoop);
    };

    const resetGame = (seed?: number) => {
        if (seed !== undefined) {
            rngRef.current = mulberry32(seed);
        }
        const engine = engineRef.current;

        engine.obstaclePool.forEach(p => p.active = false);
        engine.groundPool.forEach(p => p.active = false);

        for (let x = 0; x < JUMP_LOGS_CONFIG.CANVAS_WIDTH; x += 40 + Math.random() * 60) {
            const detail = getFromPool(engine.groundPool, () => new GroundDetail());
            detail.spawn(x);
        }

        engine.score = 0;
        engine.canRestart = false;
        engine.gameSpeed = JUMP_LOGS_CONFIG.INITIAL_SPEED;
        engine.spawnTimer = 0.5;
        engine.groundSpawnTimer = 0;
        engine.lastTime = 0;
        engine.gameRunning = true;
        engine.dayNightTimer = 0;

        engine.players.forEach((p, idx) => {
            p.reset(JUMP_LOGS_CONFIG.PLAYER_SPACING_X[idx]);
        });

        startTimeRef.current = Date.now();

        setGameRunning(true);
        setCanRestart(false);
    };

    const triggerLocalJump = () => {
        const engine = engineRef.current;
        const localPlayer = engine.players[localSlot];

        if (engine.gameRunning && localPlayer) {
            const jumped = localPlayer.jump();
            if (jumped) {
                if (!mutedRef.current) JumpLogsAudio.playJump();
                socketService.sendJump(roomCode, localSlot);
            }
        }
    };

    useEffect(() => {
        JumpLogsAudio.init();
        const engine = engineRef.current;
        engine.animationId = requestAnimationFrame(runGameLoop);

        return () => {
            cancelAnimationFrame(engine.animationId);
        };
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' || e.code === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
                e.preventDefault();
                triggerLocalJump();
            }
        };

        const unsubscribeJump = eventBus.on('JumpDetected', () => {
            triggerLocalJump();
        });

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            unsubscribeJump();
        };
    }, [localSlot, roomCode]);

    useEffect(() => {
        const socket = socketService.getSocket();

        const handleRemoteJump = ({ slot }: { slot: number }) => {
            const engine = engineRef.current;
            if (engine.players[slot]) {
                const jumped = engine.players[slot].jump();
                if (jumped && !mutedRef.current) {
                    JumpLogsAudio.playJump();
                }
            }
        };

        const handleGameStarted = ({ seed }: { seed: number }) => {
            resetGame(seed);
        };

        const handlePlayerHit = ({ slot, remainingLives }: { slot: number; remainingLives: number }) => {
            const engine = engineRef.current;
            if (engine.players[slot]) {
                engine.players[slot].lives = remainingLives;
                engine.players[slot].invulnerableTimer = 1.2;
            }
        };

        socket.on('remote-jump', handleRemoteJump);
        socket.on('game-started', handleGameStarted);
        socket.on('player-hit-update', handlePlayerHit);

        return () => {
            socket.off('remote-jump', handleRemoteJump);
            socket.off('game-started', handleGameStarted);
            socket.off('player-hit-update', handlePlayerHit);
        };
    }, [roomCode]);

    const handleExitGame = () => {
        const engine = engineRef.current;
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        
        const results: GameResults = {
            gameId: 'jump-logs',
            gameName: 'Jump Logs',
            duration,
            players: engine.players.slice(0, players.length).map(p => ({
                slot: p.slot,
                name: p.name,
                score: Math.floor(engine.score / 10),
                livesRemaining: p.lives,
                isWinner: p.lives > 0 || Math.max(...engine.players.map(pl => pl.lives)) === 0
            })).sort((a, b) => b.livesRemaining - a.livesRemaining || b.score - a.score)
        };
        
        onGameEnd(results);
    };

    return (
        <div className="w-full flex flex-col items-center gap-2 max-w-3xl mx-auto">
            <div 
                className="w-full relative rounded-lg overflow-hidden cursor-pointer shadow-xl border-2 border-sky-dark bg-bg-darkest" 
                onClick={triggerLocalJump} 
                style={{ aspectRatio: '4/3' }}
            >
                <canvas
                    ref={canvasRef}
                    width={JUMP_LOGS_CONFIG.CANVAS_WIDTH}
                    height={JUMP_LOGS_CONFIG.CANVAS_HEIGHT}
                    className="w-full h-full object-contain block"
                />

                <button
                    onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
                    className="absolute top-3 left-3 z-20 p-1.5 bg-bg-dark text-yellow border border-sky-dark text-xs cursor-pointer"
                    aria-label={isMuted ? "Unmute" : "Mute"}
                >
                    {isMuted ? "🔇" : "🔊"}
                </button>

                {(!gameRunning && canRestart) && (
                    <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center z-10 p-4 text-center">
                        <h2 className="text-xl sm:text-3xl text-error font-pixel mb-2" style={{ textShadow: '2px 2px 0 #000' }}>
                            ¡FIN DEL JUEGO!
                        </h2>
                        <p className="text-yellow font-pixel text-xs mb-4">
                            PUNTAJE: <span className="text-celeste">{score}</span>
                        </p>
                        
                        <button
                            onClick={(e) => { e.stopPropagation(); handleExitGame(); }}
                            className="pixel-btn pixel-btn-orange text-xs cursor-pointer"
                        >
                            VER RESULTADOS
                        </button>
                    </div>
                )}
            </div>

            <div className="w-full bg-bg-panel border border-sky-dark p-2 text-xs text-white flex flex-col sm:flex-row items-center justify-between gap-2 text-center">
                <span className="text-celeste">🏃 ¡Salta frente a la cámara o presiona la BARRA ESPACIADORA!</span>
                <span className="text-yellow">SALTO: CÁMARA O TECLADO (ESPACIO)</span>
            </div>
        </div>
    );
};

export default JumpLogsGame;
