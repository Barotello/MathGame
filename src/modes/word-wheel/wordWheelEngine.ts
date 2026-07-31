import type { WordEntry } from './types';

export const SCORE_PER_LETTER = 100;
export const REVEAL_COST = 100;
export const SESSION_DURATION_SECONDS = 120;

export function getBaseRoundScore(wordLength: number) {
  return Math.max(0, Math.floor(wordLength)) * SCORE_PER_LETTER;
}

export function normalizeTurkishWord(value: string) {
  return value.trim().toLocaleUpperCase('tr-TR');
}

export function getWordLetters(value: string) {
  return Array.from(normalizeTurkishWord(value));
}

export function isCorrectGuess(guess: string, answer: string) {
  return normalizeTurkishWord(guess) === normalizeTurkishWord(answer);
}

export function getMaxReveals(wordLength: number) {
  if (wordLength <= 3) return Math.max(0, wordLength - 1);
  if (wordLength <= 4) return 2;
  if (wordLength <= 6) return 3;
  return 4;
}

export function getRevealCost(_revealedCount: number) {
  return REVEAL_COST;
}

export function revealRandomIndex(
  answer: string,
  revealedIndexes: number[],
  random = Math.random,
) {
  const availableIndexes = getWordLetters(answer)
    .map((_, index) => index)
    .filter((index) => !revealedIndexes.includes(index));

  if (availableIndexes.length === 0) return null;
  return availableIndexes[Math.floor(random() * availableIndexes.length)];
}

export function applyPenalty(score: number, penalty: number) {
  return Math.max(0, score - penalty);
}

export function validateWordEntries(entries: WordEntry[]) {
  const ids = new Set<string>();
  const answers = new Set<string>();

  return entries.flatMap((entry) => {
    const problems: string[] = [];
    const answer = normalizeTurkishWord(entry.answer);

    if (ids.has(entry.id)) problems.push(`${entry.id}: yinelenen kimlik`);
    ids.add(entry.id);

    if (answers.has(answer)) problems.push(`${entry.id}: yinelenen cevap`);
    answers.add(answer);

    if (getWordLetters(answer).length < 3) problems.push(`${entry.id}: cevap çok kısa`);
    if (!/^[ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ]+$/u.test(answer)) {
      problems.push(`${entry.id}: geçersiz Türkçe karakter`);
    }
    if (!entry.clue.trim()) problems.push(`${entry.id}: açıklama boş`);

    return problems;
  });
}
