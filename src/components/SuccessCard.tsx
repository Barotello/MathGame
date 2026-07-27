import { BlurView } from 'expo-blur';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors } from '../theme/colors';
import type { CompletionSummary } from '../types/progress';

type Props = {
  autoAdvanceRemainingMs: number | null;
  canGoNext: boolean;
  nextLabel?: string;
  onNext: () => void;
  onReplay?: () => void;
  onStay: () => void;
  paper?: boolean;
  parPathLength: number;
  pathLength: number;
  summary: CompletionSummary;
};

const MATH_FACTS = [
  'Biliyor muydunuz? 2, asal sayılar arasındaki tek çift sayıdır.',
  'Biliyor muydunuz? 1’den 10’a kadar tüm sayılara tam bölünebilen en küçük sayı 2520’dir.',
  'Biliyor muydunuz? Euler sayısı (e), doğadaki organik büyümenin temel sabitidir.',
  'Biliyor muydunuz? Bir dairenin çevresinin çapına oranı her zaman Pi (π) sabitini verir.',
  'Biliyor muydunuz? 0 (sıfır), hem çift olan hem de ne pozitif ne negatif olan tek sayıdır.',
  'Biliyor muydunuz? Fibonacci dizisindeki sayılar büyüdükçe oranları Altın Oran’a yaklaşır.',
];

export function SuccessCard({
  autoAdvanceRemainingMs,
  canGoNext,
  nextLabel,
  onNext,
  onReplay,
  onStay,
  paper = false,
  parPathLength,
  pathLength,
  summary,
}: Props) {
  const entrance = useRef(new Animated.Value(0)).current;
  const star1Scale = useRef(new Animated.Value(0)).current;
  const star2Scale = useRef(new Animated.Value(0)).current;
  const star3Scale = useRef(new Animated.Value(0)).current;

  const [displayRemainingMs, setDisplayRemainingMs] = useState(
    autoAdvanceRemainingMs ?? 0,
  );

  const funFact = useRef(
    MATH_FACTS[Math.floor(Math.random() * MATH_FACTS.length)],
  ).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(entrance, {
        toValue: 1,
        damping: 14,
        stiffness: 160,
        mass: 0.68,
        useNativeDriver: true,
      }),
      Animated.stagger(160, [
        Animated.spring(star1Scale, { toValue: 1, friction: 4, useNativeDriver: true }),
        Animated.spring(star2Scale, { toValue: 1, friction: 4, useNativeDriver: true }),
        Animated.spring(star3Scale, { toValue: 1, friction: 4, useNativeDriver: true }),
      ]),
    ]).start();

    return () => entrance.stopAnimation();
  }, [entrance, star1Scale, star2Scale, star3Scale]);

  useEffect(() => {
    if (autoAdvanceRemainingMs === null) {
      setDisplayRemainingMs(0);
      return;
    }

    const duration = autoAdvanceRemainingMs;
    const startedAt = Date.now();
    const updateCountdown = () => {
      setDisplayRemainingMs(
        Math.max(0, duration - (Date.now() - startedAt)),
      );
    };

    setDisplayRemainingMs(duration);
    const frameTimer = setInterval(updateCountdown, 16);

    return () => clearInterval(frameTimer);
  }, [autoAdvanceRemainingMs]);

  const starScales = [star1Scale, star2Scale, star3Scale];

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          opacity: entrance,
          transform: [
            {
              scale: entrance.interpolate({
                inputRange: [0, 1],
                outputRange: [0.94, 1],
              }),
            },
            {
              translateY: entrance.interpolate({
                inputRange: [0, 1],
                outputRange: [16, 0],
              }),
            },
          ],
        },
      ]}
    >
      <BlurView
        accessibilityLabel={`Bölüm tamamlandı. ${summary.stars} yıldız, ${summary.score} puan.`}
        accessibilityRole="alert"
        intensity={paper ? 22 : 58}
        tint={paper ? 'light' : 'dark'}
        style={[styles.card, paper && styles.cardPaper]}
      >
        <View style={[styles.glow, paper && styles.glowPaper]} />

        {summary.isNewHighScore ? (
          <View style={[styles.newRecordBadge, paper && styles.newRecordBadgePaper]}>
            <Text style={styles.newRecordText}>🎉 YENİ REKOR!</Text>
          </View>
        ) : null}

        <View style={styles.header}>
          <View style={[styles.check, paper && styles.checkPaper]}>
            <Text style={[styles.checkText, paper && styles.checkTextPaper]}>✓</Text>
          </View>
          <View style={styles.headerCopy}>
            <Text style={[styles.eyebrow, paper && styles.eyebrowPaper]}>
              BÖLÜM TAMAMLANDI
            </Text>
            <Text style={[styles.title, paper && styles.titlePaper]}>
              Hedef bulundu!
            </Text>
          </View>

          <View style={styles.starRow}>
            {[1, 2, 3].map((starIndex) => {
              const active = starIndex <= summary.stars;
              return (
                <Animated.Text
                  key={starIndex}
                  style={[
                    styles.starIcon,
                    paper && styles.starsPaper,
                    !active && styles.starEmpty,
                    { transform: [{ scale: starScales[starIndex - 1] }] },
                  ]}
                >
                  {active ? '★' : '☆'}
                </Animated.Text>
              );
            })}
          </View>
        </View>

        <View style={[styles.scoreStrip, paper && styles.scoreStripPaper]}>
          <View>
            <Text style={[styles.scoreLabel, paper && styles.mutedPaper]}>
              TOPLAM PUAN
            </Text>
            <Text style={[styles.score, paper && styles.scorePaper]}>
              {summary.score.toLocaleString('tr-TR')}
            </Text>
          </View>
          <View style={styles.metrics}>
            <Metric label="SÜRE" paper={paper} value={`${summary.elapsedSeconds} sn`} />
            <View style={[styles.divider, paper && styles.dividerPaper]} />
            <Metric label="HIZ" paper={paper} value={`+${summary.speedBonus}`} />
            <View style={[styles.divider, paper && styles.dividerPaper]} />
            <Metric label="HAMLE" paper={paper} value={`${pathLength}/${parPathLength}`} />
          </View>
        </View>

        <View style={[styles.bonusRow, paper && styles.bonusRowPaper]}>
          <Text style={[styles.bonusText, paper && styles.bonusTextPaper]}>
            Verimlilik +{summary.efficiencyBonus}
          </Text>
          <Text style={[styles.bonusDot, paper && styles.mutedPaper]}>•</Text>
          <Text style={[styles.bonusText, paper && styles.bonusTextPaper]}>
            İpucusuz +{summary.hintBonus}
          </Text>
        </View>

        <View style={[styles.factCard, paper && styles.factCardPaper]}>
          <Text style={[styles.factText, paper && styles.factTextPaper]}>
            💡 {funFact}
          </Text>
        </View>

        <View style={styles.actionButtonGroup}>
          {summary.stars < 3 && onReplay ? (
            <Pressable
              accessibilityRole="button"
              onPress={onReplay}
              style={({ pressed }) => [
                styles.replayButton,
                paper && styles.replayButtonPaper,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={[styles.replayText, paper && styles.replayTextPaper]}>
                🔄 3 Yıldız İçin Tekrar Oyna
              </Text>
            </Pressable>
          ) : null}

          <Pressable
            accessibilityRole="button"
            disabled={!canGoNext}
            onPress={onNext}
            style={({ pressed }) => [
              styles.button,
              paper && styles.buttonPaper,
              !canGoNext && styles.buttonDisabled,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={[styles.buttonText, paper && styles.buttonTextPaper]}>
              {nextLabel ?? (canGoNext ? 'Sonraki Bölüm' : 'Tüm Bölümler Tamam')}
            </Text>
            {canGoNext && !nextLabel ? (
              <Text style={[styles.buttonArrow, paper && styles.buttonTextPaper]}>›</Text>
            ) : null}
          </Pressable>
        </View>
      </BlurView>
    </Animated.View>
  );
}

type MetricProps = {
  label: string;
  paper: boolean;
  value: string;
};

function Metric({ label, paper, value }: MetricProps) {
  return (
    <View style={styles.metric}>
      <Text style={[styles.metricLabel, paper && styles.mutedPaper]}>{label}</Text>
      <Text style={[styles.metricValue, paper && styles.metricValuePaper]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    maxWidth: 370,
  },
  card: {
    overflow: 'hidden',
    padding: 16,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(209, 243, 132, 0.68)',
    backgroundColor: 'rgba(28, 56, 31, 0.94)',
    shadowColor: '#071108',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.42,
    shadowRadius: 28,
    elevation: 14,
  },
  cardPaper: {
    borderColor: '#CFC3B6',
    backgroundColor: 'rgba(253, 253, 251, 0.98)',
    shadowColor: '#4A443F',
    shadowOpacity: 0.26,
  },
  newRecordBadge: {
    alignSelf: 'center',
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 215, 0, 0.25)',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  newRecordBadgePaper: {
    backgroundColor: '#FFF4CE',
    borderColor: '#D4AF37',
  },
  newRecordText: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  glow: {
    position: 'absolute',
    top: -92,
    left: 68,
    width: 220,
    height: 140,
    borderRadius: 110,
    backgroundColor: 'rgba(191, 239, 98, 0.17)',
  },
  glowPaper: {
    backgroundColor: 'rgba(160, 125, 78, 0.11)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  check: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(234, 255, 191, 0.75)',
    backgroundColor: 'rgba(191, 239, 98, 0.22)',
  },
  checkPaper: {
    borderColor: '#CDBFAF',
    backgroundColor: '#EEE6DC',
  },
  checkText: {
    color: '#E9FFB7',
    fontSize: 22,
    fontWeight: '900',
  },
  checkTextPaper: {
    color: '#6B5F54',
  },
  headerCopy: {
    flex: 1,
  },
  eyebrow: {
    color: colors.selected,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.45,
  },
  eyebrowPaper: {
    color: '#8C6E4A',
  },
  title: {
    marginTop: 2,
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  titlePaper: {
    color: '#4A443F',
  },
  starRow: {
    flexDirection: 'row',
    gap: 3,
  },
  starIcon: {
    color: '#D8F79A',
    fontSize: 18,
    fontWeight: '900',
  },
  starEmpty: {
    opacity: 0.3,
  },
  starsPaper: {
    color: '#A07D4E',
  },
  scoreStrip: {
    marginTop: 13,
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 13,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    backgroundColor: 'rgba(255, 255, 255, 0.09)',
  },
  scoreStripPaper: {
    borderColor: '#E5E0DA',
    backgroundColor: '#F5F0EA',
  },
  scoreLabel: {
    color: 'rgba(255, 255, 255, 0.58)',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  score: {
    marginTop: 1,
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  scorePaper: {
    color: '#4A443F',
  },
  metrics: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  metric: {
    minWidth: 48,
    alignItems: 'center',
  },
  metricLabel: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  metricValue: {
    marginTop: 3,
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  metricValuePaper: {
    color: '#4A443F',
  },
  divider: {
    width: 1,
    height: 27,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  dividerPaper: {
    backgroundColor: '#DDD5CC',
  },
  bonusRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 11,
    backgroundColor: 'rgba(191, 239, 98, 0.1)',
  },
  bonusRowPaper: {
    backgroundColor: '#F2EDE7',
  },
  bonusText: {
    color: '#DDF6A9',
    fontSize: 9,
    fontWeight: '800',
  },
  bonusTextPaper: {
    color: '#6F6255',
  },
  bonusDot: {
    color: 'rgba(255, 255, 255, 0.42)',
  },
  mutedPaper: {
    color: '#8C847E',
  },
  factCard: {
    marginTop: 10,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  factCardPaper: {
    backgroundColor: '#F5F0EA',
  },
  factText: {
    color: 'rgba(255, 255, 255, 0.78)',
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 14,
  },
  factTextPaper: {
    color: '#6F6255',
  },
  countdownRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  countdownCopy: {
    flex: 1,
  },
  countdownText: {
    color: 'rgba(255, 255, 255, 0.68)',
    fontSize: 9,
    fontWeight: '800',
  },
  countdownTextPaper: {
    color: '#786F68',
  },
  track: {
    height: 3,
    marginTop: 5,
    overflow: 'hidden',
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  trackPaper: {
    backgroundColor: '#E5E0DA',
  },
  progress: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: colors.selected,
  },
  progressPaper: {
    backgroundColor: '#8C6E4A',
  },
  stayButton: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  stayButtonPaper: {
    borderWidth: 1,
    borderColor: '#E5E0DA',
    backgroundColor: '#F2EDE7',
  },
  stayText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  stayTextPaper: {
    color: '#5E554E',
  },
  actionButtonGroup: {
    marginTop: 11,
    gap: 8,
  },
  replayButton: {
    width: '100%',
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  replayButtonPaper: {
    backgroundColor: '#EAE3DC',
    borderColor: '#D8CDC5',
  },
  replayText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  replayTextPaper: {
    color: '#4A443F',
  },
  primaryActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  shareButton: {
    height: 48,
    paddingHorizontal: 14,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  shareButtonPaper: {
    backgroundColor: '#EBE2DC',
  },
  shareText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  button: {
    flex: 1,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: '#F0FFD2',
  },
  buttonPaper: {
    backgroundColor: '#6C6259',
  },
  buttonText: {
    color: '#1E321F',
    fontSize: 13,
    fontWeight: '900',
  },
  buttonTextPaper: {
    color: '#FFFFFF',
  },
  buttonArrow: {
    position: 'absolute',
    right: 14,
    color: '#1E321F',
    fontSize: 22,
    fontWeight: '500',
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.985 }],
  },
});