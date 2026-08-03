import { Pressable, StyleSheet, Text, View } from 'react-native';

const KEY_ROWS = [
  Array.from('QWERTYUIOPĞÜ'),
  Array.from('ASDFGHJKLŞİ'),
  Array.from('ZXCVBNMÖÇ'),
];

type Props = {
  backspaceDisabled: boolean;
  disabled: boolean;
  onBackspace: () => void;
  onLetter: (letter: string) => void;
  paper: boolean;
};

export function TurkishKeyboard({
  backspaceDisabled,
  disabled,
  onBackspace,
  onLetter,
  paper,
}: Props) {
  return (
    <View accessibilityLabel="Türkçe harf klavyesi" style={styles.keyboard}>
      {KEY_ROWS.map((row, rowIndex) => (
        <View
          key={rowIndex}
          style={[
            styles.row,
            rowIndex === 1 && styles.middleRow,
            rowIndex === 2 && styles.bottomRow,
          ]}
        >
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
          {rowIndex === KEY_ROWS.length - 1 ? (
            <Pressable
              accessibilityLabel="Son girilen harfi sil"
              accessibilityRole="button"
              disabled={disabled || backspaceDisabled}
              onPress={onBackspace}
              style={({ pressed }) => [
                styles.key,
                styles.deleteKey,
                paper ? styles.deleteKeyPaper : styles.deleteKeyGlass,
                pressed && styles.keyPressed,
                (disabled || backspaceDisabled) && styles.disabled,
              ]}
            >
              <Text
                style={[
                  styles.deleteKeyText,
                  paper ? styles.textPaper : styles.textGlass,
                ]}
              >
                ⌫
              </Text>
              <Text
                style={[
                  styles.deleteKeyLabel,
                  paper ? styles.textPaper : styles.textGlass,
                ]}
              >
                SİL
              </Text>
            </Pressable>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    width: '100%',
    maxWidth: 520,
    marginTop: 12,
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 2,
  },
  middleRow: {
    paddingHorizontal: 6,
  },
  bottomRow: {
    paddingHorizontal: 20,
  },
  key: {
    flex: 1,
    maxWidth: 46,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
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
  deleteKey: {
    flex: 1.45,
    maxWidth: 68,
  },
  deleteKeyPaper: {
    borderColor: '#C9BDB1',
    backgroundColor: '#E9E0D7',
  },
  deleteKeyGlass: {
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(9,24,15,0.72)',
  },
  deleteKeyText: {
    fontSize: 26,
    lineHeight: 27,
    fontWeight: '900',
  },
  deleteKeyLabel: {
    marginTop: 1,
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  keyPressed: {
    opacity: 0.65,
    transform: [{ scale: 0.94 }],
  },
  keyText: {
    fontSize: 17,
    fontWeight: '900',
  },
  textPaper: {
    color: '#493F37',
  },
  textGlass: {
    color: '#FFFFFF',
  },
  disabled: {
    opacity: 0.45,
  },
});
