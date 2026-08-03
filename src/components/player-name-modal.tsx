import { BlurView } from 'expo-blur';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type Props = {
  onSubmit: (playerName: string) => void;
  paper?: boolean;
  visible: boolean;
};

const PLAYER_NAME_PATTERN = /^[A-Za-z0-9_ğüşöçıİĞÜŞÖÇ]{3,16}$/;

export function PlayerNameModal({ onSubmit, paper = false, visible }: Props) {
  const [value, setValue] = useState('');
  const entrance = useRef(new Animated.Value(0)).current;
  const normalizedValue = value.trim();
  const isValid = PLAYER_NAME_PATTERN.test(normalizedValue);

  useEffect(() => {
    if (!visible) {
      entrance.setValue(0);
      return;
    }

    Animated.spring(entrance, {
      toValue: 1,
      damping: 15,
      stiffness: 170,
      mass: 0.72,
      useNativeDriver: true,
    }).start();

    return () => entrance.stopAnimation();
  }, [entrance, visible]);

  function submit() {
    if (isValid) {
      onSubmit(normalizedValue);
    }
  }

  return (
    <Modal
      animationType="fade"
      onRequestClose={() => undefined}
      presentationStyle="overFullScreen"
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <Animated.View
          style={{
            opacity: entrance,
            transform: [
              {
                scale: entrance.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.94, 1],
                }),
              },
              {
                translateY: entrance.interpolate({
                  inputRange: [0, 1],
                  outputRange: [18, 0],
                }),
              },
            ],
          }}
        >
          <BlurView
            intensity={paper ? 82 : 76}
            tint={paper ? 'light' : 'dark'}
            style={[styles.card, paper && styles.cardPaper]}
          >
            <View style={[styles.avatar, paper && styles.avatarPaper]}>
              <Text style={styles.avatarText}>◆</Text>
            </View>

            <Text style={[styles.eyebrow, paper && styles.eyebrowPaper]}>
              OYUNCU PROFİLİ
            </Text>
            <Text style={[styles.title, paper && styles.titlePaper]}>
              Oyundaki adın ne olsun?
            </Text>
            <Text style={[styles.description, paper && styles.descriptionPaper]}>
              Puanların ve gelecekteki genel sıralama kaydın bu adla gösterilecek.
              Giriş yapman gerekmiyor.
            </Text>

            <TextInput
              accessibilityLabel="Oyuncu adı"
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              maxLength={16}
              onChangeText={setValue}
              onSubmitEditing={submit}
              placeholder="oyuncu_adı"
              placeholderTextColor={paper ? '#81746A' : 'rgba(255, 255, 255, 0.62)'}
              returnKeyType="done"
              selectionColor="#D78A2C"
              style={[styles.input, paper && styles.inputPaper]}
              value={value}
            />

            <View style={styles.helperRow}>
              <Text style={[styles.helper, paper && styles.helperPaper]}>
                3–16 karakter · harf, rakam veya _
              </Text>
              <Text style={[styles.counter, paper && styles.helperPaper]}>
                {value.length}/16
              </Text>
            </View>

            <Pressable
              accessibilityLabel="Oyuna Başla"
              accessibilityRole="button"
              disabled={!isValid}
              onPress={submit}
              style={({ pressed }) => [
                styles.button,
                paper && styles.buttonPaper,
                !isValid && styles.buttonDisabled,
                pressed && isValid && styles.buttonPressed,
              ]}
            >
              <View pointerEvents="none" style={styles.buttonLabelContainer}>
                <Text style={[styles.buttonText, paper && styles.buttonTextPaper]}>
                  Oyuna Başla
                </Text>
              </View>
              <View
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                pointerEvents="none"
                style={styles.buttonArrowContainer}
              >
                <Text style={[styles.buttonArrow, paper && styles.buttonTextPaper]}>›</Text>
              </View>
            </Pressable>
          </BlurView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(18, 20, 17, 0.82)',
  },
  card: {
    width: '100%',
    maxWidth: 370,
    overflow: 'hidden',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 28,
    borderRadius: 30,
    borderCurve: 'continuous',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 209, 102, 0.7)',
    backgroundColor: 'rgba(20, 31, 23, 0.98)',
    boxShadow: '0 24px 58px rgba(0, 0, 0, 0.48)',
  },
  cardPaper: {
    borderColor: '#C98225',
    backgroundColor: '#FFF9EF',
    boxShadow: '0 24px 58px rgba(64, 49, 35, 0.34)',
  },
  avatar: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#FFD166',
  },
  avatarPaper: {
    backgroundColor: '#D78A2C',
    boxShadow: '0 8px 20px rgba(166, 104, 31, 0.28)',
  },
  avatarText: {
    color: '#5A3908',
    fontSize: 24,
    fontWeight: '900',
  },
  eyebrow: {
    marginTop: 18,
    color: '#FFD166',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.7,
  },
  eyebrowPaper: {
    color: '#A5681F',
  },
  title: {
    marginTop: 7,
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '900',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  titlePaper: {
    color: '#302A25',
  },
  description: {
    marginTop: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
    textAlign: 'center',
  },
  descriptionPaper: {
    color: '#62574F',
  },
  input: {
    width: '100%',
    height: 54,
    marginTop: 22,
    paddingHorizontal: 16,
    borderRadius: 17,
    borderCurve: 'continuous',
    borderWidth: 2,
    borderColor: 'rgba(255, 209, 102, 0.74)',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  inputPaper: {
    borderColor: '#C97918',
    backgroundColor: '#FFFFFF',
    color: '#302A25',
    boxShadow: 'inset 0 1px 3px rgba(91, 62, 31, 0.1)',
  },
  helperRow: {
    width: '100%',
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  helper: {
    color: 'rgba(255, 255, 255, 0.52)',
    fontSize: 9,
    fontWeight: '700',
  },
  helperPaper: {
    color: '#6F655D',
  },
  counter: {
    color: 'rgba(255, 255, 255, 0.52)',
    fontSize: 9,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  button: {
    width: '100%',
    height: 52,
    marginTop: 20,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    borderCurve: 'continuous',
    backgroundColor: '#FFD166',
  },
  buttonPaper: {
    backgroundColor: '#D78A2C',
  },
  buttonDisabled: {
    opacity: 0.34,
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    color: '#503307',
    fontSize: 15,
    fontWeight: '900',
  },
  buttonTextPaper: {
    color: '#FFFDF8',
  },
  buttonLabelContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonArrowContainer: {
    position: 'absolute',
    right: 18,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  buttonArrow: {
    color: '#503307',
    fontSize: 26,
    lineHeight: 28,
    fontWeight: '700',
  },
});
