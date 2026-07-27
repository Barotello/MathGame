import { Pressable, StyleSheet, Text, View } from 'react-native';

import { paperColors, themeOptions, type ThemeId } from '../theme/themes';

type Props = {
  onSelect: (themeId: ThemeId) => void;
  themeId: ThemeId;
};

const options: ThemeId[] = ['paper', 'nature'];

export function ThemePicker({ onSelect, themeId }: Props) {
  const paper = themeId === 'paper';

  return (
    <View style={styles.list}>
      <Text style={[styles.intro, paper && styles.introPaper]}>
        Görünümünü seç. İlerlemen ve oyun kuralları değişmez.
      </Text>

      {options.map((optionId) => {
        const option = themeOptions[optionId];
        const selected = optionId === themeId;

        return (
          <Pressable
            accessibilityLabel={`${option.name} teması${selected ? ', seçili' : ''}`}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            key={optionId}
            onPress={() => onSelect(optionId)}
            style={({ pressed }) => [
              styles.card,
              paper && styles.cardPaper,
              selected && styles.cardSelected,
              selected && paper && styles.cardSelectedPaper,
              pressed && styles.cardPressed,
            ]}
          >
            <ThemePreview themeId={optionId} />
            <View style={styles.copy}>
              <Text style={[styles.name, paper && styles.namePaper]}>{option.name}</Text>
              <Text style={[styles.description, paper && styles.descriptionPaper]}>
                {option.description}
              </Text>
            </View>
            <View style={[styles.check, selected && styles.checkSelected, selected && paper && styles.checkSelectedPaper]}>
              <Text style={styles.checkText}>{selected ? '✓' : ''}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function ThemePreview({ themeId }: { themeId: ThemeId }) {
  if (themeId === 'paper') {
    return (
      <View style={[styles.preview, styles.paperPreview]}>
        <View style={styles.paperPanel} />
        <View style={styles.paperLine} />
        <View style={styles.paperDot} />
      </View>
    );
  }

  return (
    <View style={[styles.preview, styles.naturePreview]}>
      <View style={styles.natureGlow} />
      <View style={styles.natureHill} />
      <View style={styles.natureGlass} />
    </View>
  );
}

const styles = StyleSheet.create({
  list: { marginTop: 18, gap: 12 },
  intro: { marginBottom: 2, color: 'rgba(255, 255, 255, 0.7)', fontSize: 13, lineHeight: 18 },
  introPaper: { color: paperColors.textMuted },
  card: {
    minHeight: 92, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardPaper: { borderColor: paperColors.border, backgroundColor: paperColors.panelSolid },
  cardSelected: { borderWidth: 2, borderColor: '#007AFF' },
  cardSelectedPaper: { borderColor: '#8C847E' },
  cardPressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
  preview: { width: 70, height: 64, overflow: 'hidden', borderRadius: 15 },
  naturePreview: { backgroundColor: '#526343' },
  natureGlow: {
    position: 'absolute', width: 54, height: 54, right: -12, top: -18,
    borderRadius: 27, backgroundColor: '#D4D9B2',
  },
  natureHill: {
    position: 'absolute', left: -10, right: -10, bottom: -20, height: 54,
    borderRadius: 28, backgroundColor: '#263D2B', transform: [{ rotate: '-7deg' }],
  },
  natureGlass: {
    position: 'absolute', left: 15, right: 15, top: 14, bottom: 12,
    borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.75)',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  paperPreview: {
    backgroundColor: paperColors.background, borderWidth: 1, borderColor: paperColors.border,
  },
  paperPanel: {
    position: 'absolute', left: 10, right: 10, top: 10, bottom: 10, borderRadius: 9,
    backgroundColor: paperColors.panelSolid, borderWidth: 1, borderColor: paperColors.border,
  },
  paperLine: {
    position: 'absolute', left: 19, right: 19, top: 22, height: 4,
    borderRadius: 2, backgroundColor: paperColors.textMuted,
  },
  paperDot: {
    position: 'absolute', width: 13, height: 13, left: 28, bottom: 17,
    borderRadius: 7, backgroundColor: paperColors.border,
  },
  copy: { flex: 1 },
  name: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  namePaper: { color: paperColors.text },
  description: { marginTop: 4, color: 'rgba(255, 255, 255, 0.66)', fontSize: 11, lineHeight: 15 },
  descriptionPaper: { color: paperColors.textMuted },
  check: {
    width: 24, height: 24, alignItems: 'center', justifyContent: 'center', borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(120, 120, 128, 0.35)',
  },
  checkSelected: { borderColor: '#007AFF', backgroundColor: '#007AFF' },
  checkSelectedPaper: { borderColor: '#8C847E', backgroundColor: '#8C847E' },
  checkText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
});
