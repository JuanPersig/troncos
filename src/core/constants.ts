/**
 * Jumping Friends — Global Constants
 */

export const COLORS = {
  // Primary palette
  darkBg: '#0c180e',
  forestDark: '#142416',
  forest: '#1e3a24',
  leafDark: '#438a22',
  leaf: '#73c242',
  lightLeaf: '#9adb5e',

  // Wood / warm tones
  woodDark: '#1a0e05',
  bark: '#2b180a',
  wood: '#4a2e18',
  woodLight: '#7c4f2b',
  sand: '#d4a373',

  // Accents
  golden: '#f4d160',
  goldenDark: '#e6a800',
  cyan: '#38ef7d',
  pink: '#ff4081',
  orange: '#ff8c42',

  // UI
  textPrimary: '#e0f8cf',
  textSecondary: '#73c242',
  textMuted: '#5a7a5a',
  error: '#ff4444',
  white: '#ffffff',
  black: '#000000',
} as const;

export const PLAYER_COLORS = [
  { primary: '#38ef7d', secondary: '#11998e', shirt: '#00c2cb', tag: 'P1', name: 'Verde' },
  { primary: '#ff4081', secondary: '#c2185b', shirt: '#ff80ab', tag: 'P2', name: 'Rosa' },
  { primary: '#f4d160', secondary: '#e67e22', shirt: '#f39c12', tag: 'P3', name: 'Amarillo' },
  { primary: '#ff8c42', secondary: '#d4622b', shirt: '#ffb366', tag: 'P4', name: 'Naranja' },
] as const;

export const MAX_PLAYERS_DEFAULT = 3;

export const SERVER_PORT = 3001;
export const DEV_PORT = 3000;
