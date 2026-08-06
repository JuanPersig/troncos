import React, { useState } from 'react';
import { PixelButton } from '@/components/PixelButton';

interface CreateRoomProps {
  playerName: string;
  isConnected: boolean;
  onRoomCreated: (roomCode: string) => void;
  onBack: () => void;
}

export const CreateRoom: React.FC<CreateRoomProps> = ({
  playerName,
  isConnected,
  onRoomCreated,
  onBack,
}) => {
  const [roomCode, setRoomCode] = useState(() => `JF-${Math.floor(1000 + Math.random() * 9000)}`);

  const handleRegenerateCode = () => {
    setRoomCode(`JF-${Math.floor(1000 + Math.random() * 9000)}`);
  };

  const handleCreate = () => {
    onRoomCreated(roomCode);
  };

  return (
    <div className="screen-center">
      <div className="pixel-panel flex flex-col gap-4 w-full max-w-[400px]">
        <h2 className="text-xl text-yellow text-center pixel-text-shadow">🎮 CREAR SALA</h2>

        <div className="flex flex-col gap-2">
          <label className="pixel-label">CÓDIGO DE LA SALA</label>
          <div className="flex gap-2 items-center">
            <div className="room-code flex-1">{roomCode}</div>
            <PixelButton variant="celeste" size="sm" onClick={handleRegenerateCode}>
              🔄
            </PixelButton>
          </div>
          <span className="text-xs text-muted text-center mt-1">Comparte este código con tus amigos para jugar.</span>
        </div>

        <div className="divider" />

        <div className="flex gap-3">
          <PixelButton 
            variant="orange" 
            size="lg" 
            className="flex-1 justify-center" 
            disabled={!isConnected}
            onClick={handleCreate}
          >
            ¡ENTRAR A LA SALA!
          </PixelButton>

          <PixelButton variant="danger" className="justify-center" onClick={onBack}>
            VOLVER
          </PixelButton>
        </div>
      </div>
    </div>
  );
};
