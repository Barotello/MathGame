import type {
  CalculationResult,
  Level,
  LevelRules,
  NumberCell,
  OperationStep,
  Operator,
  MathValue,
} from '../types/game';
import {
  addValues,
  divideValues,
  formatMathValue,
  isIntegerValue,
  isNegativeValue,
  isZeroValue,
  mathValueEquals,
  mathValueMagnitude,
  moduloValues,
  multiplyValues,
  subtractValues,
} from './mathValue';

export function areOrthogonalNeighbors(
  first: NumberCell,
  second: NumberCell,
): boolean {
  const rowDistance = Math.abs(first.position.row - second.position.row);
  const columnDistance = Math.abs(
    first.position.column - second.position.column,
  );

  return rowDistance + columnDistance === 1;
}

export function hasUnvisitedOrthogonalNeighbor(
  cell: NumberCell,
  cells: NumberCell[],
  visitedCellIds: string[],
): boolean {
  const visited = new Set(visitedCellIds);

  return cells.some(
    (candidate) =>
      !visited.has(candidate.id) && areOrthogonalNeighbors(cell, candidate),
  );
}

export function calculate(
  currentValue: MathValue,
  operator: Operator,
  operand: MathValue,
  rules: LevelRules,
): CalculationResult {
  if (operator === '÷' && isZeroValue(operand)) {
    return { ok: false, reason: 'Sıfıra bölme yapılamaz.' };
  }

  let value: MathValue;

  switch (operator) {
    case '+':
      value = addValues(currentValue, operand);
      break;
    case '−':
      value = subtractValues(currentValue, operand);
      break;
    case '×':
      value = multiplyValues(currentValue, operand);
      break;
    case '÷':
      value = divideValues(currentValue, operand);
      break;
  }

  if (operator === '÷' && rules.requireExactDivision && !isIntegerValue(value)) {
    return { ok: false, reason: 'Bu bölümde bölme tam sayı vermeli.' };
  }

  if (!rules.allowNegativeResults && isNegativeValue(value)) {
    return { ok: false, reason: 'Bu bölümde negatif sonuç kullanılamaz.' };
  }

  if (mathValueMagnitude(value) > rules.maxAbsoluteIntermediateValue) {
    return {
      ok: false,
      reason: `Ara sonuç ${rules.maxAbsoluteIntermediateValue} sınırını aşıyor.`,
    };
  }

  return { ok: true, value };
}

export function isKnownSolutionValid(level: Level): boolean {
  const { cellIds, operators } = level.knownSolution;

  if (cellIds.length < 2 || operators.length !== cellIds.length - 1) {
    return false;
  }

  if (new Set(cellIds).size !== cellIds.length) {
    return false;
  }

  const cells = cellIds.map((id) =>
    level.cells.find((cell) => cell.id === id),
  );

  if (cells.some((cell) => !cell)) {
    return false;
  }

  let currentValue = cells[0]!.value;

  for (let index = 1; index < cells.length; index += 1) {
    const previousCell = cells[index - 1]!;
    const currentCell = cells[index]!;

    if (!areOrthogonalNeighbors(previousCell, currentCell)) {
      return false;
    }

    const result = calculate(
      currentValue,
      operators[index - 1],
      currentCell.value,
      level.rules,
    );

    if (!result.ok) {
      return false;
    }

    currentValue = result.value;
  }

  return meetsLevelCompletionRules(
    level,
    currentValue,
    cellIds.length,
    operators,
    cellIds,
  );
}

export function isOperatorAvailable(
  currentValue: MathValue,
  operator: Operator,
  operand: MathValue,
  rules: LevelRules,
): boolean {
  return calculate(currentValue, operator, operand, rules).ok;
}

export function buildExpression(
  firstValue: MathValue | null,
  steps: OperationStep[],
): string {
  if (firstValue === null) {
    return 'Bir sayı seç';
  }

  return steps.reduce(
    (expression, step) =>
      `(${expression} ${step.operator} ${formatMathValue(step.operand)})`,
    formatMathValue(firstValue),
  );
}

export function meetsLevelCompletionRules(
  level: Level,
  value: MathValue,
  pathLength: number,
  operators: Operator[],
  cellIds: string[] = [],
): boolean {
  if (pathLength < 2) {
    return false;
  }

  if (!mathValueEquals(value, level.target)) {
    return false;
  }

  if (
    level.exactPathLength !== undefined &&
    pathLength !== level.exactPathLength
  ) {
    return false;
  }

  if (
    !(level.requiredOperators ?? []).every((operator) =>
      operators.includes(operator),
    )
  ) {
    return false;
  }

  if (
    level.requiredOperatorSequence !== undefined &&
    (operators.length !== level.requiredOperatorSequence.length ||
      operators.some(
        (operator, index) =>
          operator !== level.requiredOperatorSequence?.[index],
      ))
  ) {
    return false;
  }

  const selectedCells = cellIds
    .map((cellId) => level.cells.find((cell) => cell.id === cellId))
    .filter((cell) => cell !== undefined);

  return (level.requiredValueKinds ?? []).every((kind) => {
    if (kind === 'fraction') {
      return selectedCells.some(
        (cell) => !isIntegerValue(cell.value),
      );
    }
    if (kind === 'negative') {
      return selectedCells.some((cell) => isNegativeValue(cell.value));
    }
    return selectedCells.some((cell) => /[√²³]/.test(cell.displayValue ?? ''));
  });
}
