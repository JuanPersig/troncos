import React from 'react';
import { PlayerInfo, GameResults } from '@/core/types';
import { PlayerCard } from '@/components/PlayerCard';
import { MINIGAME_REGISTRY } from '@/minigames/registry';

interface GameScreenProps {
  roomCode: string;
  players: PlayerInfo[];
  localSlot: number;
  isHost: boolean;
  localStream: MediaStream | null;
  remoteStreams: Record<number, MediaStream>;
  selectedGameId: string | null;
  onGameEnd: (results: GameResults) => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  roomCode,
  players,
  localSlot,
  isHost,
  localStream,
  remoteStreams,
  selectedGameId,
  onGameEnd
}) => {
  const selectedGame = MINIGAME_REGISTRY.find(g => g.id === selectedGameId);
  
  if (!selectedGame) {
    return (
      <div className="screen-center">
        <div className="error-box">Juego no encontrado</div>
      </div>
    );
  }

  const GameComponent = selectedGame.component;

  return (
    <div className="screen flex-row h-screen overflow-hidden bg-[#0c180e]">
      {/* Sidebar with players */}
      <div className="w-[300px] flex flex-col gap-2 p-2 bg-[#142416] border-r-4 border-[#2b180a] overflow-y-auto z-10">
        <h2 className="text-golden text-center text-sm py-2">SALA: {roomCode}</h2>
        {players.map((player) => {
          const isLocal = player.slot === localSlot;
          const stream = isLocal ? localStream : remoteStreams[player.slot];
          return (
            <div key={player.id} className="h-[200px]">
              <PlayerCard 
                player={player}
                slotIndex={player.slot}
                isLocal={isLocal}
                stream={stream}
                showCamera={true}
              />
            </div>
          );
        })}
      </div>

      {/* Main Game Area */}
      <div className="flex-1 relative">
        <GameComponent 
          roomCode={roomCode}
          localSlot={localSlot}
          players={players}
          isHost={isHost}
          localStream={localStream}
          onGameEnd={onGameEnd}
        />
      </div>
    </div>
  );
};
