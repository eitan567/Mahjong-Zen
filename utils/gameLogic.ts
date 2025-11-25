
import { TileInstance, TileDefinition, Difficulty } from '../types';
import { TILES, getLayout } from '../constants';

// Generate a shuffled deck that matches the layout size
export const generateBoard = (difficulty: Difficulty = 'hard'): TileInstance[] => {
  const layout = getLayout(difficulty);
  let targetCount = layout.length;
  // Ensure we have an even number of tiles (pairs required)
  if (targetCount % 2 !== 0) targetCount -= 1;
  
  const numPairs = targetCount / 2;
  
  // 1. Build a pool of potential pairs
  let pairPool: TileDefinition[][] = [];
  
  // Standard Suits
  TILES.filter(t => !['flower', 'season'].includes(t.suit)).forEach(t => {
     pairPool.push([t, t]); // Pair 1
     pairPool.push([t, t]); // Pair 2
  });
  
  // Flowers
  const flowers = TILES.filter(t => t.suit === 'flower');
  for (let i = 0; i < flowers.length; i += 2) {
      if (i + 1 < flowers.length) pairPool.push([flowers[i], flowers[i+1]]);
  }
  
  // Seasons
  const seasons = TILES.filter(t => t.suit === 'season');
  for (let i = 0; i < seasons.length; i += 2) {
      if (i + 1 < seasons.length) pairPool.push([seasons[i], seasons[i+1]]);
  }

  // 2. Shuffle pair pool
  pairPool.sort(() => Math.random() - 0.5);
  
  // 3. Select needed pairs
  // Always use random pairs from the pool, even for test mode
  const selectedPairs = pairPool.slice(0, numPairs);
  
  // 4. Flatten and shuffle positions
  const deck = selectedPairs.flat();
  deck.sort(() => Math.random() - 0.5);
  
  // 5. Assign to layout
  return deck.map((def, i) => ({
    instanceId: i,
    def,
    x: layout[i].x,
    y: layout[i].y,
    z: layout[i].z,
    isVisible: true
  }));
};

// Check if a tile can be selected
export const isTileFree = (tiles: TileInstance[], tile: TileInstance): boolean => {
  if (!tile.isVisible) return false;

  // 1. Check if covered by any tile (Any Z > current Z)
  // Strictly checks if ANY visible tile exists in the layer above that overlaps coordinates
  const isCovered = tiles.some(other => 
    other.isVisible &&
    other.z > tile.z && 
    Math.abs(other.x - tile.x) < 1.8 && // Use epsilon for float safety (standard is < 2)
    Math.abs(other.y - tile.y) < 1.8
  );

  if (isCovered) return false;

  // 2. Check if blocked on Left OR Right (Same Z)
  const leftBlocked = tiles.some(other =>
    other.isVisible &&
    other.z === tile.z &&
    other.x === tile.x - 2 && // Immediately to left
    Math.abs(other.y - tile.y) < 1.5
  );

  const rightBlocked = tiles.some(other =>
    other.isVisible &&
    other.z === tile.z &&
    other.x === tile.x + 2 && // Immediately to right
    Math.abs(other.y - tile.y) < 1.5
  );

  return !(leftBlocked && rightBlocked);
};

// Check if two tiles match
export const isMatch = (t1: TileDefinition, t2: TileDefinition): boolean => {
  if (t1.id === t2.id) return true; 
  if (t1.suit === 'flower' && t2.suit === 'flower') return true;
  if (t1.suit === 'season' && t2.suit === 'season') return true;
  if (t1.suit === t2.suit && t1.value === t2.value && t1.suit !== 'flower' && t1.suit !== 'season') return true;
  return false;
};

// Hint helper - STRICT MODE
export const findAvailableMove = (tiles: TileInstance[]): [number, number] | null => {
  // 1. Get ONLY currently visible tiles
  const visible = tiles.filter(t => t.isVisible);
  
  // 2. Get ONLY tiles that are strictly free
  const freeTiles = visible.filter(t => isTileFree(visible, t));
  
  // 3. Find a match ONLY within the free tiles
  for (let i = 0; i < freeTiles.length; i++) {
    for (let j = i + 1; j < freeTiles.length; j++) {
      const tile1 = freeTiles[i];
      const tile2 = freeTiles[j];
      
      if (tile1.instanceId !== tile2.instanceId) {
          if (isMatch(tile1.def, tile2.def)) {
            return [tile1.instanceId, tile2.instanceId];
          }
      }
    }
  }
  return null;
};

// Smart Shuffle
export const shuffleVisibleTiles = (tiles: TileInstance[]): TileInstance[] => {
  let newTiles = [...tiles];
  
  const visibleTiles = newTiles.filter(t => t.isVisible);
  if (visibleTiles.length < 2) return newTiles;

  const visibleIndices = visibleTiles.map(t => newTiles.indexOf(t));
  const visibleDefinitions = visibleTiles.map(t => t.def);

  const freeTileIndices = visibleTiles
    .filter(t => isTileFree(visibleTiles, t))
    .map(t => newTiles.indexOf(t));

  if (freeTileIndices.length >= 2) {
    let pairIdx1 = -1;
    let pairIdx2 = -1;

    for (let i = 0; i < visibleDefinitions.length; i++) {
        for (let j = i + 1; j < visibleDefinitions.length; j++) {
            if (isMatch(visibleDefinitions[i], visibleDefinitions[j])) {
                pairIdx1 = i;
                pairIdx2 = j;
                break;
            }
        }
        if (pairIdx1 !== -1) break;
    }

    if (pairIdx1 !== -1) {
        const def1 = visibleDefinitions[pairIdx1];
        const def2 = visibleDefinitions[pairIdx2];

        const remainingDefs = [...visibleDefinitions];
        remainingDefs.splice(pairIdx2, 1);
        remainingDefs.splice(pairIdx1, 1);

        const slot1Index = freeTileIndices[0];
        const slot2Index = freeTileIndices[1];
        
        const generalSlots = visibleIndices.filter(idx => idx !== slot1Index && idx !== slot2Index);

        remainingDefs.sort(() => Math.random() - 0.5);

        newTiles[slot1Index] = { ...newTiles[slot1Index], def: def1 };
        newTiles[slot2Index] = { ...newTiles[slot2Index], def: def2 };

        generalSlots.forEach((slotIdx, i) => {
            newTiles[slotIdx] = { ...newTiles[slotIdx], def: remainingDefs[i] };
        });

        return newTiles;
    }
  }

  const definitions = visibleIndices.map(i => newTiles[i].def);
  definitions.sort(() => Math.random() - 0.5);
  
  visibleIndices.forEach((index, i) => {
    newTiles[index] = { ...newTiles[index], def: definitions[i] };
  });

  return newTiles;
};

// Auto Play Action Decider
export const getAutoPlayAction = (tiles: TileInstance[], selectedId: number | null): { type: 'move' | 'shuffle' | 'none', pair?: [number, number] } => {
  const visible = tiles.filter(t => t.isVisible);
  if (visible.length === 0) return { type: 'none' };

  // If we already have a selection, find its match!
  if (selectedId !== null) {
      const selectedTile = visible.find(t => t.instanceId === selectedId);
      if (selectedTile && isTileFree(visible, selectedTile)) {
          const freeTiles = visible.filter(t => isTileFree(visible, t) && t.instanceId !== selectedId);
          const match = freeTiles.find(t => isMatch(t.def, selectedTile.def));
          if (match) {
              return { type: 'move', pair: [selectedId, match.instanceId] };
          }
      }
      // If selected tile is no longer valid or no match found, we should probably deselect or find another move
      // But let's fall through to findAvailableMove to see if ANY move exists
  }

  // 1. Try to find any move
  const move = findAvailableMove(tiles);
  if (move) return { type: 'move', pair: move };

  // 2. If no move, check if shuffle helps (geometry check)
  const freeCount = visible.filter(t => isTileFree(visible, t)).length;
  if (freeCount >= 2) return { type: 'shuffle' };

  return { type: 'none' };
};

// Debug Info Generator
export const getDebugInfo = (tiles: TileInstance[]) => {
  const visible = tiles.filter(t => t.isVisible);
  const info = visible.map(t => ({
     id: t.instanceId,
     pos: `x:${t.x},y:${t.y},z:${t.z}`,
     val: `${t.def.suit}-${t.def.value}`,
     free: isTileFree(visible, t)
  }));
  return JSON.stringify(info, null, 2);
};
