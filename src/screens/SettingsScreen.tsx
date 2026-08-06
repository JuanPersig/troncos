import React, { useState, useEffect } from 'react';
import { PixelButton } from '@/components/PixelButton';

interface SettingsScreenProps {
  onBack: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack }) => {
  const [jumpSensitivity, setJumpSensitivity] = useState<'low'|'medium'|'high'>('medium');

  useEffect(() => {
    const storedSens = (localStorage.getItem('jf_jump_sensitivity') as any) || 'medium';
    setJumpSensitivity(storedSens);
  }, []);

  const handleSave = () => {
    localStorage.setItem('jf_jump_sensitivity', jumpSensitivity);
    onBack();
  };

  return (
    <div className="screen-center">
      <div className="pixel-panel flex flex-col gap-4 w-full max-w-[420px]">
        <h2 className="text-xl text-yellow text-center pixel-text-shadow">⚙️ CONFIGURACIÓN</h2>
        
        <div className="flex flex-col gap-2">
          <label className="pixel-label">SENSIBILIDAD DE SALTO (CÁMARA)</label>
          <div className="flex gap-2">
            {(['low', 'medium', 'high'] as const).map(level => (
              <PixelButton 
                key={level}
                variant={jumpSensitivity === level ? 'celeste' : 'orange'}
                className="flex-1 justify-center"
                onClick={() => setJumpSensitivity(level)}
              >
                {level === 'low' ? 'BAJA' : level === 'medium' ? 'MEDIA' : 'ALTA'}
              </PixelButton>
            ))}
          </div>
          <span className="text-xs text-muted text-center mt-1">Ajusta la respuesta del detector de movimiento.</span>
        </div>

        <div className="divider" />

        <div className="flex gap-3">
          <PixelButton variant="orange" className="flex-1 justify-center" onClick={handleSave}>
            GUARDAR
          </PixelButton>
          <PixelButton variant="danger" className="flex-1 justify-center" onClick={onBack}>
            VOLVER
          </PixelButton>
        </div>
      </div>
    </div>
  );
};
