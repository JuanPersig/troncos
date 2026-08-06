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
  const localPlayer = players.find(p => p.slot === playerSlot);
  const isReady = localPlayer?.ready || false;
  const allReady = players.length > 0 && players.every(p => p.ready);
  
  const maxPlayers = 4;
  
  const slots = Array.from({ length: maxPlayers }).map((_, index) => {
    return players.find(p => p.slot === index) || null;
  });

  return (
    <div className="screen-center">
      <div className="screen-content-full flex flex-col md:flex-row gap-6 w-full">
        
        {/* Left Panel */}
        <div className="pixel-panel flex flex-col gap-4 flex-1 md:max-w-[300px]">
          <h2 className="text-xl text-golden pixel-text-shadow">SALA</h2>
          <RoomCodeDisplay code={roomCode} />
          <ConnectionStatus isConnected={isConnected} />
          
          <div className="divider" />
          
          <div className="flex flex-col gap-2">
            <label className="pixel-label">MINIJUEGO SELECCIONADO</label>
            <div className="p-3 bg-bg-dark border-2 border-bark text-center">
              {selectedGame ? (
                <span className="text-cyan">{selectedGame}</span>
              ) : (
                <span className="text-muted">NINGUNO</span>
              )}
            </div>
          </div>
        </div>

        {/* Center Panel - Player Grid */}
        <div className="flex-[2] flex flex-col gap-4 justify-center items-center p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            {slots.map((player, index) => {
              const isLocal = player?.slot === playerSlot;
              const stream = isLocal ? localStream : remoteStreams[index];
              return (
                <div key={index} className="h-[250px]">
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

        {/* Right Panel - Actions */}
        <div className="pixel-panel flex flex-col gap-4 flex-1 md:max-w-[300px] justify-between">
          <div className="flex flex-col gap-4">
            <h2 className="text-xl text-golden pixel-text-shadow mb-2">ACCIONES</h2>
            
            {isHost && (
              <PixelButton variant="wood" onClick={onSelectGame}>
                ELEGIR MINIJUEGO
              </PixelButton>
            )}
            
            <PixelButton 
              variant={isReady ? 'danger' : 'green'} 
              onClick={onReadyToggle}
            >
              {isReady ? 'CANCELAR LISTO' : 'ESTOY LISTO'}
            </PixelButton>
            
            {isHost && onFillBots && players.length < maxPlayers && (
              <PixelButton variant="wood" onClick={onFillBots}>
                LLENAR CON BOTS
              </PixelButton>
            )}
            
            <div className="divider" />
            
            {isHost && (
              <PixelButton 
                variant="golden" 
                size="lg" 
                disabled={!selectedGame || !allReady}
                onClick={onStartGame}
              >
                INICIAR PARTIDA
              </PixelButton>
            )}
          </div>
          
          <PixelButton variant="danger" className="mt-8" onClick={onLeaveRoom}>
            ABANDONAR SALA
          </PixelButton>
        </div>

      </div>
    </div>
  );
};
