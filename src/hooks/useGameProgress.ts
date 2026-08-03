import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import { levels } from '../data/levels';
import { syncLeaderboardProgress } from '../services/leaderboard';

import type {
  CompletionResult,
  CompletionSummary,
  GameProgress,
  GameSettings,
  LevelRecord,
} from '../types/progress';

const STORAGE_KEY = 'hedef-sayi-progress-v2';
const MAX_HINT_BONUS = 200;
export const HINT_STAGE_PENALTY = 50;

function createAnonymousPlayerId() {
  return `player-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

const defaultProgress: GameProgress = {
  schemaVersion: 2,
  playerId: createAnonymousPlayerId(),
  completedLevelNumbers: [],
  levelRecords: {},
  scoreSpent: 0,
  lastLevelNumber: 1,
  settings: {
    showHints: true,
    autoAdvance: true,
    themeId: 'paper',
  },
};

export function calculateCompletionSummary(
  result: CompletionResult,
): CompletionSummary {
  const elapsedSeconds = Math.max(
    0,
    result.timeLimitSeconds - result.secondsRemaining,
  );
  const remainingRatio = Math.max(
    0,
    Math.min(1, result.secondsRemaining / result.timeLimitSeconds),
  );
  const speedBonus = Math.round(remainingRatio * 600);
  const extraMoves = Math.max(0, result.pathLength - result.parPathLength);
  const efficiencyBonus = Math.max(0, 400 - extraMoves * 100);
  const hintStage = Math.max(
    0,
    Math.min(4, result.hintStage ?? (result.usedHint ? 1 : 0)),
  );
  const hintBonus = Math.max(
    0,
    MAX_HINT_BONUS - hintStage * HINT_STAGE_PENALTY,
  );
  const score = 1000 + speedBonus + efficiencyBonus + hintBonus;
  const stars = score >= 1800 ? 3 : score >= 1400 ? 2 : 1;

  return {
    stars,
    score,
    elapsedSeconds,
    speedBonus,
    efficiencyBonus,
    hintBonus,
  };
}

function addScoresToLegacyRecords(
  records: Record<number, LevelRecord>,
): Record<number, LevelRecord> {
  return Object.fromEntries(
    Object.entries(records).map(([levelNumberText, record]) => {
      if (record.bestScore !== undefined) {
        return [levelNumberText, record];
      }

      const levelNumber = Number(levelNumberText);
      const level = levels.find((candidate) => candidate.number === levelNumber);

      if (!level) {
        return [levelNumberText, record];
      }

      const summary = calculateCompletionSummary({
        levelNumber,
        timeLimitSeconds: level.timeLimitSeconds,
        secondsRemaining: Math.max(
          0,
          level.timeLimitSeconds - record.bestTimeSeconds,
        ),
        pathLength: record.bestPathLength,
        parPathLength: level.parPathLength,
        usedHint: !record.completedWithoutHint,
      });

      return [levelNumberText, { ...record, bestScore: summary.score }];
    }),
  );
}

export function useGameProgress() {
  const [progress, setProgress] = useState<GameProgress>(defaultProgress);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;

    async function hydrate() {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);

        if (!stored || !active) return;
        const parsed = JSON.parse(stored) as Partial<GameProgress>;

        if (parsed.schemaVersion !== 2) return;
        setProgress({
          ...defaultProgress,
          ...parsed,
          completedLevelNumbers: parsed.completedLevelNumbers ?? [],
          levelRecords: addScoresToLegacyRecords(parsed.levelRecords ?? {}),
          scoreSpent: Math.max(0, parsed.scoreSpent ?? 0),
          settings: {
            ...defaultProgress.settings,
            ...parsed.settings,
          },
        });
      } catch (error) {
        console.warn('İlerleme kaydı okunamadı.', error);
      } finally {
        if (active) setHydrated(true);
      }
    }

    hydrate();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress)).catch((error) => {
      console.warn('İlerleme kaydı yazılamadı.', error);
    });
  }, [hydrated, progress]);

  useEffect(() => {
    if (!hydrated || !progress.playerName) return;

    const syncTimer = setTimeout(() => {
      syncLeaderboardProgress(progress.playerName!, progress.levelRecords).catch(
        (error) => console.warn('Genel sıralama eşitlenemedi.', error),
      );
    }, 700);

    return () => clearTimeout(syncTimer);
  }, [hydrated, progress.levelRecords, progress.playerName]);

  const recordCompletion = useCallback((result: CompletionResult) => {
    const summary = calculateCompletionSummary(result);
    let isNewHighScore = false;

    setProgress((current) => {
      const previous = current.levelRecords[result.levelNumber];
      isNewHighScore = previous?.bestScore === undefined || summary.score > (previous?.bestScore ?? 0);

      const nextRecord: LevelRecord = {
        stars: Math.max(previous?.stars ?? 0, summary.stars),
        bestScore: Math.max(previous?.bestScore ?? 0, summary.score),
        bestTimeSeconds:
          previous?.bestTimeSeconds === undefined
            ? summary.elapsedSeconds
            : Math.min(previous.bestTimeSeconds, summary.elapsedSeconds),
        bestPathLength:
          previous?.bestPathLength === undefined
            ? result.pathLength
            : Math.min(previous.bestPathLength, result.pathLength),
        completedWithoutHint:
          (previous?.completedWithoutHint ?? false) || !result.usedHint,
      };

      return {
        ...current,
        completedLevelNumbers: current.completedLevelNumbers.includes(
          result.levelNumber,
        )
          ? current.completedLevelNumbers
          : [...current.completedLevelNumbers, result.levelNumber].sort(
              (first, second) => first - second,
            ),
        levelRecords: {
          ...current.levelRecords,
          [result.levelNumber]: nextRecord,
        },
        lastLevelNumber: result.levelNumber,
      };
    });

    return { ...summary, isNewHighScore };
  }, []);

  const updateSettings = useCallback((settings: Partial<GameSettings>) => {
    setProgress((current) => ({
      ...current,
      settings: { ...current.settings, ...settings },
    }));
  }, []);

  const setLastLevelNumber = useCallback((lastLevelNumber: number) => {
    setProgress((current) => ({ ...current, lastLevelNumber }));
  }, []);

  const setPlayerName = useCallback((playerName: string) => {
    setProgress((current) => ({
      ...current,
      playerName: playerName.trim(),
    }));
  }, []);

  const spendScore = useCallback((amount: number) => {
    if (amount <= 0) return;

    setProgress((current) => {
      const earnedScore = Object.values(current.levelRecords).reduce(
        (sum, record) => sum + (record.bestScore ?? 0),
        0,
      );
      const availableScore = Math.max(0, earnedScore - current.scoreSpent);

      if (availableScore < amount) return current;
      return { ...current, scoreSpent: current.scoreSpent + amount };
    });
  }, []);

  const recordDailyCompletion = useCallback((dateStr: string) => {
    setProgress((current) => {
      if (current.lastDailyCompletedDate === dateStr) {
        return current;
      }
      const currentStreak = current.dailyStreak ?? 0;
      return {
        ...current,
        dailyStreak: currentStreak + 1,
        lastDailyCompletedDate: dateStr,
      };
    });
  }, []);

  return {
    hydrated,
    progress,
    recordCompletion,
    recordDailyCompletion,
    setLastLevelNumber,
    setPlayerName,
    spendScore,
    updateSettings,
  };
}
