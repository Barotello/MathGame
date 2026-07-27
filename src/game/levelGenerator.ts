import type { GeniusChapter, Level, MathValue, NumberCell, Operator } from '../types/game';

function pseudoRand(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
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

  // Pick solvable path
  const startIdx = Math.floor(rand() * totalCells);
  const path: number[] = [startIdx];
  let currentIdx = startIdx;

  for (let s = 1; s < pathLen; s++) {
    const r = cells[currentIdx].position.row;
    const c = cells[currentIdx].position.column;

    const validNeighbors: number[] = [];
    cells.forEach((cell, i) => {
      if (path.includes(i)) return;
      const dr = Math.abs(cell.position.row - r);
      const dc = Math.abs(cell.position.column - c);
      if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
        validNeighbors.push(i);
      }
    });

    if (validNeighbors.length === 0) break;
    const nextIdx = validNeighbors[Math.floor(rand() * validNeighbors.length)];
    path.push(nextIdx);
    currentIdx = nextIdx;
  }

  let accVal = cells[path[0]].value as number;
  const pathOperators: Operator[] = [];

  for (let i = 1; i < path.length; i++) {
    const operand = cells[path[i]].value as number;
    let op: Operator = allowedOperators[Math.floor(rand() * allowedOperators.length)];

    if (op === '÷' && (operand === 0 || accVal % operand !== 0)) {
      op = '+';
    }

    if (op === '+') accVal += operand;
    else if (op === '−') accVal -= operand;
    else if (op === '×') accVal *= operand;
    else if (op === '÷') accVal = Math.floor(accVal / operand);

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
    rules: {
      allowNegativeResults: true,
      requireExactDivision: true,
      maxAbsoluteIntermediateValue: 999,
    },
    knownSolution: {
      cellIds: solutionCellIds,
      operators: pathOperators,
    },
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
