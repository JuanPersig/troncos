import React, { useState } from 'react';
import { PixelButton } from '@/components/PixelButton';

interface CreateRoomProps {
  playerName: string;
  isConnected: boolean;
  onRoomCreated: (roomCode: string, maxPlayers: number) => void;
  onBack: () => void;
}

export const CreateRoom: React.FC<CreateRoomProps> = ({
  playerName,
  isConnected,
  onRoomCreated,
  onBack
}) => {
  const generateCode = () => 'JF-' + Math.random().toString(36).substring(2, 6).toUpperCase();
  const [roomCode, setRoomCode] = useState(generateCode());
  const [maxPlayers, setMaxPlayers] = useState(3);

  return (
    <div className="screen-center">
      <div className="pixel-panel flex flex-col gap-6 w-full max-w-[400px]">
        <h2 className="text-2xl text-golden text-center pixel-text-shadow">CREAR SALA</h2>
        
        <div className="flex flex-col gap-2">
          <label className="pixel-label text-center">CÓDIGO DE SALA</label>
          <div className="flex gap-2">
            <div className="flex-1 bg-bg-dark border-2 border-bark p-3 text-center text-xl font-mono text-cyan">
              {roomCode}
            </div>
            <PixelButton variant="wood" size="sm" onClick={() => setRoomCode(generateCode())}>
              🔄
            </PixelButton>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="pixel-label text-center">JUGADORES ({maxPlayers})</label>
          <div className="flex justify-between gap-2">
            {[2, 3, 4].map(num => (
              <PixelButton 
                key={num} 
                variant={maxPlayers === num ? 'golden' : 'wood'} 
                className="flex-1 justify-center"
                onClick={() => setMaxPlayers(num)}
              >
                {num}
              </PixelButton>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4 mt-4">
          <PixelButton 
            variant="green" 
            size="lg" 
            className="w-full justify-center" 
            disabled={!isConnected}
            onClick={() => onRoomCreated(roomCode, maxPlayers)}
          >
            CREAR SALA
          </PixelButton>
          <PixelButton variant="danger" className="w-full justify-center" onClick={onBack}>
            VOLVER
          </PixelButton>
        </div>
      </div>
    </div>
  );
};
