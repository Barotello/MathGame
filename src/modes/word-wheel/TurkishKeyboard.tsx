import { Pressable, StyleSheet, Text, View } from 'react-native';

const KEY_ROWS = [
  Array.from('ABCÇDEFGĞ'),
  Array.from('HIİJKLMNOÖ'),
  Array.from('PRSŞTUÜVYZ'),
];

type Props = {
  disabled: boolean;
  onBackspace: () => void;
  onLetter: (letter: string) => void;
  paper: boolean;
};

export function TurkishKeyboard({ disabled, onBackspace, onLetter, paper }: Props) {
  return (
    <View accessibilityLabel="Türkçe harf klavyesi" style={styles.keyboard}>
      {KEY_ROWS.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((letter) => (
            <Pressable
              accessibilityLabel={`${letter} harfi`}
              accessibilityRole="button"
              disabled={disabled}
              key={letter}
              onPress={() => onLetter(letter)}
              style={({ pressed }) => [
                styles.key,
                paper ? styles.keyPaper : styles.keyGlass,
                pressed && styles.keyPressed,
                disabled && styles.disabled,
              ]}
            >
              <Text style={[styles.keyText, paper ? styles.textPaper : styles.textGlass]}>
                {letter}
              </Text>
            </Pressable>
          ))}
        </View>
      ))}
      <Pressable
        accessibilityLabel="Son harfi sil"
        accessibilityRole="button"
        disabled={disabled}
        onPress={onBackspace}
        style={({ pressed }) => [
          styles.deleteKey,
          paper ? styles.deletePaper : styles.deleteGlass,
          pressed && styles.keyPressed,
          disabled && styles.disabled,
        ]}
      >
        <Text style={[styles.deleteText, paper ? styles.textPaper : styles.textGlass]}>
          ← SON HARFİ SİL
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    width: '100%',
    maxWidth: 520,
    marginTop: 14,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 3,
  },
  key: {
    flex: 1,
    maxWidth: 48,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    borderWidth: 1,
  },
  keyPaper: {
    borderColor: '#DED5CC',
    backgroundColor: '#FFFFFF',
  },
  keyGlass: {
    borderColor: 'rgba(255,255,255,0.24)',
    backgroundColor: 'rgba(255,255,255,0.13)',
  },
  keyPressed: {
    opacity: 0.65,
    transform: [{ scale: 0.94 }],
  },
  keyText: {
    fontSize: 18,
    fontWeight: '900',
  },
  textPaper: {
    color: '#493F37',
  },
  textGlass: {
    color: '#FFFFFF',
  },
  deleteKey: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    borderWidth: 1,
  },
  deletePaper: {
    borderColor: '#D8CFC5',
    backgroundColor: '#EEE6DD',
  },
  deleteGlass: {
    borderColor: 'rgba(255,255,255,0.22)',
    backgroundColor: 'rgba(9,24,15,0.45)',
  },
  deleteText: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.7,
  },
  disabled: {
    opacity: 0.45,
  },
});
