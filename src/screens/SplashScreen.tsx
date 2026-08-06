import React, { useEffect } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="screen bg-black flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-black" style={{ backgroundImage: 'radial-gradient(circle at center, #1a2a1c 0%, black 70%)' }}></div>
      <div className="z-10 flex flex-col items-center gap-4 animate-scale-in">
        <h1 className="text-4xl text-golden pixel-text-shadow-lg text-center leading-tight">
          JUMPING<br />FRIENDS
        </h1>
        <p className="text-sm text-cyan tracking-wide mt-4">
          🎮 MINIJUEGOS MULTIJUGADOR
        </p>
        <div className="text-golden animate-bounce mt-8 text-2xl">...</div>
      </div>
    </div>
  );
};
