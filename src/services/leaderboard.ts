import { isLeaderboardConfigured, supabase } from '../lib/supabase';
import type { LevelRecord } from '../types/progress';

export type LeaderboardEntry = {
  rank: number;
  playerId: string;
  playerName: string;
  totalScore: number;
  levelsCompleted: number;
};

export type LeaderboardResult = {
  entries: LeaderboardEntry[];
  currentPlayer: LeaderboardEntry | null;
  currentPlayerId: string;
};

type LeaderboardRow = {
  rank: number | string;
  player_id: string;
  player_name: string;
  total_score: number | string;
  levels_completed: number | string;
};

function mapRow(row: LeaderboardRow): LeaderboardEntry {
  return {
    rank: Number(row.rank),
    playerId: row.player_id,
    playerName: row.player_name,
    totalScore: Number(row.total_score),
    levelsCompleted: Number(row.levels_completed),
  };
}

async function getAnonymousUserId() {
  if (!supabase) throw new Error('Sıralama servisi henüz yapılandırılmadı.');

  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (sessionData.session?.user.id) return sessionData.session.user.id;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  if (!data.user) throw new Error('Anonim oyuncu oturumu oluşturulamadı.');
  return data.user.id;
}

export async function syncLeaderboardProgress(
  playerName: string,
  levelRecords: Record<number, LevelRecord>,
) {
  if (!isLeaderboardConfigured || !supabase) return null;

  const playerId = await getAnonymousUserId();
  const scoredLevels = Object.entries(levelRecords)
    .map(([levelNumber, record]) => ({
      levelNumber: Number(levelNumber),
      score: record.bestScore ?? 0,
    }))
    .filter(
      ({ levelNumber, score }) =>
        Number.isInteger(levelNumber) && levelNumber >= 1 && score > 0,
    );

  const { error } = await supabase.rpc('sync_leaderboard_score', {
    p_player_name: playerName,
    p_level_numbers: scoredLevels.map(({ levelNumber }) => levelNumber),
    p_scores: scoredLevels.map(({ score }) => score),
  });

  if (error) throw error;
  return playerId;
}

export async function loadLeaderboard(
  playerName: string,
  levelRecords: Record<number, LevelRecord>,
): Promise<LeaderboardResult> {
  if (!supabase) throw new Error('Sıralama servisi henüz yapılandırılmadı.');

  const currentPlayerId = await syncLeaderboardProgress(
    playerName,
    levelRecords,
  );
  if (!currentPlayerId) throw new Error('Oyuncu sıralamaya bağlanamadı.');

  const [topResult, playerResult] = await Promise.all([
    supabase
      .from('global_leaderboard')
      .select('rank, player_id, player_name, total_score, levels_completed')
      .order('rank', { ascending: true })
      .limit(50),
    supabase
      .from('global_leaderboard')
      .select('rank, player_id, player_name, total_score, levels_completed')
      .eq('player_id', currentPlayerId)
      .maybeSingle(),
  ]);

  if (topResult.error) throw topResult.error;
  if (playerResult.error) throw playerResult.error;

  return {
    entries: ((topResult.data ?? []) as LeaderboardRow[]).map(mapRow),
    currentPlayer: playerResult.data
      ? mapRow(playerResult.data as LeaderboardRow)
      : null,
    currentPlayerId,
  };
}
