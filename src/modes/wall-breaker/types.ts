export type WallOperation = '+' | '×';

export type ChainClass = 'stone' | 'leaf' | 'sand';

export type WallTileModel = {
  id: string;
  value: number;
  row: number;
  column: number;
  chainClass: ChainClass;
  used: boolean;
};

export type ChainCalculation = {
  rawResult: number;
  damage: number;
  penalty: number;
  scoreDamage: number;
  multiplier: number;
  chainBonus: number;
  score: number;
};

export type WallBreakerProgress = {
  schemaVersion: 1;
  bestScore: number;
  mostWallsDestroyed: number;
  precisionBestMoves: number | null;
  precisionBestTimeSeconds: number | null;
};

export type BoardDimensions = {
  rows: number;
  columns: number;
};