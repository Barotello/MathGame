import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import type { WordWheelProgress } from './types';

const STORAGE_KEY = 'hedef-sayi-word-wheel-v1';
const RECENT_WORD_LIMIT = 10;

const defaultProgress: WordWheelProgress = {
  schemaVersion: 2,
  totalSolved: 0,
  totalPlayed: 0,
  totalScore: 0,
  bestRoundScore: 0,
  solvedWordIds: [],
  recentWordIds: [],
  currentLevel: 1,
  levelWordIndex: 0,
  currentLevelWordIds: [],
  completedLevels: [],
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
        setProgress({
          ...defaultProgress,
          ...parsed,
          schemaVersion: 2,
          totalPlayed: parsed.schemaVersion === 2 ? (parsed.totalPlayed ?? 0) : 0,
          solvedWordIds: parsed.solvedWordIds ?? [],
          recentWordIds: parsed.recentWordIds ?? [],
          currentLevel: parsed.schemaVersion === 2 ? (parsed.currentLevel ?? 1) : 1,
          levelWordIndex:
            parsed.schemaVersion === 2 ? (parsed.levelWordIndex ?? 0) : 0,
          currentLevelWordIds:
            parsed.schemaVersion === 2 ? (parsed.currentLevelWordIds ?? []) : [],
          completedLevels:
            parsed.schemaVersion === 2 ? (parsed.completedLevels ?? []) : [],
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

  const recordAttempt = useCallback(
    (wordId: string, score: number, solved: boolean) => {
      setProgress((current) => {
        const nextWordIndex = Math.min(10, current.levelWordIndex + 1);
        const completedLevel = nextWordIndex >= 10;
        const completedLevels = completedLevel
          ? Array.from(new Set([...current.completedLevels, current.currentLevel]))
          : current.completedLevels;
        const finalLevelCompleted = completedLevel && current.currentLevel >= 10;

        return {
          ...current,
          totalSolved: current.totalSolved + (solved ? 1 : 0),
          totalPlayed: current.totalPlayed + 1,
          totalScore: Math.max(0, current.totalScore + score),
          bestRoundScore: Math.max(current.bestRoundScore, score),
          solvedWordIds:
            solved && !current.solvedWordIds.includes(wordId)
              ? [...current.solvedWordIds, wordId]
              : current.solvedWordIds,
          recentWordIds: [
            wordId,
            ...current.recentWordIds.filter((id) => id !== wordId),
          ].slice(0, RECENT_WORD_LIMIT),
          currentLevel:
            completedLevel && !finalLevelCompleted
              ? current.currentLevel + 1
              : current.currentLevel,
          levelWordIndex: completedLevel
            ? finalLevelCompleted
              ? 10
              : 0
            : nextWordIndex,
          currentLevelWordIds: completedLevel ? [] : current.currentLevelWordIds,
          completedLevels,
        };
      });
    },
    [],
  );

  const setLevelWordIds = useCallback((level: number, wordIds: string[]) => {
    setProgress((current) =>
      current.currentLevel === level
        ? { ...current, currentLevelWordIds: wordIds }
        : current,
    );
  }, []);

  const selectLevel = useCallback((level: number, wordIds: string[]) => {
    setProgress((current) => ({
      ...current,
      currentLevel: level,
      levelWordIndex: 0,
      currentLevelWordIds: wordIds,
    }));
  }, []);

  return { hydrated, progress, recordAttempt, selectLevel, setLevelWordIds };
}
