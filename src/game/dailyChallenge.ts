import type { Level, NumberCell, Operator } from '../types/game';

function seedRandom(seedStr: string): () => number {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }
  let seed = Math.abs(hash) || 1;
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

export function getTodayDateString(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function generateDailyChallenge(dateStr: string = getTodayDateString()): Level {
  const rand = seedRandom(dateStr);

  const operatorsList: Operator[][] = [
    ['+', '−', '×'],
    ['+', '−', '×', '÷'],
    ['+', '−', '×', '÷'],
  ];

  const allowedOperators = operatorsList[Math.floor(rand() * operatorsList.length)];
  const rows = 3;
  const columns = 3;

  const cells: NumberCell[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < columns; c++) {
      const val = Math.floor(rand() * 10) + 1;
      cells.push({
        id: `daily-${r}-${c}`,
        value: val,
        position: { row: r, column: c },
      });
    }
  }

  const startIdx = Math.floor(rand() * cells.length);
  const path: number[] = [startIdx];
  let currIdx = startIdx;

  for (let step = 0; step < 3; step++) {
    const r = cells[currIdx].position.row;
    const c = cells[currIdx].position.column;

    const neighbors: number[] = [];
    cells.forEach((cell, idx) => {
      if (path.includes(idx)) return;
      const dr = Math.abs(cell.position.row - r);
      const dc = Math.abs(cell.position.column - c);
      if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
        neighbors.push(idx);
      }
    });

    if (neighbors.length === 0) break;
    const nextIdx = neighbors[Math.floor(rand() * neighbors.length)];
    path.push(nextIdx);
    currIdx = nextIdx;
  }

  let currentVal = cells[path[0]].value as number;
  const pathOperators: Operator[] = [];
  for (let i = 1; i < path.length; i++) {
    const nextVal = cells[path[i]].value as number;
    let op: Operator = allowedOperators[Math.floor(rand() * allowedOperators.length)];
    if (op === '÷' && (nextVal === 0 || currentVal % nextVal !== 0)) {
      op = '+';
    }

    if (op === '+') currentVal += nextVal;
    else if (op === '−') currentVal -= nextVal;
    else if (op === '×') currentVal *= nextVal;
    else if (op === '÷') currentVal = Math.floor(currentVal / nextVal);

    pathOperators.push(op);
  }

  const solutionCellIds = path.map((idx) => cells[idx].id);

  return {
    id: `daily-${dateStr}`,
    number: 999,
    target: currentVal,
    rows,
    columns,
    cells,
    allowedOperators,
    parPathLength: path.length,
    timeLimitSeconds: 120,
    hint: `${dateStr} Günlük Bulmaca: İlk hücre ${cells[path[0]].value}.`,
    rules: {
      allowNegativeResults: true,
      requireExactDivision: true,
      maxAbsoluteIntermediateValue: 999,
    },
    knownSolution: {
      cellIds: solutionCellIds,
      operators: pathOperators,
    },
  };
}
