import React from 'react';
import { PlayerInfo } from '@/core/types';
import { CameraPreview } from './CameraPreview';

interface PlayerCardProps {
  player: PlayerInfo | null;
  slotIndex: number;
  isLocal: boolean;
  stream?: MediaStream | null;
  showCamera?: boolean;
}

const slotColors = [
  { border: 'border-sky-bright', text: 'text-celeste', bg: 'bg-sky-bright', tag: 'P1 (Celeste)' },
  { border: 'border-orange-bright', text: 'text-orange', bg: 'bg-orange-bright', tag: 'P2 (Naranja)' },
  { border: 'border-yellow-bright', text: 'text-yellow', bg: 'bg-yellow-bright', tag: 'P3 (Amarillo)' },
  { border: 'border-purple-400', text: 'text-purple-400', bg: 'bg-purple-400', tag: 'P4 (Púrpura)' },
];

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  slotIndex,
  isLocal,
  stream,
  showCamera = true
}) => {
  const style = slotColors[slotIndex] || slotColors[0];

  return (
    <div className={`pixel-card p-2 flex flex-col justify-between h-full border-2 ${style.border}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-sky-dark pb-1">
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 ${style.bg}`} />
          <span className={`text-xs font-bold ${style.text}`}>
            {player ? player.name : `SLOT ${slotIndex + 1}`}
          </span>
        </div>

        {player && (
          <div className="text-[9px] flex gap-0.5">
            {player.lives > 0 ? (
              <span>{'❤️'.repeat(player.lives)}</span>
            ) : (
              <span className="text-error">💀 ELIMINADO</span>
            )}
          </div>
        )}
      </div>

      {/* Video or Avatar */}
      <div className="flex-1 my-1 relative overflow-hidden bg-black flex items-center justify-center border border-sky-dark">
        {showCamera && (isLocal || stream) ? (
          <CameraPreview 
            stream={stream || null} 
            label={isLocal ? 'TÚ' : player?.name} 
          />
        ) : (
          <div className="flex flex-col items-center gap-1 p-2 text-center">
            <span className="text-lg">{player?.isBot ? '🤖' : '📹'}</span>
            <span className="text-[8px] text-muted">
              {player?.isBot ? 'BOT SIMULADO' : player ? 'CÁMARA PENDIENTE' : 'SLOT VACÍO'}
            </span>
          </div>
        )}

        {isLocal && (
          <div className="absolute bottom-1 right-1 bg-sky-dark text-white px-1 text-[7px]">
            TÚ
          </div>
        )}
      </div>

      {/* Footer status */}
      <div className="flex items-center justify-between text-[8px] pt-0.5 text-muted">
        <span>ESTADO:</span>
        <span className={player?.ready ? 'text-celeste font-bold' : 'text-orange font-bold'}>
          {player ? (player.ready ? '✓ LISTO' : 'ESPERANDO') : 'LIBRE'}
        </span>
      </div>
    </div>
  );
};
