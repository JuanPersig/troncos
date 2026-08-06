import React from 'react';

interface RoomCodeDisplayProps {
  code: string;
}

export const RoomCodeDisplay: React.FC<RoomCodeDisplayProps> = ({ code }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    alert(`Código de sala copiado: ${code}`);
  };

  return (
    <div className="flex flex-col gap-1 w-full">
      <label className="pixel-label text-center">CÓDIGO DE SALA</label>
      <div 
        className="room-code cursor-pointer hover:border-yellow-bright transition-colors flex items-center justify-between"
        onClick={handleCopy}
        title="Haz clic para copiar"
      >
        <span className="text-yellow">{code || '---'}</span>
        <span className="text-xs text-celeste">📋</span>
      </div>
    </div>
  );
};
