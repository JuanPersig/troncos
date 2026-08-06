import React, { useState } from 'react';
import { AppScreen, APP_VERSION } from '@/core/types';
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
  onNavigate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(playerName);

  const handleNameSave = () => {
    if (tempName.trim()) {
      onPlayerNameChange(tempName.trim());
    }
    setIsEditing(false);
  };

  return (
    <div className="screen-center">
      <div className="pixel-panel flex flex-col items-center gap-8 w-full max-w-[400px]">
        <h1 className="text-3xl text-golden pixel-text-shadow-lg text-center leading-tight">
          JUMPING<br />FRIENDS
        </h1>
        
        <div className="w-full flex flex-col items-center gap-2">
          <label className="pixel-label">TU NOMBRE</label>
          {isEditing ? (
            <div className="flex gap-2 w-full">
              <input 
                className="pixel-input flex-1" 
                value={tempName} 
                onChange={(e) => setTempName(e.target.value.toUpperCase())}
                maxLength={10}
                autoFocus
                onBlur={handleNameSave}
                onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
              />
              <PixelButton variant="green" size="sm" onClick={handleNameSave}>OK</PixelButton>
            </div>
          ) : (
            <div 
              className="text-xl text-cyan cursor-pointer hover:text-white transition-colors"
              onClick={() => {
                setTempName(playerName);
                setIsEditing(true);
              }}
            >
              {playerName} ✏️
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4 w-full">
          <PixelButton variant="golden" size="lg" className="w-full justify-center" onClick={() => onNavigate('create-room')}>
            🎮 JUGAR ONLINE
          </PixelButton>
          <PixelButton variant="green" className="w-full justify-center" onClick={() => onNavigate('join-room')}>
            🚪 UNIRSE A SALA
          </PixelButton>
          <PixelButton variant="wood" className="w-full justify-center" onClick={() => onNavigate('settings')}>
            ⚙️ CONFIGURACIÓN
          </PixelButton>
        </div>

        <div className="flex w-full justify-between items-center mt-4 pt-4 border-t-2 border-bark">
          <span className="text-xs text-muted">v{APP_VERSION}</span>
          <ConnectionStatus isConnected={isConnected} />
        </div>
      </div>
    </div>
  );
};
