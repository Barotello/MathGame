import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import type { WallBreakerProgress } from './types';

const STORAGE_KEY = 'hedef-sayi-wall-breaker-v1';

const defaultProgress: WallBreakerProgress = {
  schemaVersion: 1,
  bestScore: 0,
  mostWallsDestroyed: 0,
  precisionBestMoves: null,
  precisionBestTimeSeconds: null,
};

export function useWallBreakerProgress() {
  const [progress, setProgress] =
    useState<WallBreakerProgress>(defaultProgress);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;

    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!stored || !active) return;
        const parsed = JSON.parse(stored) as Partial<WallBreakerProgress>;

        if (parsed.schemaVersion !== 1) return;
        setProgress({ ...defaultProgress, ...parsed });
      })
      .catch((error) => {
        console.warn('Duvar Yıkma kaydı okunamadı.', error);
      })
      .finally(() => {
        if (active) setHydrated(true);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress)).catch(
      (error) => {
        console.warn('Duvar Yıkma kaydı yazılamadı.', error);
      },
    );
  }, [hydrated, progress]);

  const recordRun = useCallback(
    (score: number, wallsDestroyed: number) => {
      setProgress((current) => ({
        ...current,
        bestScore: Math.max(current.bestScore, score),
        mostWallsDestroyed: Math.max(
          current.mostWallsDestroyed,
          wallsDestroyed,
        ),
      }));
    },
    [],
  );

  return { hydrated, progress, recordRun };
}