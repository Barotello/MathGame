import { BlurView } from 'expo-blur';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';
import { formatMathValue } from '../game/mathValue';
import type { Level } from '../types/game';

type Props = {
  level: Level;
  onReveal: () => void;
  stage: number;
  paper?: boolean;
};

export function StagedHint({ level, onReveal, stage, paper = false }: Props) {
  const solutionCells = level.knownSolution.cellIds.map((cellId) =>
    level.cells.find((cell) => cell.id === cellId),
  );
  const values = solutionCells.map((cell) =>
    cell ? cell.displayValue ?? formatMathValue(cell.value) : '?',
  );
  const hintText = getHintText(level, values, stage);

  return (
    <BlurView
      intensity={paper ? 12 : 30}
      tint={paper ? "light" : "dark"}
      style={[styles.card, paper && styles.cardPaper]}
    >
      <View style={styles.copy}>
        <Text style={[styles.eyebrow, paper && styles.eyebrowPaper]}>
          AŞAMALI İPUCU · {stage}/4
        </Text>
        <Text style={[styles.text, paper && styles.textPaper]}>{hintText}</Text>
      </View>
      {stage < 4 ? (
        <Pressable
          accessibilityLabel="Sonraki ipucunu aç"
          accessibilityRole="button"
          onPress={onReveal}
          style={({ pressed }) => [styles.button, paper && styles.buttonPaper, pressed && styles.buttonPressed]}
        >
          <Text style={[styles.buttonText, paper && styles.buttonTextPaper]}>{stage === 0 ? 'İpucu Aç' : 'Devam'}</Text>
        </Pressable>
      ) : null}
    </BlurView>
  );
}

function getHintText(level: Level, values: Array<string | number>, stage: number) {
  switch (stage) {
    case 1:
      return `Başlangıç hücresi: ${values[0]}.`;
    case 2:
      return `İkinci hücre: ${values[1]}. Yatay veya dikey komşuluğu takip et.`;
    case 3:
      return `İşlem sırası: ${level.knownSolution.operators.join(' → ')}.`;
    case 4:
      return `Tam yol: ${values
        .map((value, index) =>
          index === 0
            ? String(value)
            : `${level.knownSolution.operators[index - 1]} ${value}`,
        )
        .join(' ')}.`;
    default:
      return 'Takıldığında çözümü tek seferde vermeden adım adım yardım alabilirsin.';
  }
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: 420,
    marginTop: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    overflow: 'hidden',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.24)',
    backgroundColor: 'rgba(12, 28, 18, 0.58)',
  },
  cardPaper: {
    borderColor: '#D8D0C8',
    backgroundColor: '#FDFDFB',
    shadowColor: '#4A443F',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 5,
    boxShadow: '0 7px 20px rgba(74, 68, 63, 0.11)',
  },
  textPaper: {
    color: '#8C847E',
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
  eyebrow: {
    color: colors.selected,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.1,
  },
  eyebrowPaper: {
    color: '#416D36',
  },
  text: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  button: {
    minWidth: 72,
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  buttonText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '900',
  },
  buttonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.97 }],
  },
});
