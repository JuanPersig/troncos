/**
 * Jumping Friends — Minigame Type Definitions
 * Every minigame must implement the MiniGameProps interface.
 */

import React from 'react';
import { PlayerInfo, GameResults } from '@/core/types';

/**
 * Props that every minigame component receives from the platform.
 * The platform handles rooms, players, cameras — the minigame only handles gameplay.
 */
export interface MiniGameProps {
  roomCode: string;
  localSlot: number;
  players: PlayerInfo[];
  isHost: boolean;
  localStream: MediaStream | null;
  onGameEnd: (results: GameResults) => void;
}

/**
 * Definition of a minigame for the registry/selector.
 * To add a new minigame, create its module and add a definition to the registry.
 */
export interface MiniGameDefinition {
  /** Unique identifier (e.g., 'jump-logs') */
  id: string;
  /** Display name (e.g., 'Jump Logs') */
  name: string;
  /** Short description */
  description: string;
  /** Minimum players required */
  minPlayers: number;
  /** Maximum players allowed */
  maxPlayers: number;
  /** Path to thumbnail image — easy to replace with hand-made pixel art */
  thumbnail: string;
  /** Availability status */
  status: 'available' | 'coming_soon';
  /** React component that implements the minigame */
  component: React.ComponentType<MiniGameProps>;
}
