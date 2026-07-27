import type { WordEntry } from './types';

export function selectNextWord(
  entries: WordEntry[],
  recentWordIds: string[],
  currentWordId?: string,
  random = Math.random,
) {
  const enabled = entries.filter((entry) => entry.enabled);
  const fresh = enabled.filter(
    (entry) =>
      entry.id !== currentWordId && !recentWordIds.includes(entry.id),
  );
  const candidates = fresh.length > 0
    ? fresh
    : enabled.filter((entry) => entry.id !== currentWordId);

  if (candidates.length === 0) return enabled[0] ?? null;
  return candidates[Math.floor(random() * candidates.length)];
}
