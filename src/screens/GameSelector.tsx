import React from 'react';
import { PixelButton } from '@/components/PixelButton';
import { MINIGAME_REGISTRY } from '@/minigames/registry';

interface GameSelectorProps {
  onSelect: (gameId: string) => void;
  onBack: () => void;
  currentSelection: string | null;
}

export const GameSelector: React.FC<GameSelectorProps> = ({
  onSelect,
  onBack,
  currentSelection
}) => {
  return (
    <div className="screen-center overflow-y-auto">
      <div className="screen-content-wide flex flex-col gap-6 w-full py-8">
        <h2 className="text-3xl text-golden text-center pixel-text-shadow">SELECCIONAR MINIJUEGO</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MINIGAME_REGISTRY.map(game => {
            const isSelected = game.id === currentSelection;
            const isAvailable = game.status === 'available';
            
            return (
              <div 
                key={game.id}
                className={`game-card ${!isAvailable ? 'game-card-disabled' : ''} ${isSelected ? 'game-card-selected' : ''}`}
                onClick={() => isAvailable && onSelect(game.id)}
              >
                <div className="game-card-thumbnail bg-black flex items-center justify-center text-4xl">
                  {game.thumbnail ? <img src={game.thumbnail} alt={game.name} className="w-full h-full object-cover" /> : '🎮'}
                </div>
                <div className="game-card-body flex flex-col gap-2">
                  <h3 className="game-card-title">{game.name}</h3>
                  <p className="game-card-desc">{game.description}</p>
                </div>
                <div className="game-card-footer">
                  <span className="text-muted">Jugadores: {game.minPlayers}-{game.maxPlayers}</span>
                  {game.status === 'coming_soon' && (
                    <span className="pixel-badge pixel-badge-coming">PRÓXIMAMENTE</span>
                  )}
                  {isSelected && (
                    <span className="pixel-badge pixel-badge-golden">SELECCIONADO</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-center gap-4 mt-6">
          <PixelButton variant="danger" size="lg" onClick={onBack}>
            VOLVER
          </PixelButton>
        </div>
      </div>
    </div>
  );
};
