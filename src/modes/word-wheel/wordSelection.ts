import type { WordEntry } from './types';
import { getWordLetters } from './wordWheelEngine';

export function getWordLengthForLevel(level: number) {
  return Math.min(9, 3 + Math.floor((Math.max(1, level) - 1) / 10));
}

export function selectNextWord(
  entries: WordEntry[],
  recentWordIds: string[],
  currentWordId?: string,
  targetLength?: number,
  random = Math.random,
) {
  const enabled = entries.filter((entry) => entry.enabled);
  const lengthMatches = targetLength
    ? enabled.filter(
        (entry) => getWordLetters(entry.answer).length === targetLength,
      )
    : enabled;
  const lengthPool = lengthMatches.length > 0 ? lengthMatches : enabled;
  const fresh = lengthPool.filter(
    (entry) =>
      entry.id !== currentWordId && !recentWordIds.includes(entry.id),
  );
  const candidates = fresh.length > 0
    ? fresh
    : lengthPool.filter((entry) => entry.id !== currentWordId);

  if (candidates.length === 0) return lengthPool[0] ?? null;
  return candidates[Math.floor(random() * candidates.length)];
}
