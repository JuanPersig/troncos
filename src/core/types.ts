/**
 * Jumping Friends — Global Type Definitions
 * Shared across all modules: screens, services, minigames.
 */

// ─── Player ──────────────────────────────────────────────

export interface PlayerInfo {
  id: string;
  name: string;
  slot: number;
  ready: boolean;
  lives: number;
  score: number;
  isBot?: boolean;
}

// ─── Room ────────────────────────────────────────────────

export interface RoomInfo {
  code: string;
  players: PlayerInfo[];
  hostId: string;
  gameRunning: boolean;
  maxPlayers: number;
  selectedGame: string | null;
}

// ─── Game Results ────────────────────────────────────────

export interface GameResults {
  gameId: string;
  gameName: string;
  players: PlayerResult[];
  duration: number; // seconds
}

export interface PlayerResult {
  slot: number;
  name: string;
  score: number;
  livesRemaining: number;
  isWinner: boolean;
}

// ─── Motion Events ───────────────────────────────────────

export type MotionEventType = 'JumpDetected';

export interface MotionEvent {
  type: MotionEventType;
  timestamp: number;
  confidence: number;
}

// ─── App Navigation ──────────────────────────────────────

export type AppScreen =
  | 'splash'
  | 'main-menu'
  | 'create-room'
  | 'join-room'
  | 'lobby'
  | 'game-selector'
  | 'game'
  | 'results'
  | 'settings';

// ─── App Version ─────────────────────────────────────────

export const APP_VERSION = '1.0.0';
export const APP_NAME = 'Jumping Friends';
