import type {
  ChainCalculation,
  WallOperation,
  WallTileModel,
} from './types';

export const MAX_RAW_RESULT = 1_000_000_000;
export const MAX_SCORE_DAMAGE = 5_000;

export function areWallTilesNeighbors(
  first: WallTileModel,
  second: WallTileModel,
): boolean {
  return (
    Math.abs(first.row - second.row) +
      Math.abs(first.column - second.column) ===
    1
  );
}

export function canAppendToChain(
  chain: WallTileModel[],
  candidate: WallTileModel,
): boolean {
  if (candidate.used) return false;
  if (chain.length === 0) return true;

  const last = chain[chain.length - 1];

  return (
    last.chainClass === candidate.chainClass &&
    areWallTilesNeighbors(last, candidate) &&
    !chain.some((tile) => tile.id === candidate.id)
  );
}

export function getChainMultiplier(tileCount: number): number {
  if (tileCount >= 48) return 12;
  if (tileCount >= 31) return 7;
  if (tileCount >= 16) return 4;
  if (tileCount >= 9) return 2.5;
  if (tileCount >= 5) return 1.8;
  return 1;
}

export function calculateWallChain(
  tiles: WallTileModel[],
  operation: WallOperation,
): ChainCalculation {
  if (tiles.length < 2) {
    return {
      rawResult: 0,
      damage: 0,
      penalty: 0,
      scoreDamage: 0,
      multiplier: 1,
      chainBonus: 0,
      score: 0,
    };
  }

  let result =
    operation === '+'
      ? 0
      : 1;

  for (const tile of tiles) {
    result =
      operation === '+'
        ? clampRawResult(result + tile.value)
        : clampRawResult(result * tile.value);
  }

  const damage = Math.min(Math.max(0, result), MAX_RAW_RESULT);
  const penalty = Math.min(Math.max(0, -result), MAX_RAW_RESULT);
  const scoreDamage = Math.min(damage, MAX_SCORE_DAMAGE);
  const multiplier = getChainMultiplier(tiles.length);
  const chainBonus =
    penalty === 0 ? 4 * Math.pow(tiles.length - 2, 2) : 0;
  const score =
    penalty > 0
      ? -Math.round(
          Math.min(penalty, MAX_SCORE_DAMAGE) * multiplier,
        )
      : Math.round(scoreDamage * multiplier) + chainBonus;

  return {
    rawResult: result,
    damage,
    penalty,
    scoreDamage,
    multiplier,
    chainBonus,
    score,
  };
}

function clampRawResult(value: number): number {
  if (!Number.isFinite(value)) {
    return value < 0 ? -MAX_RAW_RESULT : MAX_RAW_RESULT;
  }

  return Math.max(-MAX_RAW_RESULT, Math.min(MAX_RAW_RESULT, value));
}