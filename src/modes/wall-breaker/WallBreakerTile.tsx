import { StyleSheet, Text, View } from 'react-native';

import type { WallTileModel } from './types';

type Props = {
  paper: boolean;
  selected: boolean;
  size: number;
  tile: WallTileModel;
};

export function WallBreakerTile({
  paper,
  selected,
  size,
  tile,
}: Props) {
  return (
    <View
      accessibilityLabel={
        tile.used
          ? 'Kullanılmış kutu, kapalı'
          : tile.value +
            ' sayısı, ' +
            chainLabels[tile.chainClass]
      }
      style={[
        styles.tile,
        paper && styles.tilePaper,
        classStyles[tile.chainClass],
        paper && classPaperStyles[tile.chainClass],
        tile.used && styles.used,
        selected && !tile.used && styles.selected,
        paper && selected && styles.selectedPaper,
        { width: size, height: size },
      ]}
      testID={tile.id}
    >
      {!tile.used ? (
        <View
          pointerEvents="none"
          style={[
            styles.classMark,
            classMarkStyles[tile.chainClass],
            selected && styles.classMarkSelected,
          ]}
        />
      ) : null}
      <Text
        style={[
          styles.value,
          paper && styles.valuePaper,
          tile.value < 0 && styles.negativeValue,
          paper &&
            tile.value < 0 &&
            styles.negativeValuePaper,
          selected && styles.valueSelected,
          tile.used && styles.usedValue,
        ]}
      >
        {tile.used ? '×' : tile.value}
      </Text>
    </View>
  );
}

const chainLabels = {
  stone: 'Taş sınıfı',
  leaf: 'Yaprak sınıfı',
  sand: 'Kum sınıfı',
} as const;

const styles = StyleSheet.create({
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: 13,
    borderWidth: 2,
    backgroundColor: 'rgba(24, 34, 28, 0.96)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 7,
    elevation: 3,
  },
  tilePaper: {
    backgroundColor: '#FDFDFB',
    shadowColor: '#4A443F',
    shadowOpacity: 0.12,
  },
  selected: {
    borderColor: '#D8F29A',
    backgroundColor: '#506B39',
    transform: [{ scale: 0.96 }],
  },
  selectedPaper: {
    borderColor: '#6B7251',
    backgroundColor: '#DDE3CA',
  },
  classMark: {
    position: 'absolute',
    top: 5,
    width: 14,
    height: 4,
    borderRadius: 2,
  },
  classMarkSelected: {
    backgroundColor: '#FFFFFF',
  },
  value: {
    marginTop: 3,
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  valuePaper: {
    color: '#4A443F',
  },
  valueSelected: {
    color: '#FFFFFF',
  },
  negativeValue: {
    color: '#FFB0A5',
  },
  negativeValuePaper: {
    color: '#A83B2E',
  },
  used: {
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(8, 12, 10, 0.66)',
    elevation: 0,
    shadowOpacity: 0,
  },
  usedValue: {
    marginTop: 0,
    color: 'rgba(255, 255, 255, 0.2)',
    fontSize: 17,
  },
});

const classStyles = StyleSheet.create({
  stone: {
    borderColor: '#B8CBD9',
    backgroundColor: '#344954',
  },
  leaf: {
    borderColor: '#CBEF8D',
    backgroundColor: '#3D5A2A',
  },
  sand: {
    borderColor: '#FFD18A',
    backgroundColor: '#6A4B25',
  },
});

const classPaperStyles = StyleSheet.create({
  stone: {
    backgroundColor: '#D9E5EC',
  },
  leaf: {
    backgroundColor: '#E1EDCC',
  },
  sand: {
    backgroundColor: '#F4DFC0',
  },
});

const classMarkStyles = StyleSheet.create({
  stone: {
    backgroundColor: '#AAB4BC',
  },
  leaf: {
    backgroundColor: '#B9DA82',
  },
  sand: {
    backgroundColor: '#F0C681',
  },
});