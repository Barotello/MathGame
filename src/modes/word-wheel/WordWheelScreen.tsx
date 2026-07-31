import * as Haptics from 'expo-haptics';
import { type AudioPlayer, useAudioPlayer } from 'expo-audio';
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
  useWindowDimensions,
  View,
} from 'react-native';

import { useGameProgress } from '../../hooks/useGameProgress';
import { MainModeSwitch } from '../../components/main-mode-switch';
import { LetterSlot } from './LetterSlot';
import { TurkishKeyboard } from './TurkishKeyboard';
import { wordBank } from './data/wordBank';
import { useWordWheelProgress } from './useWordWheelProgress';
import {
  applyPenalty,
  getBaseRoundScore,
  getMaxReveals,
  getRevealCost,
  getWordLetters,
  isCorrectGuess,
  revealRandomIndex,
  SESSION_DURATION_SECONDS,
  validateWordEntries,
} from './wordWheelEngine';
import { getWordLengthForLevel, selectNextWord } from './wordSelection';
import { SUCCESS_SOUND, WRONG_SOUND } from './word-wheel-sounds';
import type { WordRoundStatus } from './types';

const GLASS_BACKGROUND = require('../../../assets/nature-background.png');
const REVEAL_DURATION_MS = 850;
const LETTER_CHECK_DELAY_MS = 900;

type Props = {
  onBack: () => void;
  onOpenSettings: () => void;
};

export function WordWheelScreen({ onBack, onOpenSettings }: Props) {
  const { hydrated, progress, recordSolved } = useWordWheelProgress();
  const { progress: gameProgress } = useGameProgress();
  const { width: screenWidth } = useWindowDimensions();
  const successSound = useAudioPlayer(SUCCESS_SOUND);
  const wrongSound = useAudioPlayer(WRONG_SOUND);
  const paper = gameProgress.settings.themeId === 'paper';
  const [word, setWord] = useState(
    () => selectNextWord(wordBank, [], undefined, 3) ?? wordBank[0],
  );
  const [revealedIndexes, setRevealedIndexes] = useState<number[]>([]);
  const [enteredLetters, setEnteredLetters] = useState<(string | null)[]>([]);
  const [status, setStatus] = useState<WordRoundStatus>('playing');
  const [roundScore, setRoundScore] = useState(() =>
    getBaseRoundScore(getWordLetters(word.answer).length),
  );
  const [secondsRemaining, setSecondsRemaining] = useState(
    SESSION_DURATION_SECONDS,
  );
  const [sessionSolved, setSessionSolved] = useState(0);
  const [sessionFailed, setSessionFailed] = useState(0);
  const [sessionScore, setSessionScore] = useState(0);
  const [sessionFinished, setSessionFinished] = useState(false);
  const [message, setMessage] = useState(
    'Açıklamayı oku, harfleri sırayla seç.',
  );
  const shake = useRef(new Animated.Value(0)).current;
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const evaluationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionDeadline = useRef<number | null>(null);
  const hydratedWord = useRef(false);

  const letters = useMemo(() => getWordLetters(word.answer), [word.answer]);
  const maxReveals = getMaxReveals(letters.length);
  const isBusy = status !== 'playing' || sessionFinished;
  const slotGap = letters.length >= 6 ? 6 : 10;
  const slotAreaWidth = Math.min(430, Math.max(180, screenWidth - 36));
  const slotSize = Math.min(
    78,
    Math.floor((slotAreaWidth - slotGap * (letters.length - 1)) / letters.length),
  );
  const displayedLevel =
    status === 'solved'
      ? Math.max(1, progress.totalSolved)
      : progress.totalSolved + 1;
  const formattedTime = `${Math.floor(secondsRemaining / 60)}:${String(
    secondsRemaining % 60,
  ).padStart(2, '0')}`;

  useEffect(() => {
    const problems = validateWordEntries(wordBank);
    if (wordBank.length !== 500) {
      problems.unshift(`kelime bankası ${wordBank.length} kayıt içeriyor`);
    }
    if (problems.length > 0) {
      console.warn('Kelime verisi sorunları:', problems.join(', '));
    }
  }, []);

  useEffect(() => {
    if (!hydrated || hydratedWord.current) return;
    hydratedWord.current = true;
    const targetLength = getWordLengthForLevel(progress.totalSolved + 1);
    const firstWord =
      selectNextWord(wordBank, progress.recentWordIds, undefined, targetLength) ??
      wordBank[0];
    setWord(firstWord);
    setEnteredLetters(
      new Array(getWordLetters(firstWord.answer).length).fill(null),
    );
    setRoundScore(getBaseRoundScore(getWordLetters(firstWord.answer).length));
  }, [hydrated, progress.recentWordIds, progress.totalSolved]);

  useEffect(() => {
    if (!hydrated || sessionFinished) return;

    if (sessionDeadline.current === null) {
      sessionDeadline.current = Date.now() + SESSION_DURATION_SECONDS * 1000;
    }

    const updateTimer = () => {
      const remaining = Math.max(
        0,
        Math.ceil(((sessionDeadline.current ?? Date.now()) - Date.now()) / 1000),
      );
      setSecondsRemaining(remaining);

      if (remaining > 0) return;

      if (revealTimer.current) clearTimeout(revealTimer.current);
      if (evaluationTimer.current) clearTimeout(evaluationTimer.current);
      revealTimer.current = null;
      evaluationTimer.current = null;
      setSessionFinished(true);
      setStatus('finished');
      setMessage('');
    };

    updateTimer();
    const timer = setInterval(updateTimer, 250);
    return () => clearInterval(timer);
  }, [hydrated, sessionFinished]);

  useEffect(
    () => () => {
      if (revealTimer.current) clearTimeout(revealTimer.current);
      if (evaluationTimer.current) clearTimeout(evaluationTimer.current);
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

  function playFeedbackSound(player: AudioPlayer) {
    player
      .seekTo(0)
      .then(() => player.play())
      .catch(() => {
        try {
          player.play();
        } catch {
          // Ses desteği olmayan ortamlarda oyun akışı kesilmesin.
        }
      });
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
      setEnteredLetters((current) =>
        current.map((letter, index) => (index === nextIndex ? null : letter)),
      );
      setRoundScore((current) =>
        applyPenalty(current, getRevealCost(revealedIndexes.length)),
      );
      setStatus('playing');
      setMessage(`${nextIndex + 1}. harf açıldı. Kalan harfleri seç.`);
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
          () => undefined,
        );
      }
    }, REVEAL_DURATION_MS);
  }

  function handleLetter(letter: string) {
    if (status !== 'playing') return;

    const nextIndex = enteredLetters.findIndex(
      (value, index) => !revealedIndexes.includes(index) && value === null,
    );
    if (nextIndex < 0) return;

    const nextLetters = Array.from(
      { length: letters.length },
      (_, index) => enteredLetters[index] ?? null,
    );
    nextLetters[nextIndex] = letter;
    setEnteredLetters(nextLetters);

    const completedGuess = letters
      .map((answerLetter, index) =>
        revealedIndexes.includes(index)
          ? answerLetter
          : (nextLetters[index] ?? ''),
      )
      .join('');

    if (getWordLetters(completedGuess).length === letters.length) {
      setStatus('checking');
      setMessage('Kelime kontrol ediliyor…');
      evaluationTimer.current = setTimeout(
        () => evaluateCompletedGuess(completedGuess),
        LETTER_CHECK_DELAY_MS,
      );
    } else {
      setMessage('Harfler doğrudan üstteki kutulara yerleşiyor.');
    }
  }

  function evaluateCompletedGuess(completedGuess: string) {
    if (isCorrectGuess(completedGuess, word.answer)) {
      setStatus('solved');
      setMessage('');
      setSessionSolved((current) => current + 1);
      setSessionScore((current) => current + roundScore);
      recordSolved(word.id, roundScore);
      playFeedbackSound(successSound);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        ).catch(() => undefined);
      }
      return;
    }

    setSessionFailed((current) => current + 1);
    setRoundScore(0);
    setStatus('failed');
    setMessage('');
    runWrongGuessAnimation();
    playFeedbackSound(wrongSound);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Error,
      ).catch(() => undefined);
    }
  }

  function startNextWord() {
    if (sessionFinished) return;
    const nextLevel = progress.totalSolved + 1;
    const nextWord = selectNextWord(
      wordBank,
      [word.id, ...progress.recentWordIds],
      word.id,
      getWordLengthForLevel(nextLevel),
    );
    if (!nextWord) return;

    setWord(nextWord);
    setRevealedIndexes([]);
    setEnteredLetters(
      new Array(getWordLetters(nextWord.answer).length).fill(null),
    );
    setStatus('playing');
    setRoundScore(getBaseRoundScore(getWordLetters(nextWord.answer).length));
    setMessage('Açıklamayı oku, harfleri sırayla seç.');
  }

  function restartSession() {
    const targetLength = getWordLengthForLevel(progress.totalSolved + 1);
    const nextWord =
      selectNextWord(
        wordBank,
        [word.id, ...progress.recentWordIds],
        word.id,
        targetLength,
      ) ?? wordBank[0];

    sessionDeadline.current = Date.now() + SESSION_DURATION_SECONDS * 1000;
    setSecondsRemaining(SESSION_DURATION_SECONDS);
    setSessionSolved(0);
    setSessionFailed(0);
    setSessionScore(0);
    setSessionFinished(false);
    setWord(nextWord);
    setRevealedIndexes([]);
    setEnteredLetters(
      new Array(getWordLetters(nextWord.answer).length).fill(null),
    );
    setStatus('playing');
    setRoundScore(getBaseRoundScore(getWordLetters(nextWord.answer).length));
    setMessage('Yeni 2 dakikalık tur başladı.');
  }

  function handleBackspace() {
    if (status !== 'playing') return;
    setEnteredLetters((current) => {
      const next = [...current];
      for (let index = next.length - 1; index >= 0; index -= 1) {
        if (!revealedIndexes.includes(index) && next[index]) {
          next[index] = null;
          break;
        }
      }
      return next;
    });
  }

  const screen = (
    <SafeAreaView
      style={[
        styles.safeArea,
        paper ? styles.paperBackground : styles.glassBackground,
      ]}
    >
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <MainModeSwitch
          activeMode="turkish"
          onSelectMath={onBack}
          onSelectTurkish={() => undefined}
          paper={paper}
        />

        <View style={styles.header}>
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
            accessibilityLabel="Genel ayarları aç"
            accessibilityRole="button"
            onPress={onOpenSettings}
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
              ⚙
            </Text>
          </Pressable>
        </View>

        <View style={styles.scoreRow}>
          <ScorePill label="TUR PUANI" paper={paper} value={roundScore} />
          <ScorePill
            emphasized
            label="SÜRE"
            paper={paper}
            value={formattedTime}
          />
          <ScorePill label="SEVİYE" paper={paper} value={displayedLevel} />
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
          style={[
            styles.slots,
            { gap: slotGap, transform: [{ translateX: shake }] },
          ]}
        >
          {letters.map((letter, index) => (
            <LetterSlot
              index={index}
              key={`${word.id}-${index}`}
              letter={
                status === 'solved' ||
                status === 'failed' ||
                revealedIndexes.includes(index)
                  ? letter
                  : (enteredLetters[index] ?? null)
              }
              paper={paper}
              revealed={
                revealedIndexes.includes(index) ||
                status === 'solved' ||
                status === 'failed'
              }
              size={slotSize}
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
          Harf hakkı: {Math.max(0, maxReveals - revealedIndexes.length)} · Her
          harf 100 puan
        </Text>

        <Text
          style={[
            styles.sessionStats,
            paper ? styles.mutedPaper : styles.mutedGlass,
          ]}
        >
          Bu tur: {sessionSolved} doğru · {sessionFailed} yanlış · {sessionScore}{' '}
          puan
        </Text>

        {sessionFinished ? (
          <View
            style={[
              styles.sessionEndCard,
              paper ? styles.sessionEndPaper : styles.sessionEndGlass,
            ]}
          >
            <Text
              style={[
                styles.sessionEndTitle,
                paper ? styles.textPaper : styles.textGlass,
              ]}
            >
              SÜRE DOLDU
            </Text>
            <Text
              style={[
                styles.sessionEndScore,
                paper ? styles.accentPaper : styles.accentGlass,
              ]}
            >
              {sessionScore} PUAN
            </Text>
            <Text
              style={[
                styles.sessionEndSummary,
                paper ? styles.mutedPaper : styles.mutedGlass,
              ]}
            >
              {sessionSolved} doğru · {sessionFailed} yanlış
            </Text>
            <PrimaryButton
              label="YENİ 2 DAKİKALIK TUR"
              onPress={restartSession}
            />
          </View>
        ) : status === 'solved' || status === 'failed' ? (
          <View
            style={[
              styles.successCard,
              status === 'solved'
                ? paper
                  ? styles.successPaper
                  : styles.successGlass
                : paper
                  ? styles.failurePaper
                  : styles.failureGlass,
            ]}
          >
            <Text
              style={[
                styles.successText,
                status === 'solved'
                  ? paper
                    ? styles.successTextPaper
                    : styles.textGlass
                  : paper
                    ? styles.failureTextPaper
                    : styles.textGlass,
              ]}
            >
              {status === 'solved'
                ? `Bu kelimeden ${roundScore} puan kazandın.`
                : `Doğru cevap: ${word.answer}`}
            </Text>
            {status === 'failed' ? (
              <Text
                style={[
                  styles.failureHint,
                  paper ? styles.mutedPaper : styles.mutedGlass,
                ]}
              >
                Her kelime için yalnızca bir tahmin hakkın var.
              </Text>
            ) : null}
            <PrimaryButton label="SONRAKİ KELİME" onPress={startNextWord} />
          </View>
        ) : (
          <>
            <Pressable
              accessibilityHint="Rastgele bir doğru harfi kendi yerinde gösterir"
              accessibilityRole="button"
              disabled={
                isBusy || revealedIndexes.length >= maxReveals
              }
              onPress={handleReveal}
              style={({ pressed }) => [
                styles.revealButton,
                paper ? styles.revealButtonPaper : styles.revealButtonGlass,
                pressed && styles.pressed,
                (isBusy || revealedIndexes.length >= maxReveals) &&
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

            <TurkishKeyboard
              disabled={isBusy}
              onBackspace={handleBackspace}
              onLetter={handleLetter}
              paper={paper}
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
  emphasized?: boolean;
  label: string;
  paper: boolean;
  value: number | string;
};

function ScorePill({ emphasized = false, label, paper, value }: ScorePillProps) {
  const formattedValue =
    typeof value === 'number' ? value.toLocaleString('tr-TR') : value;

  return (
    <View
      accessibilityLabel={`${label.toLocaleLowerCase('tr-TR')} ${formattedValue}`}
      style={[
        styles.scorePill,
        paper ? styles.pillPaper : styles.pillGlass,
        emphasized && (paper ? styles.pillEmphasizedPaper : styles.pillEmphasizedGlass),
      ]}
    >
      <Text
        style={[
          styles.scoreLabel,
          emphasized
            ? paper
              ? styles.scoreLabelEmphasizedPaper
              : styles.scoreLabelEmphasizedGlass
            : paper
              ? styles.mutedPaper
              : styles.mutedGlass,
        ]}
      >
        {label}
      </Text>
      <Text
        selectable
        style={[
          styles.scoreValue,
          emphasized
            ? paper
              ? styles.scoreValueEmphasizedPaper
              : styles.scoreValueEmphasizedGlass
            : paper
              ? styles.textPaper
              : styles.textGlass,
        ]}
      >
        {formattedValue}
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
    marginTop: 14,
  },
  headerButtonPaper: {
    borderColor: '#DED5CC',
    backgroundColor: '#FFFDFC',
  },
  headerButtonGlass: {
    borderColor: 'rgba(255,255,255,0.24)',
    backgroundColor: 'rgba(13,34,21,0.62)',
  },
  headerTitleWrap: { flex: 1, alignItems: 'flex-start' },
  eyebrow: { fontSize: 9, fontWeight: '900', letterSpacing: 1.3 },
  title: { marginTop: 2, fontSize: 24, fontWeight: '900' },
  themeButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
  },
  themeButtonText: { fontSize: 22, fontWeight: '700' },
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
  pillEmphasizedPaper: {
    borderColor: '#D8A04F',
    backgroundColor: '#FFF0D2',
    boxShadow: '0 5px 12px rgba(166, 104, 31, 0.14)',
  },
  pillEmphasizedGlass: {
    borderColor: 'rgba(255, 209, 102, 0.58)',
    backgroundColor: 'rgba(70, 46, 12, 0.66)',
    boxShadow: '0 5px 14px rgba(255, 191, 63, 0.18)',
  },
  scoreLabel: { fontSize: 8, fontWeight: '900', letterSpacing: 1.1 },
  scoreLabelEmphasizedPaper: { color: '#9A631E' },
  scoreLabelEmphasizedGlass: { color: '#FFE7AA' },
  scoreValue: {
    marginTop: 2,
    fontSize: 20,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  scoreValueEmphasizedPaper: { color: '#A5681F' },
  scoreValueEmphasizedGlass: { color: '#FFFFFF' },
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
  },
  revealInfo: { marginTop: 13, fontSize: 12, fontWeight: '700' },
  sessionStats: { marginTop: 5, fontSize: 11, fontWeight: '700' },
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
  primaryButton: {
    width: '100%',
    maxWidth: 430,
    minHeight: 52,
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#4F7948',
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
  successPaper: { borderColor: '#9DB58C', backgroundColor: '#E8F2DF' },
  successGlass: {
    borderColor: 'rgba(203,234,155,0.72)',
    backgroundColor: 'rgba(50,102,53,0.86)',
  },
  successText: { fontSize: 16, fontWeight: '800' },
  successTextPaper: { color: '#3F6F3B' },
  failurePaper: { borderColor: '#D4A09A', backgroundColor: '#F9E8E5' },
  failureGlass: {
    borderColor: 'rgba(255,177,166,0.68)',
    backgroundColor: 'rgba(112,45,40,0.84)',
  },
  failureTextPaper: { color: '#8C3F38' },
  failureHint: {
    marginTop: 7,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
  },
  sessionEndCard: {
    width: '100%',
    maxWidth: 430,
    marginTop: 18,
    alignItems: 'center',
    padding: 22,
    borderRadius: 22,
    borderWidth: 1,
  },
  sessionEndPaper: { borderColor: '#D8A04F', backgroundColor: '#FFF0D2' },
  sessionEndGlass: {
    borderColor: 'rgba(255,209,102,0.58)',
    backgroundColor: 'rgba(70,46,12,0.82)',
  },
  sessionEndTitle: { fontSize: 14, fontWeight: '900', letterSpacing: 1.1 },
  sessionEndScore: { marginTop: 8, fontSize: 30, fontWeight: '900' },
  sessionEndSummary: { marginTop: 4, fontSize: 13, fontWeight: '700' },
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
