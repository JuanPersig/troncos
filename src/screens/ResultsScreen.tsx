import React from 'react';
import { GameResults } from '@/core/types';
import { PixelButton } from '@/components/PixelButton';

interface ResultsScreenProps {
  results: GameResults;
  isHost: boolean;
  onBackToLobby: () => void;
  onPlayAgain: () => void;
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({
  results,
  isHost,
  onBackToLobby,
  onPlayAgain,
}) => {
  const winner = results.players.find(p => p.isWinner) || results.players[0];

  return (
    <div className="screen-center">
      <div className="pixel-panel flex flex-col gap-4 w-full max-w-[500px]">
        <h2 className="text-2xl text-yellow text-center pixel-text-shadow">🏆 RESULTADOS</h2>
        <h3 className="text-sm text-celeste text-center font-mono">{results.gameName.toUpperCase()}</h3>

        {/* Winner Highlight Box */}
        {winner && (
          <div className="p-4 bg-bg-darkest border-2 border-yellow text-center flex flex-col gap-2">
            <span className="text-xs text-orange">👑 GANADOR DE LA PARTIDA 👑</span>
            <span className="text-xl text-yellow font-bold">{winner.name}</span>
            <span className="text-xs text-celeste">PUNTAJE: {winner.score} PTS</span>
          </div>
        )}

        {/* Leaderboard Table */}
        <div className="flex flex-col gap-2 my-2">
          {results.players.map((p, idx) => (
            <div 
              key={p.slot}
              className={`flex items-center justify-between p-3 border ${p.isWinner ? 'bg-bg-light border-yellow' : 'bg-bg-dark border-sky-dark'}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xs text-yellow font-bold">#{idx + 1}</span>
                <span className="text-sm text-white">{p.name}</span>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="text-celeste">{p.score} PTS</span>
                <span className={p.livesRemaining > 0 ? 'text-green-400' : 'text-error'}>
                  {p.livesRemaining > 0 ? '❤️ '.repeat(p.livesRemaining) : '💀 ELIMINADO'}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="divider" />

        {/* Action Buttons */}
        <div className="flex gap-3">
          {isHost && (
            <PixelButton variant="orange" size="lg" className="flex-1 justify-center" onClick={onPlayAgain}>
              🔄 JUGAR DE NUEVO
            </PixelButton>
          )}

          <PixelButton variant="celeste" className="flex-1 justify-center" onClick={onBackToLobby}>
            VOLVER AL LOBBY
          </PixelButton>
        </div>
      </div>
    </div>
  );
};
