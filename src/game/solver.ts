import type { Level, MathValue, Operator } from '../types/game';
import {
  areOrthogonalNeighbors,
  calculate,
  meetsLevelCompletionRules,
} from './engine';

export type LevelAnalysis = {
  exploredStates: number;
  solutionCount: number;
  shortestSolutionLength: number | null;
  averageBranchingFactor: number;
  deadEndCount: number;
  truncated: boolean;
};

type SearchOptions = {
  maxDepth?: number;
  maxExploredStates?: number;
  maxSolutions?: number;
};

export function analyzeLevel(
  level: Level,
  options: SearchOptions = {},
): LevelAnalysis {
  const maxDepth =
    options.maxDepth ?? level.exactPathLength ?? level.parPathLength;
  const maxExploredStates = options.maxExploredStates ?? 30_000;
  const maxSolutions = options.maxSolutions ?? 100;
  const neighbors = new Map(
    level.cells.map((cell) => [
      cell.id,
      level.cells.filter((candidate) =>
        areOrthogonalNeighbors(cell, candidate),
      ),
    ]),
  );

  let exploredStates = 0;
  const knownSolutionKey = `${level.knownSolution.cellIds.join(',')}|${level.knownSolution.operators.join(',')}`;
  const solutionKeys = new Set([knownSolutionKey]);
  let solutionCount = 1;
  let shortestSolutionLength: number | null =
    level.knownSolution.cellIds.length;
  let branchingTotal = 0;
  let expandedStateCount = 0;
  let deadEndCount = 0;
  let truncated = false;

  function search(
    cellId: string,
    value: MathValue,
    path: Set<string>,
    operators: Operator[],
  ) {
    if (
      exploredStates >= maxExploredStates ||
      solutionCount >= maxSolutions
    ) {
      truncated = true;
      return;
    }

    if (
      meetsLevelCompletionRules(
        level,
        value,
        path.size,
        operators,
        [...path],
      )
    ) {
      const solutionKey = `${[...path].join(',')}|${operators.join(',')}`;
      if (!solutionKeys.has(solutionKey)) {
        solutionKeys.add(solutionKey);
        solutionCount = solutionKeys.size;
        shortestSolutionLength =
          shortestSolutionLength === null
            ? path.size
            : Math.min(shortestSolutionLength, path.size);
      }
      return;
    }

    if (path.size >= maxDepth) {
      deadEndCount += 1;
      return;
    }

    let validTransitionCount = 0;

    for (const nextCell of neighbors.get(cellId) ?? []) {
      if (path.has(nextCell.id)) {
        continue;
      }

      for (const operator of level.allowedOperators) {
        const result = calculate(value, operator, nextCell.value, level.rules);
        if (!result.ok) {
          continue;
        }

        validTransitionCount += 1;
        exploredStates += 1;
        const nextPath = new Set(path);
        nextPath.add(nextCell.id);
        search(nextCell.id, result.value, nextPath, [...operators, operator]);

        if (truncated) {
          return;
        }
      }
    }

    expandedStateCount += 1;
    branchingTotal += validTransitionCount;
    if (validTransitionCount === 0) {
      deadEndCount += 1;
    }
  }

  for (const startCell of level.cells) {
    search(startCell.id, startCell.value, new Set([startCell.id]), []);
    if (truncated) {
      break;
    }
  }

  return {
    exploredStates,
    solutionCount,
    shortestSolutionLength,
    averageBranchingFactor:
      expandedStateCount === 0 ? 0 : branchingTotal / expandedStateCount,
    deadEndCount,
    truncated,
  };
}
