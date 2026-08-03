import type { ThemeId } from '../theme/themes';

export type LevelRecord = {
  stars: number;
  bestScore?: number;
  bestTimeSeconds: number;
  bestPathLength: number;
  completedWithoutHint: boolean;
};

export type CompletionSummary = {
  stars: number;
  score: number;
  elapsedSeconds: number;
  speedBonus: number;
  efficiencyBonus: number;
  hintBonus: number;
  isNewHighScore?: boolean;
};

export type GameSettings = {
  showHints: boolean;
  autoAdvance: boolean;
  themeId: ThemeId;
};

export type GameProgress = {
  schemaVersion: 2;
  playerId: string;
  playerName?: string;
  completedLevelNumbers: number[];
  levelRecords: Record<number, LevelRecord>;
  scoreSpent: number;
  lastLevelNumber: number;
  dailyStreak?: number;
  lastDailyCompletedDate?: string;
  settings: GameSettings;
};

export type CompletionResult = {
  levelNumber: number;
  timeLimitSeconds: number;
  secondsRemaining: number;
  pathLength: number;
  parPathLength: number;
  usedHint: boolean;
  hintStage?: number;
};
