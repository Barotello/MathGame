export type WordCategory =
  | 'Hayvan'
  | 'Doğa'
  | 'Nesne'
  | 'Yiyecek'
  | 'Vücut'
  | 'Yer'
  | 'Renk'
  | 'Kavram';

export type WordEntry = {
  id: string;
  answer: string;
  clue: string;
  category: WordCategory;
  difficulty: 1 | 2 | 3;
  enabled: boolean;
};

export type WordRoundStatus =
  | 'playing'
  | 'revealing'
  | 'checking'
  | 'solved'
  | 'failed'
  | 'finished';

export type WordWheelProgress = {
  schemaVersion: 1;
  totalSolved: number;
  totalScore: number;
  bestRoundScore: number;
  solvedWordIds: string[];
  recentWordIds: string[];
};
