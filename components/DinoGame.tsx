/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useRef, useState } from 'react';
import { socketService, PlayerInfo } from '../services/socket';

// --- TYPES & INTERFACES ---

interface ExtendedWindow extends Window {
    webkitAudioContext?: typeof AudioContext;
}

interface VisionState {
    poseLandmarker: any;
    lastVideoTime: number;
    results: any;
    prevY: number;
    prevTime: number;
    smoothedVelocity: number;
    peakVelocity: number;
    JUMP_VELOCITY_THRESHOLD: number;
    lastPredictionTime: number;
}

interface RunnerEntity {
    slot: number;
    name: string;
    color: string;
    secondaryColor: string;
    shirtColor: string;
    x: number;
    y: number;
    width: number;
    height: number;
    dy: number;
    grounded: boolean;
    jumpTimer: number;
    legState: boolean;
    animTimer: number;
    lives: number;
    invulnerableTimer: number;
    isBot: boolean;
    jump: () => boolean;
    update: (dt: number, onStep?: () => void) => void;
    draw: (ctx: CanvasRenderingContext2D) => void;
    reset: (startX: number) => void;
}

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
    visionAnimationId: number;
    players: RunnerEntity[];
    hasStarted: boolean;
    cameraReady: boolean;
}

// --- CONSTANTS ---

const GAME_CONFIG = {
    CANVAS_WIDTH: 850,
    CANVAS_HEIGHT: 320,
    GROUND_Y: 245,
    GRAVITY: 3800,
    JUMP_FORCE: 960,
    INITIAL_SPEED: 420,
    MAX_SPEED: 1200,
    SPEED_INCREMENT: 8,
    PLAYER_GROUND_Y: 200,
    PLAYER_SPACING_X: [70, 120, 170], // X positions for P1, P2, P3
    PLAYER_COLORS: [
        { primary: '#38ef7d', secondary: '#11998e', shirt: '#00c2cb', tag: 'P1' },
        { primary: '#ff4081', secondary: '#c2185b', shirt: '#ff80ab', tag: 'P2' },
        { primary: '#f4d160', secondary: '#e67e22', shirt: '#f39c12', tag: 'P3' }
    ],
    VISION_FPS: 30,
};

// --- AUDIO SYNTHESIS ---

const SoundSynth = {
    ctx: null as AudioContext | null,
    bufferCache: {} as Record<string, AudioBuffer>,
    
    init: () => {
        if (!SoundSynth.ctx) {
            const Win = window as ExtendedWindow;
            SoundSynth.ctx = new (window.AudioContext || Win.webkitAudioContext)();
        }
        if (SoundSynth.ctx.state === 'suspended') {
            SoundSynth.ctx.resume();
        }

        if (!SoundSynth.bufferCache['step']) {
            SoundSynth.bufferCache['step'] = SoundSynth.createNoiseBuffer(0.04);
        }
        if (!SoundSynth.bufferCache['hit']) {
            SoundSynth.bufferCache['hit'] = SoundSynth.createNoiseBuffer(0.3);
        }
    },

    createNoiseBuffer: (duration: number): AudioBuffer => {
        const ctx = SoundSynth.ctx!;
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        return buffer;
    },

    playJump: () => {
        const ctx = SoundSynth.ctx;
        if (!ctx) return;
        
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(160, t);
        osc.frequency.exponentialRampToValueAtTime(680, t + 0.12);
        
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
        
        osc.start(t);
        osc.stop(t + 0.12);
    },

    playStep: () => {
        const ctx = SoundSynth.ctx;
        if (!ctx || !SoundSynth.bufferCache['step']) return;
        
        const t = ctx.currentTime;
        const noise = ctx.createBufferSource();
        noise.buffer = SoundSynth.bufferCache['step'];
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, t);
        filter.frequency.exponentialRampToValueAtTime(100, t + 0.04);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.15, t); 
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.04);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        noise.start(t);
    },

    playHit: () => {
        const ctx = SoundSynth.ctx;
        if (!ctx || !SoundSynth.bufferCache['hit']) return;
        
        const t = ctx.currentTime;
        const noise = ctx.createBufferSource();
        noise.buffer = SoundSynth.bufferCache['hit'];
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(400, t);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, t);
        osc.frequency.linearRampToValueAtTime(40, t + 0.3);

        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(0.2, t);
        oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

        osc.connect(oscGain);
        oscGain.connect(ctx.destination);

        noise.start(t);
        osc.start(t);
        noise.stop(t + 0.3);
        osc.stop(t + 0.3);
    }
};

// --- GAME ENTITIES (POOLED) ---

class GroundDetail {
    active: boolean = false;
    x: number = 0;
    y: number = 0;
    width: number = 0;
    height: number = 3;

    spawn(startX: number) {
        this.x = startX;
        this.y = GAME_CONFIG.GROUND_Y + 6 + Math.random() * 45;
        this.width = Math.random() > 0.5 ? 4 : 8;
        this.active = true;
    }

    update(dt: number, speed: number) {
        if (!this.active) return;
        this.x -= speed * dt;
        if (this.x < -this.width) this.active = false;
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (!this.active) return;
        ctx.fillStyle = '#73c242';
        ctx.fillRect(Math.floor(this.x), Math.floor(this.y), this.width, this.height);
    }
}

// --- PIXEL ART TRONCO (LOG) OBSTACLE ---

class Tronco {
    active: boolean = false;
    x: number = 0;
    y: number = 210;
    width: number = 44;
    height: number = 36;
    type: 'single' | 'double' | 'large' = 'single';

    spawn(startX: number, type: 'single' | 'double' | 'large' = 'single') {
        this.x = startX;
        this.type = type;

        if (type === 'large') {
            this.width = 52;
            this.height = 46;
            this.y = GAME_CONFIG.GROUND_Y - 46;
        } else if (type === 'double') {
            this.width = 76;
            this.height = 36;
            this.y = GAME_CONFIG.GROUND_Y - 36;
        } else {
            this.width = 44;
            this.height = 36;
            this.y = GAME_CONFIG.GROUND_Y - 36;
        }
        this.active = true;
    }

    update(dt: number, speed: number) {
        if (!this.active) return;
        this.x -= speed * dt;
        if (this.x < -this.width - 40) this.active = false;
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (!this.active) return;
        const ix = Math.floor(this.x);
        const iy = Math.floor(this.y);
        const w = Math.floor(this.width);
        const h = Math.floor(this.height);
        const px = 2; // pixel size for "chunky" retro look

        // Ground shadow
        ctx.fillStyle = 'rgba(10, 20, 8, 0.5)';
        ctx.fillRect(ix + 4, GAME_CONFIG.GROUND_Y, w - 8, 6);
        ctx.fillRect(ix + 2, GAME_CONFIG.GROUND_Y + 2, w - 4, 4);

        // === PIXEL ART LOG ===

        // 1. Darkest bark outline
        ctx.fillStyle = '#1a0e05';
        ctx.fillRect(ix, iy, w, h);

        // 2. Dark bark shell
        ctx.fillStyle = '#3a1c05';
        ctx.fillRect(ix + px, iy + px, w - px * 2, h - px * 2);

        // 3. Main bark body
        ctx.fillStyle = '#5c3111';
        ctx.fillRect(ix + px * 2, iy + px * 2, w - px * 4, h - px * 4);

        // 4. Bark texture — horizontal grain lines
        ctx.fillStyle = '#4a2609';
        for (let row = 0; row < 3; row++) {
            const ly = iy + px * 3 + row * Math.floor((h - px * 6) / 3);
            ctx.fillRect(ix + px * 3, ly, w - px * 6, px);
        }

        // 5. Lighter bark highlights (top & bottom edges)
        ctx.fillStyle = '#8b5a2b';
        ctx.fillRect(ix + px * 3, iy + px * 2, w - px * 8, px);
        ctx.fillRect(ix + px * 3, iy + h - px * 3, w - px * 8, px);

        // 6. Warm inner wood highlights
        ctx.fillStyle = '#7c4a1e';
        ctx.fillRect(ix + px * 4, iy + px * 3, w - px * 10, px);
        ctx.fillRect(ix + px * 5, iy + h - px * 5, w - px * 12, px);

        // 7. Wood knots (small dark circles)
        ctx.fillStyle = '#3a1c05';
        ctx.fillRect(ix + Math.floor(w * 0.3), iy + Math.floor(h * 0.4), px * 2, px * 2);
        ctx.fillStyle = '#4a2609';
        ctx.fillRect(ix + Math.floor(w * 0.3) + 1, iy + Math.floor(h * 0.4) + 1, px, px);

        // 8. Cut end face (right side – concentric tree rings)
        const endW = Math.min(12, Math.floor(w * 0.22));
        const endX = ix + w - endW - px;
        // Outer ring (sapwood)
        ctx.fillStyle = '#d4a373';
        ctx.fillRect(endX, iy + px * 2, endW, h - px * 4);
        // Mid ring
        ctx.fillStyle = '#c49360';
        ctx.fillRect(endX + px, iy + px * 3, endW - px * 2, h - px * 6);
        // Inner heartwood
        ctx.fillStyle = '#b07d4a';
        ctx.fillRect(endX + px * 2, iy + px * 4, endW - px * 4, h - px * 8);
        // Core center
        ctx.fillStyle = '#8b5a2b';
        ctx.fillRect(endX + px * 3, iy + Math.floor(h / 2) - px, Math.max(px, endW - px * 6), px * 2);

        // 9. Moss patches on top
        ctx.fillStyle = '#438a22';
        ctx.fillRect(ix + px * 2, iy - px * 2, px * 4, px * 2);
        ctx.fillRect(ix + px * 5, iy - px * 3, px * 6, px * 3);
        ctx.fillRect(ix + px * 9, iy - px * 2, px * 3, px * 2);
        ctx.fillStyle = '#73c242';
        ctx.fillRect(ix + px * 6, iy - px * 4, px * 4, px * 2);
        ctx.fillRect(ix + px * 3, iy - px * 2, px * 2, px);

        // 10. Tiny pixel mushroom on left side
        ctx.fillStyle = '#e04040';
        ctx.fillRect(ix + px, iy - px * 4, px * 3, px * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(ix + px + 1, iy - px * 4, px, px);
        ctx.fillStyle = '#d4a373';
        ctx.fillRect(ix + px + px, iy - px * 2, px, px * 2);
    }
}

// Pool Helper
const getFromPool = <T extends { active: boolean }>(pool: T[], factory: () => T): T => {
    const item = pool.find(p => !p.active);
    if (item) return item;
    const newItem = factory();
    pool.push(newItem);
    return newItem;
};

// --- PIXEL ART RUNNER CHARACTER ENTITY ---

const createRunner = (slot: number, name: string): RunnerEntity => {
    const colorInfo = GAME_CONFIG.PLAYER_COLORS[slot] || GAME_CONFIG.PLAYER_COLORS[0];
    const startX = GAME_CONFIG.PLAYER_SPACING_X[slot] || 70;

    return {
        slot,
        name,
        color: colorInfo.primary,
        secondaryColor: colorInfo.secondary,
        shirtColor: colorInfo.shirt,
        x: startX,
        y: GAME_CONFIG.PLAYER_GROUND_Y,
        width: 38,
        height: 45,
        dy: 0,
        grounded: false,
        jumpTimer: 0,
        legState: false,
        animTimer: 0,
        lives: 3,
        invulnerableTimer: 0,
        isBot: false,

        reset(newStartX: number) {
            this.x = newStartX;
            this.y = GAME_CONFIG.PLAYER_GROUND_Y;
            this.dy = 0;
            this.grounded = true;
            this.jumpTimer = 0;
            this.legState = false;
            this.animTimer = 0;
            this.lives = 3;
            this.invulnerableTimer = 0;
        },

        jump() {
            if (this.lives > 0 && this.grounded && this.jumpTimer <= 0) {
                this.dy = -GAME_CONFIG.JUMP_FORCE;
                this.grounded = false;
                this.jumpTimer = 0.12;
                return true;
            }
            return false;
        },

        update(dt: number, onStep?: () => void) {
            if (this.lives <= 0) return;

            if (this.jumpTimer > 0) this.jumpTimer -= dt;
            if (this.invulnerableTimer > 0) this.invulnerableTimer -= dt;

            this.animTimer += dt;
            if (this.animTimer > 0.09) {
                this.legState = !this.legState;
                this.animTimer = 0;
                if (this.grounded && onStep) onStep();
            }

            this.dy += GAME_CONFIG.GRAVITY * dt;
            this.y += this.dy * dt;

            if (this.y > GAME_CONFIG.PLAYER_GROUND_Y) {
                this.y = GAME_CONFIG.PLAYER_GROUND_Y;
                this.dy = 0;
                this.grounded = true;
            } else {
                this.grounded = false;
            }
        },

        draw(ctx: CanvasRenderingContext2D) {
            if (this.lives <= 0) return; // Dead player is not drawn

            // Invulnerability Flashing (damage hit effect)
            if (this.invulnerableTimer > 0 && Math.floor(Date.now() / 100) % 2 === 0) {
                ctx.fillStyle = '#ff0000'; // Damage red flash
            } else {
                ctx.fillStyle = this.shirtColor;
            }

            const ix = Math.floor(this.x);
            const iy = Math.floor(this.y);

            ctx.save();

            // Pixel Shadow on Ground
            ctx.fillStyle = 'rgba(20, 35, 15, 0.4)';
            ctx.fillRect(ix + 4, GAME_CONFIG.GROUND_Y + 2, 28, 5);

            // Pixel Art Shirt Body
            ctx.fillRect(ix + 8, iy + 10, 20, 20);

            // Skin Face
            ctx.fillStyle = '#ffdbac';
            ctx.fillRect(ix + 10, iy + 2, 16, 12);

            // Pixel Headband matching player accent color
            ctx.fillStyle = this.color;
            ctx.fillRect(ix + 8, iy, 20, 5);

            // Eye facing right
            ctx.fillStyle = '#1e3a24';
            ctx.fillRect(ix + 20, iy + 6, 4, 4);

            // Pixel Shorts
            ctx.fillStyle = '#2b180a';
            ctx.fillRect(ix + 10, iy + 28, 16, 6);

            // Pixel Legs & Running Shoes
            ctx.fillStyle = this.color;
            if (!this.grounded) {
                ctx.fillRect(ix + 10, iy + 34, 6, 8);
                ctx.fillRect(ix + 20, iy + 34, 6, 8);
            } else if (this.legState) {
                ctx.fillRect(ix + 8, iy + 34, 6, 12);
                ctx.fillRect(ix + 22, iy + 34, 6, 8);
            } else {
                ctx.fillRect(ix + 8, iy + 34, 6, 8);
                ctx.fillRect(ix + 22, iy + 34, 6, 12);
            }

            // Name Tag above character head (Pixel font style)
            ctx.font = "10px 'Press Start 2P', monospace";
            ctx.textAlign = "center";
            ctx.fillStyle = this.color;
            ctx.fillText(this.name, ix + 18, iy - 12);

            ctx.restore();
        }
    };
};

interface DinoGameProps {
    roomCode: string;
    localSlot: number;
    playerList: PlayerInfo[];
    isHost: boolean;
    isCountdownActive?: boolean;
    localStream?: MediaStream | null;
}

const DinoGame: React.FC<DinoGameProps> = ({ roomCode, localSlot, playerList, isHost, isCountdownActive = false, localStream = null }) => {
    // --- REFS ---
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const outputCanvasRef = useRef<HTMLCanvasElement>(null);
    const jumpSignalRef = useRef<HTMLDivElement>(null);

    // --- REACT STATE ---
    const [isLoading, setIsLoading] = useState(true);
    const [status, setStatus] = useState("¡Salga frente a la cámara o presiona la BARRA ESPACIADORA para saltar los troncos!");
    const [showVision, setShowVision] = useState(false);
    const [gameRunning, setGameRunning] = useState(true); // Default running so characters and troncos show immediately!
    const [canRestart, setCanRestart] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [score, setScore] = useState(0);

    const mutedRef = useRef(false);

    // Initial 3 Players creation
    const createInitialPlayers = () => [
        createRunner(0, playerList[0]?.name || 'P1 (Verde)'),
        createRunner(1, playerList[1]?.name || 'P2 (Rosa)'),
        createRunner(2, playerList[2]?.name || 'P3 (Amarillo)'),
    ];

    // --- ENGINE STATE ---
    const engineRef = useRef<GameEngineState>({
        gameRunning: true,
        canRestart: false,
        score: 0,
        gameSpeed: GAME_CONFIG.INITIAL_SPEED,
        lastTime: 0,
        obstaclePool: Array.from({ length: 12 }, () => new Tronco()),
        groundPool: Array.from({ length: 50 }, () => new GroundDetail()),
        spawnTimer: 0.5, // Spawn first Tronco quickly!
        groundSpawnTimer: 0,
        animationId: 0,
        visionAnimationId: 0,
        players: createInitialPlayers(),
        hasStarted: true,
        cameraReady: false
    });

    // --- VISION STATE ---
    const visionRef = useRef<VisionState>({
        poseLandmarker: null,
        lastVideoTime: -1,
        results: undefined,
        prevY: 0,
        prevTime: 0,
        smoothedVelocity: 0,
        peakVelocity: 0,
        JUMP_VELOCITY_THRESHOLD: 2.2,
        lastPredictionTime: 0
    });

    useEffect(() => {
        mutedRef.current = isMuted;
    }, [isMuted]);

    useEffect(() => {
        engineRef.current.gameRunning = !isCountdownActive;
    }, [isCountdownActive]);

    // Keep players updated when playerList prop changes
    useEffect(() => {
        const engine = engineRef.current;
        playerList.forEach(p => {
            if (engine.players[p.slot]) {
                engine.players[p.slot].name = p.name;
                engine.players[p.slot].isBot = !!p.isBot;
            }
        });
    }, [playerList]);

// --- SEEDED PSEUDO-RANDOM NUMBER GENERATOR (Mulberry32) ---
function mulberry32(a: number) {
    return function() {
        let t = a += 0x6D2B79F5;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

    // RNG Ref for synchronized obstacle spawning across all 3 players
    const rngRef = useRef<() => number>(mulberry32(123456));

    // Socket Event Listeners for remote actions
    useEffect(() => {
        const socket = socketService.getSocket();

        const handleRemoteJump = ({ slot }: { slot: number }) => {
            const engine = engineRef.current;
            if (engine.players[slot]) {
                const jumped = engine.players[slot].jump();
                if (jumped && !mutedRef.current) {
                    SoundSynth.playJump();
                }
            }
        };

        const handleGameStarted = ({ seed, players }: { seed: number; players: PlayerInfo[] }) => {
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

    // --- GAME LOGIC ---

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
            tronco.spawn(GAME_CONFIG.CANVAS_WIDTH, type);

            engine.spawnTimer = 1.4 + rng() * 1.6;

            if (engine.gameSpeed < GAME_CONFIG.MAX_SPEED) {
                engine.gameSpeed += GAME_CONFIG.SPEED_INCREMENT;
            }
        }
    };

    const spawnGroundDetails = (dt: number) => {
        const engine = engineRef.current;
        engine.groundSpawnTimer -= dt;
        if (engine.groundSpawnTimer <= 0) {
            const detail = getFromPool(engine.groundPool, () => new GroundDetail());
            detail.spawn(GAME_CONFIG.CANVAS_WIDTH);
            engine.groundSpawnTimer = 0.05 + Math.random() * 0.2;
        }
    };

    const handlePlayerCollision = (player: RunnerEntity, tronco: Tronco) => {
        // Only evaluate collision for local player, or bots if we are host
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

            if (!mutedRef.current) SoundSynth.playHit();

            socketService.sendHit(roomCode, player.slot, player.lives);
        }
    };

    const checkGameOver = () => {
        const engine = engineRef.current;
        const activePlayers = engine.players.filter(p => p.lives > 0);
        if (activePlayers.length === 0) {
            engine.gameRunning = false;
            engine.canRestart = false;
            setGameRunning(false);

            setTimeout(() => {
                engine.canRestart = true;
                setCanRestart(true);
            }, 1000);
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

        // 1. Draw Nature Forest Sky
        const skyGrad = ctx.createLinearGradient(0, 0, 0, GAME_CONFIG.GROUND_Y);
        skyGrad.addColorStop(0, '#142416');
        skyGrad.addColorStop(0.6, '#1e3a24');
        skyGrad.addColorStop(1, '#2d5a3f');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Sun / Forest Canopy Glow
        ctx.fillStyle = '#f4d160';
        ctx.fillRect(canvas.width - 120, 30, 32, 32);

        // 2. Draw Pixel Art Forest Trees (Parallax Background)
        ctx.fillStyle = '#172d1c';
        for (let x = 0; x <= canvas.width; x += 30) {
            const h = 50 + (x % 40);
            ctx.fillRect(x, GAME_CONFIG.GROUND_Y - h, 20, h);
            ctx.fillRect(x - 6, GAME_CONFIG.GROUND_Y - h + 10, 32, 14);
        }

        // 3. Soil Ground
        ctx.fillStyle = '#4a2e18';
        ctx.fillRect(0, GAME_CONFIG.GROUND_Y, canvas.width, canvas.height - GAME_CONFIG.GROUND_Y);

        ctx.fillStyle = '#438a22';
        ctx.fillRect(0, GAME_CONFIG.GROUND_Y, canvas.width, 8);

        // Grass blades
        ctx.fillStyle = '#73c242';
        for (let x = 0; x <= canvas.width; x += 16) {
            ctx.fillRect(x, GAME_CONFIG.GROUND_Y - 4, 6, 4);
        }

        // Ground Details
        if (engine.gameRunning) spawnGroundDetails(dt);
        for (let i = 0; i < engine.groundPool.length; i++) {
            const detail = engine.groundPool[i];
            if (detail.active) {
                if (engine.gameRunning) detail.update(dt, engine.gameSpeed);
                detail.draw(ctx);
            }
        }

        // 4. Update & Draw 3 Players ALWAYS!
        for (let i = 0; i < engine.players.length; i++) {
            const player = engine.players[i];
            
            if (engine.gameRunning) {
                // Simulated Bot Auto-Jump Logic
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
                    if (i === localSlot && !mutedRef.current) SoundSynth.playStep();
                });
            }
            player.draw(ctx);
        }

        // 5. Update & Draw Troncos Logs + Collision Damage
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

            // 6. Draw Score
            engine.score += 60 * dt;
            const currentScore = Math.floor(engine.score / 10);
            setScore(currentScore);

            ctx.font = "14px 'Press Start 2P', monospace";
            ctx.textAlign = "right";
            ctx.fillStyle = '#f4d160';
            ctx.fillText(`PUNTAJE: ${currentScore}`, canvas.width - 20, 35);
        }

        // Always schedule next frame!
        engine.animationId = requestAnimationFrame(runGameLoop);
    };

    const resetGame = (seed?: number) => {
        if (seed !== undefined) {
            rngRef.current = mulberry32(seed);
        }
        const engine = engineRef.current;

        engine.obstaclePool.forEach(p => p.active = false);
        engine.groundPool.forEach(p => p.active = false);

        for (let x = 0; x < GAME_CONFIG.CANVAS_WIDTH; x += 40 + Math.random() * 60) {
            const detail = getFromPool(engine.groundPool, () => new GroundDetail());
            detail.spawn(x);
        }

        engine.score = 0;
        engine.canRestart = false;
        engine.gameSpeed = GAME_CONFIG.INITIAL_SPEED;
        engine.spawnTimer = 0.5;
        engine.groundSpawnTimer = 0;
        engine.lastTime = 0;
        engine.gameRunning = true;

        engine.players.forEach((p, idx) => {
            p.reset(GAME_CONFIG.PLAYER_SPACING_X[idx]);
        });

        setGameRunning(true);
        setCanRestart(false);
    };

    const triggerLocalJump = () => {
        if (jumpSignalRef.current) {
            jumpSignalRef.current.classList.add('active');
            setTimeout(() => jumpSignalRef.current?.classList.remove('active'), 200);
        }

        const engine = engineRef.current;
        const localPlayer = engine.players[localSlot];

        if (engine.gameRunning && localPlayer) {
            const jumped = localPlayer.jump();
            if (jumped) {
                if (!mutedRef.current) SoundSynth.playJump();
                socketService.sendJump(roomCode, localSlot);
            }
        } else if (!engine.gameRunning && engine.canRestart && isHost) {
            socketService.restartGame(roomCode);
        }
    };

    // Keyboard Fallback & Jump Testing
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' || e.code === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
                e.preventDefault();
                triggerLocalJump();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [localSlot, roomCode, isHost]);

    // Start continuous render loop on mount
    useEffect(() => {
        const engine = engineRef.current;
        engine.animationId = requestAnimationFrame(runGameLoop);

        return () => {
            cancelAnimationFrame(engine.animationId);
        };
    }, []);

    // --- VISION LOGIC ---

    const predictWebcam = () => {
        const video = videoRef.current;
        const outCanvas = outputCanvasRef.current;
        const engine = engineRef.current;

        if (!video || !outCanvas || !visionRef.current.poseLandmarker) {
            engine.visionAnimationId = requestAnimationFrame(predictWebcam);
            return;
        }

        if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
            engine.visionAnimationId = requestAnimationFrame(predictWebcam);
            return;
        }

        const now = performance.now();
        const timeSinceLast = now - visionRef.current.lastPredictionTime;
        const frameInterval = 1000 / GAME_CONFIG.VISION_FPS;

        if (timeSinceLast < frameInterval) {
            engine.visionAnimationId = requestAnimationFrame(predictWebcam);
            return;
        }
        visionRef.current.lastPredictionTime = now;

        const state = visionRef.current;
        const { poseLandmarker } = state;

        if (outCanvas.width !== video.videoWidth || outCanvas.height !== video.videoHeight) {
            outCanvas.width = video.videoWidth;
            outCanvas.height = video.videoHeight;
        }

        const outCtx = outCanvas.getContext('2d', { alpha: true })!;

        let didUpdate = false;
        if (state.lastVideoTime !== video.currentTime) {
            state.lastVideoTime = video.currentTime;
            try {
                state.results = poseLandmarker.detectForVideo(video, now);
                didUpdate = true;
            } catch (err) {
                console.warn('[MediaPipe] Detect error:', err);
            }
        }

        outCtx.clearRect(0, 0, outCanvas.width, outCanvas.height);

        if (state.results && state.results.landmarks && state.results.landmarks.length > 0) {
            const landmarks = state.results.landmarks[0];
            const leftShoulder = landmarks[11];
            const rightShoulder = landmarks[12];

            outCtx.beginPath();
            outCtx.moveTo(leftShoulder.x * outCanvas.width, leftShoulder.y * outCanvas.height);
            outCtx.lineTo(rightShoulder.x * outCanvas.width, rightShoulder.y * outCanvas.height);
            outCtx.strokeStyle = '#38ef7d';
            outCtx.lineWidth = 3;
            outCtx.stroke();

            outCtx.fillStyle = '#73c242';
            const shoulders = [leftShoulder, rightShoulder];
            for (let i = 0; i < shoulders.length; i++) {
                outCtx.beginPath();
                outCtx.arc(shoulders[i].x * outCanvas.width, shoulders[i].y * outCanvas.height, 5, 0, 2 * Math.PI);
                outCtx.fill();
            }

            if (didUpdate) {
                const currentY = (leftShoulder.y + rightShoulder.y) / 2;
                const shoulderDist = Math.hypot(leftShoulder.x - rightShoulder.x, leftShoulder.y - rightShoulder.y);

                const currentTime = video.currentTime;
                let currentVelocity = 0;

                if (state.prevTime > 0 && currentTime > state.prevTime) {
                    const dt = currentTime - state.prevTime;
                    const dy = state.prevY - currentY;
                    const normalizedDy = dy / shoulderDist;
                    currentVelocity = normalizedDy / dt;
                }

                state.smoothedVelocity = state.smoothedVelocity * 0.5 + currentVelocity * 0.5;

                if (state.smoothedVelocity > state.peakVelocity) {
                    state.peakVelocity = state.smoothedVelocity;
                } else {
                    state.peakVelocity *= 0.95;
                }

                state.prevY = currentY;
                state.prevTime = currentTime;

                if (state.smoothedVelocity > state.JUMP_VELOCITY_THRESHOLD) {
                    triggerLocalJump();
                }
            }
        }

        engine.visionAnimationId = requestAnimationFrame(predictWebcam);
    };

    const enableCam = async () => {
        SoundSynth.init();
        if (!visionRef.current.poseLandmarker) return;

        try {
            let stream = localStream;
            if (!stream) {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 320, height: 240 }
                });
            }

            if (videoRef.current && stream) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadeddata = () => {
                    predictWebcam();
                    engineRef.current.cameraReady = true;
                };
                // Fallback trigger if event already fired
                predictWebcam();
                engineRef.current.cameraReady = true;
            }
        } catch (err) {
            console.error(err);
            setStatus("Nota: Usa ESPACIO / FLECHA ARRIBA para saltar si no tienes cámara.");
        }
    };

    useEffect(() => {
        const initMediaPipe = async () => {
            try {
                // @ts-ignore
                const { PoseLandmarker, FilesetResolver } = await import("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/+esm");

                const vision = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm"
                );

                visionRef.current.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
                        delegate: "GPU"
                    },
                    runningMode: "VIDEO",
                    numPoses: 1
                });

                setIsLoading(false);
                enableCam();
            } catch (err) {
                console.error(err);
                setIsLoading(false);
            }
        };

        initMediaPipe();

        return () => {
            cancelAnimationFrame(engineRef.current.visionAnimationId);
        };
    }, [localStream]);

    return (
        <div className="flex flex-col items-center gap-4 w-full max-w-5xl relative">
            
            {/* GAME CANVAS ARENA (PIXEL ART WOOD BORDER) */}
            <div className="relative rounded-lg overflow-hidden pixel-border-wood bg-[#1e3a24] cursor-pointer" onClick={triggerLocalJump}>
                <canvas
                    ref={canvasRef}
                    width={GAME_CONFIG.CANVAS_WIDTH}
                    height={GAME_CONFIG.CANVAS_HEIGHT}
                    className="block w-full max-w-full"
                />

                {/* MUTE BUTTON */}
                <button
                    onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
                    className="absolute top-4 left-4 z-20 p-2 bg-[#2b180a] text-[#f4d160] border-2 border-[#5c3111] transition-all hover:scale-105 active:scale-95"
                    aria-label={isMuted ? "Unmute" : "Mute"}
                >
                    {isMuted ? "🔇" : "🔊"}
                </button>

                {/* GAME OVER OVERLAY */}
                {(!gameRunning && canRestart) && (
                    <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center z-10 p-6 text-center">
                        <h2 className="text-2xl md:text-4xl text-red-500 font-pixel mb-4 animate-pulse pixel-text-shadow">
                            ¡FIN DEL JUEGO!
                        </h2>
                        <p className="text-yellow-300 font-pixel text-xs mb-6">
                            PUNTAJE: <span className="text-[#38ef7d]">{score}</span>
                        </p>
                        {isHost ? (
                            <button
                                onClick={(e) => { e.stopPropagation(); socketService.restartGame(roomCode); }}
                                className="px-6 py-3 pixel-btn-green font-pixel text-xs rounded-none cursor-pointer"
                            >
                                🚀 REINICIAR PARTIDA (ADMIN)
                            </button>
                        ) : (
                            <p className="text-xs text-gray-400 font-pixel animate-pulse">
                                ESPERANDO QUE EL ANFITRIÓN REINICIE...
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* STATUS INSTRUCTION BAR */}
            <div className="w-full bg-[#1e3a24] pixel-border-green p-3 text-[10px] text-[#e0f8cf] font-pixel flex flex-col sm:flex-row items-center justify-between gap-2 text-center">
                <span>🌲 {status}</span>
                <span className="text-[#f4d160]">SALTO: CÁMARA O TECLADO (ESPACIO)</span>
            </div>

            {/* HIDDEN MEDIAPIPE VIDEO HARNESS WITH REAL 320x240 DIMENSIONS */}
            <video ref={videoRef} autoPlay playsInline width={320} height={240} className="absolute opacity-0 pointer-events-none -z-50 w-[320px] h-[240px]"></video>
            <canvas ref={outputCanvasRef} className="hidden"></canvas>
            <div ref={jumpSignalRef} className="hidden"></div>
        </div>
    );
};

export default DinoGame;