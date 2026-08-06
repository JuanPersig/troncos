import React from 'react';

interface RoomCodeDisplayProps {
  code: string;
}

export const RoomCodeDisplay: React.FC<RoomCodeDisplayProps> = ({ code }) => {
  return (
    <div className="room-code flex items-center justify-between p-2 pixel-border-wood bg-bark mb-4">
      <span className="text-sm text-golden">CÓDIGO: {code}</span>
      <button 
        className="pixel-btn pixel-btn-sm pixel-btn-wood"
        onClick={() => navigator.clipboard.writeText(code)}
      >
        COPIAR
      </button>
    </div>
  );
};
