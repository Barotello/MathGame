import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  ImageBackground,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useGameProgress } from '../../hooks/useGameProgress';
import { LetterSlot } from './LetterSlot';
import { TurkishKeyboard } from './TurkishKeyboard';
import { threeLetterWords } from './data/threeLetterWords';
import { useWordWheelProgress } from './useWordWheelProgress';
import {
  applyPenalty,
  BASE_ROUND_SCORE,
  getMaxReveals,
  getRevealCost,
  getWordLetters,
  isCorrectGuess,
  revealRandomIndex,
  validateWordEntries,
  WRONG_GUESS_PENALTY,
} from './wordWheelEngine';
import { selectNextWord } from './wordSelection';

const GLASS_BACKGROUND = require('../../../assets/nature-background.png');
const REVEAL_DURATION_MS = 850;

type Props = {
  onBack: () => void;
};

export function WordWheelScreen({ onBack }: Props) {
  const { progress, recordSolved } = useWordWheelProgress();
  const { progress: gameProgress, updateSettings } = useGameProgress();
  const paper = gameProgress.settings.themeId === 'paper';
  const [word, setWord] = useState(
    () => selectNextWord(threeLetterWords, []) ?? threeLetterWords[0],
  );
  const [revealedIndexes, setRevealedIndexes] = useState<number[]>([]);
  const [guess, setGuess] = useState('');
  const [status, setStatus] =
    useState<'playing' | 'revealing' | 'solved'>('playing');
  const [roundScore, setRoundScore] = useState(BASE_ROUND_SCORE);
  const [wrongGuessCount, setWrongGuessCount] = useState(0);
  const [message, setMessage] = useState('Açıklamayı oku ve kelimeyi bul.');
  const shake = useRef(new Animated.Value(0)).current;
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const letters = useMemo(() => getWordLetters(word.answer), [word.answer]);
  const maxReveals = getMaxReveals(letters.length);
  const isBusy = status !== 'playing';

  useEffect(() => {
    const problems = validateWordEntries(threeLetterWords);
    if (problems.length > 0) {
      console.warn('Kelime verisi sorunları:', problems.join(', '));
    }
  }, []);

  useEffect(
    () => () => {
      if (revealTimer.current) clearTimeout(revealTimer.current);
    },
    [],
  );

  function runWrongGuessAnimation() {
    Animated.sequence([
      Animated.timing(shake, { duration: 55, toValue: -9, useNativeDriver: true }),
      Animated.timing(shake, { duration: 70, toValue: 9, useNativeDriver: true }),
      Animated.timing(shake, { duration: 70, toValue: -6, useNativeDriver: true }),
      Animated.timing(shake, { duration: 55, toValue: 0, useNativeDriver: true }),
    ]).start();
  }

  function handleReveal() {
    if (status !== 'playing' || revealedIndexes.length >= maxReveals) return;
    const nextIndex = revealRandomIndex(word.answer, revealedIndexes);
    if (nextIndex === null) return;

    setStatus('revealing');
    setMessage('Kutular dönüyor…');
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync().catch(() => undefined);
    }

    revealTimer.current = setTimeout(() => {
      setRevealedIndexes((current) =>
        [...current, nextIndex].sort((first, second) => first - second),
      );
      setRoundScore((current) =>
        applyPenalty(current, getRevealCost(revealedIndexes.length)),
      );
      setStatus('playing');
      setMessage(`${nextIndex + 1}. harf açıldı. Şimdi kelimeyi tahmin et!`);
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
          () => undefined,
        );
      }
    }, REVEAL_DURATION_MS);
  }

  function handleLetter(letter: string) {
    if (status !== 'playing' || Array.from(guess).length >= letters.length) return;
    setGuess((current) => current + letter);
    setMessage('Tahminini tamamlayıp gönder.');
  }

  function handleSubmit() {
    if (status !== 'playing') return;
    if (getWordLetters(guess).length !== letters.length) {
      setMessage(`${letters.length} harfli bir tahmin yazmalısın.`);
      return;
    }

    if (isCorrectGuess(guess, word.answer)) {
      setStatus('solved');
      setMessage('Harika! Kelimeyi buldun.');
      recordSolved(word.id, roundScore);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        ).catch(() => undefined);
      }
      return;
    }

    setWrongGuessCount((current) => current + 1);
    setRoundScore((current) => applyPenalty(current, WRONG_GUESS_PENALTY));
    setGuess('');
    setMessage('Bu olmadı. Açıklamayı yeniden düşün!');
    runWrongGuessAnimation();
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Error,
      ).catch(() => undefined);
    }
  }

  function startNextWord() {
    const nextWord = selectNextWord(
      threeLetterWords,
      [word.id, ...progress.recentWordIds],
      word.id,
    );
    if (!nextWord) return;

    setWord(nextWord);
    setRevealedIndexes([]);
    setGuess('');
    setStatus('playing');
    setRoundScore(BASE_ROUND_SCORE);
    setWrongGuessCount(0);
    setMessage('Açıklamayı oku ve kelimeyi bul.');
  }

  const screen = (
    <SafeAreaView
      style={[
        styles.safeArea,
        paper ? styles.paperBackground : styles.glassBackground,
      ]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="Kelime Çarkından çık"
            accessibilityRole="button"
            onPress={onBack}
            style={[
              styles.headerButton,
              paper ? styles.headerButtonPaper : styles.headerButtonGlass,
            ]}
          >
            <Text style={[styles.backText, paper ? styles.textPaper : styles.textGlass]}>
              ‹
            </Text>
          </Pressable>

          <View style={styles.headerTitleWrap}>
            <Text
              style={[
                styles.eyebrow,
                paper ? styles.accentPaper : styles.accentGlass,
              ]}
            >
              TÜRKÇE KELİME MODU
            </Text>
            <Text style={[styles.title, paper ? styles.textPaper : styles.textGlass]}>
              Kelime Çarkı
            </Text>
          </View>

          <Pressable
            accessibilityLabel={paper ? 'Cam temasına geç' : 'Kâğıt temasına geç'}
            accessibilityRole="button"
            onPress={() =>
              updateSettings({ themeId: paper ? 'nature' : 'paper' })
            }
            style={[
              styles.themeButton,
              paper ? styles.headerButtonPaper : styles.headerButtonGlass,
            ]}
          >
            <Text
              style={[
                styles.themeButtonText,
                paper ? styles.textPaper : styles.textGlass,
              ]}
            >
              {paper ? 'CAM' : 'KÂĞIT'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.scoreRow}>
          <ScorePill label="TUR PUANI" paper={paper} value={roundScore} />
          <ScorePill label="ÇÖZÜLEN" paper={paper} value={progress.totalSolved} />
        </View>

        <View style={[styles.clueCard, paper ? styles.cardPaper : styles.cardGlass]}>
          <Text
            style={[
              styles.category,
              paper ? styles.accentPaper : styles.accentGlass,
            ]}
          >
            {word.category.toLocaleUpperCase('tr-TR')}
          </Text>
          <Text style={[styles.clue, paper ? styles.textPaper : styles.textGlass]}>
            {word.clue}
          </Text>
        </View>

        <Animated.View
          style={[styles.slots, { transform: [{ translateX: shake }] }]}
        >
          {letters.map((letter, index) => (
            <LetterSlot
              index={index}
              key={`${word.id}-${index}`}
              paper={paper}
              revealedLetter={
                revealedIndexes.includes(index) || status === 'solved'
                  ? letter
                  : null
              }
              spinning={
                status === 'revealing' && !revealedIndexes.includes(index)
              }
            />
          ))}
        </Animated.View>

        <Text
          style={[
            styles.revealInfo,
            paper ? styles.mutedPaper : styles.mutedGlass,
          ]}
        >
          Harf hakkı: {Math.max(0, maxReveals - revealedIndexes.length)} · Yanlış
          tahmin: {wrongGuessCount}
        </Text>

        {status === 'solved' ? (
          <View
            style={[
              styles.successCard,
              paper ? styles.successPaper : styles.successGlass,
            ]}
          >
            <Text
              style={[
                styles.successTitle,
                paper ? styles.textPaper : styles.textGlass,
              ]}
            >
              Bildin: {word.answer}
            </Text>
            <Text
              style={[
                styles.successText,
                paper ? styles.mutedPaper : styles.mutedGlass,
              ]}
            >
              Bu turdan {roundScore} puan kazandın.
            </Text>
            <PrimaryButton label="SONRAKİ KELİME" onPress={startNextWord} />
          </View>
        ) : (
          <>
            <Pressable
              accessibilityHint="Rastgele bir doğru harfi kendi yerinde gösterir"
              accessibilityRole="button"
              disabled={
                status === 'revealing' || revealedIndexes.length >= maxReveals
              }
              onPress={handleReveal}
              style={({ pressed }) => [
                styles.revealButton,
                paper ? styles.revealButtonPaper : styles.revealButtonGlass,
                pressed && styles.pressed,
                (status === 'revealing' ||
                  revealedIndexes.length >= maxReveals) &&
                  styles.disabled,
              ]}
            >
              <Text
                style={[
                  styles.revealButtonText,
                  paper ? styles.textPaper : styles.textGlass,
                ]}
              >
                {status === 'revealing'
                  ? 'DÖNÜYOR…'
                  : revealedIndexes.length >= maxReveals
                    ? 'HARF HAKKI BİTTİ'
                    : `HARF AÇ  −${getRevealCost(revealedIndexes.length)}`}
              </Text>
            </Pressable>

            <View
              style={[
                styles.guessBox,
                paper ? styles.guessPaper : styles.guessGlass,
              ]}
            >
              <Text
                style={[
                  styles.guessLabel,
                  paper ? styles.mutedPaper : styles.mutedGlass,
                ]}
              >
                TAHMİNİN
              </Text>
              <Text
                style={[
                  styles.guessText,
                  paper ? styles.textPaper : styles.textGlass,
                ]}
              >
                {guess.padEnd(letters.length, '•').split('').join('  ')}
              </Text>
            </View>

            <TurkishKeyboard
              disabled={isBusy}
              onBackspace={() =>
                setGuess((current) => Array.from(current).slice(0, -1).join(''))
              }
              onLetter={handleLetter}
              paper={paper}
            />
            <PrimaryButton
              disabled={isBusy}
              label="TAHMİN ET"
              onPress={handleSubmit}
            />
          </>
        )}

        <Text
          accessibilityLiveRegion="polite"
          style={[
            styles.message,
            paper ? styles.mutedPaper : styles.mutedGlass,
          ]}
        >
          {message}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );

  if (paper) return screen;

  return (
    <ImageBackground source={GLASS_BACKGROUND} style={styles.imageBackground}>
      <View style={styles.glassOverlay} />
      {screen}
    </ImageBackground>
  );
}

type ScorePillProps = {
  label: string;
  paper: boolean;
  value: number;
};

function ScorePill({ label, paper, value }: ScorePillProps) {
  return (
    <View style={[styles.scorePill, paper ? styles.pillPaper : styles.pillGlass]}>
      <Text
        style={[
          styles.scoreLabel,
          paper ? styles.mutedPaper : styles.mutedGlass,
        ]}
      >
        {label}
      </Text>
      <Text style={[styles.scoreValue, paper ? styles.textPaper : styles.textGlass]}>
        {value}
      </Text>
    </View>
  );
}

type PrimaryButtonProps = {
  disabled?: boolean;
  label: string;
  onPress: () => void;
};

function PrimaryButton({
  disabled = false,
  label,
  onPress,
}: PrimaryButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryButton,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  imageBackground: { flex: 1 },
  glassOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(5,18,10,0.42)',
  },
  safeArea: { flex: 1 },
  paperBackground: { backgroundColor: '#F8F3ED' },
  glassBackground: { backgroundColor: 'transparent' },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 34,
  },
  header: {
    width: '100%',
    maxWidth: 430,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
  },
  headerButtonPaper: {
    borderColor: '#DED5CC',
    backgroundColor: '#FFFDFC',
  },
  headerButtonGlass: {
    borderColor: 'rgba(255,255,255,0.24)',
    backgroundColor: 'rgba(13,34,21,0.62)',
  },
  backText: { marginTop: -4, fontSize: 32, fontWeight: '500' },
  headerTitleWrap: { flex: 1, alignItems: 'center' },
  eyebrow: { fontSize: 9, fontWeight: '900', letterSpacing: 1.3 },
  title: { marginTop: 2, fontSize: 24, fontWeight: '900' },
  themeButton: {
    minWidth: 58,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 7,
  },
  themeButtonText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  scoreRow: {
    width: '100%',
    maxWidth: 430,
    marginTop: 18,
    flexDirection: 'row',
    gap: 10,
  },
  scorePill: {
    flex: 1,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
  },
  pillPaper: { borderColor: '#E3DAD1', backgroundColor: '#FDFBF8' },
  pillGlass: {
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(13,34,21,0.55)',
  },
  scoreLabel: { fontSize: 8, fontWeight: '900', letterSpacing: 1.1 },
  scoreValue: { marginTop: 2, fontSize: 20, fontWeight: '900' },
  clueCard: {
    width: '100%',
    maxWidth: 430,
    minHeight: 126,
    marginTop: 14,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
    borderRadius: 24,
    borderWidth: 1,
  },
  cardPaper: { borderColor: '#DED5CC', backgroundColor: '#FFFDFC' },
  cardGlass: {
    borderColor: 'rgba(255,255,255,0.28)',
    backgroundColor: 'rgba(13,34,21,0.7)',
  },
  category: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  clue: {
    marginTop: 9,
    textAlign: 'center',
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '800',
  },
  slots: {
    marginTop: 22,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  revealInfo: { marginTop: 13, fontSize: 12, fontWeight: '700' },
  revealButton: {
    width: '100%',
    maxWidth: 300,
    minHeight: 48,
    marginTop: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
  },
  revealButtonPaper: {
    borderColor: '#CDBCA9',
    backgroundColor: '#EDE0D1',
  },
  revealButtonGlass: {
    borderColor: 'rgba(203,234,155,0.5)',
    backgroundColor: 'rgba(82,107,57,0.78)',
  },
  revealButtonText: { fontSize: 13, fontWeight: '900', letterSpacing: 0.8 },
  guessBox: {
    width: '100%',
    maxWidth: 300,
    minHeight: 68,
    marginTop: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
  },
  guessPaper: { borderColor: '#E3DAD1', backgroundColor: '#FFFEFC' },
  guessGlass: {
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(8,24,14,0.48)',
  },
  guessLabel: { fontSize: 8, fontWeight: '900', letterSpacing: 1.1 },
  guessText: {
    marginTop: 5,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 3,
  },
  primaryButton: {
    width: '100%',
    maxWidth: 430,
    minHeight: 52,
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#71543F',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.9,
  },
  successCard: {
    width: '100%',
    maxWidth: 430,
    marginTop: 18,
    alignItems: 'center',
    padding: 22,
    borderRadius: 22,
    borderWidth: 1,
  },
  successPaper: { borderColor: '#CDBCA9', backgroundColor: '#F3E7D7' },
  successGlass: {
    borderColor: 'rgba(203,234,155,0.5)',
    backgroundColor: 'rgba(60,91,44,0.75)',
  },
  successTitle: { fontSize: 23, fontWeight: '900' },
  successText: { marginTop: 6, fontSize: 13, fontWeight: '700' },
  message: {
    marginTop: 13,
    minHeight: 20,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
  },
  textPaper: { color: '#493F37' },
  textGlass: { color: '#FFFFFF' },
  mutedPaper: { color: '#8F8175' },
  mutedGlass: { color: 'rgba(255,255,255,0.7)' },
  accentPaper: { color: '#9C7658' },
  accentGlass: { color: '#CBEA9B' },
  pressed: { opacity: 0.76, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.45 },
});
