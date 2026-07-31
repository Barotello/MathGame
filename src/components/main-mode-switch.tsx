import { Pressable, StyleSheet, Text, View } from 'react-native';

export type MainGameMode = 'math' | 'turkish';

type Props = {
  activeMode: MainGameMode;
  onSelectMath: () => void;
  onSelectTurkish: () => void;
  paper?: boolean;
};

export function MainModeSwitch({
  activeMode,
  onSelectMath,
  onSelectTurkish,
  paper = false,
}: Props) {
  return (
    <View
      accessibilityLabel="Ana oyun modu"
      accessibilityRole="tablist"
      style={[styles.container, paper ? styles.containerPaper : styles.containerGlass]}
    >
      <ModeButton
        active={activeMode === 'math'}
        icon="∑"
        label="Matematik"
        onPress={onSelectMath}
        paper={paper}
      />
      <ModeButton
        active={activeMode === 'turkish'}
        icon="ABC"
        label="Türkçe"
        onPress={onSelectTurkish}
        paper={paper}
      />
    </View>
  );
}

type ModeButtonProps = {
  active: boolean;
  icon: string;
  label: string;
  onPress: () => void;
  paper: boolean;
};

function ModeButton({ active, icon, label, onPress, paper }: ModeButtonProps) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      disabled={active}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        active && (paper ? styles.buttonActivePaper : styles.buttonActiveGlass),
        pressed && styles.buttonPressed,
      ]}
    >
      <Text
        style={[
          styles.icon,
          active
            ? paper
              ? styles.textActivePaper
              : styles.textActiveGlass
            : paper
              ? styles.textPaper
              : styles.textGlass,
        ]}
      >
        {icon}
      </Text>
      <Text
        style={[
          styles.label,
          active
            ? paper
              ? styles.textActivePaper
              : styles.textActiveGlass
            : paper
              ? styles.textPaper
              : styles.textGlass,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 430,
    minHeight: 50,
    padding: 4,
    flexDirection: 'row',
    gap: 4,
    borderRadius: 18,
    borderCurve: 'continuous',
    borderWidth: 1,
  },
  containerPaper: {
    borderColor: '#E2D8CE',
    backgroundColor: '#EEE7DF',
  },
  containerGlass: {
    borderColor: 'rgba(255, 255, 255, 0.25)',
    backgroundColor: 'rgba(12, 28, 17, 0.55)',
  },
  button: {
    flex: 1,
    minHeight: 40,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 14,
    borderCurve: 'continuous',
  },
  buttonActivePaper: {
    backgroundColor: '#FFFDFC',
    boxShadow: '0 3px 9px rgba(78, 66, 54, 0.15)',
  },
  buttonActiveGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    boxShadow: '0 3px 12px rgba(0, 0, 0, 0.24)',
  },
  buttonPressed: { opacity: 0.68, transform: [{ scale: 0.98 }] },
  icon: { fontSize: 12, fontWeight: '900' },
  label: { fontSize: 13, fontWeight: '900' },
  textPaper: { color: '#8B8178' },
  textGlass: { color: 'rgba(255, 255, 255, 0.64)' },
  textActivePaper: { color: '#A5681F' },
  textActiveGlass: { color: '#FFFFFF' },
});
