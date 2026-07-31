import type {
  GeniusChapter,
  Level,
  MathValue,
  NumberCell,
  Operator,
} from '../types/game';
import { calculate } from './engine';

function pseudoRand(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function getIntermediateValueLimit(levelNumber: number): number {
  if (levelNumber <= 50) return 500;
  if (levelNumber <= 80) return 2_000;
  return 10_000;
}

export function generateLevel(levelNumber: number): Level {
  const rand = pseudoRand(levelNumber * 777 + 12345);

  let allowedOperators: Operator[] = ['+', '−'];
  let rows = 3;
  let cols = 3;
  let pathLen = 3;
  let timeLimit = 90;

  let geniusChapter: GeniusChapter | undefined;

  if (levelNumber <= 10) {
    allowedOperators = ['+', '−'];
    timeLimit = 90;
  } else if (levelNumber <= 20) {
    allowedOperators = ['+', '−', '×'];
    timeLimit = 90;
  } else if (levelNumber <= 40) {
    allowedOperators = ['+', '−', '×', '÷'];
    rows = 4;
    cols = 3;
    pathLen = 4;
    timeLimit = 100;
  } else if (levelNumber <= 70) {
    allowedOperators = ['+', '−', '×', '÷'];
    rows = 4;
    cols = 4;
    pathLen = 4;
    timeLimit = 110;
  } else {
    allowedOperators = ['+', '−', '×', '÷'];
    rows = 4;
    cols = 4;
    pathLen = 5;
    timeLimit = 120;

    if (levelNumber === 75) {
      geniusChapter = {
        mathematician: 'Euler',
        period: '1707 - 1783',
        note: 'Modüler aritmetik ve fonksiyonel analiz ustası.',
      };
    } else if (levelNumber === 90) {
      geniusChapter = {
        mathematician: 'Gauss',
        period: '1777 - 1855',
        note: 'Matematikçilerin Prensi.',
      };
    } else if (levelNumber === 100) {
      geniusChapter = {
        mathematician: 'Ramanujan',
        period: '1887 - 1920',
        note: 'Sayılar teorisinin sonsuz zekası.',
      };
    }
  }

  const totalCells = rows * cols;
  const cells: NumberCell[] = [];
  const rules = {
    allowNegativeResults: true,
    requireExactDivision: true,
    maxAbsoluteIntermediateValue: getIntermediateValueLimit(levelNumber),
  };

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const val = Math.floor(rand() * 14) + 1;
      cells.push({
        id: `c-${levelNumber}-${r}-${c}`,
        value: val,
        position: { row: r, column: c },
      });
    }
  }

  // Aynı seed için aynı yolu üret; nadir bir çıkmazda yeni başlangıç dene.
  let path: number[] = [];

  for (
    let attempt = 0;
    attempt < totalCells && path.length < pathLen;
    attempt += 1
  ) {
    const startIdx = Math.floor(rand() * totalCells);
    const candidatePath: number[] = [startIdx];
    let currentIdx = startIdx;

    for (let step = 1; step < pathLen; step += 1) {
      const row = cells[currentIdx].position.row;
      const column = cells[currentIdx].position.column;
      const validNeighbors = cells.flatMap((cell, index) => {
        if (candidatePath.includes(index)) return [];
        const rowDistance = Math.abs(cell.position.row - row);
        const columnDistance = Math.abs(cell.position.column - column);
        return rowDistance + columnDistance === 1 ? [index] : [];
      });

      if (validNeighbors.length === 0) break;
      const nextIdx =
        validNeighbors[Math.floor(rand() * validNeighbors.length)];
      candidatePath.push(nextIdx);
      currentIdx = nextIdx;
    }

    if (candidatePath.length > path.length) path = candidatePath;
  }

  if (path.length !== pathLen) {
    throw new Error(
      `Seviye ${levelNumber} için ${pathLen} hücrelik yol üretilemedi.`,
    );
  }

  let accVal = cells[path[0]].value as number;
  const pathOperators: Operator[] = [];

  for (let i = 1; i < path.length; i++) {
    const operand = cells[path[i]].value as number;
    const validOperators = allowedOperators.filter((operator) =>
      calculate(accVal, operator, operand, rules).ok,
    );

    if (validOperators.length === 0) {
      throw new Error(`Seviye ${levelNumber} için geçerli işlem üretilemedi.`);
    }

    const op = validOperators[Math.floor(rand() * validOperators.length)];
    const result = calculate(accVal, op, operand, rules);

    if (!result.ok || typeof result.value !== 'number') {
      throw new Error(
        `Seviye ${levelNumber} için çözüm adımı doğrulanamadı.`,
      );
    }

    accVal = result.value;

    pathOperators.push(op);
  }

  const solutionCellIds = path.map((i) => cells[i].id);

  return {
    id: `level-${levelNumber}`,
    number: levelNumber,
    target: accVal,
    rows,
    columns: cols,
    cells,
    allowedOperators,
    parPathLength: path.length,
    timeLimitSeconds: timeLimit,
    hint: `İlk sayı ${cells[path[0]].value}. Sonraki komşu adımda hedefe doğru ilerle.`,
    rules,
    knownSolution: {
      cellIds: solutionCellIds,
      operators: pathOperators,
    },
    exactPathLength: path.length,
    requiredOperators:
      levelNumber >= 51 ? [...new Set(pathOperators)] : undefined,
    requiredOperatorSequence:
      levelNumber >= 91 ? pathOperators : undefined,
    geniusChapter,
  };
}

export function generateAll100Levels(existing30Levels: Level[]): Level[] {
  const result: Level[] = [...existing30Levels];

  for (let n = existing30Levels.length + 1; n <= 100; n++) {
    result.push(generateLevel(n));
  }

  return result;
}
