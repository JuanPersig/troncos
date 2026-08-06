import React from 'react';
import { MINIGAME_REGISTRY } from '@/minigames/registry';
import { PixelButton } from '@/components/PixelButton';

interface GameSelectorProps {
  currentSelection: string | null;
  onSelect: (gameId: string) => void;
  onBack: () => void;
}

export const GameSelector: React.FC<GameSelectorProps> = ({
  currentSelection,
  onSelect,
  onBack,
}) => {
  const selectedId = currentSelection || 'jump-logs';

  return (
    <div className="screen-center py-4">
      <div className="screen-content-wide flex flex-col gap-4">
        <h2 className="text-xl text-yellow text-center pixel-text-shadow">🎮 SELECTOR DE MINIJUEGOS</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {MINIGAME_REGISTRY.map((game) => {
            const isSelected = game.id === selectedId;
            const isAvailable = game.status === 'available';

            return (
              <div
                key={game.id}
                className={`game-card ${isSelected ? 'game-card-selected' : ''} ${!isAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => isAvailable && onSelect(game.id)}
              >
                <img
                  src={game.thumbnail}
                  alt={game.name}
                  className="game-card-thumbnail"
                />
                <div className="game-card-body">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="game-card-title">{game.name}</h3>
                    {isSelected && <span className="pixel-badge pixel-badge-yellow">SELECCIONADO</span>}
                    {!isAvailable && <span className="pixel-badge pixel-badge-celeste">PRÓXIMAMENTE</span>}
                  </div>
                  <p className="game-card-desc">{game.description}</p>
                </div>
                <div className="flex justify-between items-center px-3 py-2 bg-bg-darkest text-xs border-t border-sky-dark">
                  <span className="text-celeste">JUGADORES: {game.minPlayers}-{game.maxPlayers}</span>
                  {isAvailable && (
                    <PixelButton variant={isSelected ? 'orange' : 'celeste'} size="sm">
                      {isSelected ? 'ELEGIDO' : 'SELECCIONAR'}
                    </PixelButton>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-center mt-4">
          <PixelButton variant="danger" onClick={onBack}>
            VOLVER AL LOBBY
          </PixelButton>
        </div>
      </div>
    </div>
  );
};
