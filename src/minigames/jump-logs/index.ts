import { MiniGameDefinition } from '@/minigames/types';
import JumpLogsGame from './JumpLogsGame';

export const jumpLogsDefinition: MiniGameDefinition = {
  id: 'jump-logs',
  name: 'Jump Logs',
  description: 'Esquiva los troncos saltando frente a tu cámara. ¡El último en pie gana!',
  minPlayers: 1,
  maxPlayers: 3,
  thumbnail: '/assets/images/jump-logs-thumb.png',
  status: 'available',
  component: JumpLogsGame,
};
