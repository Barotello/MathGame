import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { formatMathValue } from '../game/mathValue';
import type { FractionValue, MathValue } from '../types/game';

type Props = {
  accessible?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<TextStyle>;
  value: MathValue | string;
};

function isFractionValue(value: MathValue | string): value is FractionValue {
  return typeof value === 'object';
}

export function MathValueLabel({
  accessible = true,
  containerStyle,
  style,
  value,
}: Props) {
  if (!isFractionValue(value)) {
    return <Text style={style}>{String(value)}</Text>;
  }

  const flattenedStyle = StyleSheet.flatten(style) ?? {};
  const baseFontSize =
    typeof flattenedStyle.fontSize === 'number' ? flattenedStyle.fontSize : 16;
  const partFontSize = Math.max(11, Math.round(baseFontSize * 0.58));
  const partLineHeight = Math.ceil(partFontSize * 1.05);
  const widestPartLength = Math.max(
    String(value.numerator).length,
    String(value.denominator).length,
  );
  const fractionWidth = Math.max(
    Math.round(baseFontSize * 0.78),
    Math.round(widestPartLength * partFontSize * 0.72),
  );

  return (
    <View
      accessibilityLabel={accessible ? formatMathValue(value) : undefined}
      accessible={accessible}
      style={[
        styles.fraction,
        {
          minWidth: fractionWidth,
        },
        containerStyle,
      ]}
    >
      <Text
        style={[
          style,
          styles.fractionPart,
          { fontSize: partFontSize, lineHeight: partLineHeight },
        ]}
      >
        {value.numerator}
      </Text>
      <View
        style={[
          styles.fractionBar,
          {
            backgroundColor: flattenedStyle.color,
            width: fractionWidth,
          },
        ]}
      />
      <Text
        style={[
          style,
          styles.fractionPart,
          { fontSize: partFontSize, lineHeight: partLineHeight },
        ]}
      >
        {value.denominator}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fraction: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fractionPart: {
    marginTop: 0,
    textAlign: 'center',
  },
  fractionBar: {
    height: 1.5,
    borderRadius: 1,
  },
});
