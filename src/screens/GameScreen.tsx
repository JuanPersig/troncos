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
  const gameId = selectedGameId || 'jump-logs';
  const selectedGame = MINIGAME_REGISTRY.find(g => g.id === gameId) || MINIGAME_REGISTRY[0];
  const GameComponent = selectedGame.component;

  return (
    <div className="screen flex-col lg:flex-row min-h-screen bg-bg-darkest overflow-hidden">
      {/* Sidebar / Top bar with player webcams */}
      <div className="w-full lg:w-[240px] shrink-0 flex flex-col gap-2 p-2 bg-bg-dark border-b-2 lg:border-b-0 lg:border-r-2 border-sky-dark z-10">
        <div className="flex items-center justify-between px-2 py-1 bg-bg-panel border border-sky-dark text-xs">
          <span className="text-yellow">SALA:</span>
          <span className="text-celeste font-mono">{roomCode}</span>
        </div>

        <div className="grid grid-cols-3 lg:grid-cols-1 gap-2 flex-1">
          {players.map((player) => {
            const isLocal = player.slot === localSlot;
            const stream = isLocal ? localStream : remoteStreams[player.slot];
            return (
              <div key={player.id} className="h-[120px] lg:h-[160px]">
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
      </div>

      {/* Main Minigame Canvas Area */}
      <div className="flex-1 flex items-center justify-center p-2 relative overflow-hidden">
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
