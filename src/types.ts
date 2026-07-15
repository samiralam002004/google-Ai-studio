export type GameState = 'MENU' | 'GAME_OFFLINE' | 'GAME_ONLINE' | 'GAMEOVER';

export type ControlType = 'mouse' | 'joystick' | 'keyboard';

export type PowerupType = 'magnet' | 'shield' | 'speed';

export interface Position {
  x: number;
  y: number;
}

export interface SnakeSegment extends Position {
  angle: number;
}

export interface ActivePowerups {
  magnet: number; // expiration timestamp (ms) or remaining ms
  shield: number;
  speed: number;
}

export interface Snake {
  id: string;
  name: string;
  segments: SnakeSegment[];
  color: string;
  borderColor?: string;
  skinId: string;
  score: number;
  kills: number;
  isDead: boolean;
  isAI: boolean;
  isBoosting: boolean;
  activePowerups: ActivePowerups;
  width: number;
  speed: number;
  angle: number;
  targetAngle: number;
  hueShift?: number;
  isInvulnerable?: boolean; // initial spawn invulnerability
  spawnInvulTimer?: number;
}

export interface Food {
  id: string;
  x: number;
  y: number;
  value: number;
  color: string;
  size: number;
  isSuper: boolean;
  magnetizedTo?: string; // snake ID drawing it in
}

export interface PowerupItem {
  id: string;
  type: PowerupType;
  x: number;
  y: number;
  size: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
  size: number;
  type: 'eat' | 'dust' | 'explode' | 'powerup';
}

export interface GameStats {
  totalMatches: number;
  highScore: number;
  totalKills: number;
  totalCoins: number;
}

export interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  controlType: ControlType;
  playerName: string;
  selectedSkin: string;
}

export interface Skin {
  id: string;
  name: string;
  color: string; // Tail CSS style, hex color, or gradient
  secondaryColor?: string;
  patternType?: 'solid' | 'striped' | 'glow' | 'spotted' | 'rainbow';
  cost: number;
  unlocked: boolean;
}

export const SKINS_DATA: Skin[] = [
  { id: 'classic_green', name: 'Classic Green', color: '#10b981', secondaryColor: '#047857', patternType: 'striped', cost: 0, unlocked: true },
  { id: 'neon_blue', name: 'Neon Blue', color: '#06b6d4', secondaryColor: '#0891b2', patternType: 'solid', cost: 0, unlocked: true },
  { id: 'magma_orange', name: 'Magma Orange', color: '#f97316', secondaryColor: '#ea580c', patternType: 'glow', cost: 100, unlocked: false },
  { id: 'royal_purple', name: 'Royal Purple', color: '#a855f7', secondaryColor: '#7e22ce', patternType: 'spotted', cost: 250, unlocked: false },
  { id: 'rainbow', name: 'Rainbow', color: '#ef4444', secondaryColor: '#3b82f6', patternType: 'rainbow', cost: 500, unlocked: false },
  { id: 'cyber_pink', name: 'Cyber Pink', color: '#ec4899', secondaryColor: '#db2777', patternType: 'glow', cost: 350, unlocked: false },
  { id: 'gold_rush', name: 'Gold Rush', color: '#eab308', secondaryColor: '#ca8a04', patternType: 'striped', cost: 600, unlocked: false },
  { id: 'shadow_dark', name: 'Shadow Ghost', color: '#1e293b', secondaryColor: '#0f172a', patternType: 'glow', cost: 150, unlocked: false },
];

export const WORLD_SIZE = 4000; // 4000x4000 map
