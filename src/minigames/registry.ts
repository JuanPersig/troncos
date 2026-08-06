import { MiniGameDefinition } from './types';
import { jumpLogsDefinition } from './jump-logs';

export const MINIGAME_REGISTRY: MiniGameDefinition[] = [
  jumpLogsDefinition,
  // Placeholder for future games
  {
    id: 'dodge-ball',
    name: 'Dodge Ball',
    description: 'Esquiva las pelotas moviéndote de lado a lado. ¡Próximamente!',
    minPlayers: 2,
    maxPlayers: 4,
    thumbnail: '/assets/images/coming-soon-thumb.png',
    status: 'coming_soon',
    component: () => null,
  },
];

export function getGameById(id: string): MiniGameDefinition | undefined {
  return MINIGAME_REGISTRY.find(g => g.id === id);
}

export function getAvailableGames(): MiniGameDefinition[] {
  return MINIGAME_REGISTRY.filter(g => g.status === 'available');
}
