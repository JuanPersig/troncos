import React, { useState } from 'react';
import { PixelButton } from '@/components/PixelButton';

interface JoinRoomProps {
  playerName: string;
  isConnected: boolean;
  onRoomJoined: (roomCode: string) => void;
  onBack: () => void;
}

export const JoinRoom: React.FC<JoinRoomProps> = ({
  playerName,
  isConnected,
  onRoomJoined,
  onBack
}) => {
  const [roomCode, setRoomCode] = useState('');

  const handleJoin = () => {
    if (roomCode.trim().length >= 4) {
      onRoomJoined(roomCode.trim().toUpperCase());
    }
  };

  return (
    <div className="screen-center">
      <div className="pixel-panel flex flex-col gap-6 w-full max-w-[400px]">
        <h2 className="text-2xl text-golden text-center pixel-text-shadow">UNIRSE A SALA</h2>
        
        <div className="flex flex-col gap-2">
          <label className="pixel-label">CÓDIGO DE SALA</label>
          <input 
            className="pixel-input text-center text-xl font-mono text-cyan" 
            value={roomCode} 
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            placeholder="JF-XXXX"
            maxLength={10}
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
          />
        </div>

        <div className="flex flex-col gap-4 mt-4">
          <PixelButton 
            variant="golden" 
            size="lg" 
            className="w-full justify-center" 
            disabled={!isConnected || roomCode.trim().length < 4}
            onClick={handleJoin}
          >
            UNIRSE
          </PixelButton>
          <PixelButton variant="danger" className="w-full justify-center" onClick={onBack}>
            VOLVER
          </PixelButton>
        </div>
      </div>
    </div>
  );
};
