import React from 'react';

interface CountdownOverlayProps {
  count: number | null;
}

export const CountdownOverlay: React.FC<CountdownOverlayProps> = ({ count }) => {
  if (count === null) return null;

  return (
    <div className="overlay">
      <div className="text-4xl text-golden pixel-text-shadow-lg animate-bounce">
        {count === 0 ? '¡YA!' : count}
      </div>
    </div>
  );
};
