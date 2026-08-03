import type { WordEntry } from './types';
import { getWordLetters } from './wordWheelEngine';

export const WORD_WHEEL_LEVEL_COUNT = 10;
export const WORDS_PER_LEVEL = 10;
const FIRST_LEVEL_LENGTH_QUOTAS = [
  { length: 3, count: 3 },
  { length: 4, count: 4 },
  { length: 5, count: 3 },
] as const;

export function clampWordWheelLevel(level: number) {
  return Math.min(WORD_WHEEL_LEVEL_COUNT, Math.max(1, Math.floor(level)));
}

export function getWordDifficultyScore(entry: WordEntry) {
  const lengthScore = getWordLetters(entry.answer).length * 100;
  const contentScore = entry.difficulty * 20;
  const clueScore = Math.min(19, Math.floor(entry.clue.length / 5));
  return lengthScore + contentScore + clueScore;
}

export function getLevelDifficultyPool(entries: WordEntry[], level: number) {
  const enabled = entries
    .filter((entry) => entry.enabled)
    .sort((first, second) => {
      const difficultyDifference =
        getWordDifficultyScore(first) - getWordDifficultyScore(second);
      if (difficultyDifference !== 0) return difficultyDifference;
      return first.answer.localeCompare(second.answer, 'tr-TR');
    });

  const safeLevel = clampWordWheelLevel(level);
  if (safeLevel === 1) {
    return enabled.filter((entry) => {
      const length = getWordLetters(entry.answer).length;
      return length >= 3 && length <= 5;
    });
  }
  const start = Math.floor(
    ((safeLevel - 1) * enabled.length) / WORD_WHEEL_LEVEL_COUNT,
  );
  const end = Math.floor((safeLevel * enabled.length) / WORD_WHEEL_LEVEL_COUNT);
  return enabled.slice(start, Math.max(start + WORDS_PER_LEVEL, end));
}

function shuffleWords(entries: WordEntry[], random: () => number) {
  return entries
    .map((entry) => ({ entry, order: random() }))
    .sort((first, second) => first.order - second.order)
    .map(({ entry }) => entry);
}

function prioritizeFreshWords(
  entries: WordEntry[],
  recent: Set<string>,
  random: () => number,
) {
  return [
    ...shuffleWords(
      entries.filter((entry) => !recent.has(entry.id)),
      random,
    ),
    ...shuffleWords(
      entries.filter((entry) => recent.has(entry.id)),
      random,
    ),
  ];
}

export function isLevelWordGroupValid(entries: WordEntry[], level: number) {
  if (
    entries.length !== WORDS_PER_LEVEL ||
    new Set(entries.map((entry) => entry.id)).size !== WORDS_PER_LEVEL
  ) {
    return false;
  }

  if (clampWordWheelLevel(level) !== 1) return true;

  return FIRST_LEVEL_LENGTH_QUOTAS.every(({ length, count }) => {
    const matchingWords = entries.filter(
      (entry) => getWordLetters(entry.answer).length === length,
    );
    return matchingWords.length === count;
  });
}

export function createLevelWordGroup(
  entries: WordEntry[],
  level: number,
  recentWordIds: string[],
  random = Math.random,
) {
  const safeLevel = clampWordWheelLevel(level);
  const pool = getLevelDifficultyPool(entries, safeLevel);
  const recent = new Set(recentWordIds);

  if (safeLevel === 1) {
    const selected = FIRST_LEVEL_LENGTH_QUOTAS.flatMap(({ length, count }) =>
      prioritizeFreshWords(
        pool.filter(
          (entry) => getWordLetters(entry.answer).length === length,
        ),
        recent,
        random,
      ).slice(0, count),
    );

    return shuffleWords(selected, random);
  }

  const prioritized = [
    ...pool.filter((entry) => !recent.has(entry.id)),
    ...pool.filter((entry) => recent.has(entry.id)),
  ];
  const fresh = pool.filter((entry) => !recent.has(entry.id));
  const candidates = fresh.length >= WORDS_PER_LEVEL ? fresh : prioritized;

  const shuffled = candidates
    .map((entry) => ({ entry, order: random() }))
    .sort((first, second) => first.order - second.order)
    .map(({ entry }) => entry);

  return shuffled.slice(0, WORDS_PER_LEVEL);
}

export function isWordWheelComplete(level: number, wordIndex: number) {
  return level >= WORD_WHEEL_LEVEL_COUNT && wordIndex >= WORDS_PER_LEVEL;
}
