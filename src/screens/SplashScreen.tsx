import React, { useEffect } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2200);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="screen-center bg-bg-darkest cursor-pointer" onClick={onComplete}>
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-3xl sm:text-4xl text-yellow pixel-text-shadow animate-pulse">
          JUMPING FRIENDS
        </h1>
        <p className="text-sm text-celeste font-mono">
          🎮 MINIJUEGOS MULTIJUGADOR ONLINE 🎮
        </p>

        <div className="mt-8 flex items-center gap-2">
          <div className="w-3 h-3 bg-sky-bright animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-3 h-3 bg-orange-bright animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-3 h-3 bg-yellow-bright animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>

        <p className="text-xs text-muted mt-4">Haz clic para continuar...</p>
      </div>
    </div>
  );
};
