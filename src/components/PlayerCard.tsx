import React from 'react';
import { PlayerInfo } from '@/core/types';
import { PLAYER_COLORS } from '@/core/constants';
import { CameraPreview } from './CameraPreview';

interface PlayerCardProps {
  player: PlayerInfo | null;
  slotIndex: number;
  isLocal: boolean;
  stream?: MediaStream | null;
  showCamera?: boolean;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ player, slotIndex, isLocal, stream, showCamera = true }) => {
  const slotColor = PLAYER_COLORS[slotIndex] || PLAYER_COLORS[0];
  
  if (!player) {
    return (
      <div className="pixel-card p-2 player-slot-empty flex flex-col items-center justify-center gap-2 h-full" style={{ borderColor: slotColor.primary }}>
        <div className="text-muted text-xs">SLOT {slotIndex + 1}</div>
        <div className="text-muted">VACÍO</div>
      </div>
    );
  }

  return (
    <div className="pixel-card p-2 flex flex-col gap-2 relative h-full" style={{ borderColor: slotColor.primary }}>
      {isLocal && (
        <div className="absolute -top-2 -right-2 pixel-badge pixel-badge-golden z-10">TÚ</div>
      )}
      
      {showCamera && (
        <CameraPreview stream={stream || null} label={player.name} />
      )}
      
      <div className="flex flex-col gap-2 w-full mt-2">
        <div className="flex items-center gap-2">
          <div className="player-slot-avatar" style={{ backgroundColor: slotColor.primary }}>
            {slotColor.tag}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold" style={{ color: slotColor.primary }}>{player.name}</span>
            {player.isBot && <span className="text-xs text-muted">BOT</span>}
          </div>
        </div>
        
        <div className="flex items-center justify-between w-full">
          <span className={`pixel-badge ${player.ready ? 'pixel-badge-green' : 'pixel-badge-error'}`}>
            {player.ready ? 'LISTO' : 'ESPERANDO'}
          </span>
          <span className="text-xs text-golden font-bold">VIDAS: {player.lives}</span>
        </div>
      </div>
    </div>
  );
};
