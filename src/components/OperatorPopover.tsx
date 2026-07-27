import { Pressable, StyleSheet, View } from 'react-native';

import { isOperatorAvailable } from '../game/engine';
import type {
  BoardPoint,
  OperatorArcLayout,
  OperatorPlacement,
} from '../game/gesture';
import type { LevelRules, MathValue, Operator } from '../types/game';

type Props = {
  currentValue: MathValue;
  operand: MathValue;
  allowedOperators: Operator[];
  rules: LevelRules;
  layout: OperatorArcLayout;
  activeOperator: Operator | null;
  onSelect: (operator: Operator) => void;
  pointerPosition: BoardPoint | null;
  paper?: boolean;
};

type OperatorButtonProps = {
  placement: OperatorPlacement;
  size: number;
  active: boolean;
  enabled: boolean;
  onSelect: (operator: Operator) => void;
  paper: boolean;
};

export function OperatorPopover({
  currentValue,
  operand,
  allowedOperators,
  rules,
  layout,
  activeOperator,
  onSelect,
  pointerPosition,
  paper = false,
}: Props) {
  const shellLeft = layout.center.x - layout.radius - layout.buttonSize / 2;
  const shellTop = layout.center.y - layout.radius - layout.buttonSize / 2;

  return (
    <View
      accessibilityLabel="İşlem seçimi"
      pointerEvents="box-none"
      style={styles.overlay}
    >
      <View
        pointerEvents="none"
        style={[
          styles.crescentClip,
          {
            left: shellLeft,
            top: shellTop,
            width: layout.radius * 2 + layout.buttonSize,
            height: layout.radius + layout.buttonSize / 2,
          },
        ]}
      >
        <View
          style={[
            styles.crescentRing,
            paper && styles.crescentRingPaper,
            {
              left: layout.buttonSize / 2,
              top: layout.buttonSize / 2,
              width: layout.radius * 2,
              height: layout.radius * 2,
              borderRadius: layout.radius,
            },
          ]}
        />
        <View
          style={[
            styles.crescentHighlight,
            paper && styles.crescentHighlightPaper,
            {
              left: layout.buttonSize / 2 + 4,
              top: layout.buttonSize / 2 + 4,
              width: layout.radius * 2 - 8,
              height: layout.radius * 2 - 8,
              borderRadius: layout.radius - 4,
            },
          ]}
        />
      </View>
      {layout.placements.map((placement) => {
        const enabled =
          allowedOperators.includes(placement.operator) &&
          isOperatorAvailable(
            currentValue,
            placement.operator,
            operand,
            rules,
          );
        return (
          <OperatorButton
            active={activeOperator === placement.operator}
            enabled={enabled}
            key={placement.operator}
            onSelect={onSelect}
            paper={paper}
            placement={placement}
            size={layout.buttonSize}
          />
        );
      })}
    </View>
  );
}

function OperatorButton({
  placement,
  size,
  active,
  enabled,
  onSelect,
  paper,
}: OperatorButtonProps) {
  return (
    <View
      style={[
        styles.operatorPosition,
        {
          left: placement.left,
          top: placement.top,
          width: size,
          height: size,
          borderRadius: 22,
          opacity: enabled ? 1 : 0.72,
          zIndex: active ? 120 : 100,
          transform: [{ scale: active ? 1.08 : 1 }],
        },
      ]}
    >
      <Pressable
        accessibilityLabel={operatorLabel[placement.operator]}
        accessibilityRole="button"
        accessibilityState={{ disabled: !enabled, selected: active }}
        disabled={!enabled}
        onPress={() => onSelect(placement.operator)}
        style={({ pressed }) => [
          styles.operatorSurface,
          paper && styles.operatorSurfacePaper,
          active && styles.operatorSurfaceActive,
          paper && active && styles.operatorSurfaceActivePaper,
          !enabled && styles.operatorSurfaceDisabled,
          pressed && enabled && styles.operatorSurfacePressed,
        ]}
      >

        <OperatorGlyph
          active={active}
          enabled={enabled}
          operator={placement.operator}
          paper={paper}
        />

      </Pressable>
    </View>
  );
}

function OperatorGlyph({
  operator,
  active,
  enabled,
  paper,
}: {
  operator: Operator;
  active: boolean;
  enabled: boolean;
  paper: boolean;
}) {
  const markStyle = [
    styles.glyphMark,
    paper && styles.glyphMarkPaper,
    active && styles.glyphMarkActive,
    paper && active && styles.glyphMarkActivePaper,
    !enabled && styles.glyphMarkDisabled,
  ];

  return (
    <View style={styles.glyphFrame}>
      {operator !== '×' ? (
        <View style={[styles.glyphHorizontal, markStyle]} />
      ) : null}
      {operator === '+' ? (
        <View style={[styles.glyphVertical, markStyle]} />
      ) : null}
      {operator === '×' ? (
        <>
          <View style={[styles.glyphDiagonal, markStyle]} />
          <View style={[styles.glyphDiagonalReverse, markStyle]} />
        </>
      ) : null}
      {operator === '÷' ? (
        <>
          <View style={[styles.glyphDot, styles.glyphDotTop, markStyle]} />
          <View style={[styles.glyphDot, styles.glyphDotBottom, markStyle]} />
        </>
      ) : null}
    </View>
  );
}

const operatorLabel: Record<Operator, string> = {
  '+': 'Toplama',
  '−': 'Çıkarma',
  '×': 'Çarpma',
  '÷': 'Bölme',
};


const styles = StyleSheet.create({
  glyphFrame: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyphMark: {
    backgroundColor: '#F7FAF3',
  },
  glyphMarkPaper: {
    backgroundColor: '#4A443F',
  },
  glyphMarkActive: {
    backgroundColor: '#191D19',
  },
  glyphMarkActivePaper: {
    backgroundColor: '#FDFDFB',
  },
  glyphMarkDisabled: {
    backgroundColor: '#655F59',
  },
  glyphHorizontal: {
    position: 'absolute',
    width: 22,
    height: 4,
    borderRadius: 2,
  },
  glyphVertical: {
    position: 'absolute',
    width: 4,
    height: 22,
    borderRadius: 2,
  },
  glyphDiagonal: {
    position: 'absolute',
    width: 4,
    height: 24,
    borderRadius: 2,
    transform: [{ rotate: '45deg' }],
  },
  glyphDiagonalReverse: {
    position: 'absolute',
    width: 4,
    height: 24,
    borderRadius: 2,
    transform: [{ rotate: '-45deg' }],
  },
  glyphDot: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  glyphDotTop: {
    top: 4,
  },
  glyphDotBottom: {
    bottom: 4,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 999,
    elevation: 999,
  },
  crescentClip: {
    position: 'absolute',
    overflow: 'hidden',
  },
  crescentRing: {
    position: 'absolute',
    borderWidth: 0,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
    shadowColor: '#071108',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  crescentHighlight: {
    position: 'absolute',
    opacity: 0,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.52)',
    backgroundColor: 'transparent',
  },
  operatorPosition: {
    position: 'absolute',
    shadowColor: '#071108',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.48,
    shadowRadius: 12,
    elevation: 100,
  },
  operatorSurface: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'rgba(223, 255, 134, 0.68)',
    backgroundColor: '#14241B',
  },
  crescentRingPaper: {
    borderColor: '#D8D0C8',
    shadowColor: '#8C847E',
  },
  crescentHighlightPaper: {
    borderColor: '#F2EDE7',
  },
  operatorSurfacePaper: {
    borderColor: '#8C847E',
    backgroundColor: '#F2EDE7',
  },
  operatorSurfaceActive: {
    borderWidth: 2,
    borderColor: '#F4FFD8',
    backgroundColor: '#DFFF86',
  },
  operatorSurfaceActivePaper: {
    borderColor: '#4A443F',
    backgroundColor: '#4A443F',
  },
  operatorSurfaceDisabled: {
    borderColor: '#A39D95',
    backgroundColor: '#D0CBC4',
  },
  operatorSurfacePressed: {
    opacity: 0.84,
  },

  operatorText: {
    color: '#F7FAF3',
    fontSize: 36,
    fontWeight: '900',
    lineHeight: 40,
  },
  operatorTextPaper: {
    color: '#4A443F',
  },
  operatorTextActive: {
    color: '#191D19',
  },
  operatorTextActivePaper: {
    color: '#FDFDFB',
  },
  operatorTextDisabled: {
    color: '#655F59',
    textShadowColor: 'transparent',
  },
});
