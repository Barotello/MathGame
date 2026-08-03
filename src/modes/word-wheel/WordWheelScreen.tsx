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
import { SettingsModal } from '../../components/SettingsModal';
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
import {
  createLevelWordGroup,
  isLevelWordGroupValid,
  isWordWheelComplete,
  WORDS_PER_LEVEL,
  WORD_WHEEL_LEVEL_COUNT,
} from './wordLevels';
import {
  DELETE_SOUND,
  LETTER_SOUND,
  REVEAL_COMPLETE_SOUND,
  REVEAL_SOUND,
  SUCCESS_SOUND,
  WRONG_SOUND,
} from './word-wheel-sounds';
import type { WordRoundStatus } from './types';

const GLASS_BACKGROUND = require('../../../assets/nature-background.png');
const REVEAL_DURATION_MS = 850;
const LETTER_CHECK_DELAY_MS = 450;

type Props = {
  onOpenMath: () => void;
};

export function WordWheelScreen({ onOpenMath }: Props) {
  const { hydrated, progress, recordAttempt, selectLevel, setLevelWordIds } =
    useWordWheelProgress();
  const { progress: gameProgress, updateSettings } = useGameProgress();
  const { width: screenWidth } = useWindowDimensions();
  const successSound = useAudioPlayer(SUCCESS_SOUND);
  const wrongSound = useAudioPlayer(WRONG_SOUND);
  const revealSound = useAudioPlayer(REVEAL_SOUND);
  const revealCompleteSound = useAudioPlayer(REVEAL_COMPLETE_SOUND);
  const deleteSound = useAudioPlayer(DELETE_SOUND);
  const letterSound = useAudioPlayer(LETTER_SOUND);
  const paper = gameProgress.settings.themeId === 'paper';
  const [word, setWord] = useState(
    () => createLevelWordGroup(wordBank, 1, [])[0] ?? wordBank[0],
  );
  const [activeLevel, setActiveLevel] = useState(1);
  const [activeWordNumber, setActiveWordNumber] = useState(1);
  const [showLevels, setShowLevels] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [resumeNoticeVisible, setResumeNoticeVisible] = useState(false);
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
  const [scoreGain, setScoreGain] = useState<number | null>(null);
  const [sessionFinished, setSessionFinished] = useState(false);
  const [campaignFinished, setCampaignFinished] = useState(false);
  const [message, setMessage] = useState(
    'Açıklamayı oku, harfleri sırayla seç.',
  );
  const shake = useRef(new Animated.Value(0)).current;
  const scoreTransfer = useRef(new Animated.Value(0)).current;
  const totalScorePulse = useRef(new Animated.Value(1)).current;
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const evaluationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resumeNoticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionDeadline = useRef<number | null>(null);
  const pauseStartedAt = useRef<number | null>(null);
  const hydratedWord = useRef(false);

  const letters = useMemo(() => getWordLetters(word.answer), [word.answer]);
  const maxReveals = getMaxReveals(letters.length);
  const isBusy = status !== 'playing' || sessionFinished;
  const canBackspace = enteredLetters.some(
    (letter, index) => letter !== null && !revealedIndexes.includes(index),
  );
  const canSubmit = letters.every(
    (_, index) => revealedIndexes.includes(index) || enteredLetters[index] !== null,
  );
  const highestUnlockedLevel = useMemo(
    () =>
      Math.min(
        WORD_WHEEL_LEVEL_COUNT,
        Math.max(
          progress.currentLevel,
          ...progress.completedLevels.map((level) => level + 1),
        ),
      ),
    [progress.completedLevels, progress.currentLevel],
  );
  const timerPaused = settingsOpen || showLevels;
  const slotGap = letters.length >= 6 ? 6 : 10;
  const slotAreaWidth = Math.min(430, Math.max(180, screenWidth - 36));
  const slotSize = Math.min(
    78,
    Math.floor((slotAreaWidth - slotGap * (letters.length - 1)) / letters.length),
  );
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
    const storedGroup = progress.currentLevelWordIds
      .map((wordId) => wordBank.find((entry) => entry.id === wordId))
      .filter((entry): entry is (typeof wordBank)[number] => Boolean(entry));
    const storedGroupIsValid = isLevelWordGroupValid(
      storedGroup,
      progress.currentLevel,
    );
    const levelGroup =
      storedGroupIsValid
        ? storedGroup
        : createLevelWordGroup(
            wordBank,
            progress.currentLevel,
            progress.recentWordIds,
          );
    if (!storedGroupIsValid) {
      setLevelWordIds(
        progress.currentLevel,
        levelGroup.map((entry) => entry.id),
      );
    }
    const wordIndex = Math.min(
      progress.levelWordIndex,
      WORDS_PER_LEVEL - 1,
    );
    const firstWord = levelGroup[wordIndex] ?? wordBank[0];
    setActiveLevel(progress.currentLevel);
    setActiveWordNumber(wordIndex + 1);
    setWord(firstWord);
    setEnteredLetters(
      new Array(getWordLetters(firstWord.answer).length).fill(null),
    );
    setRoundScore(getBaseRoundScore(getWordLetters(firstWord.answer).length));
  }, [
    hydrated,
    progress.currentLevel,
    progress.currentLevelWordIds,
    progress.levelWordIndex,
    progress.recentWordIds,
    setLevelWordIds,
  ]);

  useEffect(() => {
    if (timerPaused) {
      if (pauseStartedAt.current === null) pauseStartedAt.current = Date.now();
      return;
    }

    if (pauseStartedAt.current !== null && sessionDeadline.current !== null) {
      sessionDeadline.current += Date.now() - pauseStartedAt.current;
    }
    pauseStartedAt.current = null;
  }, [timerPaused]);

  useEffect(() => {
    if (!hydrated || sessionFinished || timerPaused) return;

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
  }, [hydrated, sessionFinished, timerPaused]);

  useEffect(
    () => () => {
      if (revealTimer.current) clearTimeout(revealTimer.current);
      if (evaluationTimer.current) clearTimeout(evaluationTimer.current);
      if (resumeNoticeTimer.current) clearTimeout(resumeNoticeTimer.current);
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

    playFeedbackSound(revealSound);
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
      playFeedbackSound(revealCompleteSound);
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
    playFeedbackSound(letterSound);
    setEnteredLetters(nextLetters);

    const filled = nextLetters.every(
      (value, index) => revealedIndexes.includes(index) || value !== null,
    );
    setMessage(
      filled
        ? 'Kelime hazır. Kontrol edip Cevapla düğmesine bas.'
        : 'Harfler doğrudan üstteki kutulara yerleşiyor.',
    );
  }

  function handleSubmit() {
    if (status !== 'playing' || !canSubmit) return;

    const completedGuess = letters
      .map((answerLetter, index) =>
        revealedIndexes.includes(index)
          ? answerLetter
          : (enteredLetters[index] ?? ''),
      )
      .join('');

    setStatus('checking');
    setMessage('Kelime kontrol ediliyor…');
    evaluationTimer.current = setTimeout(
      () => evaluateCompletedGuess(completedGuess),
      LETTER_CHECK_DELAY_MS,
    );
  }

  function evaluateCompletedGuess(completedGuess: string) {
    if (isCorrectGuess(completedGuess, word.answer)) {
      setStatus('solved');
      setMessage('');
      setSessionSolved((current) => current + 1);
      animateScoreTransfer(roundScore);
      recordAttempt(word.id, roundScore, true);
      playFeedbackSound(successSound);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        ).catch(() => undefined);
      }
      return;
    }

    const scorePenalty = roundScore;
    setSessionFailed((current) => current + 1);
    animateScoreTransfer(-scorePenalty);
    setRoundScore(0);
    setStatus('failed');
    setMessage('');
    recordAttempt(word.id, -scorePenalty, false);
    runWrongGuessAnimation();
    playFeedbackSound(wrongSound);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Error,
      ).catch(() => undefined);
    }
  }

  function animateScoreTransfer(score: number) {
    setScoreGain(score);
    scoreTransfer.setValue(0);

    Animated.timing(scoreTransfer, {
      toValue: 1,
      duration: 720,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) return;

      setSessionScore((current) => Math.max(0, current + score));
      setScoreGain(null);
      Animated.sequence([
        Animated.timing(totalScorePulse, {
          toValue: 1.08,
          duration: 110,
          useNativeDriver: true,
        }),
        Animated.spring(totalScorePulse, {
          toValue: 1,
          damping: 9,
          stiffness: 230,
          mass: 0.55,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }

  function startNextWord() {
    if (sessionFinished) return;

    if (isWordWheelComplete(progress.currentLevel, progress.levelWordIndex)) {
      setCampaignFinished(true);
      setSessionFinished(true);
      setStatus('finished');
      setMessage('');
      return;
    }

    if (progress.currentLevel !== activeLevel) {
      setShowLevels(true);
      return;
    }

    const storedGroup = progress.currentLevelWordIds
      .map((wordId) => wordBank.find((entry) => entry.id === wordId))
      .filter((entry): entry is (typeof wordBank)[number] => Boolean(entry));
    const storedGroupIsValid = isLevelWordGroupValid(
      storedGroup,
      progress.currentLevel,
    );
    const levelGroup =
      storedGroupIsValid
        ? storedGroup
        : createLevelWordGroup(
            wordBank,
            progress.currentLevel,
            progress.recentWordIds,
          );
    if (!storedGroupIsValid) {
      setLevelWordIds(
        progress.currentLevel,
        levelGroup.map((entry) => entry.id),
      );
    }
    const nextWord = levelGroup[progress.levelWordIndex];
    if (!nextWord) return;

    setActiveLevel(progress.currentLevel);
    setActiveWordNumber(progress.levelWordIndex + 1);
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
    if (isWordWheelComplete(progress.currentLevel, progress.levelWordIndex)) {
      setCampaignFinished(true);
      return;
    }

    const storedGroup = progress.currentLevelWordIds
      .map((wordId) => wordBank.find((entry) => entry.id === wordId))
      .filter((entry): entry is (typeof wordBank)[number] => Boolean(entry));
    const storedGroupIsValid = isLevelWordGroupValid(
      storedGroup,
      progress.currentLevel,
    );
    const levelGroup =
      storedGroupIsValid
        ? storedGroup
        : createLevelWordGroup(
            wordBank,
            progress.currentLevel,
            progress.recentWordIds,
          );
    if (!storedGroupIsValid) {
      setLevelWordIds(
        progress.currentLevel,
        levelGroup.map((entry) => entry.id),
      );
    }
    const sessionWord = levelGroup[progress.levelWordIndex] ?? word;

    sessionDeadline.current = Date.now() + SESSION_DURATION_SECONDS * 1000;
    setSecondsRemaining(SESSION_DURATION_SECONDS);
    setSessionSolved(0);
    setSessionFailed(0);
    setSessionScore(0);
    scoreTransfer.stopAnimation();
    totalScorePulse.stopAnimation();
    totalScorePulse.setValue(1);
    setScoreGain(null);
    setSessionFinished(false);
    setCampaignFinished(false);
    setActiveLevel(progress.currentLevel);
    setActiveWordNumber(progress.levelWordIndex + 1);
    setWord(sessionWord);
    setRevealedIndexes([]);
    setEnteredLetters(
      new Array(getWordLetters(sessionWord.answer).length).fill(null),
    );
    setStatus('playing');
    setRoundScore(getBaseRoundScore(getWordLetters(sessionWord.answer).length));
    setMessage('Yeni 2 dakikalık tur başladı.');
  }

  function handleBackspace() {
    if (status !== 'playing' || !canBackspace) return;
    playFeedbackSound(deleteSound);
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync().catch(() => undefined);
    }
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
    setMessage('Son harf silindi. Kelimeyi düzenlemeye devam edebilirsin.');
  }

  function openSettings() {
    if (resumeNoticeTimer.current) clearTimeout(resumeNoticeTimer.current);
    setResumeNoticeVisible(false);
    setSettingsOpen(true);
  }

  function closeSettings() {
    setSettingsOpen(false);
    if (sessionFinished) return;

    setResumeNoticeVisible(true);
    if (resumeNoticeTimer.current) clearTimeout(resumeNoticeTimer.current);
    resumeNoticeTimer.current = setTimeout(() => {
      setResumeNoticeVisible(false);
      resumeNoticeTimer.current = null;
    }, 3200);
  }

  function toggleLevelOverview() {
    setShowLevels((current) => !current);
  }

  function handleSelectLevel(level: number) {
    if (level < 1 || level > highestUnlockedLevel) return;

    const levelGroup = createLevelWordGroup(
      wordBank,
      level,
      progress.recentWordIds,
    );
    const firstWord = levelGroup[0];
    if (!firstWord) return;

    selectLevel(
      level,
      levelGroup.map((entry) => entry.id),
    );
    setActiveLevel(level);
    setActiveWordNumber(1);
    setWord(firstWord);
    setRevealedIndexes([]);
    setEnteredLetters(
      new Array(getWordLetters(firstWord.answer).length).fill(null),
    );
    setStatus('playing');
    setRoundScore(getBaseRoundScore(getWordLetters(firstWord.answer).length));
    setCampaignFinished(false);
    setShowLevels(false);
    setMessage(`Bölüm ${level} başladı. Açıklamayı oku ve kelimeyi bul.`);

    if (sessionFinished) {
      pauseStartedAt.current = null;
      sessionDeadline.current = Date.now() + SESSION_DURATION_SECONDS * 1000;
      setSecondsRemaining(SESSION_DURATION_SECONDS);
      setSessionSolved(0);
      setSessionFailed(0);
      setSessionScore(0);
      setSessionFinished(false);
    }
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
        <View style={styles.header}>
          <Animated.View
            accessibilityLabel={`bu turun toplam puanı ${sessionScore.toLocaleString('tr-TR')}`}
            style={[
              styles.totalScoreCard,
              paper ? styles.pillEmphasizedPaper : styles.pillEmphasizedGlass,
              { transform: [{ scale: totalScorePulse }] },
            ]}
          >
            {scoreGain !== null ? (
              <Animated.Text
                pointerEvents="none"
                style={[
                  styles.scoreGainFlyer,
                  paper ? styles.scoreGainFlyerPaper : styles.scoreGainFlyerGlass,
                  {
                    opacity: scoreTransfer.interpolate({
                      inputRange: [0, 0.12, 0.78, 1],
                      outputRange: [0, 1, 1, 0],
                    }),
                    transform: [
                      {
                        translateY: scoreTransfer.interpolate({
                          inputRange: [0, 1],
                          outputRange: [92, 4],
                        }),
                      },
                      {
                        scale: scoreTransfer.interpolate({
                          inputRange: [0, 0.7, 1],
                          outputRange: [0.88, 1.08, 0.94],
                        }),
                      },
                    ],
                  },
                ]}
              >
                {scoreGain > 0 ? '+' : '−'}
                {Math.abs(scoreGain).toLocaleString('tr-TR')}
              </Animated.Text>
            ) : null}
            <Text
              style={[
                styles.totalScoreLabel,
                paper
                  ? styles.scoreLabelEmphasizedPaper
                  : styles.scoreLabelEmphasizedGlass,
              ]}
            >
              TOPLAM PUAN
            </Text>
            <Text
              selectable
              style={[
                styles.totalScoreValue,
                paper
                  ? styles.scoreValueEmphasizedPaper
                  : styles.scoreValueEmphasizedGlass,
              ]}
            >
              {sessionScore.toLocaleString('tr-TR')}
            </Text>
          </Animated.View>

          <Pressable
            accessibilityLabel={
              showLevels ? 'Bölümler alanını kapat' : 'Bölümleri göster'
            }
            accessibilityRole="button"
            onPress={toggleLevelOverview}
            style={({ pressed }) => [
              styles.levelsButton,
              paper ? styles.headerButtonPaper : styles.headerButtonGlass,
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.levelsButtonIcon,
                paper ? styles.textPaper : styles.textGlass,
              ]}
            >
              ▦
            </Text>
            <Text
              style={[
                styles.levelsButtonText,
                paper ? styles.textPaper : styles.textGlass,
              ]}
            >
              BÖLÜMLER
            </Text>
          </Pressable>

          <Pressable
            accessibilityLabel="Genel ayarları aç"
            accessibilityRole="button"
            onPress={openSettings}
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

        {resumeNoticeVisible && !showLevels ? (
          <View
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
            style={[
              styles.resumeNotice,
              paper ? styles.resumeNoticePaper : styles.resumeNoticeGlass,
            ]}
          >
            <Text style={styles.resumeNoticeIcon}>⏱</Text>
            <View style={styles.resumeNoticeCopy}>
              <Text
                style={[
                  styles.resumeNoticeTitle,
                  paper ? styles.textPaper : styles.textGlass,
                ]}
              >
                SÜRE KALDIĞI YERDEN DEVAM EDİYOR
              </Text>
              <Text
                style={[
                  styles.resumeNoticeText,
                  paper ? styles.mutedPaper : styles.mutedGlass,
                ]}
              >
                Ayarlarda geçirdiğin süre oyundan düşülmedi.
              </Text>
            </View>
          </View>
        ) : null}

        {showLevels ? (
          <LevelOverview
            completedLevels={progress.completedLevels}
            currentWordIndex={
              activeLevel === progress.currentLevel ? progress.levelWordIndex : 0
            }
            highestUnlockedLevel={highestUnlockedLevel}
            onSelectLevel={handleSelectLevel}
            paper={paper}
            selectedLevel={activeLevel}
          />
        ) : (
          <>

        <View style={styles.scoreRow}>
          <ScorePill label="KELİME PUANI" paper={paper} value={roundScore} />
          <ScorePill
            emphasized
            label="SÜRE"
            paper={paper}
            value={formattedTime}
          />
          <ScorePill label="BÖLÜM" paper={paper} value={activeLevel} />
        </View>

        <Text
          style={[
            styles.wordProgress,
            paper ? styles.mutedPaper : styles.mutedGlass,
          ]}
        >
          KELİME {activeWordNumber}/{WORDS_PER_LEVEL}
        </Text>

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
              {campaignFinished ? 'TÜM BÖLÜMLER TAMAMLANDI' : 'SÜRE DOLDU'}
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
            {!campaignFinished ? (
              <PrimaryButton
                label="YENİ 2 DAKİKALIK TUR"
                onPress={restartSession}
              />
            ) : null}
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
            <PrimaryButton
              label={
                activeLevel === WORD_WHEEL_LEVEL_COUNT &&
                activeWordNumber === WORDS_PER_LEVEL
                  ? 'BÖLÜMLERİ TAMAMLA'
                    : activeWordNumber === WORDS_PER_LEVEL
                    ? 'BÖLÜM LİSTESİNİ AÇ'
                    : 'SONRAKİ KELİME'
              }
              onPress={startNextWord}
            />
          </View>
        ) : (
          <>
            <View style={styles.wordActionRow}>
              <Pressable
                accessibilityHint="Rastgele bir doğru harfi kendi yerinde gösterir"
                accessibilityRole="button"
                disabled={isBusy || revealedIndexes.length >= maxReveals}
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

              <Pressable
                accessibilityLabel="Kelimeyi cevapla"
                accessibilityRole="button"
                disabled={isBusy || !canSubmit}
                onPress={handleSubmit}
                style={({ pressed }) => [
                  styles.submitButton,
                  paper ? styles.submitButtonPaper : styles.submitButtonGlass,
                  pressed && styles.pressed,
                  (isBusy || !canSubmit) && styles.disabled,
                ]}
              >
                <Text style={styles.submitButtonText}>CEVAPLA</Text>
              </Pressable>
            </View>

            <TurkishKeyboard
              backspaceDisabled={!canBackspace}
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
          </>
        )}
      </ScrollView>

      <SettingsModal
        activeGameMode="word"
        completedLevelNumbers={gameProgress.completedLevelNumbers}
        currentLevelIndex={Math.max(0, gameProgress.lastLevelNumber - 1)}
        levelRecords={gameProgress.levelRecords}
        playerName={gameProgress.playerName}
        onClose={closeSettings}
        onOpenMath={() => {
          setSettingsOpen(false);
          onOpenMath();
        }}
        onOpenWordWheel={closeSettings}
        onRestart={closeSettings}
        onSelectLevel={() => undefined}
        onShowHintsChange={(value) => updateSettings({ showHints: value })}
        onThemeChange={(themeId) => updateSettings({ themeId })}
        showHints={gameProgress.settings.showHints}
        showMathProgress={false}
        themeId={gameProgress.settings.themeId}
        visible={settingsOpen}
      />
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

type LevelOverviewProps = {
  completedLevels: number[];
  currentWordIndex: number;
  highestUnlockedLevel: number;
  onSelectLevel: (level: number) => void;
  paper: boolean;
  selectedLevel: number;
};

function LevelOverview({
  completedLevels,
  currentWordIndex,
  highestUnlockedLevel,
  onSelectLevel,
  paper,
  selectedLevel,
}: LevelOverviewProps) {
  return (
    <View
      accessibilityLabel="Kelime Çarkı bölümleri"
      style={[
        styles.levelOverview,
        paper ? styles.cardPaper : styles.cardGlass,
      ]}
    >
      <Text
        style={[
          styles.levelOverviewTitle,
          paper ? styles.textPaper : styles.textGlass,
        ]}
      >
        10 BÖLÜM · HER BÖLÜMDE 10 KELİME
      </Text>
      <View style={styles.levelGrid}>
        {Array.from({ length: WORD_WHEEL_LEVEL_COUNT }, (_, index) => {
          const level = index + 1;
          const completed = completedLevels.includes(level);
          const selected = level === selectedLevel;
          const locked = level > highestUnlockedLevel;
          const remainingWords = completed
            ? 0
            : selected
              ? Math.max(0, WORDS_PER_LEVEL - currentWordIndex)
              : WORDS_PER_LEVEL;
          const statusLabel = completed
            ? 'tamamlandı'
            : selected
              ? 'seçili'
              : locked
                ? 'kilitli'
                : 'açık';

          return (
            <Pressable
              accessibilityLabel={`Bölüm ${level}, ${statusLabel}, ${remainingWords} kelime kaldı`}
              accessibilityRole="button"
              disabled={locked}
              key={level}
              onPress={() => onSelectLevel(level)}
              style={({ pressed }) => [
                  styles.levelTile,
                  paper ? styles.levelTilePaper : styles.levelTileGlass,
                  completed &&
                    (paper
                      ? styles.levelTileCompletedPaper
                      : styles.levelTileCompletedGlass),
                  selected &&
                    (paper
                      ? styles.levelTileCurrentPaper
                      : styles.levelTileCurrentGlass),
                  locked && styles.levelTileLocked,
                  pressed && styles.pressed,
                ]}
            >
              <Text
                style={[
                  styles.levelTileNumber,
                  paper ? styles.textPaper : styles.textGlass,
                ]}
              >
                {level}
              </Text>
              <Text
                style={[
                  styles.levelTileStatus,
                  paper ? styles.mutedPaper : styles.mutedGlass,
                ]}
              >
                {selected
                  ? 'SEÇİLİ'
                  : completed
                    ? '↻'
                    : locked
                      ? '🔒'
                      : 'AÇIK'}
              </Text>
              <Text
                style={[
                  styles.levelTileRemaining,
                  paper ? styles.textPaper : styles.textGlass,
                ]}
              >
                {remainingWords} KALDI
              </Text>
            </Pressable>
          );
        })}
      </View>
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
    gap: 8,
    marginTop: 14,
  },
  resumeNotice: {
    width: '100%',
    maxWidth: 430,
    marginTop: 10,
    paddingHorizontal: 13,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  resumeNoticePaper: {
    borderColor: '#B7C9A9',
    backgroundColor: '#EDF5E7',
    boxShadow: '0 5px 14px rgba(79, 121, 72, 0.12)',
  },
  resumeNoticeGlass: {
    borderColor: 'rgba(203,234,155,0.5)',
    backgroundColor: 'rgba(42,79,43,0.86)',
    boxShadow: '0 5px 16px rgba(0, 0, 0, 0.2)',
  },
  resumeNoticeIcon: {
    fontSize: 22,
  },
  resumeNoticeCopy: {
    flex: 1,
  },
  resumeNoticeTitle: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.65,
  },
  resumeNoticeText: {
    marginTop: 2,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '600',
  },
  headerButtonPaper: {
    borderColor: '#DED5CC',
    backgroundColor: '#FFFDFC',
  },
  headerButtonGlass: {
    borderColor: 'rgba(255,255,255,0.24)',
    backgroundColor: 'rgba(13,34,21,0.62)',
  },
  themeButton: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
  },
  themeButtonText: { fontSize: 22, fontWeight: '700' },
  totalScoreCard: {
    flex: 1,
    minHeight: 54,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  totalScoreLabel: { fontSize: 8, fontWeight: '900', letterSpacing: 1.05 },
  totalScoreValue: {
    marginTop: 1,
    fontSize: 20,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  scoreGainFlyer: {
    position: 'absolute',
    zIndex: 20,
    left: 18,
    top: 4,
    fontSize: 21,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
  },
  scoreGainFlyerPaper: {
    color: '#B96510',
    textShadowColor: 'rgba(255, 255, 255, 0.9)',
  },
  scoreGainFlyerGlass: {
    color: '#FFE070',
    textShadowColor: 'rgba(0, 0, 0, 0.55)',
  },
  levelsButton: {
    width: 104,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
  },
  levelsButtonIcon: { fontSize: 17, fontWeight: '900' },
  levelsButtonText: {
    marginTop: 2,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  levelOverview: {
    width: '100%',
    maxWidth: 430,
    marginTop: 10,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  levelOverviewTitle: {
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  levelGrid: {
    marginTop: 11,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  levelTile: {
    width: '18%',
    minHeight: 62,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    borderWidth: 1,
  },
  levelTilePaper: { borderColor: '#E3DAD1', backgroundColor: '#F8F3ED' },
  levelTileGlass: {
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(13,34,21,0.52)',
  },
  levelTileCompletedPaper: { borderColor: '#9DB58C', backgroundColor: '#E8F2DF' },
  levelTileCompletedGlass: {
    borderColor: 'rgba(203,234,155,0.65)',
    backgroundColor: 'rgba(50,102,53,0.72)',
  },
  levelTileCurrentPaper: { borderColor: '#D8A04F', backgroundColor: '#FFF0D2' },
  levelTileCurrentGlass: {
    borderColor: 'rgba(255,209,102,0.58)',
    backgroundColor: 'rgba(70,46,12,0.72)',
  },
  levelTileLocked: { opacity: 0.45 },
  levelTileNumber: { fontSize: 16, fontWeight: '900' },
  levelTileStatus: { marginTop: 2, fontSize: 7, fontWeight: '900' },
  levelTileRemaining: {
    marginTop: 3,
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.25,
    fontVariant: ['tabular-nums'],
  },
  scoreRow: {
    width: '100%',
    maxWidth: 430,
    marginTop: 12,
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
  wordProgress: {
    marginTop: 8,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
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
    flex: 1,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
  },
  wordActionRow: {
    width: '100%',
    maxWidth: 430,
    marginTop: 14,
    flexDirection: 'row',
    gap: 10,
  },
  deleteButton: {
    width: 96,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
  },
  deleteButtonPaper: {
    borderColor: '#D8CFC5',
    backgroundColor: '#EEE6DD',
  },
  deleteButtonGlass: {
    borderColor: 'rgba(255,255,255,0.22)',
    backgroundColor: 'rgba(9,24,15,0.62)',
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.45,
  },
  submitButton: {
    width: 104,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
  },
  submitButtonPaper: {
    borderColor: '#42683D',
    backgroundColor: '#4F7948',
  },
  submitButtonGlass: {
    borderColor: 'rgba(220, 245, 188, 0.5)',
    backgroundColor: 'rgba(63, 111, 59, 0.94)',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.65,
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
