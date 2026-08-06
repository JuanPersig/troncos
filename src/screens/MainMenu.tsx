import React, { useState } from 'react';
import { AppScreen } from '@/core/types';
import { PixelButton } from '@/components/PixelButton';
import { ConnectionStatus } from '@/components/ConnectionStatus';

interface MainMenuProps {
  playerName: string;
  onPlayerNameChange: (name: string) => void;
  isConnected: boolean;
  onNavigate: (screen: AppScreen) => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  playerName,
  onPlayerNameChange,
  isConnected,
  onNavigate,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(playerName);

  const handleSaveName = () => {
    if (tempName.trim()) {
      onPlayerNameChange(tempName.trim());
    }
    setIsEditingName(false);
  };

  return (
    <div className="screen-center">
      <div className="pixel-panel flex flex-col gap-4 w-full max-w-[400px] items-center text-center">
        {/* Title Logo */}
        <div className="mb-2">
          <h1 className="text-3xl text-yellow pixel-text-shadow mb-1 animate-pulse">
            JUMPING FRIENDS
          </h1>
          <p className="text-xs text-celeste">MINIJUEGOS MULTIJUGADOR ONLINE</p>
        </div>

        {/* Player Profile Box */}
        <div className="w-full p-3 bg-bg-darkest border border-sky-dark flex flex-col gap-2">
          <span className="text-xs text-orange">NOMBRE JUGADOR:</span>
          {isEditingName ? (
            <div className="flex gap-2">
              <input
                className="pixel-input text-center"
                value={tempName}
                maxLength={12}
                onChange={(e) => setTempName(e.target.value)}
                autoFocus
              />
              <PixelButton variant="green" size="sm" onClick={handleSaveName}>
                OK
              </PixelButton>
            </div>
          ) : (
            <div 
              className="text-sm text-white font-mono cursor-pointer hover:text-yellow transition-colors flex items-center justify-center gap-2"
              onClick={() => setIsEditingName(true)}
            >
              <span>{playerName}</span>
              <span className="text-xs text-muted">✏️</span>
            </div>
          )}
        </div>

        {/* Menu Action Buttons */}
        <div className="flex flex-col gap-3 w-full mt-2">
          <PixelButton 
            variant="orange" 
            size="lg" 
            className="w-full justify-center"
            onClick={() => onNavigate('create-room')}
          >
            🎮 CREAR SALA
          </PixelButton>

          <PixelButton 
            variant="celeste" 
            size="lg" 
            className="w-full justify-center"
            onClick={() => onNavigate('join-room')}
          >
            🚪 UNIRSE A SALA
          </PixelButton>

          <PixelButton 
            variant="yellow" 
            className="w-full justify-center"
            onClick={() => onNavigate('settings')}
          >
            ⚙️ CONFIGURACIÓN
          </PixelButton>
        </div>

        {/* Footer info */}
        <div className="divider" />
        <div className="flex items-center justify-between w-full text-xs text-muted">
          <ConnectionStatus isConnected={isConnected} />
          <span>v1.0.0</span>
        </div>
      </div>
    </div>
  );
};
