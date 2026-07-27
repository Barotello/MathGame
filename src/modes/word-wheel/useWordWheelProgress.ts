import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import type { WordWheelProgress } from './types';

const STORAGE_KEY = 'hedef-sayi-word-wheel-v1';
const RECENT_WORD_LIMIT = 10;

const defaultProgress: WordWheelProgress = {
  schemaVersion: 1,
  totalSolved: 0,
  totalScore: 0,
  bestRoundScore: 0,
  solvedWordIds: [],
  recentWordIds: [],
};

export function useWordWheelProgress() {
  const [progress, setProgress] = useState(defaultProgress);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;

    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!stored || !active) return;
        const parsed = JSON.parse(stored) as Partial<WordWheelProgress>;
        if (parsed.schemaVersion !== 1) return;
        setProgress({
          ...defaultProgress,
          ...parsed,
          solvedWordIds: parsed.solvedWordIds ?? [],
          recentWordIds: parsed.recentWordIds ?? [],
        });
      })
      .catch((error) => console.warn('Kelime Çarkı kaydı okunamadı.', error))
      .finally(() => {
        if (active) setHydrated(true);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress)).catch((error) =>
      console.warn('Kelime Çarkı kaydı yazılamadı.', error),
    );
  }, [hydrated, progress]);

  const recordSolved = useCallback((wordId: string, score: number) => {
    setProgress((current) => ({
      ...current,
      totalSolved: current.totalSolved + 1,
      totalScore: current.totalScore + score,
      bestRoundScore: Math.max(current.bestRoundScore, score),
      solvedWordIds: current.solvedWordIds.includes(wordId)
        ? current.solvedWordIds
        : [...current.solvedWordIds, wordId],
      recentWordIds: [
        wordId,
        ...current.recentWordIds.filter((id) => id !== wordId),
      ].slice(0, RECENT_WORD_LIMIT),
    }));
  }, []);

  return { hydrated, progress, recordSolved };
}
