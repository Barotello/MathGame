import type { FractionValue, MathValue } from '../types/game';

function greatestCommonDivisor(first: number, second: number): number {
  let left = Math.abs(first);
  let right = Math.abs(second);

  while (right !== 0) {
    const remainder = left % right;
    left = right;
    right = remainder;
  }

  return left || 1;
}

export function fraction(numerator: number, denominator: number): MathValue {
  if (!Number.isInteger(numerator) || !Number.isInteger(denominator)) {
    throw new Error('Kesir payı ve paydası tam sayı olmalı.');
  }
  if (denominator === 0) {
    throw new Error('Kesrin paydası sıfır olamaz.');
  }

  const sign = denominator < 0 ? -1 : 1;
  const commonDivisor = greatestCommonDivisor(numerator, denominator);
  const normalizedNumerator = (numerator * sign) / commonDivisor;
  const normalizedDenominator = Math.abs(denominator) / commonDivisor;

  return normalizedDenominator === 1
    ? normalizedNumerator
    : {
        numerator: normalizedNumerator,
        denominator: normalizedDenominator,
      };
}

export function asFraction(value: MathValue): FractionValue {
  return typeof value === 'number'
    ? { numerator: value, denominator: 1 }
    : value;
}

export function addValues(first: MathValue, second: MathValue): MathValue {
  const left = asFraction(first);
  const right = asFraction(second);
  return fraction(
    left.numerator * right.denominator + right.numerator * left.denominator,
    left.denominator * right.denominator,
  );
}

export function subtractValues(first: MathValue, second: MathValue): MathValue {
  const right = asFraction(second);
  return addValues(first, fraction(-right.numerator, right.denominator));
}

export function multiplyValues(first: MathValue, second: MathValue): MathValue {
  const left = asFraction(first);
  const right = asFraction(second);
  return fraction(
    left.numerator * right.numerator,
    left.denominator * right.denominator,
  );
}

export function divideValues(first: MathValue, second: MathValue): MathValue {
  const left = asFraction(first);
  const right = asFraction(second);
  return fraction(
    left.numerator * right.denominator,
    left.denominator * right.numerator,
  );
}

export function moduloValues(first: MathValue, second: MathValue): MathValue {
  const left = asFraction(first);
  const right = asFraction(second);

  if (left.denominator !== 1 || right.denominator !== 1) {
    throw new Error('Kalan işlemi yalnızca tam sayılarla yapılabilir.');
  }

  return left.numerator % right.numerator;
}

export function isIntegerValue(value: MathValue): boolean {
  return asFraction(value).denominator === 1;
}

export function isZeroValue(value: MathValue): boolean {
  return asFraction(value).numerator === 0;
}

export function isNegativeValue(value: MathValue): boolean {
  return asFraction(value).numerator < 0;
}

export function mathValueEquals(first: MathValue, second: MathValue): boolean {
  const left = asFraction(first);
  const right = asFraction(second);
  return (
    left.numerator === right.numerator &&
    left.denominator === right.denominator
  );
}

export function mathValueMagnitude(value: MathValue): number {
  const normalized = asFraction(value);
  return Math.abs(normalized.numerator / normalized.denominator);
}

export function formatMathValue(value: MathValue): string {
  const normalized = asFraction(value);
  return normalized.denominator === 1
    ? String(normalized.numerator)
    : `${normalized.numerator}/${normalized.denominator}`;
}
