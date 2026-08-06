/**
 * Jumping Friends — Global Constants & Theme Colors
 * Minigame Palette: Celestes (Sky Blue), Naranjas (Orange), Amarillos (Yellow), Blancos (White)
 */

export const COLORS = {
  // Backgrounds (Dark Celestial / Navy Blue)
  bgDarkest: '#0b1320',
  bgDark: '#111f35',
  bgPanel: '#182a47',
  bgCard: '#1e3456',

  // Celestes (Sky Blue / Cyan)
  skyLight: '#e0f2fe',
  skyBright: '#38bdf8',
  skyMain: '#0ea5e9',
  skyDark: '#0284c7',

  // Naranjas (Orange)
  orangeLight: '#ffedd5',
  orangeBright: '#ff7d1a',
  orangeMain: '#f97316',
  orangeDark: '#ea580c',

  // Amarillos (Yellow)
  yellowLight: '#fef9c3',
  yellowBright: '#ffe033',
  yellowMain: '#facc15',
  yellowDark: '#ca8a04',

  // Blancos / Grises (White / Light Slate)
  white: '#ffffff',
  offWhite: '#f8fafc',
  slateLight: '#cbd5e1',
  slateMuted: '#64748b',

  // Accents
  error: '#ef4444',
  black: '#000000',
} as const;

export const PLAYER_COLORS = [
  { primary: '#38bdf8', secondary: '#0284c7', shirt: '#7dd3fc', tag: 'P1', name: 'Celeste' },
  { primary: '#ff7d1a', secondary: '#c2410c', shirt: '#ffedd5', tag: 'P2', name: 'Naranja' },
  { primary: '#facc15', secondary: '#a16207', shirt: '#fef08a', tag: 'P3', name: 'Amarillo' },
  { primary: '#a855f7', secondary: '#7e22ce', shirt: '#e9d5ff', tag: 'P4', name: 'Púrpura' },
] as const;

export const MAX_PLAYERS_DEFAULT = 3;
export const DEFAULT_MINIGAME_ID = 'jump-logs';
