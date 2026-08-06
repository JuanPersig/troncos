import React, { useState, useEffect } from 'react';
import { PixelButton } from '@/components/PixelButton';

interface SettingsScreenProps {
  onBack: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack }) => {
  const [serverUrl, setServerUrl] = useState('');
  const [jumpSensitivity, setJumpSensitivity] = useState<'low'|'medium'|'high'>('medium');

  useEffect(() => {
    // Load from local storage
    const storedUrl = localStorage.getItem('jf_server_url') || 'http://localhost:3001';
    const storedSens = localStorage.getItem('jf_jump_sensitivity') as any || 'medium';
    setServerUrl(storedUrl);
    setJumpSensitivity(storedSens);
  }, []);

  const handleSave = () => {
    localStorage.setItem('jf_server_url', serverUrl);
    localStorage.setItem('jf_jump_sensitivity', jumpSensitivity);
    alert('Configuración guardada. Recarga la página para aplicar los cambios del servidor.');
  };

  return (
    <div className="screen-center">
      <div className="pixel-panel flex flex-col gap-6 w-full max-w-[500px]">
        <h2 className="text-2xl text-golden text-center pixel-text-shadow">⚙️ CONFIGURACIÓN</h2>
        
        <div className="flex flex-col gap-2">
          <label className="pixel-label">URL DEL SERVIDOR</label>
          <input 
            className="pixel-input" 
            value={serverUrl} 
            onChange={(e) => setServerUrl(e.target.value)}
          />
          <span className="text-xs text-muted">Por defecto: http://localhost:3001</span>
        </div>

        <div className="flex flex-col gap-2 mt-4">
          <label className="pixel-label">SENSIBILIDAD DE SALTO</label>
          <div className="flex gap-2">
            {(['low', 'medium', 'high'] as const).map(level => (
              <PixelButton 
                key={level}
                variant={jumpSensitivity === level ? 'green' : 'wood'}
                className="flex-1 justify-center"
                onClick={() => setJumpSensitivity(level)}
              >
                {level === 'low' ? 'BAJA' : level === 'medium' ? 'MEDIA' : 'ALTA'}
              </PixelButton>
            ))}
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <PixelButton variant="golden" className="flex-1 justify-center" onClick={handleSave}>
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
