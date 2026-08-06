import React from 'react';

interface CountdownOverlayProps {
  count: number | null;
}

export const CountdownOverlay: React.FC<CountdownOverlayProps> = ({ count }) => {
  if (count === null) return null;

  return (
    <div className="overlay">
      <div className="flex flex-col items-center justify-center gap-4 text-center animate-pulse">
        <h2 className="text-4xl sm:text-6xl text-yellow pixel-text-shadow">
          {count > 0 ? count : '¡YA!'}
        </h2>
        <p className="text-sm text-celeste">¡PREPÁRATE EN LA CÁMARA!</p>
      </div>
    </div>
  );
};
