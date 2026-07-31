import { BlurView } from 'expo-blur';
import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  failureReason: 'constraint' | 'dead-end' | 'timeout' | null;
  onRetry: () => void;
  onUndoTwoMoves: () => void;
  onUseHint: () => void;
  canUndoMoves: boolean;
  paper?: boolean;
};

export function FailCard({
  failureReason,
  onRetry,
  onUndoTwoMoves,
  onUseHint,
  canUndoMoves,
  paper = false,
}: Props) {
  const entrance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(entrance, {
      toValue: 1,
      damping: 14,
      stiffness: 160,
      mass: 0.68,
      useNativeDriver: true,
    }).start();

    return () => entrance.stopAnimation();
  }, [entrance]);

  const title =
    failureReason === 'timeout'
      ? 'Süre doldu'
      : failureReason === 'constraint'
        ? 'Hamle sınırı doldu'
        : 'Çıkış yolu kalmadı';

  const explanation =
    failureReason === 'timeout'
      ? 'Süre bitmeden hedef sayıyı bulamadın.'
      : failureReason === 'constraint'
        ? 'Bölümdeki hamle kuralına tam uymadın.'
        : 'Son seçtiğin sayının etrafındaki tüm hücreler kullanılmış.';

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
        accessibilityRole="alert"
        intensity={paper ? 26 : 58}
        tint={paper ? 'light' : 'dark'}
        style={[styles.card, paper && styles.cardPaper]}
      >
        <View style={styles.header}>
          <View style={[styles.iconContainer, paper && styles.iconContainerPaper]}>
            <Text style={styles.iconText}>✕</Text>
          </View>
          <View style={styles.headerCopy}>
            <Text style={[styles.eyebrow, paper && styles.eyebrowPaper]}>
              BÖLÜM BAŞARISIZ
            </Text>
            <Text style={[styles.title, paper && styles.titlePaper]}>{title}</Text>
          </View>
        </View>

        <Text style={[styles.explanation, paper && styles.explanationPaper]}>
          {explanation}
        </Text>

        <View style={styles.actionContainer}>
          {canUndoMoves ? (
            <Pressable
              accessibilityRole="button"
              onPress={onUndoTwoMoves}
              style={({ pressed }) => [
                styles.undoButton,
                paper && styles.undoButtonPaper,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={[styles.undoButtonText, paper && styles.undoButtonTextPaper]}>
                ↺ Son 2 Hamleyi Geri Al
              </Text>
            </Pressable>
          ) : null}

          <View style={styles.secondaryRow}>
            <Pressable
              accessibilityRole="button"
              onPress={onUseHint}
              style={({ pressed }) => [
                styles.secondaryButton,
                paper && styles.secondaryButtonPaper,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={[styles.secondaryButtonText, paper && styles.secondaryButtonTextPaper]}>
                💡 İpucu Gör
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={onRetry}
              style={({ pressed }) => [
                styles.retryButton,
                paper && styles.retryButtonPaper,
                pressed && styles.buttonPressed,
              ]}
            >
              <View style={styles.retryButtonContent}>
                <Text style={styles.retryIcon}>↻</Text>
                <Text style={styles.retryButtonText}>Yeniden Dene</Text>
              </View>
            </Pressable>
          </View>
        </View>
      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    maxWidth: 370,
    marginTop: 16,
  },
  card: {
    overflow: 'hidden',
    padding: 18,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255, 110, 110, 0.45)',
    backgroundColor: 'rgba(48, 16, 16, 0.94)',
    shadowColor: '#120404',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.42,
    shadowRadius: 28,
    elevation: 14,
  },
  cardPaper: {
    borderColor: '#E2B8B8',
    backgroundColor: 'rgba(253, 246, 246, 0.98)',
    shadowColor: '#4A3F3F',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 90, 90, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 140, 0.6)',
  },
  iconContainerPaper: {
    backgroundColor: '#F5DCD C',
    borderColor: '#E8B6B6',
  },
  iconText: {
    color: '#FF7B7B',
    fontSize: 20,
    fontWeight: '900',
  },
  headerCopy: {
    flex: 1,
  },
  eyebrow: {
    color: '#FF8A8A',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  eyebrowPaper: {
    color: '#C05555',
  },
  title: {
    marginTop: 2,
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  titlePaper: {
    color: '#4A3434',
  },
  explanation: {
    marginTop: 12,
    color: 'rgba(255, 255, 255, 0.82)',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  explanationPaper: {
    color: '#634F4F',
  },
  actionContainer: {
    marginTop: 16,
    gap: 10,
  },
  undoButton: {
    width: '100%',
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  undoButtonPaper: {
    backgroundColor: '#EBE2DC',
    borderColor: '#D8CDC5',
  },
  undoButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  undoButtonTextPaper: {
    color: '#4A443F',
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  secondaryButtonPaper: {
    backgroundColor: '#FAF5F0',
    borderColor: '#E5DCD4',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  secondaryButtonTextPaper: {
    color: '#5E554E',
  },
  retryButton: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B6B',
  },
  retryButtonPaper: {
    backgroundColor: '#C84B4B',
  },
  retryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  retryIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 18,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.985 }],
  },
});
