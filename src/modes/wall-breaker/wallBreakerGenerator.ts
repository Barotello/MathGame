import type {
  BoardDimensions,
  ChainClass,
  WallTileModel,
} from './types';

const VALUES = [-6, -4, -3, -2, -1, 1, 1, 2, 2, 3, 4, 5, 6, 8, 10, 12];
const CLASSES: ChainClass[] = ['stone', 'leaf', 'sand'];

export function createWallBoard(
  dimensions: BoardDimensions,
  seed: number,
): WallTileModel[] {
  const random = createSeededRandom(seed);
  const tiles: WallTileModel[] = [];

  for (let row = 0; row < dimensions.rows; row += 1) {
    for (let column = 0; column < dimensions.columns; column += 1) {
      tiles.push(createTile(row, column, random, seed));
    }
  }

  if (tiles.length >= 2) {
    tiles[1] = { ...tiles[1], chainClass: tiles[0].chainClass };
  }

  return tiles;
}

export function closeWallTiles(
  board: WallTileModel[],
  usedIds: string[],
): WallTileModel[] {
  const used = new Set(usedIds);

  return board.map((tile) =>
    used.has(tile.id) ? { ...tile, used: true } : tile,
  );
}

export function hasAvailableWallChain(board: WallTileModel[]): boolean {
  return board.some((tile) =>
    !tile.used &&
    board.some(
      (candidate) =>
        !candidate.used &&
        candidate.id !== tile.id &&
        candidate.chainClass === tile.chainClass &&
        Math.abs(candidate.row - tile.row) +
          Math.abs(candidate.column - tile.column) ===
          1,
    ),
  );
}

function createTile(
  row: number,
  column: number,
  random: () => number,
  seed: number,
): WallTileModel {
  const value = VALUES[Math.floor(random() * VALUES.length)];
  const chainClass = CLASSES[Math.floor(random() * CLASSES.length)];

  return {
    id: 'wall-' + seed + '-' + row + '-' + column + '-' + Math.floor(random() * 1_000_000),
    value,
    row,
    column,
    chainClass,
    used: false,
  };
}

function createSeededRandom(seed: number) {
  let state = Math.max(1, Math.floor(seed) % 2_147_483_647);

  return () => {
    state = (state * 48_271) % 2_147_483_647;
    return state / 2_147_483_647;
  };
}