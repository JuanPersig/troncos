import React from 'react';
import { GameResults } from '@/core/types';
import { PixelButton } from '@/components/PixelButton';
import { PLAYER_COLORS } from '@/core/constants';

interface ResultsScreenProps {
  results: GameResults;
  onBackToLobby: () => void;
  onPlayAgain: () => void;
  isHost: boolean;
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({
  results,
  onBackToLobby,
  onPlayAgain,
  isHost
}) => {
  const sortedPlayers = [...results.players].sort((a, b) => {
    if (a.isWinner && !b.isWinner) return -1;
    if (!a.isWinner && b.isWinner) return 1;
    return b.score - a.score;
  });

  return (
    <div className="screen-center">
      <div className="screen-content-wide pixel-panel flex flex-col items-center gap-8 py-8">
        <h1 className="text-4xl text-golden pixel-text-shadow-lg">🏆 RESULTADOS</h1>
        <h2 className="text-xl text-cyan">{results.gameName}</h2>
        
        {/* Podium */}
        <div className="flex items-end justify-center gap-4 h-[200px] mt-4">
          {sortedPlayers.slice(0, 3).map((p, i) => {
            const height = i === 0 ? '160px' : i === 1 ? '120px' : '90px';
            const color = PLAYER_COLORS[p.slot]?.primary || 'white';
            return (
              <div key={p.slot} className="flex flex-col items-center gap-2">
                <span className="text-sm font-bold" style={{ color }}>{p.name}</span>
                <div 
                  className="w-[80px] bg-[#142416] border-[4px] border-[#2b180a] flex items-start justify-center pt-2"
                  style={{ height, borderColor: color }}
                >
                  <span className="text-xl text-golden">{i + 1}º</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Results Table */}
        <div className="w-full max-w-[500px] flex flex-col gap-2 mt-4">
          <div className="flex justify-between text-muted text-xs px-4 mb-2">
            <span>JUGADOR</span>
            <div className="flex gap-8">
              <span>VIDAS</span>
              <span>PUNTOS</span>
            </div>
          </div>
          
          {sortedPlayers.map((p) => (
            <div key={p.slot} className={`player-slot ${p.isWinner ? 'border-golden bg-[#2a220a]' : ''}`}>
              <div className="flex items-center gap-4">
                <span className="text-lg" style={{ color: PLAYER_COLORS[p.slot]?.primary }}>{p.name}</span>
                {p.isWinner && <span className="pixel-badge pixel-badge-golden">🥇 GANADOR</span>}
              </div>
              <div className="flex gap-8 text-golden">
                <span className="w-8 text-center">{p.livesRemaining}</span>
                <span className="w-12 text-right">{p.score}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-4 mt-8 w-full max-w-[500px]">
          <PixelButton variant="wood" size="lg" className="flex-1 justify-center" onClick={onBackToLobby}>
            VOLVER AL LOBBY
          </PixelButton>
          {isHost && (
            <PixelButton variant="golden" size="lg" className="flex-1 justify-center" onClick={onPlayAgain}>
              JUGAR DE NUEVO
            </PixelButton>
          )}
        </div>
      </div>
    </div>
  );
};
