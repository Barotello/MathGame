export type Operator = '+' | '−' | '×' | '÷';

export type FractionValue = {
  numerator: number;
  denominator: number;
};

export type MathValue = number | FractionValue;
export type ValueKind = 'fraction' | 'negative' | 'symbolic';

export type Position = {
  row: number;
  column: number;
};

export type NumberCell = {
  id: string;
  value: MathValue;
  displayValue?: string;
  position: Position;
};

export type LevelRules = {
  allowNegativeResults: boolean;
  requireExactDivision: boolean;
  maxAbsoluteIntermediateValue: number;
};

export type KnownSolution = {
  cellIds: string[];
  operators: Operator[];
};

export type GeniusChapter = {
  mathematician: string;
  period: string;
  note: string;
};

export type Level = {
  id: string;
  number: number;
  target: MathValue;
  rows: number;
  columns: number;
  cells: NumberCell[];
  allowedOperators: Operator[];
  parPathLength: number;
  timeLimitSeconds: number;
  hint: string;
  rules: LevelRules;
  knownSolution: KnownSolution;
  requiredOperators?: Operator[];
  requiredOperatorSequence?: Operator[];
  requiredValueKinds?: ValueKind[];
  exactPathLength?: number;
  geniusChapter?: GeniusChapter;
};

export type OperationStep = {
  operator: Operator;
  cellId: string;
  operand: MathValue;
  result: MathValue;
};

export type CalculationResult =
  | { ok: true; value: MathValue }
  | { ok: false; reason: string };
