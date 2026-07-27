import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  ImageBackground,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { NumberCell } from '../components/NumberCell';
import { OperatorPopover } from '../components/OperatorPopover';
import { SettingsModal } from '../components/SettingsModal';
import { StagedHint } from '../components/StagedHint';
import { SuccessCard } from '../components/SuccessCard';
import { FailCard } from '../components/FailCard';
import { DailyChallengeModal } from '../components/DailyChallengeModal';
import { GestureTutorialOverlay } from '../components/GestureTutorialOverlay';
import { MathValueLabel } from '../components/math-value-label';
import { generateDailyChallenge, getTodayDateString } from '../game/dailyChallenge';
import { levels } from '../data/levels';
import { getDifficultyProfile } from '../game/difficulty';
import {
  areOrthogonalNeighbors,
  calculate,
  hasUnvisitedOrthogonalNeighbor,
  meetsLevelCompletionRules,
} from '../game/engine';
import {
  formatMathValue,
  isIntegerValue,
  isNegativeValue,
} from '../game/mathValue';
import {
  getBoardPointFromDrag,
  getCellAtBoardPoint,
  getOperatorArcLayout,
  getOperatorAtBoardPoint,
} from '../game/gesture';
import { useGameProgress } from '../hooks/useGameProgress';
import { colors } from '../theme/colors';
import type {
  NumberCell as NumberCellModel,
  MathValue,
  OperationStep,
  Operator,
} from '../types/game';
import type { BoardPoint } from '../game/gesture';
import type { CompletionSummary } from '../types/progress';

const BOARD_GAP = 9;
const BOARD_PADDING = 12;
const AUTO_ADVANCE_DELAY_MS = 5000;
const CHAPTER_BACKGROUNDS = [
  require('../../assets/chapter-1-background-v2.jpg'),
  require('../../assets/chapter-2-background-v2.jpg'),
  require('../../assets/chapter-3-background.jpg'),
  require('../../assets/chapter-4-background.jpg'),
  require('../../assets/chapter-5-background.jpg'),
  require('../../assets/chapter-6-background.jpg'),
  require('../../assets/chapter-7-background.jpg'),
  require('../../assets/chapter-8-background.jpg'),
  require('../../assets/chapter-9-background.jpg'),
  require('../../assets/chapter-10-background.jpg'),
] as const;
const PYTHAGORAS_INTERLUDE = require('../../assets/pythagoras-interlude.png');

type DragSession = {
  startCell: NumberCellModel;
  targetCell: NumberCellModel | null;
  activeOperator: Operator | null;
  baseCurrentValue: MathValue;
  basePath: string[];
  baseSteps: OperationStep[];
};

type MergeAnimation = {
  key: number;
  fromId: string;
  toId: string;
  offsetX: number;
  offsetY: number;
};

type Props = {
  onOpenWallBreaker: () => void;
  onOpenWordWheel: () => void;
};

export function GameScreen({
  onOpenWallBreaker,
  onOpenWordWheel,
}: Props) {
  const { width } = useWindowDimensions();
  const [levelIndex, setLevelIndex] = useState(0);
  const [isDailyMode, setIsDailyMode] = useState(false);
  const [dailyModalOpen, setDailyModalOpen] = useState(false);
  const todayDateStr = useMemo(() => getTodayDateString(), []);
  const dailyLevel = useMemo(() => generateDailyChallenge(todayDateStr), [todayDateStr]);

  const level = isDailyMode ? dailyLevel : levels[levelIndex];
  const isLastLevel = levelIndex === levels.length - 1;
  const chapterIndex = Math.min(
    CHAPTER_BACKGROUNDS.length - 1,
    Math.floor((level.number - 1) / 10),
  );
  const backgroundSource = CHAPTER_BACKGROUNDS[chapterIndex];
  const [path, setPath] = useState<string[]>([]);
  const [firstValue, setFirstValue] = useState<MathValue | null>(null);
  const [currentValue, setCurrentValue] = useState<MathValue | null>(null);
  const [steps, setSteps] = useState<OperationStep[]>([]);
  const [pendingCell, setPendingCell] = useState<NumberCellModel | null>(null);
  const [message, setMessage] = useState('Hedefe ulaşmak için ilk sayıyı seç.');
  const [won, setWon] = useState(false);
  const [lost, setLost] = useState(false);
  const [failureReason, setFailureReason] = useState<'constraint' | 'dead-end' | 'timeout' | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(levels[0].timeLimitSeconds);
  const [activeOperator, setActiveOperator] = useState<Operator | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showPythagorasInterlude, setShowPythagorasInterlude] = useState(false);
  const [hintStage, setHintStage] = useState(0);
  const [usedHint, setUsedHint] = useState(false);
  const [completionSummary, setCompletionSummary] =
    useState<CompletionSummary | null>(null);
  const [autoAdvanceRemainingMs, setAutoAdvanceRemainingMs] = useState<number | null>(null);
  const [autoAdvancePaused, setAutoAdvancePaused] = useState(false);
  const [pointerPosition, setPointerPosition] = useState<BoardPoint | null>(null);
  const [mergeAnimation, setMergeAnimation] = useState<MergeAnimation | null>(null);
  const dragSession = useRef<DragSession | null>(null);
  const mergeSequence = useRef(0);
  const restoredProgress = useRef(false);
  const {
    hydrated,
    progress,
    recordCompletion,
    recordDailyCompletion,
    setLastLevelNumber,
    updateSettings,
  } = useGameProgress();
  const { completedLevelNumbers, dailyStreak, lastDailyCompletedDate, levelRecords, settings } = progress;
  const { showHints, themeId } = settings;
  const autoAdvance = true;
  const isPaperTheme = themeId === 'paper';


  const boardSize = Math.min(width - 32, 420);
  const cellSize =
    (boardSize -
      BOARD_PADDING * 2 -
      BOARD_GAP * (level.columns - 1)) /
    level.columns;

  const cellMap = useMemo(
    () => new Map(level.cells.map((cell) => [cell.id, cell])),
    [level.cells],
  );

  const selectedCells = useMemo(
    () =>
      path
        .map((cellId) => cellMap.get(cellId))
        .filter((cell): cell is NumberCellModel => cell !== undefined),
    [cellMap, path],
  );
  const challengeRules = useMemo(() => {
    const usedOperators = steps.map((step) => step.operator);
    const rules: Array<{
      id: string;
      label: string;
      progress?: string;
      satisfied: boolean;
    }> = [];

    if (level.exactPathLength !== undefined) {
      rules.push({
        id: 'path-length',
        label: `Tam ${level.exactPathLength} hücre kullan`,
        progress: `${Math.min(path.length, level.exactPathLength)}/${level.exactPathLength}`,
        satisfied: path.length === level.exactPathLength,
      });
    }

    if (level.requiredOperatorSequence?.length) {
      const sequenceMatches =
        usedOperators.length === level.requiredOperatorSequence.length &&
        usedOperators.every(
          (operator, index) =>
            operator === level.requiredOperatorSequence?.[index],
        );
      rules.push({
        id: 'operator-sequence',
        label: `İşlem sırası: ${level.requiredOperatorSequence.join(' ')}`,
        progress: `${Math.min(usedOperators.length, level.requiredOperatorSequence.length)}/${level.requiredOperatorSequence.length}`,
        satisfied: sequenceMatches,
      });
    } else if (level.requiredOperators?.length) {
      const completedOperatorCount = level.requiredOperators.filter(
        (operator) => usedOperators.includes(operator),
      ).length;
      const optionalOperators = level.allowedOperators.filter(
        (operator) => !level.requiredOperators?.includes(operator),
      );
      rules.push({
        id: 'required-operators',
        label:
          optionalOperators.length > 0
            ? `Zorunlu: ${level.requiredOperators.join(' ')} · Serbest: ${optionalOperators.join(' ')}`
            : `Zorunlu işlemler: ${level.requiredOperators.join(' ')}`,
        progress: `${completedOperatorCount}/${level.requiredOperators.length}`,
        satisfied: completedOperatorCount === level.requiredOperators.length,
      });
    }

    level.requiredValueKinds?.forEach((kind) => {
      const label =
        kind === 'negative'
          ? 'Negatif hücre kullan'
          : kind === 'fraction'
            ? 'Kesirli hücre kullan'
            : 'Üs veya kök hücresi kullan';
      const satisfied = selectedCells.some((cell) => {
        if (kind === 'negative') {
          return isNegativeValue(cell.value);
        }
        if (kind === 'fraction') {
          return !isIntegerValue(cell.value);
        }
        return /[√²³]/.test(cell.displayValue ?? '');
      });

      rules.push({
        id: `value-kind-${kind}`,
        label,
        satisfied,
      });
    });

    return rules;
  }, [level, path.length, selectedCells, steps]);
  const lastCell = path.length > 0 ? cellMap.get(path[path.length - 1]) : null;
  const difficulty = useMemo(() => getDifficultyProfile(level), [level]);
  const mechanicLabel =
    level.number <= 5
      ? 'Toplama ve çıkarma'
      : level.number <= 10
        ? 'Çarpma ve bölme'
        : level.number <= 15
          ? 'Negatif sayılar'
          : level.number <= 20
            ? 'Kesirler'
            : level.number <= 25
              ? 'Üsler ve kökler'
              : 'Karma ustalık';
  const timeIsLow = secondsRemaining <= 10;
  const canGoNext = !isLastLevel;
  const formattedTime = Math.floor(secondsRemaining / 60) + ':' + String(secondsRemaining % 60).padStart(2, '0');

  function resetGame(timeLimit = level.timeLimitSeconds) {
    setPath([]);
    setFirstValue(null);
    setCurrentValue(null);
    setSteps([]);
    setPendingCell(null);
    setActiveOperator(null);
    setPointerPosition(null);
    setMergeAnimation(null);
    dragSession.current = null;
    setMessage('Hedefe ulaşmak için ilk sayıyı seç.');
    setWon(false);
    setLost(false);
    setFailureReason(null);
    setHintStage(0);
    setUsedHint(false);
    setCompletionSummary(null);
    setAutoAdvancePaused(false);
    setAutoAdvanceRemainingMs(null);
    setSecondsRemaining(timeLimit);
  }

  function clearAttempt() {
    setPath([]);
    setFirstValue(null);
    setCurrentValue(null);
    setSteps([]);
    setPendingCell(null);
    setActiveOperator(null);
    setPointerPosition(null);
    setMergeAnimation(null);
    dragSession.current = null;
    setMessage('Hedefe ulaşmak için ilk sayıyı seç.');
    setWon(false);
    setLost(false);
    setFailureReason(null);
    setCompletionSummary(null);
  }

  function exitDailyChallenge() {
    setIsDailyMode(false);
    resetGame(levels[levelIndex].timeLimitSeconds);
  }

  function changeLevel(nextIndex: number) {
    if (nextIndex < 0 || nextIndex >= levels.length) {
      return;
    }

    if (level.number === 10 && nextIndex === levelIndex + 1 && won) {
      setShowPythagorasInterlude(true);
      return;
    }

    setIsDailyMode(false);
    resetGame(levels[nextIndex].timeLimitSeconds);
    setLevelIndex(nextIndex);
    setLastLevelNumber(levels[nextIndex].number);
  }

  function continueAfterPythagorasInterlude() {
    const nextIndex = levelIndex + 1;

    if (nextIndex >= levels.length) {
      return;
    }

    setShowPythagorasInterlude(false);
    setIsDailyMode(false);
    resetGame(levels[nextIndex].timeLimitSeconds);
    setLevelIndex(nextIndex);
    setLastLevelNumber(levels[nextIndex].number);
  }

  function selectLevelFromSettings(nextIndex: number) {
    const nextLevel = levels[nextIndex];
    if (!nextLevel) {
      return;
    }

    setIsDailyMode(false);
    setSettingsOpen(false);
    setShowPythagorasInterlude(false);
    resetGame(levels[nextIndex].timeLimitSeconds);
    setLevelIndex(nextIndex);
    setLastLevelNumber(levels[nextIndex].number);
  }

  useEffect(() => {
    if (won || lost || settingsOpen || secondsRemaining <= 0) return;
    const timer = setInterval(() => {
      setSecondsRemaining((remaining) => Math.max(0, remaining - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [level.id, lost, settingsOpen, won]);

  useEffect(() => {
    if (!hydrated || restoredProgress.current) return;
    restoredProgress.current = true;
    const savedIndex = levels.findIndex(
      (candidate) => candidate.number === progress.lastLevelNumber,
    );

    if (savedIndex > 0) {
      resetGame(levels[savedIndex].timeLimitSeconds);
      setLevelIndex(savedIndex);
    }
  }, [hydrated, progress.lastLevelNumber]);

  useEffect(() => {
    if (secondsRemaining > 0 || won || lost) return;
    setPendingCell(null);
    setFailureReason('timeout');
    setLost(true);
    setMessage('Süre doldu. Bölümü yeniden deneyebilirsin.');
  }, [lost, secondsRemaining, won]);

  useEffect(() => {
    if (
      !autoAdvance ||
      !won ||
      isDailyMode ||
      isLastLevel ||
      settingsOpen ||
      autoAdvancePaused
    ) {
      setAutoAdvanceRemainingMs(null);
      return;
    }

    setAutoAdvanceRemainingMs(AUTO_ADVANCE_DELAY_MS);
    const transition = setTimeout(() => {
      changeLevel(levelIndex + 1);
    }, AUTO_ADVANCE_DELAY_MS);

    return () => {
      clearTimeout(transition);
    };
  }, [
    autoAdvance,
    autoAdvancePaused,
    isDailyMode,
    isLastLevel,
    levelIndex,
    settingsOpen,
    won,
  ]);

  useEffect(() => {
    if (!activeOperator || Platform.OS === 'web') return;
    Haptics.selectionAsync().catch(() => undefined);
  }, [activeOperator]);

  useEffect(() => {
    if (!lost || Platform.OS === 'web') return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
      () => undefined,
    );
  }, [lost]);

  function undo() {
    setMergeAnimation(null);

    if (pendingCell) {
      setPendingCell(null);
      setMessage('İkinci hücre seçimi iptal edildi.');
      return;
    }

    if (steps.length === 0) {
      clearAttempt();
      return;
    }

    const nextSteps = steps.slice(0, -1);
    const nextPath = path.slice(0, -1);
    const nextValue =
      nextSteps.length === 0
        ? firstValue
        : nextSteps[nextSteps.length - 1].result;

    setSteps(nextSteps);
    setPath(nextPath);
    setCurrentValue(nextValue);
    setWon(false);
    setLost(false);
    setFailureReason(null);
    setMessage('Son işlem geri alındı.');
  }

  function handleCellPress(cell: NumberCellModel) {
    if (won || lost) {
      return;
    }

    if (pendingCell?.id === cell.id) {
      setPendingCell(null);
      setMessage('İkinci hücre seçimi iptal edildi.');
      return;
    }

    if (path.length === 0) {
      setPath([cell.id]);
      setFirstValue(cell.value);
      setCurrentValue(cell.value);
      setMessage('Şimdi komşu bir sayı seç.');
      return;
    }

    if (path.includes(cell.id)) {
      setMessage('Aynı hücre bir ifadede yalnızca bir kez kullanılabilir.');
      return;
    }

    if (!lastCell || !areOrthogonalNeighbors(lastCell, cell)) {
      setMessage('Yalnızca yatay veya dikey komşu hücreleri seçebilirsin.');
      return;
    }

    setPendingCell(cell);
    setMessage(
      `${formatMathValue(currentValue!)} ile ${cell.displayValue ?? formatMathValue(cell.value)} arasında bir işlem seç.`,
    );
  }

  function applyOperator(
    operator: Operator,
    operandCell: NumberCellModel,
    baseCurrentValue = currentValue,
    basePath = path,
    baseSteps = steps,
  ) {
    if (baseCurrentValue === null) {
      return;
    }

    const result = calculate(
      baseCurrentValue,
      operator,
      operandCell.value,
      level.rules,
    );

    if (!result.ok) {
      setMessage(result.reason);
      return;
    }

    const nextStep: OperationStep = {
      operator,
      cellId: operandCell.id,
      operand: operandCell.value,
      result: result.value,
    };

    const nextSteps = [...baseSteps, nextStep];
    const nextPath = [...basePath, operandCell.id];
    const sourceCell = cellMap.get(basePath[basePath.length - 1]);

    if (sourceCell) {
      const travelDistance = Math.min(14, cellSize * 0.14);
      mergeSequence.current += 1;
      setMergeAnimation({
        key: mergeSequence.current,
        fromId: sourceCell.id,
        toId: operandCell.id,
        offsetX:
          (operandCell.position.column - sourceCell.position.column) *
          travelDistance,
        offsetY:
          (operandCell.position.row - sourceCell.position.row) * travelDistance,
      });
    }

    setSteps(nextSteps);
    setPath(nextPath);
    setCurrentValue(result.value);
    setPendingCell(null);
    setActiveOperator(null);
    setPointerPosition(null);

    const usedOperators = nextSteps.map((step) => step.operator);

    if (
      meetsLevelCompletionRules(
        level,
        result.value,
        nextPath.length,
        usedOperators,
        nextPath,
      )
    ) {
      const summary = recordCompletion({
        levelNumber: level.number,
        timeLimitSeconds: level.timeLimitSeconds,
        secondsRemaining,
        pathLength: nextPath.length,
        parPathLength: level.parPathLength,
        usedHint,
      });
      setCompletionSummary(summary);
      setWon(true);
      if (isDailyMode) {
        recordDailyCompletion(todayDateStr);
      }
      setMessage(
        `Harika! Hedef çözüldü · ${summary.stars}/3 yıldız · ${summary.score} puan.`,
      );
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        ).catch(() => undefined);
      }
    } else if (
      level.exactPathLength !== undefined &&
      nextPath.length >= level.exactPathLength
    ) {
      setFailureReason('constraint');
      setLost(true);
      setMessage('Hamle sınırına ulaştın. Hedefi ve zorunlu işlemleri birlikte tamamlamalısın.');
    } else if (
      !hasUnvisitedOrthogonalNeighbor(operandCell, level.cells, nextPath)
    ) {
      setFailureReason('dead-end');
      setLost(true);
      setMessage('Hamle kalmadı. Son sayının tüm komşuları daha önce seçilmiş.');
    } else {
      setMessage(
        `Ara sonuç ${formatMathValue(result.value)}. Komşu bir sayı daha seçebilirsin.`,
      );
    }
  }

  function handleOperator(operator: Operator) {
    if (!pendingCell) {
      return;
    }

    applyOperator(operator, pendingCell);
  }

  function handleDragStart(cell: NumberCellModel) {
    if (won || lost || pendingCell) {
      return false;
    }

    const startsNewPath = path.length === 0;
    if (!startsNewPath && lastCell?.id !== cell.id) {
      return false;
    }

    const baseCurrentValue = startsNewPath ? cell.value : currentValue;
    if (baseCurrentValue === null) {
      return false;
    }

    if (startsNewPath) {
      handleCellPress(cell);
    }

    dragSession.current = {
      startCell: cell,
      targetCell: null,
      activeOperator: null,
      baseCurrentValue,
      basePath: startsNewPath ? [cell.id] : [...path],
      baseSteps: [...steps],
    };
    setActiveOperator(null);
    return true;
  }

  function handleDragMove(
    startCell: NumberCellModel,
    dx: number,
    dy: number,
  ) {
    const session = dragSession.current;
    if (!session || session.startCell.id !== startCell.id) {
      return;
    }

    const point = getBoardPointFromDrag(
      startCell,
      cellSize,
      BOARD_GAP,
      BOARD_PADDING,
      dx,
      dy,
    );

    const candidate = getCellAtBoardPoint(
      point,
      level.cells,
      cellSize,
      BOARD_GAP,
      BOARD_PADDING,
    );

    const referenceCell =
      session.basePath.length > 0
        ? cellMap.get(session.basePath[session.basePath.length - 1]) ?? startCell
        : startCell;

    if (
      candidate &&
      candidate.id !== referenceCell.id &&
      !session.basePath.includes(candidate.id) &&
      areOrthogonalNeighbors(referenceCell, candidate)
    ) {
      if (session.targetCell?.id !== candidate.id) {
        session.targetCell = candidate;
        setPendingCell(candidate);
        setMessage(
          `${formatMathValue(session.baseCurrentValue)} ile ${candidate.displayValue ?? formatMathValue(candidate.value)}: işlemi seç veya sürükle.`,
        );
      }
    }

    if (!session.targetCell) {
      return;
    }

    const layout = getOperatorArcLayout(
      session.targetCell,
      cellSize,
      boardSize,
      BOARD_GAP,
      BOARD_PADDING,
    );
    setPointerPosition(point);
    const candidateOperator = getOperatorAtBoardPoint(point, layout);
    const candidateResult = candidateOperator
      ? calculate(
          session.baseCurrentValue,
          candidateOperator,
          session.targetCell.value,
          level.rules,
        )
      : null;
    const operatorAllowed = candidateOperator
      ? level.allowedOperators.includes(candidateOperator)
      : false;
    const enabledOperator =
      candidateOperator && operatorAllowed && candidateResult?.ok
        ? candidateOperator
        : null;

    if (candidateOperator && !operatorAllowed) {
      setMessage(`${candidateOperator} işlemi bu bölümde henüz açık değil.`);
    } else if (candidateResult && !candidateResult.ok) {
      setMessage(candidateResult.reason);
    }

    if (session.activeOperator !== enabledOperator) {
      session.activeOperator = enabledOperator;
      setActiveOperator(enabledOperator);
    }
  }

  function handleDragEnd() {
    const session = dragSession.current;
    dragSession.current = null;

    if (session?.targetCell && session.activeOperator) {
      applyOperator(
        session.activeOperator,
        session.targetCell,
        session.baseCurrentValue,
        session.basePath,
        session.baseSteps,
      );
      return;
    }

    setActiveOperator(null);
    setPointerPosition(null);
    if (session?.targetCell) {
      setMessage('İşlemi yaydan seçebilir veya düğmeye dokunabilirsin.');
    }
  }

  function handleDragCancel() {
    const session = dragSession.current;
    dragSession.current = null;
    setActiveOperator(null);
    setPointerPosition(null);
    setPendingCell(null);

    if (session) {
      setMessage('Sürükleme iptal edildi. Komşu bir sayıya tekrar ilerle.');
    }
  }

  function revealNextHint() {
    setUsedHint(true);
    setHintStage((stage) => Math.min(4, stage + 1));
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
        () => undefined,
      );
    }
  }

  function isCellAvailable(cell: NumberCellModel) {
    if (won || lost) {
      return false;
    }

    if (path.length === 0 || pendingCell?.id === cell.id) {
      return true;
    }

    if (pendingCell || path.includes(cell.id) || !lastCell) {
      return false;
    }

    return areOrthogonalNeighbors(lastCell, cell);
  }

  const operatorArcLayout = pendingCell
    ? getOperatorArcLayout(
        pendingCell,
        cellSize,
        boardSize,
        BOARD_GAP,
        BOARD_PADDING,
      )
    : null;

  if (showPythagorasInterlude) {
    return (
      <View style={styles.interludeScreen}>
        <Image
          accessibilityLabel="Pisagor'un yaşamı ve Pisagor teoremi hakkında bilgi görseli"
          resizeMode="contain"
          source={PYTHAGORAS_INTERLUDE}
          style={styles.interludeImage}
        />
        <Pressable
          accessibilityRole="button"
          onPress={continueAfterPythagorasInterlude}
          style={({ pressed }) => [
            styles.interludeButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.interludeButtonText}>11. Bölüme Geç</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ImageBackground
      imageStyle={styles.backgroundImage}
      resizeMode="cover"
      source={isPaperTheme ? undefined : backgroundSource}
      style={[styles.screen, isPaperTheme && styles.screenPaper]}
    >
      {!isPaperTheme ? (
        <View pointerEvents="none" style={styles.backgroundScrim} />
      ) : null}

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: Platform.OS === 'android' ? 48 : 64 },
        ]}
        scrollEnabled={!pendingCell}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.levelTitle, isPaperTheme && styles.textPaper]}>
              {isDailyMode ? 'Günlük Bulmaca' : `Seviye ${level.number}`}
            </Text>
            <Text style={[styles.difficultyText, isPaperTheme && styles.mutedTextPaper]}>
              {isDailyMode ? `${todayDateStr} · 🔥 ${dailyStreak ?? 0} Gün` : `${mechanicLabel} · ${difficulty.label} ${difficulty.score}/100`}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            {isDailyMode ? (
              <Pressable
                accessibilityLabel="Günlük bulmacadan çık"
                accessibilityRole="button"
                onPress={exitDailyChallenge}
                style={({ pressed }) => [
                  styles.settingsButton,
                  isPaperTheme && styles.settingsButtonPaper,
                  pressed && styles.buttonPressed,
                  { paddingHorizontal: 10, width: 'auto' },
                ]}
              >
                <Text style={[{ fontSize: 12, fontWeight: '900' }, isPaperTheme ? styles.textPaper : { color: '#FFFFFF' }]}>
                  ✕ Çık
                </Text>
              </Pressable>
            ) : (
              <Pressable
                accessibilityLabel="Günlük Bulmaca"
                accessibilityRole="button"
                onPress={() => setDailyModalOpen(true)}
                style={({ pressed }) => [
                  styles.settingsButton,
                  isPaperTheme && styles.settingsButtonPaper,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={{ fontSize: 16 }}>🔥</Text>
              </Pressable>
            )}

            <Pressable
              accessibilityLabel="Ayarlar"
              accessibilityRole="button"
              onPress={() => setSettingsOpen(true)}
              style={({ pressed }) => [
                styles.settingsButton,
                isPaperTheme && styles.settingsButtonPaper,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={[styles.settingsIcon, isPaperTheme && styles.textPaper]}>⚙</Text>
            </Pressable>
          </View>
        </View>

        {level.number === 1 && !completedLevelNumbers.includes(1) && path.length === 0 ? (
          <GestureTutorialOverlay paper={isPaperTheme} />
        ) : null}


        {level.geniusChapter && level.number !== 10 ? (
          <BlurView intensity={isPaperTheme ? 12 : 40} tint={isPaperTheme ? "light" : "dark"} style={[styles.geniusCard, isPaperTheme && styles.panelPaper]}>
            <Text style={styles.geniusEyebrow}>DEHA BÖLÜMÜ</Text>
            <Text style={[styles.geniusTitle, isPaperTheme && styles.textPaper]}>
              {level.geniusChapter.mathematician} · {level.geniusChapter.period}
            </Text>
            <Text style={[styles.geniusText, isPaperTheme && styles.mutedTextPaper]}>{level.geniusChapter.note}</Text>
          </BlurView>
        ) : null}

        <BlurView intensity={isPaperTheme ? 12 : 42} tint={isPaperTheme ? "light" : "dark"} style={[styles.gameStatusCard, isPaperTheme && styles.panelPaper]}>
          <View style={styles.statusMetric}>
            <Text style={[styles.statusLabel, isPaperTheme && styles.mutedTextPaper]}>BÖLÜM</Text>
            <Text style={[styles.statusValue, isPaperTheme && styles.textPaper]}>
              {level.number}
            </Text>
          </View>

          <View style={[styles.statusDivider, isPaperTheme && styles.dividerPaper]} />

          <View style={[styles.statusMetric, styles.statusTargetMetric]}>
            <Text style={[styles.statusLabel, isPaperTheme && styles.mutedTextPaper]}>HEDEF</Text>
            <MathValueLabel
              style={[styles.statusTarget, isPaperTheme && styles.accentPaper]}
              value={level.target}
            />
          </View>

          <View style={[styles.statusDivider, isPaperTheme && styles.dividerPaper]} />

          <View style={styles.statusMetric}>
            <Text style={[styles.statusLabel, isPaperTheme && styles.mutedTextPaper]}>SÜRE</Text>
            <Text
              accessibilityLiveRegion="polite"
              style={[styles.statusTime, isPaperTheme && styles.textPaper, timeIsLow && styles.timerValueDanger]}
            >
              {formattedTime}
            </Text>
          </View>

        </BlurView>

        {challengeRules.length > 0 ? (
          <View style={[styles.challengeCard, isPaperTheme && styles.panelPaper]}>
            <Text style={[styles.challengeLabel, isPaperTheme && styles.mutedTextPaper]}>
              BÖLÜM KURALI
            </Text>
            <View style={styles.challengeRuleList}>
              {challengeRules.map((rule) => (
                <View
                  accessibilityLabel={`${rule.label}: ${rule.satisfied ? 'tamamlandı' : 'henüz tamamlanmadı'}`}
                  accessible
                  key={rule.id}
                  style={[
                    styles.challengeRuleBadge,
                    isPaperTheme && styles.challengeRuleBadgePaper,
                    rule.satisfied && styles.challengeRuleBadgeSatisfied,
                    rule.satisfied &&
                      isPaperTheme &&
                      styles.challengeRuleBadgeSatisfiedPaper,
                  ]}
                >
                  <View
                    style={[
                      styles.challengeCheck,
                      isPaperTheme && styles.challengeCheckPaper,
                      rule.satisfied && styles.challengeCheckSatisfied,
                    ]}
                  >
                    <Text style={styles.challengeCheckText}>
                      {rule.satisfied ? '✓' : ''}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.challengeRuleText,
                      isPaperTheme && styles.textPaper,
                      rule.satisfied && styles.challengeRuleTextSatisfied,
                      rule.satisfied &&
                        isPaperTheme &&
                        styles.challengeRuleTextSatisfiedPaper,
                    ]}
                  >
                    {rule.label}
                  </Text>
                  {rule.progress ? (
                    <Text
                      style={[
                        styles.challengeProgress,
                        isPaperTheme && styles.mutedTextPaper,
                        rule.satisfied && styles.challengeRuleTextSatisfied,
                        rule.satisfied &&
                          isPaperTheme &&
                          styles.challengeRuleTextSatisfiedPaper,
                      ]}
                    >
                      {rule.progress}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <BlurView
          intensity={isPaperTheme ? 10 : 48}
          tint={isPaperTheme ? "light" : "dark"}
          style={[
            styles.board,
            isPaperTheme && styles.boardPaper,
            { width: boardSize, height: boardSize },
          ]}
        >
          {Array.from({ length: level.rows }, (_, rowIndex) => (
            <View key={rowIndex} style={styles.boardRow}>
              {level.cells
                .filter((cell) => cell.position.row === rowIndex)
                .map((cell) => (
                  <NumberCell
                    activeResult={steps.length > 0 && lastCell?.id === cell.id}
                    available={isCellAvailable(cell)}
                    cell={cell}
                    displayValue={
                      steps.length > 0 &&
                      lastCell?.id === cell.id &&
                      currentValue !== null
                        ? currentValue
                        : undefined
                    }
                    key={cell.id}
                    merge={
                      mergeAnimation?.fromId === cell.id
                        ? {
                            key: mergeAnimation.key,
                            role: 'source',
                            offsetX: mergeAnimation.offsetX,
                            offsetY: mergeAnimation.offsetY,
                          }
                        : mergeAnimation?.toId === cell.id
                          ? {
                              key: mergeAnimation.key,
                              role: 'target',
                              offsetX: -mergeAnimation.offsetX,
                              offsetY: -mergeAnimation.offsetY,
                            }
                          : undefined
                    }
                    onDragCancel={handleDragCancel}
                    onDragEnd={handleDragEnd}
                    onDragMove={handleDragMove}
                    onDragStart={handleDragStart}
                    onPress={handleCellPress}
                    paper={isPaperTheme}
                    pending={pendingCell?.id === cell.id}
                    selected={path.includes(cell.id)}
                    size={cellSize}
                    won={won}
                  />
                ))}
            </View>
          ))}

          <View pointerEvents="none" style={styles.connectionOverlay}>
            {steps.map((step, index) => {
              const fromCell = cellMap.get(path[index]);
              const toCell = cellMap.get(path[index + 1]);

              if (!fromCell || !toCell) {
                return null;
              }

              const connection = getConnectionLayout(
                fromCell,
                toCell,
                cellSize,
              );

              return (
                <View key={`${step.cellId}-${index}`}>
                  <View style={[styles.connectionLine, isPaperTheme && styles.connectionLinePaper, connection.line]} />
                  <View
                    accessibilityLabel={`${step.operator} işlemi`}
                    style={[styles.connectionOperator, isPaperTheme && styles.connectionOperatorPaper, connection.operator]}
                  >
                    <Text style={[styles.connectionOperatorText, isPaperTheme && styles.connectionOperatorTextPaper]}>
                      {step.operator}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {pendingCell && currentValue !== null && operatorArcLayout ? (
            <OperatorPopover
              activeOperator={activeOperator}
              allowedOperators={level.allowedOperators}
              currentValue={currentValue}
              layout={operatorArcLayout}
              onSelect={handleOperator}
              operand={pendingCell.value}
              paper={isPaperTheme}
              pointerPosition={pointerPosition}
              rules={level.rules}
            />
          ) : null}
        </BlurView>

        {!won && !lost ? (
          <BlurView
          accessibilityLiveRegion="polite"
          intensity={isPaperTheme ? 10 : 34}
          tint={isPaperTheme ? "light" : "dark"}
          style={[
            styles.messageCard,
            isPaperTheme && styles.panelPaper,
          ]}
        >
          <View
            style={[
              styles.messageDot,
              isPaperTheme && styles.messageDotPaper,
            ]}
          />
          <Text style={[styles.message, isPaperTheme && styles.textPaper]}>{message}</Text>
          </BlurView>
        ) : null}

        {lost ? (
          <FailCard
            canUndoMoves={path.length >= 2}
            failureReason={failureReason}
            onRetry={() => resetGame()}
            onUndoTwoMoves={() => {
              undo();
              undo();
            }}
            onUseHint={() => revealNextHint()}
            paper={isPaperTheme}
          />
        ) : !won ? (
          <View style={styles.actions}>
            <Pressable
              accessibilityLabel="Son işlemi geri al"
              accessibilityRole="button"
              disabled={path.length === 0}
              onPress={undo}
              style={({ pressed }) => [
                styles.secondaryButton,
                isPaperTheme && styles.softButtonPaper,
                path.length === 0 && styles.buttonDisabled,
                pressed && styles.buttonPressed,
              ]}
            >
              <View style={styles.secondaryButtonContent}>
                <Text
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                  style={[styles.secondaryButtonIcon, isPaperTheme && styles.textPaper]}
                >
                  ↶
                </Text>
                <Text style={[styles.secondaryButtonText, isPaperTheme && styles.textPaper]}>Geri Al</Text>
              </View>
            </Pressable>
            <Pressable
              accessibilityLabel="Mevcut denemeyi temizle"
              accessibilityRole="button"
              disabled={path.length === 0}
              onPress={clearAttempt}
              style={({ pressed }) => [
                styles.secondaryButton,
                isPaperTheme && styles.softButtonPaper,
                path.length === 0 && styles.buttonDisabled,
                pressed && styles.buttonPressed,
              ]}
            >
              <View style={styles.secondaryButtonContent}>
                <Text
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                  style={[styles.secondaryButtonIcon, isPaperTheme && styles.textPaper]}
                >
                  ✕
                </Text>
                <Text style={[styles.secondaryButtonText, isPaperTheme && styles.textPaper]}>Temizle</Text>
              </View>
            </Pressable>
          </View>
        ) : null}

        {showHints && !won && !lost ? (
          <StagedHint level={level} onReveal={revealNextHint} paper={isPaperTheme} stage={hintStage} />
        ) : null}
      </ScrollView>

      <Modal
        animationType="fade"
        onRequestClose={
          isDailyMode
            ? exitDailyChallenge
            : () => setAutoAdvancePaused(true)
        }
        presentationStyle="overFullScreen"
        statusBarTranslucent
        transparent
        visible={won && completionSummary !== null}
      >
        <View style={styles.successOverlay}>
          {completionSummary ? (
            <SuccessCard
              autoAdvanceRemainingMs={autoAdvanceRemainingMs}
              canGoNext={isDailyMode || canGoNext}
              nextLabel={isDailyMode ? 'Günlük Bulmacadan Çık' : undefined}
              onNext={() => {
                if (isDailyMode) {
                  exitDailyChallenge();
                  return;
                }
                changeLevel(levelIndex + 1);
              }}
              onReplay={() => resetGame()}
              onStay={() => setAutoAdvancePaused(true)}
              paper={isPaperTheme}
              parPathLength={level.parPathLength}
              pathLength={path.length}
              summary={completionSummary}
            />
          ) : null}
        </View>
      </Modal>

      <SettingsModal

        completedLevelNumbers={completedLevelNumbers}
        currentLevelIndex={levelIndex}

        levelRecords={levelRecords}

        onClose={() => setSettingsOpen(false)}

        onOpenWallBreaker={() => {
          setSettingsOpen(false);
          onOpenWallBreaker();
        }}
        onOpenWordWheel={() => {
          setSettingsOpen(false);
          onOpenWordWheel();
        }}
        onRestart={() => {
          setSettingsOpen(false);
          resetGame();
        }}
        onSelectLevel={selectLevelFromSettings}
        onShowHintsChange={(value) => updateSettings({ showHints: value })}
        onThemeChange={(value) => updateSettings({ themeId: value })}
        showHints={showHints}
        themeId={themeId}
        visible={settingsOpen}
      />

      <DailyChallengeModal
        dailyLevel={dailyLevel}
        dailyStreak={dailyStreak ?? 0}
        isCompletedToday={lastDailyCompletedDate === todayDateStr}
        onClose={() => setDailyModalOpen(false)}
        onStartDaily={() => {
          setIsDailyMode(true);
          resetGame(dailyLevel.timeLimitSeconds);
        }}
        paper={isPaperTheme}
        visible={dailyModalOpen}
      />
    </ImageBackground>
  );
}

function getConnectionLayout(
  fromCell: NumberCellModel,
  toCell: NumberCellModel,
  cellSize: number,
) {
  const fromX =
    BOARD_PADDING +
    fromCell.position.column * (cellSize + BOARD_GAP) +
    cellSize / 2;
  const fromY =
    BOARD_PADDING +
    fromCell.position.row * (cellSize + BOARD_GAP) +
    cellSize / 2;
  const toX =
    BOARD_PADDING +
    toCell.position.column * (cellSize + BOARD_GAP) +
    cellSize / 2;
  const toY =
    BOARD_PADDING +
    toCell.position.row * (cellSize + BOARD_GAP) +
    cellSize / 2;
  const middleX = (fromX + toX) / 2;
  const middleY = (fromY + toY) / 2;

  if (fromCell.position.row === toCell.position.row) {
    return {
      line: {
        left: Math.min(fromX, toX) + cellSize / 2 - 2,
        top: middleY - 2,
        width: BOARD_GAP + 4,
        height: 4,
      },
      operator: { left: middleX - 17, top: middleY - 12 },
    };
  }

  return {
    line: {
      left: middleX - 2,
      top: Math.min(fromY, toY) + cellSize / 2 - 2,
      width: 4,
      height: BOARD_GAP + 4,
    },
    operator: { left: middleX - 17, top: middleY - 12 },
  };
}

const styles = StyleSheet.create({
  interludeScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A0D0F',
  },
  interludeImage: {
    width: '100%',
    height: '100%',
  },
  interludeButton: {
    position: 'absolute',
    right: 22,
    bottom: Platform.OS === 'android' ? 28 : 42,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 244, 210, 0.8)',
    backgroundColor: 'rgba(9, 34, 50, 0.94)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.38,
    shadowRadius: 14,
    elevation: 10,
  },
  interludeButtonText: {
    color: '#FFF4D2',
    fontSize: 15,
    fontWeight: '900',
  },
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  successOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 36,
    backgroundColor: 'rgba(18, 20, 17, 0.58)',
  },
  screenPaper: {
    backgroundColor: '#F9F6F2',
  },
  settingsButtonPaper: {
    borderWidth: 1,
    borderColor: '#D8D0C8',
    backgroundColor: '#FDFDFB',
    shadowColor: '#4A443F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 5,
    boxShadow: '0 6px 18px rgba(74, 68, 63, 0.14)',
  },
  textPaper: {
    color: '#4A443F',
    textShadowColor: 'transparent',
  },
  mutedTextPaper: {
    color: '#8C847E',
  },
  accentPaper: {
    color: '#4A443F',
  },
  panelPaper: {
    borderWidth: 1,
    borderColor: '#D8D0C8',
    backgroundColor: '#FDFDFB',
    shadowColor: '#4A443F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 6,
    boxShadow: '0 8px 24px rgba(74, 68, 63, 0.13)',
  },
  softButtonPaper: {
    borderColor: '#D8D0C8',
    backgroundColor: '#FDFDFB',
  },
  dividerPaper: {
    backgroundColor: '#E5E0DA',
  },
  boardPaper: {
    borderWidth: 2,
    borderColor: '#D8D0C8',
    backgroundColor: '#E5E0DA',
    shadowColor: '#4A443F',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 8,
    boxShadow: '0 12px 30px rgba(74, 68, 63, 0.16)',
  },
  connectionLinePaper: {
    backgroundColor: '#8C847E',
    shadowColor: '#8C847E',
  },
  connectionOperatorPaper: {
    borderColor: '#8C847E',
    backgroundColor: '#FDFDFB',
    shadowColor: '#8C847E',
  },
  messageDotPaper: {
    backgroundColor: '#8C847E',
  },
  primaryButtonPaper: {
    backgroundColor: '#4A443F',
  },
  primaryButtonTextPaper: {
    color: '#FDFDFB',
  },
  backgroundImage: {
    transform: [{ scale: 1.02 }],
  },
  backgroundScrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(8, 20, 12, 0.24)',
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 38,
  },
  header: {
    width: '100%',
    maxWidth: 420,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  settingsButton: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.46)',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#071108',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.24,
    shadowRadius: 18,
    elevation: 8,
  },
  settingsIcon: {
    color: colors.text,
    fontSize: 25,
    fontWeight: '700',
  },
  levelTitle: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  difficultyText: {
    marginTop: 5,
    color: 'rgba(255, 255, 255, 0.62)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  headerStats: {
    flexDirection: 'row',
    gap: 8,
  },
  timerCard: {
    minWidth: 78,
    alignItems: 'center',
    overflow: 'hidden',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  timerCardDanger: {
    borderColor: 'rgba(255, 155, 147, 0.75)',
    backgroundColor: 'rgba(110, 34, 28, 0.48)',
  },
  timerValue: {
    marginTop: 1,
    color: colors.white,
    fontSize: 24,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  timerValueDanger: {
    color: colors.danger,
  },
  targetCard: {
    minWidth: 88,
    alignItems: 'center',
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#071108',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.26,
    shadowRadius: 24,
    elevation: 8,
  },
  targetLabel: {
    color: 'rgba(255, 255, 255, 0.74)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  targetValue: {
    marginTop: 1,
    color: colors.white,
    fontSize: 31,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  gameStatusCard: {
    width: '100%',
    maxWidth: 420,
    minHeight: 82,
    marginBottom: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    overflow: 'hidden',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.panelBorder,
    backgroundColor: colors.panel,
    shadowColor: '#071108',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.24,
    shadowRadius: 24,
    elevation: 9,
  },
  challengeCard: {
    width: '100%',
    maxWidth: 420,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(223, 255, 134, 0.42)',
    backgroundColor: 'rgba(34, 53, 28, 0.52)',
  },
  challengeLabel: {
    color: colors.selected,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  challengeRuleList: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  challengeRuleBadge: {
    minHeight: 30,
    maxWidth: '100%',
    paddingHorizontal: 8,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.24)',
    backgroundColor: 'rgba(13, 29, 18, 0.32)',
  },
  challengeRuleBadgePaper: {
    borderColor: '#D8D0C8',
    backgroundColor: '#F4F0EA',
  },
  challengeRuleBadgeSatisfied: {
    borderColor: 'rgba(200, 255, 139, 0.72)',
    backgroundColor: 'rgba(102, 154, 73, 0.3)',
  },
  challengeRuleBadgeSatisfiedPaper: {
    borderColor: '#8DB47D',
    backgroundColor: '#E7F1E2',
  },
  challengeCheck: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.46)',
  },
  challengeCheckPaper: {
    borderColor: '#B7AFA8',
  },
  challengeCheckSatisfied: {
    borderColor: colors.success,
    backgroundColor: colors.success,
  },
  challengeCheckText: {
    color: '#315126',
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '900',
  },
  challengeRuleText: {
    flexShrink: 1,
    color: colors.text,
    fontSize: 11,
    fontWeight: '800',
  },
  challengeRuleTextSatisfied: {
    color: colors.success,
  },
  challengeRuleTextSatisfiedPaper: {
    color: '#416D36',
  },
  challengeProgress: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  statusMetric: {
    flex: 1,
    minWidth: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTargetMetric: {
    flex: 1.25,
  },
  statusLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  statusValue: {
    marginTop: 4,
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  statusTarget: {
    marginTop: 1,
    color: colors.selected,
    fontSize: 38,
    lineHeight: 42,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  statusTime: {
    marginTop: 4,
    color: colors.text,
    fontSize: 19,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  statusDivider: {
    width: 1,
    height: 38,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  levelNavigation: {
    width: '100%',
    maxWidth: 420,
    marginBottom: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.32)',
    backgroundColor: 'rgba(19, 32, 22, 0.3)',
  },
  levelArrowButton: {
    width: 44,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.34)',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  levelArrow: {
    marginTop: -4,
    color: colors.text,
    fontSize: 32,
    fontWeight: '500',
  },
  levelPosition: {
    alignItems: 'center',
  },
  levelPositionLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  levelPositionValue: {
    marginTop: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  geniusCard: {
    width: '100%',
    maxWidth: 420,
    marginBottom: 12,
    overflow: 'hidden',
    padding: 15,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(223, 255, 134, 0.5)',
    backgroundColor: 'rgba(52, 73, 31, 0.4)',
  },
  geniusEyebrow: {
    color: colors.selected,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  geniusTitle: {
    marginTop: 5,
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  geniusText: {
    marginTop: 5,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },
  board: {
    position: 'relative',
    justifyContent: 'space-between',
    overflow: 'hidden',
    padding: BOARD_PADDING,
    borderRadius: 34,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.52)',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#071108',
    shadowOffset: { width: 0, height: 22 },
    shadowOpacity: 0.32,
    shadowRadius: 34,
    elevation: 12,
  },
  connectionOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 30,
  },
  connectionLine: {
    position: 'absolute',
    borderRadius: 2,
    backgroundColor: 'rgba(222, 235, 216, 0.78)',
    shadowColor: '#071108',
    shadowOpacity: 0.34,
    shadowRadius: 4,
  },
  connectionOperator: {
    position: 'absolute',
    width: 34,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: 'rgba(223, 255, 134, 0.9)',
    backgroundColor: '#15251B',
    shadowColor: '#071108',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 12,
  },
  connectionOperatorText: {
    color: '#F4FFD8',
    fontSize: 16,
    fontWeight: '900',
  },
  connectionOperatorTextPaper: {
    color: '#4A443F',
  },
  boardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  messageCard: {
    width: '100%',
    maxWidth: 420,
    minHeight: 52,
    marginTop: 16,
    paddingHorizontal: 15,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: 19,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.34)',
    backgroundColor: 'rgba(19, 32, 22, 0.34)',
  },
  messageDot: {
    width: 8,
    height: 8,
    marginRight: 10,
    borderRadius: 4,
    backgroundColor: colors.pending,
  },
  message: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  actions: {
    width: '100%',
    maxWidth: 420,
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  secondaryButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    backgroundColor: 'rgba(22, 36, 25, 0.58)',
  },
  secondaryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  secondaryButtonIcon: {
    color: colors.text,
    fontSize: 20,
    lineHeight: 22,
    fontWeight: '800',
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  buttonDisabled: {
    opacity: 0.38,
  },
  buttonPressed: {
    transform: [{ scale: 0.97 }],
  },
  winCard: {
    width: '100%',
    maxWidth: 420,
    marginTop: 14,
    padding: 20,
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(85, 209, 135, 0.38)',
    backgroundColor: 'rgba(43, 84, 39, 0.72)',
  },
  winEyebrow: {
    color: colors.success,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  winTitle: {
    marginTop: 5,
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
  },
  winText: {
    marginTop: 6,
    color: '#B7D9CC',
    fontSize: 14,
    fontWeight: '600',
  },
  primaryButton: {
    width: '100%',
    maxWidth: 420,
    marginTop: 14,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: colors.success,
  },
  primaryButtonText: {
    color: '#17301F',
    fontSize: 15,
    fontWeight: '900',
  },
  failCard: {
    width: '100%',
    maxWidth: 420,
    marginTop: 14,
    overflow: 'hidden',
    padding: 20,
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 155, 147, 0.55)',
    backgroundColor: 'rgba(77, 30, 25, 0.62)',
  },
  failEyebrow: {
    color: colors.danger,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  failTitle: {
    marginTop: 5,
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
  },
  failText: {
    marginTop: 7,
    color: 'rgba(255, 232, 229, 0.84)',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    textAlign: 'center',
  },
  retryButton: {
    width: '100%',
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: colors.white,
  },
  retryButtonText: {
    color: '#17301F',
    fontSize: 15,
    fontWeight: '900',
  },
});
