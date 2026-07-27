import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors } from '../theme/colors';
import { formatMathValue } from '../game/mathValue';
import { MathValueLabel } from './math-value-label';
import type {
  MathValue,
  NumberCell as NumberCellModel,
} from '../types/game';

type CellMergeAnimation = {
  key: number;
  role: 'source' | 'target';
  offsetX: number;
  offsetY: number;
};

type Props = {
  cell: NumberCellModel;
  size: number;
  selected: boolean;
  pending: boolean;
  available: boolean;
  won: boolean;
  paper?: boolean;
  activeResult?: boolean;
  displayValue?: MathValue | string;
  merge?: CellMergeAnimation;
  onPress: (cell: NumberCellModel) => void;
  onDragStart: (cell: NumberCellModel) => boolean;
  onDragMove: (cell: NumberCellModel, dx: number, dy: number) => void;
  onDragEnd: () => void;
  onDragCancel: () => void;
};

export function NumberCell(props: Props) {
  const gestureProps = useRef(props);
  const mergeProgress = useRef(new Animated.Value(0)).current;
  gestureProps.current = props;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) + Math.abs(gestureState.dy) > 7,
      onPanResponderGrant: (_, gestureState) => {
        const current = gestureProps.current;

        if (current.onDragStart(current.cell)) {
          current.onDragMove(current.cell, gestureState.dx, gestureState.dy);
        }
      },
      onPanResponderMove: (_, gestureState) => {
        const current = gestureProps.current;
        current.onDragMove(current.cell, gestureState.dx, gestureState.dy);
      },
      onPanResponderRelease: () => gestureProps.current.onDragEnd(),
      onPanResponderTerminate: () => gestureProps.current.onDragCancel(),
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
    }),
  ).current;

  const {
    cell,
    size,
    selected,
    pending,
    available,
    won,
    paper = false,
    activeResult = false,
    displayValue,
    merge,
    onPress,
  } = props;
  const visibleValue = displayValue ?? cell.displayValue ?? cell.value;
  const accessibleValue =
    typeof visibleValue === 'string'
      ? visibleValue
      : formatMathValue(visibleValue);

  useEffect(() => {
    if (!merge) {
      return;
    }

    mergeProgress.stopAnimation();
    mergeProgress.setValue(0);
    Animated.sequence([
      Animated.timing(mergeProgress, {
        toValue: 1,
        duration: 135,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(mergeProgress, {
        toValue: 0,
        damping: 11,
        stiffness: 190,
        mass: 0.62,
        useNativeDriver: true,
      }),
    ]).start();

    return () => mergeProgress.stopAnimation();
  }, [merge?.key, mergeProgress]);

  const mergeStyle = merge
    ? {
        opacity: mergeProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [1, merge.role === 'source' ? 0.62 : 1],
        }),
        transform: [
          {
            translateX: mergeProgress.interpolate({
              inputRange: [0, 1],
              outputRange: [0, merge.offsetX],
            }),
          },
          {
            translateY: mergeProgress.interpolate({
              inputRange: [0, 1],
              outputRange: [0, merge.offsetY],
            }),
          },
          {
            scale: mergeProgress.interpolate({
              inputRange: [0, 1],
              outputRange: [1, merge.role === 'target' ? 1.1 : 0.92],
            }),
          },
        ],
      }
    : undefined;

  return (
    <Animated.View
      style={[styles.cellFrame, { width: size, height: size }, mergeStyle]}
    >
      <Pressable
        {...panResponder.panHandlers}
        accessibilityHint="Dokunabilir veya komşu sayıya doğru sürükleyebilirsin"
        accessibilityLabel={`${accessibleValue} sayısı${activeResult ? ', güncel sonuç' : selected ? ', kullanıldı' : ''}`}
        accessibilityRole="button"
        accessibilityState={{ selected: selected || pending, disabled: !available }}
        disabled={!available && !selected && !pending}
        onPress={() => onPress(cell)}
        testID={cell.id}
        style={({ pressed }) => [
          styles.cell,
          paper && styles.cellPaper,
          available && (paper ? styles.availablePaper : styles.available),
          selected && (paper ? styles.selectedPaper : styles.selected),
          pending && (paper ? styles.pendingPaper : styles.pending),
          activeResult && (paper ? styles.activeResultPaper : styles.activeResult),
          won && selected && styles.won,
          pressed && styles.pressed,
          !available && !selected && !pending && styles.unavailable,
        ]}
      >
        {activeResult ? (
          <Text
            style={[
              styles.resultLabel,
              paper ? styles.resultLabelPaper : styles.resultLabelNature,
            ]}
          >
            GÜNCEL SONUÇ
          </Text>
        ) : null}
        {selected && !activeResult && !pending ? (
          <View
            pointerEvents="none"
            style={[styles.usedBadge, paper && styles.usedBadgePaper]}
          >
            <Text style={[styles.usedBadgeText, paper && styles.usedBadgeTextPaper]}>
              ✓
            </Text>
          </View>
        ) : null}
        <MathValueLabel
          accessible={false}
          style={[
            paper ? styles.valuePaper : styles.value,
            selected && (paper ? styles.selectedTextPaper : styles.selectedText),
            pending && (paper ? styles.pendingTextPaper : styles.pendingText),
            activeResult &&
              (paper ? styles.activeResultTextPaper : styles.activeResultText),
          ]}
          value={visibleValue}
        />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cellFrame: {
    zIndex: 1,
  },
  cell: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.cellBorder,
    backgroundColor: colors.cell,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 4,
  },
  cellPaper: {
    borderWidth: 1,
    borderColor: '#D8D0C8',
    backgroundColor: '#FDFDFB',
    shadowColor: '#4A443F',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.18,
    shadowRadius: 9,
    elevation: 4,
    boxShadow: '0 5px 14px rgba(74, 68, 63, 0.14)',
  },
  availablePaper: {
    borderColor: '#D8D0C8',
    backgroundColor: '#FDFDFB',
  },
  selectedPaper: {
    borderWidth: 1,
    borderColor: '#C9C2BB',
    backgroundColor: '#F2EDE7',
    shadowColor: '#8C847E',
    shadowOpacity: 0.08,
  },
  pendingPaper: {
    borderWidth: 2,
    borderColor: '#4A443F',
    backgroundColor: '#F2EDE7',
  },
  activeResultPaper: {
    borderWidth: 2,
    borderColor: '#5F574F',
    backgroundColor: '#EEE8E1',
    shadowColor: '#4A443F',
    shadowOpacity: 0.28,
  },
  valuePaper: {
    color: '#4A443F',
    fontSize: 28,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  selectedTextPaper: {
    color: '#4A443F',
  },
  pendingTextPaper: {
    color: '#4A443F',
  },
  available: {
    backgroundColor: colors.cellAvailable,
    borderColor: 'rgba(255, 255, 255, 0.58)',
  },
  selected: {
    borderColor: 'rgba(222, 235, 216, 0.58)',
    borderWidth: 1,
    backgroundColor: 'rgba(24, 39, 31, 0.82)',
    shadowColor: '#071108',
    shadowOpacity: 0.16,
  },
  pending: {
    borderColor: colors.pending,
    borderWidth: 2,
    backgroundColor: colors.pendingSoft,
  },
  activeResult: {
    borderWidth: 2,
    borderColor: '#F2DBA8',
    backgroundColor: 'rgba(49, 64, 39, 0.92)',
    shadowColor: '#E7D29D',
    shadowOpacity: 0.38,
  },
  won: {
    borderColor: colors.success,
    backgroundColor: 'rgba(75, 124, 52, 0.58)',
  },
  value: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    textShadowColor: 'rgba(0, 0, 0, 0.42)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  selectedText: {
    color: '#C8D2C4',
  },
  activeResultText: {
    color: '#F4FFD8',
  },
  activeResultTextPaper: {
    color: '#4A443F',
  },
  pendingText: {
    color: '#17301F',
  },
  resultLabel: {
    position: 'absolute',
    top: 6,
    fontSize: 6.2,
    fontWeight: '900',
    letterSpacing: 0.65,
  },
  usedBadge: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(222, 235, 216, 0.54)',
    backgroundColor: 'rgba(8, 19, 14, 0.66)',
  },
  usedBadgePaper: {
    borderColor: '#C9C2BB',
    backgroundColor: '#FDFDFB',
  },
  usedBadgeText: {
    color: '#DDE8D8',
    fontSize: 10,
    fontWeight: '900',
    lineHeight: 12,
  },
  usedBadgeTextPaper: {
    color: '#786F68',
  },
  resultLabelNature: {
    color: '#E8D7AD',
  },
  resultLabelPaper: {
    color: '#786F68',
  },
  pressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.88,
  },
  unavailable: {
    opacity: 0.38,
  },
});
