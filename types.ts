
export type Suit = 'character' | 'bamboo' | 'dot' | 'wind' | 'dragon' | 'flower' | 'season';

export interface TileDefinition {
  id: string; // Unique identifier (e.g., 'bamboo-1')
  suit: Suit;
  value: number | string; // 1-9 or 'east', 'red', etc.
  char: string; // Unicode character
  color?: string; // Visual hint color
}

export interface TileInstance {
  instanceId: number;
  def: TileDefinition;
  x: number; // Grid units (2 units = 1 tile width usually)
  y: number; 
  z: number; // Layer
  isVisible: boolean;
}

export type TileData = TileInstance;

export interface HandConfig {
  front: TileData[];
  rear: TileData[];
}

export type GamePhase = 'idle' | 'playing' | 'won' | 'lost';

export type Theme = 'classic' | 'dark' | 'retro' | 'modern' | 'minimalist';

export type Difficulty = 'easy' | 'medium' | 'hard' | 'test';

export type TileSet = 'standard' | 'western' | 'nature' | 'cards' | 'emoji';

export interface GameState {
  phase: GamePhase;
  tiles: TileInstance[];
  selectedTileId: number | null;
  score: number;
  matches: number;
  history: number[]; // Array of removed instanceIds for Undo
  sageMessage: string | null;
}
