import { BlurView } from 'expo-blur';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

type Props = {
  earnedStars: number;
  onStay: () => void;
  remainingMs: number;
  paper?: boolean;
};

export function AutoAdvanceBanner({ earnedStars, onStay, remainingMs, paper = false }: Props) {
  const progress = Math.max(0, Math.min(100, (remainingMs / 5000) * 100));

  return (
    <BlurView intensity={paper ? 14 : 48} tint={paper ? "light" : "dark"} style={[styles.card, paper && styles.cardPaper]}>
      <View style={styles.copy}>
        <Text style={styles.title}>{'★'.repeat(earnedStars)}{'☆'.repeat(3 - earnedStars)}</Text>
        <Text style={[styles.text, paper && styles.textPaper]}>
          Sonraki bölüm {(remainingMs / 1000).toFixed(1)} sn içinde açılıyor…
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={onStay}
        style={({ pressed }) => [styles.button, paper && styles.buttonPaper, pressed && styles.buttonPressed]}
      >
        <Text style={[styles.buttonText, paper && styles.buttonTextPaper]}>Burada Kal</Text>
      </Pressable>
      <View style={styles.track}>
        <View style={[styles.progress, { width: `${progress}%` }]} />
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: 420,
    marginTop: 12,
    padding: 14,
    paddingBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    overflow: 'hidden',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(191, 239, 98, 0.54)',
    backgroundColor: 'rgba(31, 64, 34, 0.72)',
  },
  cardPaper: {
    borderColor: '#E5E0DA',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  textPaper: {
    color: '#4A443F',
  },
  buttonPaper: {
    borderWidth: 1,
    borderColor: '#E5E0DA',
    backgroundColor: '#F2EDE7',
  },
  buttonTextPaper: {
    color: '#4A443F',
  },
  copy: {
    flex: 1,
  },
  title: {
    color: colors.selected,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
  },
  text: {
    marginTop: 3,
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  buttonText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '900',
  },
  buttonPressed: {
    opacity: 0.74,
  },
  track: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 7,
    height: 3,
    overflow: 'hidden',
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  progress: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: colors.selected,
  },
});