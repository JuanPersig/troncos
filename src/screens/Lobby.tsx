import React from 'react';
import { PlayerInfo } from '@/core/types';
import { PixelButton } from '@/components/PixelButton';
import { PlayerCard } from '@/components/PlayerCard';
import { RoomCodeDisplay } from '@/components/RoomCodeDisplay';
import { ConnectionStatus } from '@/components/ConnectionStatus';

interface LobbyProps {
  roomCode: string;
  players: PlayerInfo[];
  hostId: string;
  playerSlot: number | null;
  localStream: MediaStream | null;
  remoteStreams: Record<number, MediaStream>;
  isConnected: boolean;
  selectedGame: string | null;
  onSelectGame: () => void;
  onStartGame: () => void;
  onLeaveRoom: () => void;
  onReadyToggle?: () => void;
  onFillBots?: () => void;
}

export const Lobby: React.FC<LobbyProps> = ({
  roomCode,
  players,
  hostId,
  playerSlot,
  localStream,
  remoteStreams,
  isConnected,
  selectedGame,
  onSelectGame,
  onStartGame,
  onLeaveRoom,
  onReadyToggle,
  onFillBots
}) => {
  const isHost = playerSlot !== null && players.find(p => p.slot === playerSlot)?.id === hostId;
  const activeGame = selectedGame || 'jump-logs';
  const maxPlayers = 3;
  
  const slots = Array.from({ length: maxPlayers }).map((_, index) => {
    return players.find(p => p.slot === index) || null;
  });

  return (
    <div className="screen-center py-4">
      <div className="screen-content-full flex flex-col md:flex-row gap-4 w-full max-w-[960px]">
        
        {/* Left Panel: Room Info */}
        <div className="pixel-panel flex flex-col gap-3 flex-1 md:max-w-[260px]">
          <h2 className="text-lg text-yellow pixel-text-shadow">SALA</h2>
          <RoomCodeDisplay code={roomCode} />
          <ConnectionStatus isConnected={isConnected} />
          
          <div className="divider" />
          
          <div className="flex flex-col gap-1">
            <label className="pixel-label">MINIJUEGO ACTIVO</label>
            <div className="p-2 bg-bg-darkest border border-sky-dark text-center font-mono text-sm text-celeste">
              {activeGame === 'jump-logs' ? '🪵 JUMP LOGS' : activeGame}
            </div>
            {isHost && (
              <PixelButton variant="celeste" size="sm" className="mt-2" onClick={onSelectGame}>
                CAMBIAR JUEGO
              </PixelButton>
            )}
          </div>
        </div>

        {/* Center Panel: Player Cameras */}
        <div className="flex-[2] flex flex-col gap-3 justify-center items-center">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
            {slots.map((player, index) => {
              const isLocal = player?.slot === playerSlot;
              const stream = isLocal ? localStream : remoteStreams[index];
              return (
                <div key={index} className="h-[180px]">
                  <PlayerCard 
                    player={player}
                    slotIndex={index}
                    isLocal={isLocal}
                    stream={stream}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Panel: Controls */}
        <div className="pixel-panel flex flex-col gap-3 flex-1 md:max-w-[260px] justify-between">
          <div className="flex flex-col gap-3">
            <h2 className="text-lg text-yellow pixel-text-shadow">CONTROLES</h2>
            
            {isHost && onFillBots && players.length < maxPlayers && (
              <PixelButton variant="yellow" size="sm" onClick={onFillBots}>
                🤖 LLENAR BOTS
              </PixelButton>
            )}

            {isHost ? (
              <PixelButton 
                variant="orange" 
                size="lg"
                className="w-full mt-2"
                onClick={onStartGame}
              >
                🚀 INICIAR PARTIDA
              </PixelButton>
            ) : (
              <div className="p-3 bg-bg-darkest border border-sky text-center text-xs text-secondary animate-pulse">
                ESPERANDO AL ANFITRIÓN PARA INICIAR...
              </div>
            )}
          </div>
          
          <PixelButton variant="danger" size="sm" className="mt-4" onClick={onLeaveRoom}>
            SALIR DE SALA
          </PixelButton>
        </div>

      </div>
    </div>
  );
};
