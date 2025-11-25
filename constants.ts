
import { TileDefinition, Suit, Difficulty } from './types';

// Unicode Mahjong Tiles Range: 1F000 - 1F02B
// We define them explicitly for easier management

const createSuits = (suit: Suit, prefix: string, startCode: number, count: number): TileDefinition[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `${suit}-${i + 1}`,
    suit,
    value: i + 1,
    char: String.fromCodePoint(startCode + i),
  }));
};

export const TILES: TileDefinition[] = [
  ...createSuits('character', 'man', 0x1F007, 9), // Wan
  ...createSuits('bamboo', 'sou', 0x1F010, 9),    // Tiao
  ...createSuits('dot', 'pin', 0x1F019, 9),       // Bing
  
  // Winds
  { id: 'wind-east', suit: 'wind', value: 'east', char: '🀀' },
  { id: 'wind-south', suit: 'wind', value: 'south', char: '🀁' },
  { id: 'wind-west', suit: 'wind', value: 'west', char: '🀂' },
  { id: 'wind-north', suit: 'wind', value: 'north', char: '🀃' },
  
  // Dragons
  { id: 'dragon-red', suit: 'dragon', value: 'red', char: '🀄' }, // Chung
  { id: 'dragon-green', suit: 'dragon', value: 'green', char: '🀅' }, // Fa
  { id: 'dragon-white', suit: 'dragon', value: 'white', char: '🀆' }, // Po
  
  // Flowers (Wildcards)
  { id: 'flower-plum', suit: 'flower', value: 1, char: '🀢' },
  { id: 'flower-orchid', suit: 'flower', value: 2, char: '🀣' },
  { id: 'flower-bamboo', suit: 'flower', value: 3, char: '🀤' },
  { id: 'flower-chrysanthemum', suit: 'flower', value: 4, char: '🀥' },
  
  // Seasons (Wildcards)
  { id: 'season-spring', suit: 'season', value: 1, char: '🀦' },
  { id: 'season-summer', suit: 'season', value: 2, char: '🀧' },
  { id: 'season-autumn', suit: 'season', value: 3, char: '🀨' },
  { id: 'season-winter', suit: 'season', value: 4, char: '🀩' },
];

// Visual Constants - MASSIVE SIZE FOR MOBILE
export const TILE_WIDTH = 98; // px 
export const TILE_HEIGHT = 134; // px 
export const GRID_W = TILE_WIDTH / 2; 
export const GRID_H = TILE_HEIGHT / 2;

// Tiny Layout for Debugging (20 Tiles)
const TINY_LAYOUT = [
  // Layer 0: 4x4 Base (16 Tiles)
  {x: 10, y: 10, z: 0}, {x: 12, y: 10, z: 0}, {x: 14, y: 10, z: 0}, {x: 16, y: 10, z: 0},
  {x: 10, y: 12, z: 0}, {x: 12, y: 12, z: 0}, {x: 14, y: 12, z: 0}, {x: 16, y: 12, z: 0},
  {x: 10, y: 14, z: 0}, {x: 12, y: 14, z: 0}, {x: 14, y: 14, z: 0}, {x: 16, y: 14, z: 0},
  {x: 10, y: 16, z: 0}, {x: 12, y: 16, z: 0}, {x: 14, y: 16, z: 0}, {x: 16, y: 16, z: 0},
  
  // Layer 1: 2x2 Center (4 Tiles)
  {x: 11, y: 11, z: 1}, {x: 13, y: 11, z: 1},
  {x: 11, y: 13, z: 1}, {x: 13, y: 13, z: 1},
];

// Base Layout Construction (The Full "Turtle")
const RAW_LAYOUT = (() => {
  const coords: {x: number, y: number, z: number}[] = [];
  
  // --- Classic Wide Construction Start ---
  
  // Layer 0 (Bottom): Large rectangular-ish base
  // Ears
  coords.push({x: 2, y: 8, z: 0}, {x: 26, y: 8, z: 0});
  coords.push({x: 4, y: 8, z: 0}, {x: 24, y: 8, z: 0});
  coords.push({x: 6, y: 8, z: 0}, {x: 22, y: 8, z: 0});

  // Main block
  for (let x = 4; x <= 24; x += 2) {
    coords.push({x, y: 2, z: 0});
    coords.push({x, y: 14, z: 0});
  }
  for (let x = 6; x <= 22; x += 2) {
    for (let y = 4; y <= 12; y += 2) {
      coords.push({x, y, z: 0});
    }
  }

  // Layer 1
  for (let x = 8; x <= 20; x += 2) {
    for (let y = 4; y <= 12; y += 2) {
      coords.push({x, y, z: 1});
    }
  }

  // Layer 2
  for (let x = 10; x <= 18; x += 2) {
    for (let y = 6; y <= 10; y += 2) {
      coords.push({x, y, z: 2});
    }
  }

  // Layer 3
  coords.push({x: 12, y: 7, z: 3});
  coords.push({x: 14, y: 7, z: 3});
  coords.push({x: 12, y: 9, z: 3});
  coords.push({x: 14, y: 9, z: 3});

  // Layer 4
  coords.push({x: 13, y: 8, z: 4});
  
  // --- Classic Wide Construction End ---

  // TRANSFORM: ROTATE 90 DEGREES AND COMPRESS
  
  const finalCoords: {x: number, y: number, z: number}[] = [];
  const processedKeys = new Set<string>();

  coords.forEach(c => {
    // Swap X and Y for rotation
    const rawX = c.y; 
    const rawY = c.x;
    
    // AGGRESSIVE COMPRESSION:
    const centerY = 14;
    const compressedY = Math.round(centerY + (rawY - centerY) * 0.60);
    
    // Ensure it aligns to even grid (2 units)
    const alignedY = compressedY % 2 !== 0 ? compressedY + 1 : compressedY;

    // Create unique key to prevent overlaps (Ghost Tiles)
    const key = `${rawX},${alignedY},${c.z}`;
    
    if (!processedKeys.has(key)) {
      processedKeys.add(key);
      finalCoords.push({
        x: rawX,      
        y: alignedY,      
        z: c.z
      });
    }
  });

  return finalCoords;
})();

export const getLayout = (difficulty: Difficulty) => {
  switch (difficulty) {
    case 'test':
      return TINY_LAYOUT;
    case 'easy':
      // Only layers 1 and above, plus specific parts of layer 0 to form a solvable base
      return RAW_LAYOUT.filter(c => c.z >= 1 || (c.x >= 6 && c.x <= 10 && c.y >= 10 && c.y <= 18));
      
    case 'medium':
      // Remove the outliers
      return RAW_LAYOUT.filter(c => c.y >= 8 && c.y <= 20);
      
    case 'hard':
    default:
      return RAW_LAYOUT;
  }
};
