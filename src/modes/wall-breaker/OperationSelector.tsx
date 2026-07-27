import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { WallOperation } from './types';

type Props = {
  disabled: boolean;
  onChange: (operation: WallOperation) => void;
  operation: WallOperation;
  paper: boolean;
};

export function OperationSelector({
  disabled,
  onChange,
  operation,
  paper,
}: Props) {
  return (
    <View style={[styles.track, paper && styles.trackPaper]}>
      <OperationButton
        active={operation === '+'}
        disabled={disabled}
        label="+  TOPLAMA"
        onPress={() => onChange('+')}
        paper={paper}
      />
      <OperationButton
        active={operation === '×'}
        disabled={disabled}
        label="×  ÇARPMA"
        onPress={() => onChange('×')}
        paper={paper}
      />
    </View>
  );
}

type ButtonProps = {
  active: boolean;
  disabled: boolean;
  label: string;
  onPress: () => void;
  paper: boolean;
};

function OperationButton({
  active,
  disabled,
  label,
  onPress,
  paper,
}: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        paper && styles.buttonPaper,
        active && styles.buttonActive,
        paper && active && styles.buttonActivePaper,
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.label,
          paper && styles.labelPaper,
          active && styles.labelActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    padding: 4,
    gap: 4,
    borderRadius: 17,
    backgroundColor: 'rgba(8, 18, 13, 0.86)',
  },
  trackPaper: {
    backgroundColor: '#E5E0DA',
  },
  button: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 13,
  },
  buttonPaper: {
    backgroundColor: 'transparent',
  },
  buttonActive: {
    backgroundColor: '#D6AE74',
    shadowColor: '#D6AE74',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 9,
    elevation: 4,
  },
  buttonActivePaper: {
    backgroundColor: '#4A443F',
    shadowColor: '#4A443F',
  },
  label: {
    color: 'rgba(255, 255, 255, 0.62)',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  labelPaper: {
    color: '#8C847E',
  },
  labelActive: {
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },
});