import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ImageBackground,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { useGameProgress } from '../../hooks/useGameProgress';
import { WallBreakerBoard } from './WallBreakerBoard';
import {
  calculateWallChain,
  canAppendToChain,
} from './wallBreakerEngine';
import {
  closeWallTiles,
  createWallBoard,
  hasAvailableWallChain,
} from './wallBreakerGenerator';
import { OperationSelector } from './OperationSelector';
import { useWallBreakerProgress } from './useWallBreakerProgress';
import { WallScene } from './WallScene';
import type {
  BoardDimensions,
  WallOperation,
  WallTileModel,
} from './types';

const NATURE_BACKGROUND = require('../../../assets/nature-background.png');
const FIRST_WALL_HEALTH = 1_000;

type Props = {
  onBack: () => void;
};

export function WallBreakerScreen({ onBack }: Props) {
  const { width } = useWindowDimensions();
  const dimensions: BoardDimensions =
    width >= 680
      ? { rows: 6, columns: 8 }
      : { rows: 8, columns: 6 };
  const boardWidth = Math.min(width - 24, 430);
  const seedRef = useRef(Date.now());
  const chainRef = useRef<WallTileModel[]>([]);
  const transitionTimer = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const [board, setBoard] = useState(() =>
    createWallBoard(dimensions, seedRef.current),
  );
  const [chain, setChain] = useState<WallTileModel[]>([]);
  const [operation, setOperation] =
    useState<WallOperation>('+');
  const [score, setScore] = useState(0);
  const [wallMaxHealth, setWallMaxHealth] = useState(
    FIRST_WALL_HEALTH,
  );
  const [wallHealth, setWallHealth] = useState(
    FIRST_WALL_HEALTH,
  );
  const [wallsDestroyed, setWallsDestroyed] = useState(0);
  const [impactKey, setImpactKey] = useState(0);
  const [lastPenalty, setLastPenalty] = useState(0);
  const [boardExhausted, setBoardExhausted] =
    useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const { progress: classicProgress } = useGameProgress();
  const { progress, recordRun } = useWallBreakerProgress();
  const paper = classicProgress.settings.themeId === 'paper';
  const preview = useMemo(
    () => calculateWallChain(chain, operation),
    [chain, operation],
  );
  const healthRatio =
    wallMaxHealth === 0 ? 0 : wallHealth / wallMaxHealth;

  useEffect(() => {
    seedRef.current += 1;
    const nextBoard = createWallBoard(
      dimensions,
      seedRef.current,
    );
    setBoard(nextBoard);
    chainRef.current = [];
    setChain([]);
    setBoardExhausted(false);
  }, [dimensions.columns, dimensions.rows]);

  useEffect(
    () => () => {
      if (transitionTimer.current) {
        clearTimeout(transitionTimer.current);
      }
    },
    [],
  );

  function updateChain(next: WallTileModel[]) {
    chainRef.current = next;
    setChain(next);
  }

  function handleChainStart(tile: WallTileModel) {
    if (transitioning || boardExhausted || tile.used) return;
    updateChain([tile]);
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync().catch(() => undefined);
    }
  }

  function handleChainMove(tile: WallTileModel) {
    if (transitioning || boardExhausted) return;

    const current = chainRef.current;
    const last = current[current.length - 1];
    if (last?.id === tile.id) return;

    const previous = current[current.length - 2];
    if (previous?.id === tile.id) {
      updateChain(current.slice(0, -1));
      return;
    }

    if (!canAppendToChain(current, tile)) return;

    updateChain([...current, tile]);
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync().catch(() => undefined);
    }
  }

  function handleChainCancel() {
    updateChain([]);
  }

  function handleChainComplete() {
    const completedChain = chainRef.current;
    if (completedChain.length < 2 || transitioning) {
      updateChain([]);
      return;
    }

    const result = calculateWallChain(
      completedChain,
      operation,
    );
    const nextScore = Math.max(0, score + result.score);
    const nextWallMaxHealth =
      wallMaxHealth + result.penalty;
    const remainingHealth =
      result.penalty > 0
        ? wallHealth + result.penalty
        : Math.max(0, wallHealth - result.damage);
    const destroyed = remainingHealth === 0;
    const nextDestroyed = wallsDestroyed + (destroyed ? 1 : 0);

    setScore(nextScore);
    setLastPenalty(result.penalty);
    if (result.damage > 0) {
      setImpactKey((current) => current + 1);
    }
    if (result.penalty > 0) {
      setWallMaxHealth(nextWallMaxHealth);
    }
    recordRun(nextScore, nextDestroyed);

    const nextBoard = closeWallTiles(
      board,
      completedChain.map((tile) => tile.id),
    );
    const exhausted = !hasAvailableWallChain(nextBoard);

    setBoard(nextBoard);
    updateChain([]);

    if (destroyed) {
      setBoardExhausted(false);
      setWallHealth(0);
      setWallsDestroyed(nextDestroyed);
      setTransitioning(true);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        ).catch(() => undefined);
      }

      transitionTimer.current = setTimeout(() => {
        const nextMaximum = getNextWallHealth(
          wallMaxHealth,
          nextDestroyed,
        );
        setWallMaxHealth(nextMaximum);
        setWallHealth(nextMaximum);
        seedRef.current += 1;
        setBoard(
          createWallBoard(dimensions, seedRef.current),
        );
        setTransitioning(false);
      }, 720);
    } else {
      setWallHealth(remainingHealth);
      setBoardExhausted(exhausted);
      if (Platform.OS !== 'web') {
        if (result.penalty > 0) {
          Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Warning,
          ).catch(() => undefined);
        } else {
          Haptics.impactAsync(
            result.damage > 500
              ? Haptics.ImpactFeedbackStyle.Heavy
              : Haptics.ImpactFeedbackStyle.Medium,
          ).catch(() => undefined);
        }
      }
    }
  }

  function resetRun() {
    if (transitionTimer.current) {
      clearTimeout(transitionTimer.current);
      transitionTimer.current = null;
    }

    seedRef.current += 1;
    setBoard(createWallBoard(dimensions, seedRef.current));
    updateChain([]);
    setScore(0);
    setWallMaxHealth(FIRST_WALL_HEALTH);
    setWallHealth(FIRST_WALL_HEALTH);
    setWallsDestroyed(0);
    setImpactKey(0);
    setLastPenalty(0);
    setBoardExhausted(false);
    setTransitioning(false);
  }

  function leaveMode() {
    recordRun(score, wallsDestroyed);
    onBack();
  }

  return (
    <ImageBackground
      resizeMode="cover"
      source={paper ? undefined : NATURE_BACKGROUND}
      style={[styles.screen, paper && styles.screenPaper]}
    >
      {!paper ? (
        <View pointerEvents="none" style={styles.scrim} />
      ) : null}

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: Platform.OS === 'ios' ? 54 : 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="Klasik oyuna dön"
            accessibilityRole="button"
            onPress={leaveMode}
            style={({ pressed }) => [
              styles.iconButton,
              paper && styles.iconButtonPaper,
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.backIcon,
                paper && styles.textPaper,
              ]}
            >
              ‹
            </Text>
          </Pressable>

          <View style={styles.headerCopy}>
            <Text
              style={[
                styles.eyebrow,
                paper && styles.eyebrowPaper,
              ]}
            >
              EKSTRA MOD · ENDLESS
            </Text>
            <Text
              style={[
                styles.title,
                paper && styles.textPaper,
              ]}
            >
              Duvar Yıkma
            </Text>
          </View>

          <Pressable
            accessibilityLabel="Duvar Yıkma oyununu sıfırla"
            accessibilityRole="button"
            onPress={resetRun}
            style={({ pressed }) => [
              styles.iconButton,
              paper && styles.iconButtonPaper,
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.resetIcon,
                paper && styles.textPaper,
              ]}
            >
              ↻
            </Text>
          </Pressable>
        </View>

        <BlurView
          intensity={paper ? 16 : 48}
          tint={paper ? 'light' : 'dark'}
          style={[
            styles.wallCard,
            paper && styles.panelPaper,
          ]}
        >
          <WallScene
            healthRatio={healthRatio}
            impactKey={impactKey}
            paper={paper}
          />

          <View pointerEvents="none" style={styles.wallHud}>
            <View>
              <Text
                style={[
                  styles.wallLabel,
                  paper && styles.mutedPaper,
                ]}
              >
                DUVAR CANI
              </Text>
              <Text
                style={[
                  styles.wallValue,
                  paper && styles.textPaper,
                ]}
              >
                {wallHealth.toLocaleString('tr-TR')} /{' '}
                {wallMaxHealth.toLocaleString('tr-TR')}
              </Text>
            </View>
            <View style={styles.wallStats}>
              <Text
                style={[
                  styles.wallLabel,
                  paper && styles.mutedPaper,
                ]}
              >
                YIKILAN
              </Text>
              <Text
                style={[
                  styles.destroyedValue,
                  paper && styles.textPaper,
                ]}
              >
                {wallsDestroyed}
              </Text>
            </View>
          </View>

          <View
            pointerEvents="none"
            style={[
              styles.healthTrack,
              paper && styles.healthTrackPaper,
            ]}
          >
            <View
              style={[
                styles.healthFill,
                healthRatio <= 0.3 &&
                  styles.healthFillDanger,
                {
                  width: (Math.max(0, healthRatio * 100) +
                    '%') as `${number}%`,
                },
              ]}
            />
          </View>

          {transitioning ? (
            <View
              pointerEvents="none"
              style={styles.wallDestroyedBadge}
            >
              <Text style={styles.wallDestroyedText}>
                DUVAR YIKILDI!
              </Text>
            </View>
          ) : null}

          {lastPenalty > 0 &&
          !transitioning &&
          !boardExhausted ? (
            <View
              pointerEvents="none"
              style={styles.wallPenaltyBadge}
            >
              <Text style={styles.wallPenaltyText}>
                +{lastPenalty.toLocaleString('tr-TR')} DUVAR GÜCÜ
              </Text>
            </View>
          ) : null}

          {boardExhausted && !transitioning ? (
            <View
              pointerEvents="none"
              style={styles.wallExhaustedBadge}
            >
              <Text style={styles.wallExhaustedText}>
                HAMLE KALMADI
              </Text>
            </View>
          ) : null}
        </BlurView>

        <View style={{ width: boardWidth }}>
          <View style={styles.scoreRow}>
            <View>
              <Text
                style={[
                  styles.metricLabel,
                  paper && styles.mutedPaper,
                ]}
              >
                PUAN
              </Text>
              <Text
                style={[
                  styles.scoreValue,
                  paper && styles.textPaper,
                ]}
              >
                {score.toLocaleString('tr-TR')}
              </Text>
            </View>
            <View style={styles.bestCopy}>
              <Text
                style={[
                  styles.metricLabel,
                  paper && styles.mutedPaper,
                ]}
              >
                EN İYİ
              </Text>
              <Text
                style={[
                  styles.bestValue,
                  paper && styles.textPaper,
                ]}
              >
                {Math.max(
                  progress.bestScore,
                  score,
                ).toLocaleString('tr-TR')}
              </Text>
            </View>
          </View>

          <OperationSelector
            disabled={
              chain.length > 0 ||
              transitioning ||
              boardExhausted
            }
            onChange={setOperation}
            operation={operation}
            paper={paper}
          />
        </View>

        <WallBreakerBoard
          board={board}
          chain={chain}
          dimensions={dimensions}
          disabled={transitioning || boardExhausted}
          onCancel={handleChainCancel}
          onComplete={handleChainComplete}
          onMove={handleChainMove}
          onStart={handleChainStart}
          paper={paper}
          width={boardWidth}
        />

        <BlurView
          intensity={paper ? 12 : 34}
          tint={paper ? 'light' : 'dark'}
          style={[
            styles.previewCard,
            paper && styles.panelPaper,
            { width: boardWidth },
          ]}
        >
          <View style={styles.previewMetric}>
            <Text
              style={[
                styles.metricLabel,
                paper && styles.mutedPaper,
              ]}
            >
              ZİNCİR
            </Text>
            <Text
              style={[
                styles.previewValue,
                paper && styles.textPaper,
              ]}
            >
              {chain.length} KARE
            </Text>
          </View>
          <View style={styles.previewDivider} />
          <View style={styles.previewMetric}>
            <Text
              style={[
                styles.metricLabel,
                paper && styles.mutedPaper,
              ]}
            >
              ÇARPAN
            </Text>
            <Text
              style={[
                styles.previewValue,
                paper && styles.textPaper,
              ]}
            >
              x{preview.multiplier.toFixed(1)}
            </Text>
          </View>
          <View style={styles.previewDivider} />
          <View style={styles.previewMetric}>
            <Text
              style={[
                styles.metricLabel,
                paper && styles.mutedPaper,
              ]}
            >
              {preview.penalty > 0
                ? 'CEZA / PUAN'
                : 'HASAR / PUAN'}
            </Text>
            <Text
              style={[
                styles.previewValue,
                paper && styles.textPaper,
              ]}
            >
              {(preview.penalty || preview.damage).toLocaleString(
                'tr-TR',
              )}{' '}
              / {preview.score.toLocaleString('tr-TR')}
            </Text>
          </View>
        </BlurView>

        <View style={styles.legend}>
          <LegendDot color="#AAB4BC" label="Taş" paper={paper} />
          <LegendDot color="#B9DA82" label="Yaprak" paper={paper} />
          <LegendDot color="#F0C681" label="Kum" paper={paper} />
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

function getNextWallHealth(
  currentMaximum: number,
  destroyed: number,
) {
  if (destroyed === 1) return 2_500;
  if (destroyed === 2) return 5_000;
  return Math.round(currentMaximum * 1.6);
}

type LegendDotProps = {
  color: string;
  label: string;
  paper: boolean;
};

function LegendDot({
  color,
  label,
  paper,
}: LegendDotProps) {
  return (
    <View style={styles.legendItem}>
      <View
        style={[styles.legendDot, { backgroundColor: color }]}
      />
      <Text
        style={[
          styles.legendText,
          paper && styles.mutedPaper,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0B1711',
  },
  screenPaper: {
    backgroundColor: '#F9F6F2',
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(3, 12, 8, 0.62)',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 30,
  },
  header: {
    width: '100%',
    maxWidth: 430,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerCopy: {
    flex: 1,
  },
  eyebrow: {
    color: '#B9DA82',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  eyebrowPaper: {
    color: '#8C847E',
  },
  title: {
    marginTop: 2,
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '900',
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    backgroundColor: 'rgba(17, 31, 22, 0.86)',
  },
  iconButtonPaper: {
    borderColor: '#D8D0C8',
    backgroundColor: '#FDFDFB',
  },
  backIcon: {
    marginTop: -5,
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '400',
  },
  resetIcon: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: '700',
  },
  wallCard: {
    width: '100%',
    maxWidth: 430,
    height: 176,
    marginBottom: 12,
    overflow: 'hidden',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.34)',
    backgroundColor: 'rgba(9, 21, 14, 0.78)',
  },
  panelPaper: {
    borderColor: '#D8D0C8',
    backgroundColor: 'rgba(253, 253, 251, 0.94)',
  },
  wallHud: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  wallStats: {
    alignItems: 'flex-end',
  },
  wallLabel: {
    color: 'rgba(255, 255, 255, 0.58)',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  wallValue: {
    marginTop: 2,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  destroyedValue: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  healthTrack: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 12,
    height: 8,
    overflow: 'hidden',
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  healthTrackPaper: {
    backgroundColor: '#E5E0DA',
  },
  healthFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#B9DA82',
  },
  healthFillDanger: {
    backgroundColor: '#FF8C83',
  },
  wallDestroyedBadge: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 68,
    alignItems: 'center',
  },
  wallDestroyedText: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 14,
    overflow: 'hidden',
    color: '#FFFFFF',
    backgroundColor: '#D06B5D',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.1,
  },
  wallPenaltyBadge: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 68,
    alignItems: 'center',
  },
  wallPenaltyText: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 14,
    overflow: 'hidden',
    color: '#FFF4D2',
    backgroundColor: 'rgba(107, 62, 26, 0.94)',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  wallExhaustedBadge: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 68,
    alignItems: 'center',
  },
  wallExhaustedText: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 14,
    overflow: 'hidden',
    color: '#FFFFFF',
    backgroundColor: 'rgba(135, 47, 39, 0.94)',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },
  scoreRow: {
    marginBottom: 8,
    paddingHorizontal: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  bestCopy: {
    alignItems: 'flex-end',
  },
  metricLabel: {
    color: 'rgba(255, 255, 255, 0.52)',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  scoreValue: {
    marginTop: 1,
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  bestValue: {
    marginTop: 2,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  previewCard: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    backgroundColor: 'rgba(10, 22, 15, 0.82)',
  },
  previewMetric: {
    flex: 1,
    alignItems: 'center',
  },
  previewDivider: {
    width: 1,
    height: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  previewValue: {
    marginTop: 3,
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  legend: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 18,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: 'rgba(255, 255, 255, 0.58)',
    fontSize: 10,
    fontWeight: '700',
  },
  textPaper: {
    color: '#4A443F',
  },
  mutedPaper: {
    color: '#8C847E',
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.97 }],
  },
});