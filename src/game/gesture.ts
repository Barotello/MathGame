import type { NumberCell, Operator } from '../types/game';

export type BoardPoint = {
  x: number;
  y: number;
};

export type OperatorPlacement = {
  operator: Operator;
  center: BoardPoint;
  left: number;
  top: number;
};

export type OperatorArcLayout = {
  center: BoardPoint;
  radius: number;
  buttonSize: number;
  placements: OperatorPlacement[];
};

export const ALL_OPERATORS: Operator[] = ['+', '−', '×', '÷'];

const ARC_START_DEGREES = 210;
const ARC_SWEEP_DEGREES = 120;
const ARC_RADIUS = 110;
const OPERATOR_SIZE = 56;

export function getBoardPointFromDrag(
  startCell: NumberCell,
  cellSize: number,
  gap: number,
  padding: number,
  dx: number,
  dy: number,
): BoardPoint {
  return {
    x:
      padding +
      startCell.position.column * (cellSize + gap) +
      cellSize / 2 +
      dx,
    y:
      padding +
      startCell.position.row * (cellSize + gap) +
      cellSize / 2 +
      dy,
  };
}

export function getCellAtBoardPoint(
  point: BoardPoint,
  cells: NumberCell[],
  cellSize: number,
  gap: number,
  padding: number,
): NumberCell | null {
  return (
    cells.find((cell) => {
      const left = padding + cell.position.column * (cellSize + gap);
      const top = padding + cell.position.row * (cellSize + gap);

      return (
        point.x >= left &&
        point.x <= left + cellSize &&
        point.y >= top &&
        point.y <= top + cellSize
      );
    }) ?? null
  );
}

export function getOperatorArcLayout(
  targetCell: NumberCell,
  cellSize: number,
  boardSize: number,
  gap: number,
  padding: number,
): OperatorArcLayout {
  const targetCenterX =
    padding +
    targetCell.position.column * (cellSize + gap) +
    cellSize / 2;
  const targetCenterY =
    padding + targetCell.position.row * (cellSize + gap) + cellSize / 2;
  const edgeInset = ARC_RADIUS + OPERATOR_SIZE / 2 + 4;
  const center = {
    x: clamp(targetCenterX, edgeInset, boardSize - edgeInset),
    y: Math.max(targetCenterY, edgeInset),
  };

  const placements = ALL_OPERATORS.map((operator, index) => {
    const progress = index / (ALL_OPERATORS.length - 1);
    const degrees = ARC_START_DEGREES + ARC_SWEEP_DEGREES * progress;
    const radians = (degrees * Math.PI) / 180;
    const operatorCenter = {
      x: center.x + Math.cos(radians) * ARC_RADIUS,
      y: center.y + Math.sin(radians) * ARC_RADIUS,
    };

    return {
      operator,
      center: operatorCenter,
      left: operatorCenter.x - OPERATOR_SIZE / 2,
      top: operatorCenter.y - OPERATOR_SIZE / 2,
    };
  });

  return { center, radius: ARC_RADIUS, buttonSize: OPERATOR_SIZE, placements };
}

export function getOperatorAtBoardPoint(
  point: BoardPoint,
  layout: OperatorArcLayout,
  hitSlop = 12,
): Operator | null {
  const hitRadius = layout.buttonSize / 2 + hitSlop;
  const hitRadiusSquared = hitRadius * hitRadius;

  let nearestOperator: Operator | null = null;
  let nearestDistanceSquared = Number.POSITIVE_INFINITY;

  for (const placement of layout.placements) {
    const dx = point.x - placement.center.x;
    const dy = point.y - placement.center.y;
    const distanceSquared = dx * dx + dy * dy;

    if (
      distanceSquared <= hitRadiusSquared &&
      distanceSquared < nearestDistanceSquared
    ) {
      nearestOperator = placement.operator;
      nearestDistanceSquared = distanceSquared;
    }
  }

  return nearestOperator;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(value, maximum));
}
