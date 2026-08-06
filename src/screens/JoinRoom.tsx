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
  onBack,
}) => {
  const [inputCode, setInputCode] = useState('');

  const handleJoin = () => {
    if (inputCode.trim()) {
      onRoomJoined(inputCode.trim().toUpperCase());
    }
  };

  return (
    <div className="screen-center">
      <div className="pixel-panel flex flex-col gap-4 w-full max-w-[400px]">
        <h2 className="text-xl text-yellow text-center pixel-text-shadow">🚪 UNIRSE A SALA</h2>

        <div className="flex flex-col gap-2">
          <label className="pixel-label">INGRESA EL CÓDIGO</label>
          <input
            className="pixel-input text-center text-lg font-mono uppercase"
            placeholder="EJ: JF-1234"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            autoFocus
          />
        </div>

        <div className="divider" />

        <div className="flex gap-3">
          <PixelButton 
            variant="celeste" 
            size="lg" 
            className="flex-1 justify-center" 
            disabled={!isConnected || !inputCode.trim()}
            onClick={handleJoin}
          >
            UNIRSE
          </PixelButton>

          <PixelButton variant="danger" className="justify-center" onClick={onBack}>
            VOLVER
          </PixelButton>
        </div>
      </div>
    </div>
  );
};
