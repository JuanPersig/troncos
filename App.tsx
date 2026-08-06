/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useRef, useState } from 'react';
import DinoGame from './components/DinoGame';
import { socketService, PlayerInfo } from './services/socket';
import { webRTCManager } from './services/webrtc';

const App: React.FC = () => {
  // Lobby State
  const [inLobby, setInLobby] = useState(true);
  const [playerName, setPlayerName] = useState(() => `Jugador_${Math.floor(Math.random() * 90 + 10)}`);
  const [roomCode, setRoomCode] = useState('TRONCOS-1');
  const [playerSlot, setPlayerSlot] = useState<number | null>(null);
  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  const [hostId, setHostId] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [gameStarted, setGameStarted] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [serverUrl, setServerUrlState] = useState(() => socketService.getServerUrl());
  const [showSettings, setShowSettings] = useState(false);

  // WebRTC Remote Video Streams
  const [remoteStreams, setRemoteStreams] = useState<Record<number, MediaStream>>({});
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  // Connect socket and handle room updates
  useEffect(() => {
    const socket = socketService.connect();

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('error-message', (msg: string) => {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(''), 4000);
    });

    socket.on('room-joined', ({ playerSlot, players, hostId }) => {
      setPlayerSlot(playerSlot);
      setPlayers(players);
      setHostId(hostId);
      setErrorMsg('');
      
      // Initialize WebRTC signaling
      webRTCManager.initSignaling(playerSlot);
    });

    socket.on('room-update', ({ players, hostId, gameRunning }) => {
      setPlayers(players);
      setHostId(hostId);
      if (gameRunning && !gameStarted) {
        setCountdown(3);
        setInLobby(false);
      }
    });

    socket.on('game-started', ({ seed, players }) => {
      setPlayers(players);
      setCountdown(3);
      setInLobby(false);
    });

    const unsubscribeRemoteStream = webRTCManager.onRemoteStream((slot, stream) => {
      setRemoteStreams(prev => ({ ...prev, [slot]: stream }));
    });

    return () => {
      unsubscribeRemoteStream();
    };
  }, [gameStarted]);

  // Handle countdown
  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setGameStarted(true);
      setCountdown(null);
    }
  }, [countdown]);

  // Auto-connect WebRTC cameras
  useEffect(() => {
    if (playerSlot === null || players.length === 0) return;
    
    players.forEach(p => {
      // Only initiate offer to players with smaller slots to prevent collisions
      // (e.g. P3 initiates to P2 and P1; P2 initiates to P1)
      if (p.slot < playerSlot && !p.isBot) {
        webRTCManager.connectToPeer(p.id, p.slot, playerSlot);
      }
    });
  }, [players, playerSlot]);

  // Handle local camera preview stream
  useEffect(() => {
    let activeStream: MediaStream | null = null;
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240 }
        });
        activeStream = stream;
        setLocalStream(stream);
        webRTCManager.setLocalStream(stream);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (e) {
        console.warn('Webcam permission not granted or unavailable', e);
      }
    }

    startCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const handleJoinRoom = () => {
    if (!playerName.trim()) return;
    socketService.joinRoom(roomCode, playerName.trim());
  };

  const handleFillBots = () => {
    socketService.fillBots(roomCode);
  };

  const handleToggleReady = () => {
    socketService.toggleReady(roomCode);
  };

  const handleStartGame = () => {
    socketService.startGame(roomCode);
  };

  const isHost = socketService.getSocket()?.id === hostId;

  // Nature slot styles
  const slotStyles = [
    { border: 'border-[#38ef7d]', text: 'text-[#38ef7d]', bg: 'bg-[#38ef7d]', name: 'Verde' },
    { border: 'border-[#ff4081]', text: 'text-[#ff4081]', bg: 'bg-[#ff4081]', name: 'Rosa' },
    { border: 'border-[#f4d160]', text: 'text-[#f4d160]', bg: 'bg-[#f4d160]', name: 'Amarillo' }
  ];

  return (
    <div className="min-h-screen bg-[#142416] text-[#e0f8cf] flex flex-col items-center p-3 md:p-6 font-press-start selection:bg-[#438a22] selection:text-white">
      
      {/* TOP PIXEL NAVBAR / HEADER */}
      <header className="w-full max-w-5xl flex items-center justify-between pixel-border-wood bg-[#1e3a24] p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#7c4f2b] border-2 border-[#2b180a] flex items-center justify-center text-xl">
            🪵
          </div>
          <div>
            <h1 className="text-sm md:text-lg font-pixel text-[#f4d160] pixel-text-shadow">
              TRONCOS 3P
            </h1>
            <p className="text-[9px] text-[#73c242] mt-1">JUEGO MULTIJUGADOR PIXEL ART</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-[#142416] border-2 border-[#2b180a] px-3 py-2 text-[10px]">
            <span className="text-gray-400">SALA:</span>
            <span className="text-[#f4d160]">{roomCode}</span>
          </div>

          <div className="flex items-center gap-2 text-[10px] bg-[#142416] border-2 border-[#2b180a] px-3 py-2">
            <span className={`w-2.5 h-2.5 ${isConnected ? 'bg-green-400' : 'bg-red-500'}`} />
            <span className="text-gray-200">{isConnected ? 'ONLINE' : 'OFFLINE'}</span>
          </div>
        </div>
      </header>

      {/* LOBBY MODAL / OVERLAY */}
      {inLobby ? (
        <main className="w-full max-w-xl pixel-border-wood bg-[#1e3a24] p-6 md:p-8 my-auto">
          <div className="text-center mb-6">
            <h2 className="text-base md:text-xl text-[#f4d160] pixel-text-shadow mb-3">
              🌲 SALA DE ESPERA (3P)
            </h2>
            <p className="text-[10px] text-[#73c242] leading-relaxed">
              Ingresa tu nombre para unirte o llena con bots para jugar de inmediato.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-900/40 border-2 border-red-500 text-red-200 text-[10px] text-center">
              {errorMsg}
            </div>
          )}

          {playerSlot === null ? (
            /* JOIN FORM */
            <div className="space-y-5">
              <div>
                <label className="block text-[10px] text-[#f4d160] mb-2">NOMBRE DEL JUGADOR:</label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full bg-[#142416] border-2 border-[#2b180a] px-4 py-3 text-xs text-white outline-none focus:border-[#73c242]"
                  placeholder="Tu apodo"
                />
              </div>

              <div>
                <label className="block text-[10px] text-[#f4d160] mb-2">CÓDIGO DE SALA:</label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  className="w-full bg-[#142416] border-2 border-[#2b180a] px-4 py-3 text-xs text-white outline-none focus:border-[#73c242] uppercase font-mono tracking-widest"
                  placeholder="TRONCOS-1"
                />
              </div>

              <button
                onClick={handleJoinRoom}
                className="w-full py-4 pixel-btn-green text-xs font-pixel uppercase cursor-pointer"
              >
                UNIRSE A LA SALA 🪵
              </button>

              <div className="pt-2 border-t-2 border-[#2b180a] text-center">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="text-[9px] text-[#73c242] hover:text-[#a3e282] underline cursor-pointer"
                >
                  {showSettings ? '▲ OCULTAR CONFIGURACIÓN' : '▼ CONFIGURAR SERVIDOR (NETLIFY / RENDER)'}
                </button>
              </div>

              {showSettings && (
                <div className="p-4 bg-[#142416] border-2 border-[#2b180a] space-y-3">
                  <div className="text-[8px] text-gray-400 leading-normal">
                    Si alojas el juego en un hosting estático (ej. Netlify, Vercel), debes ingresar la URL de tu servidor Node.js/Render aquí abajo.
                  </div>
                  <div>
                    <label className="block text-[8px] text-[#f4d160] mb-2">URL DEL SERVIDOR WEB/SOCKETS:</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={serverUrl}
                        onChange={(e) => setServerUrlState(e.target.value)}
                        className="flex-1 bg-[#0c180e] border-2 border-[#2b180a] px-3 py-2 text-[9px] text-white outline-none focus:border-[#73c242]"
                        placeholder="https://troncos-3p.onrender.com"
                      />
                      <button
                        onClick={() => {
                          socketService.setServerUrl(serverUrl);
                          alert('Servidor configurado. Intentando reconectar...');
                        }}
                        className="px-3 py-2 bg-[#7c4f2b] text-white border-2 border-[#2b180a] text-[8px] active:translate-y-0.5 cursor-pointer font-bold"
                      >
                        GUARDAR
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ROOM LOBBY SLOTS */
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-3">
                {[0, 1, 2].map((slotIdx) => {
                  const p = players.find(player => player.slot === slotIdx);
                  const style = slotStyles[slotIdx];
                  const isLocal = slotIdx === playerSlot;

                  return (
                    <div
                      key={slotIdx}
                      className={`flex items-center justify-between p-4 bg-[#142416] border-2 ${p ? style.border : 'border-dashed border-[#2b180a]'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 ${style.bg} text-black font-bold flex items-center justify-center text-xs`}>
                          P{slotIdx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-white">
                              {p ? p.name : 'Slot Vacío'}
                            </span>
                            {isLocal && (
                              <span className="text-[8px] bg-[#438a22] text-white px-1.5 py-0.5">
                                TÚ
                              </span>
                            )}
                            {p?.isBot && (
                              <span className="text-[8px] bg-amber-800 text-amber-200 px-1.5 py-0.5">
                                BOT
                              </span>
                            )}
                          </div>
                          <p className="text-[8px] text-[#73c242] mt-1">
                            {p ? (p.ready ? '✓ LISTO' : 'ESPERANDO...') : 'LIBRE'}
                          </p>
                        </div>
                      </div>

                      {p && (
                        <div className="text-[10px]">
                          {p.ready ? (
                            <span className="text-green-400">LISTO</span>
                          ) : (
                            <span className="text-yellow-400">PENDIENTE</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex flex-col sm:flex-row gap-3">
                {players.length < 3 && (
                  <button
                    onClick={handleFillBots}
                    className="flex-1 py-3 pixel-btn-wood text-[10px] cursor-pointer"
                  >
                    🤖 LLENAR CON BOTS
                  </button>
                )}

                <button
                  onClick={handleToggleReady}
                  className="flex-1 py-3 pixel-btn-green text-[10px] cursor-pointer"
                >
                  {players.find(p => p.slot === playerSlot)?.ready ? 'CANCELAR' : '¡ESTOY LISTO!'}
                </button>
              </div>

              {isHost && (
                <button
                  onClick={handleStartGame}
                  className="w-full py-4 pixel-btn-green text-xs font-pixel uppercase cursor-pointer"
                >
                  🚀 INICIAR PARTIDA
                </button>
              )}
            </div>
          )}
        </main>
      ) : (
        /* MAIN GAME & HUD DISPLAY */
        <main className="w-full max-w-5xl flex flex-col items-center gap-6">
          {/* GAME ARENA CANVAS */}
          <DinoGame
            roomCode={roomCode}
            localSlot={playerSlot ?? 0}
            playerList={players}
            isHost={isHost}
            isCountdownActive={countdown !== null}
          />

          {/* 3 PLAYER WEBCAM & HUD CARDS GRID */}
          <section className="w-full grid grid-cols-1 md:grid-cols-3 gap-4">
            {[0, 1, 2].map((slotIdx) => {
              const p = players.find(player => player.slot === slotIdx);
              const style = slotStyles[slotIdx];
              const isLocal = slotIdx === playerSlot;
              const remoteStream = remoteStreams[slotIdx];

              return (
                <div
                  key={slotIdx}
                  className={`pixel-card p-4 flex flex-col gap-3 border-2 ${style.border}`}
                >
                  {/* PLAYER HEADER & BADGE */}
                  <div className="flex items-center justify-between border-b-2 border-[#2b180a] pb-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 ${style.bg}`} />
                      <span className={`text-xs ${style.text}`}>
                        {p ? p.name : `P${slotIdx + 1}`}
                      </span>
                    </div>

                    {/* PIXEL LIVES (❤️ ❤️ ❤️) */}
                    <div className="flex items-center gap-1 text-xs">
                      {[1, 2, 3].map((heart) => (
                        <span key={heart} className={p && p.lives >= heart ? 'opacity-100' : 'opacity-20 grayscale'}>
                          ❤️
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* WEBCAM VIDEO DISPLAY CONTAINER */}
                  <div className="relative w-full aspect-video bg-black border-2 border-[#2b180a] flex items-center justify-center overflow-hidden">
                    {isLocal ? (
                      /* LOCAL WEBCAM FEED */
                      <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover scale-x-[-1]"
                      />
                    ) : remoteStream ? (
                      /* REMOTE PLAYER WEBCAM STREAM (WebRTC) */
                      <video
                        ref={(el) => {
                          if (el && remoteStream && el.srcObject !== remoteStream) {
                            el.srcObject = remoteStream;
                          }
                        }}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover scale-x-[-1]"
                      />
                    ) : (
                      /* AVATAR / BOT PREVIEW */
                      <div className="flex flex-col items-center gap-2 text-center p-3">
                        <div className="text-2xl">
                          {p?.isBot ? '🤖' : '📹'}
                        </div>
                        <span className="text-[8px] text-gray-400">
                          {p?.isBot ? 'BOT SIMULADO' : p ? 'CÁMARA REMOTA' : 'VACÍO'}
                        </span>
                      </div>
                    )}

                    {/* OVERLAY BADGE */}
                    <div className="absolute top-2 left-2 bg-[#142416] px-2 py-0.5 text-[8px] text-[#f4d160] border border-[#2b180a]">
                      {isLocal ? 'TU CÁMARA' : p ? p.name : 'DESCONECTADO'}
                    </div>
                  </div>

                  {/* PLAYER STATUS FOOTER */}
                  <div className="flex items-center justify-between text-[8px] pt-1 text-gray-300">
                    <span>ESTADO:</span>
                    <span className={p && p.lives > 0 ? 'text-green-400' : 'text-red-500'}>
                      {p ? (p.lives > 0 ? 'EN JUEGO' : 'ELIMINADO') : 'VACÍO'}
                    </span>
                  </div>
                </div>
              );
            })}
          </section>
        </main>
      )}

      {/* COUNTDOWN OVERLAY */}
      {countdown !== null && (
        <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center pointer-events-none">
          <h2 className="text-6xl md:text-8xl text-[#f4d160] pixel-text-shadow mb-8 animate-ping">
            {countdown > 0 ? countdown : '¡YA!'}
          </h2>
          <p className="text-sm md:text-base text-[#38ef7d] animate-pulse">¡Prepárate frente a la cámara!</p>
        </div>
      )}
    </div>
  );
};

export default App;