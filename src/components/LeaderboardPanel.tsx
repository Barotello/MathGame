import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { isLeaderboardConfigured } from '../lib/supabase';
import {
  loadLeaderboard,
  type LeaderboardEntry,
} from '../services/leaderboard';
import type { LevelRecord } from '../types/progress';

type Props = {
  levelRecords: Record<number, LevelRecord>;
  paper: boolean;
  playerName?: string;
};

export function LeaderboardPanel({ levelRecords, paper, playerName }: Props) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [currentPlayer, setCurrentPlayer] =
    useState<LeaderboardEntry | null>(null);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isLeaderboardConfigured) {
      setLoading(false);
      setError(
        'Sıralama sunucusu henüz bağlanmadı. Kurulum adımları README dosyasında.',
      );
      return;
    }

    if (!playerName) {
      setLoading(false);
      setError('Sıralamaya katılmak için önce oyuncu adını belirle.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await loadLeaderboard(playerName, levelRecords);
      setEntries(result.entries);
      setCurrentPlayer(result.currentPlayer);
      setCurrentPlayerId(result.currentPlayerId);
    } catch (loadError) {
      console.warn('Genel sıralama yüklenemedi.', loadError);
      setError(
        'Sıralama şu anda yüklenemiyor. Bağlantını kontrol edip tekrar dene.',
      );
    } finally {
      setLoading(false);
    }
  }, [levelRecords, playerName]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (loading) {
    return (
      <View style={styles.stateBox}>
        <ActivityIndicator
          color={paper ? '#A5681F' : '#FFD166'}
          size="large"
        />
        <Text style={[styles.stateText, paper && styles.mutedPaper]}>
          Sıralama yükleniyor…
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.errorBox, paper && styles.errorBoxPaper]}>
        <Text style={styles.errorIcon}>🏆</Text>
        <Text style={[styles.errorText, paper && styles.textPaper]}>
          {error}
        </Text>
        {isLeaderboardConfigured ? (
          <Pressable
            accessibilityRole="button"
            onPress={refresh}
            style={({ pressed }) => [
              styles.retryButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.retryText}>Tekrar Dene</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  const currentPlayerInTop = entries.some(
    (entry) => entry.playerId === currentPlayerId,
  );

  return (
    <View>
      <Text style={[styles.description, paper && styles.mutedPaper]}>
        En iyi bölüm puanlarının toplamı · İlk 50 oyuncu
      </Text>

      <View style={styles.podiumRow}>
        {entries.slice(0, 3).map((entry, index) => (
          <View
            key={entry.playerId}
            style={[
              styles.podiumCard,
              paper && styles.podiumCardPaper,
              index === 0 && styles.podiumWinner,
            ]}
          >
            <Text style={styles.medal}>{['🥇', '🥈', '🥉'][index]}</Text>
            <Text
              numberOfLines={1}
              style={[styles.podiumName, paper && styles.textPaper]}
            >
              {entry.playerName}
            </Text>
            <Text
              style={[styles.podiumScore, paper && styles.scorePaper]}
            >
              {entry.totalScore.toLocaleString('tr-TR')}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.list}>
        {entries.map((entry) => (
          <LeaderboardRow
            entry={entry}
            isCurrent={entry.playerId === currentPlayerId}
            key={entry.playerId}
            paper={paper}
          />
        ))}
      </View>

      {!currentPlayerInTop && currentPlayer ? (
        <View style={styles.currentPlayerSection}>
          <Text
            style={[styles.currentPlayerLabel, paper && styles.mutedPaper]}
          >
            SENİN SIRAN
          </Text>
          <LeaderboardRow entry={currentPlayer} isCurrent paper={paper} />
        </View>
      ) : null}

      {entries.length === 0 ? (
        <Text style={[styles.emptyText, paper && styles.mutedPaper]}>
          İlk puanı sen kazan ve zirveye yerleş!
        </Text>
      ) : null}
    </View>
  );
}

function LeaderboardRow({
  entry,
  isCurrent,
  paper,
}: {
  entry: LeaderboardEntry;
  isCurrent: boolean;
  paper: boolean;
}) {
  return (
    <View
      accessibilityLabel={entry.rank + '. sıra, ' + entry.playerName + ', ' + entry.totalScore + ' puan'}
      style={[
        styles.row,
        paper && styles.rowPaper,
        isCurrent && styles.rowCurrent,
        isCurrent && paper && styles.rowCurrentPaper,
      ]}
    >
      <Text style={[styles.rank, paper && styles.textPaper]}>
        #{entry.rank}
      </Text>
      <View style={styles.playerCopy}>
        <Text
          numberOfLines={1}
          style={[styles.playerName, paper && styles.textPaper]}
        >
          {entry.playerName}
          {isCurrent ? '  ·  SEN' : ''}
        </Text>
        <Text style={[styles.levelCount, paper && styles.mutedPaper]}>
          {entry.levelsCompleted} bölüm tamamlandı
        </Text>
      </View>
      <Text style={[styles.score, paper && styles.scorePaper]}>
        {entry.totalScore.toLocaleString('tr-TR')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  description: {
    color: 'rgba(255,255,255,0.66)',
    fontSize: 11,
    fontWeight: '600',
  },
  stateBox: {
    minHeight: 260,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  stateText: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 13,
    fontWeight: '700',
  },
  errorBox: {
    minHeight: 250,
    padding: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  errorBoxPaper: { backgroundColor: 'rgba(255,255,255,0.48)' },
  errorIcon: { fontSize: 38 },
  errorText: {
    marginTop: 12,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 14,
    backgroundColor: '#D78A2C',
  },
  retryText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
  podiumRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 7,
  },
  podiumCard: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 7,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  podiumCardPaper: {
    borderColor: '#DED4C9',
    backgroundColor: 'rgba(255,253,249,0.8)',
  },
  podiumWinner: { paddingTop: 17, borderColor: '#E5A33B' },
  medal: { fontSize: 24 },
  podiumName: {
    width: '100%',
    marginTop: 7,
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'center',
  },
  podiumScore: {
    marginTop: 4,
    color: '#FFD166',
    fontSize: 11,
    fontWeight: '900',
  },
  list: { marginTop: 14, gap: 7 },
  row: {
    minHeight: 58,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.13)',
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  rowPaper: {
    borderColor: '#E2D8CE',
    backgroundColor: 'rgba(255,253,249,0.72)',
  },
  rowCurrent: {
    borderColor: '#FFD166',
    backgroundColor: 'rgba(181,120,24,0.23)',
  },
  rowCurrentPaper: {
    borderColor: '#D78A2C',
    backgroundColor: '#FFF0D2',
  },
  rank: { width: 36, color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  playerCopy: { flex: 1, minWidth: 0 },
  playerName: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  levelCount: {
    marginTop: 2,
    color: 'rgba(255,255,255,0.57)',
    fontSize: 9,
    fontWeight: '600',
  },
  score: {
    color: '#FFD166',
    fontSize: 12,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  scorePaper: { color: '#A5681F' },
  currentPlayerSection: { marginTop: 18 },
  currentPlayerLabel: {
    marginBottom: 7,
    color: 'rgba(255,255,255,0.6)',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  emptyText: {
    paddingVertical: 50,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  textPaper: { color: '#4A443F' },
  mutedPaper: { color: '#8C847E' },
});
