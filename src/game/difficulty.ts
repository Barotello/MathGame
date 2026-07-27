import type { Level } from '../types/game';
import { asFraction } from './mathValue';
import { analyzeLevel, type LevelAnalysis } from './solver';

export type DifficultyProfile = {
  score: number;
  label: 'Rahat' | 'Dengeli' | 'Zorlu' | 'Usta';
  factors: string[];
};

const analysisCache = new WeakMap<Level, LevelAnalysis>();

function getLevelAnalysis(level: Level) {
  const cached = analysisCache.get(level);
  if (cached) {
    return cached;
  }

  const analysis = analyzeLevel(level);
  analysisCache.set(level, analysis);
  return analysis;
}

export function getDifficultyProfile(level: Level): DifficultyProfile {
  const analysis = getLevelAnalysis(level);
  const fractionCellCount = level.cells.filter(
    (cell) => asFraction(cell.value).denominator !== 1,
  ).length;
  const negativeCellCount = level.cells.filter(
    (cell) => asFraction(cell.value).numerator < 0,
  ).length;
  const symbolicCellCount = level.cells.filter((cell) =>
    /[√²³]/.test(cell.displayValue ?? ''),
  ).length;
  const operatorScore = Math.max(0, level.allowedOperators.length - 1) * 5;
  const pathScore = Math.max(0, level.parPathLength - 2) * 6;
  const boardScore = Math.max(0, level.rows * level.columns - 9) * 0.45;
  const timePressure = Math.max(0, 60 - level.timeLimitSeconds) * 0.35;
  const numberComplexity = Math.min(
    16,
    fractionCellCount * 1.5 + negativeCellCount + symbolicCellCount,
  );
  const constraintScore =
    (level.requiredOperators?.length ?? 0) * 2 +
    (level.requiredOperatorSequence?.length ?? 0) * 1.5 +
    (level.requiredValueKinds?.length ?? 0) * 4 +
    (level.exactPathLength === undefined ? 0 : 5);
  const solutionScarcity =
    analysis.solutionCount <= 1
      ? 14
      : analysis.solutionCount <= 3
        ? 10
        : analysis.solutionCount <= 8
          ? 6
          : 0;
  const searchComplexity = Math.min(
    14,
    Math.log10(Math.max(1, analysis.exploredStates)) * 3.5,
  );
  const rawScore = Math.round(
    operatorScore +
      pathScore +
      boardScore +
      timePressure +
      numberComplexity +
      constraintScore +
      solutionScarcity +
      searchComplexity,
  );
  const score = Math.min(100, rawScore);
  const label =
    score >= 55 ? 'Usta' : score >= 38 ? 'Zorlu' : score >= 20 ? 'Dengeli' : 'Rahat';
  const factors = [
    `${level.rows}×${level.columns} tahta`,
    `${level.parPathLength} hücrelik ideal yol`,
    `${analysis.solutionCount}${analysis.truncated ? '+' : ''} çözüm bulundu`,
    `${Math.round(analysis.averageBranchingFactor * 10) / 10} ortalama seçenek`,
  ];

  return { score, label, factors };
}

export function validateDifficultyCurve(levels: Level[]) {
  return levels.flatMap((level) => {
    const issues: string[] = [];

    if (level.number >= 11 && level.number <= 20) {
      if (level.rows !== 5 || level.columns !== 5) {
        issues.push('ikinci paket 5×5 olmalı');
      }
      if (level.allowedOperators.length !== 4) {
        issues.push('ikinci pakette dört işlem açık olmalı');
      }
      if (level.parPathLength < 3 || level.parPathLength > 5) {
        issues.push('ideal yol 3–5 hücre arasında olmalı');
      }
      if (level.number <= 15 && !level.rules.allowNegativeResults) {
        issues.push('negatif sayı paketi negatif ara sonuçlara izin vermeli');
      }
      if (
        level.number <= 15 &&
        !level.requiredValueKinds?.includes('negative')
      ) {
        issues.push('negatif sayı paketi negatif hücre kullanımını zorunlu tutmalı');
      }
      if (level.number >= 16 && level.rules.requireExactDivision) {
        issues.push('kesir paketi rasyonel bölmeye izin vermeli');
      }
      if (
        level.number >= 16 &&
        !level.requiredValueKinds?.includes('fraction')
      ) {
        issues.push('kesir paketi kesirli hücre kullanımını zorunlu tutmalı');
      }
    }

    if (level.number >= 21 && level.number <= 30) {
      if (level.rows !== 6 || level.columns !== 6) {
        issues.push('üçüncü paket 6×6 olmalı');
      }
      if (
        level.allowedOperators.length < 4 ||
        level.allowedOperators.length > 5
      ) {
        issues.push('üçüncü pakette dört işlem veya kalan işlemi açık olmalı');
      }
      if (level.parPathLength < 5 || level.parPathLength > 6) {
        issues.push('ideal yol 5–6 hücre arasında olmalı');
      }
      if (
        level.number <= 25 &&
        !level.cells.some((cell) => /[√²³]/.test(cell.displayValue ?? ''))
      ) {
        issues.push('üs ve kök paketinde sembolik hücre bulunmalı');
      }
      if (
        level.number <= 25 &&
        !level.requiredValueKinds?.includes('symbolic')
      ) {
        issues.push('üs ve kök paketinde sembolik hücre kullanımı zorunlu olmalı');
      }
      if (
        level.number >= 26 &&
        (level.exactPathLength === undefined ||
          level.requiredOperatorSequence === undefined)
      ) {
        issues.push('ustalık paketinde kesin yol ve işlem sırası olmalı');
      }
    }

    return issues.map((issue) => `${level.id}: ${issue}`);
  });
}
