import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

const PAGE_TEAR_DURATION_MS = 760;

type Props = {
  index: number;
  letter: string | null;
  paper: boolean;
  revealed: boolean;
  size: number;
  spinning: boolean;
};

export function LetterSlot({
  index,
  letter,
  paper,
  revealed,
  size,
  spinning,
}: Props) {
  const [pageVisible, setPageVisible] = useState(letter === null);
  const previousLetter = useRef<string | null>(letter);
  const tearProgress = useRef(new Animated.Value(letter ? 1 : 0)).current;

  const answerStyle = {
    opacity: tearProgress.interpolate({
      inputRange: [0, 0.16, 0.62],
      outputRange: [0.08, 0.5, 1],
      extrapolate: 'clamp',
    }),
    transform: [
      {
        scale: tearProgress.interpolate({
          inputRange: [0, 0.72, 1],
          outputRange: [0.88, 1.04, 1],
        }),
      },
    ],
  };

  const tearingPageStyle = {
    opacity: tearProgress.interpolate({
      inputRange: [0, 0.58, 0.88, 1],
      outputRange: [1, 1, 0.62, 0],
      extrapolate: 'clamp',
    }),
    transform: [
      { perspective: 560 },
      {
        translateY: tearProgress.interpolate({
          inputRange: [0, 0.18, 1],
          outputRange: [0, size * 0.1, size * 0.86],
        }),
      },
      {
        translateX: tearProgress.interpolate({
          inputRange: [0, 0.38, 1],
          outputRange: [0, -2, size * 0.34],
        }),
      },
      {
        rotateX: tearProgress.interpolate({
          inputRange: [0, 0.36, 1],
          outputRange: ['0deg', '-8deg', '-24deg'],
        }),
      },
      {
        rotateZ: tearProgress.interpolate({
          inputRange: [0, 0.28, 1],
          outputRange: ['0deg', '-5deg', '-18deg'],
        }),
      },
      {
        scale: tearProgress.interpolate({
          inputRange: [0, 0.62, 1],
          outputRange: [1, 0.98, 0.84],
        }),
      },
    ],
  };

  useEffect(() => {
    let startTearTimer: ReturnType<typeof setTimeout> | null = null;
    let hidePageTimer: ReturnType<typeof setTimeout> | null = null;
    let activeAnimation: Animated.CompositeAnimation | null = null;

    if (letter && previousLetter.current !== letter) {
      setPageVisible(true);
      tearProgress.setValue(0);
      startTearTimer = setTimeout(() => {
        activeAnimation = Animated.timing(tearProgress, {
          toValue: 1,
          duration: PAGE_TEAR_DURATION_MS,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        });
        activeAnimation.start();
      }, 32);
      hidePageTimer = setTimeout(() => {
        setPageVisible(false);
      }, PAGE_TEAR_DURATION_MS + 32);
    } else if (spinning && !letter) {
      setPageVisible(true);
      activeAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(tearProgress, {
            toValue: 0.07,
            duration: 90,
            useNativeDriver: true,
          }),
          Animated.timing(tearProgress, {
            toValue: 0,
            duration: 90,
            useNativeDriver: true,
          }),
        ]),
      );
      activeAnimation.start();
    } else if (!letter) {
      tearProgress.stopAnimation();
      tearProgress.setValue(0);
      setPageVisible(true);
    } else {
      tearProgress.stopAnimation();
      tearProgress.setValue(1);
      setPageVisible(false);
    }

    previousLetter.current = letter;

    return () => {
      if (startTearTimer) clearTimeout(startTearTimer);
      if (hidePageTimer) clearTimeout(hidePageTimer);
      activeAnimation?.stop();
    };
  }, [letter, spinning, tearProgress]);

  const cornerRadius = Math.max(14, Math.round(size * 0.25));
  const letterSize = Math.max(23, Math.min(38, Math.round(size * 0.49)));

  return (
    <View
      accessibilityLabel={
        letter
          ? `${index + 1}. harf ${letter}`
          : `${index + 1}. harf kapalı`
      }
      style={[
        styles.slot,
        paper ? styles.slotPaper : styles.slotGlass,
        letter && (paper ? styles.filledPaper : styles.filledGlass),
        revealed && (paper ? styles.revealedPaper : styles.revealedGlass),
        {
          width: size,
          height: Math.max(64, Math.min(92, Math.round(size * 1.18))),
          borderRadius: cornerRadius,
        },
      ]}
    >
      <View
        style={[
          styles.calendarBinding,
          paper ? styles.calendarBindingPaper : styles.calendarBindingGlass,
        ]}
      >
        {[0, 1, 2].map((hole) => (
          <View
            key={hole}
            style={[
              styles.bindingHole,
              paper ? styles.bindingHolePaper : styles.bindingHoleGlass,
            ]}
          />
        ))}
      </View>

      {letter ? (
        <Animated.Text
          style={[
            styles.letter,
            { fontSize: letterSize },
            paper ? styles.letterPaper : styles.letterGlass,
            answerStyle,
          ]}
        >
          {letter}
        </Animated.Text>
      ) : null}

      {pageVisible ? (
        <Animated.View
          testID={`calendar-page-${index}`}
          accessibilityElementsHidden
          importantForAccessibility="no"
          style={[
            styles.calendarPage,
            paper ? styles.calendarPagePaper : styles.calendarPageGlass,
            { borderRadius: cornerRadius - 2 },
            tearingPageStyle,
          ]}
        >
          <View
            style={[
              styles.perforation,
              paper ? styles.perforationPaper : styles.perforationGlass,
            ]}
          />
          <Text
            style={[
              styles.pageQuestion,
              { fontSize: letterSize },
              paper ? styles.letterPaper : styles.letterGlass,
            ]}
          >
            ?
          </Text>
          <Text
            style={[
              styles.pageIndex,
              paper ? styles.indexPaper : styles.indexGlass,
            ]}
          >
            {index + 1}
          </Text>
        </Animated.View>
      ) : null}

      {!pageVisible ? (
        <Text style={[styles.index, paper ? styles.indexPaper : styles.indexGlass]}>
          {index + 1}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    overflow: 'visible',
  },
  slotPaper: {
    borderColor: '#D8CFC5',
    backgroundColor: '#FFF8EF',
    boxShadow: '0 8px 14px rgba(116,104,93,0.13)',
  },
  slotGlass: {
    borderColor: 'rgba(255,255,255,0.48)',
    backgroundColor: 'rgba(29,58,39,0.82)',
  },
  filledPaper: {
    borderColor: '#B89B83',
    backgroundColor: '#FFF8EF',
  },
  filledGlass: {
    borderColor: 'rgba(255,255,255,0.72)',
    backgroundColor: 'rgba(29,58,39,0.82)',
  },
  revealedPaper: {
    borderColor: '#9C7658',
    backgroundColor: '#F6EBDD',
  },
  revealedGlass: {
    borderColor: '#CBEA9B',
    backgroundColor: 'rgba(82,107,57,0.8)',
  },
  calendarBinding: {
    position: 'absolute',
    zIndex: 4,
    top: -5,
    left: '26%',
    right: '26%',
    height: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calendarBindingPaper: {},
  calendarBindingGlass: {},
  bindingHole: {
    width: 7,
    height: 7,
    borderRadius: 4,
    borderWidth: 1,
  },
  bindingHolePaper: {
    borderColor: '#A98A70',
    backgroundColor: '#F8F3ED',
  },
  bindingHoleGlass: {
    borderColor: 'rgba(203,234,155,0.72)',
    backgroundColor: '#173322',
  },
  letter: {
    fontWeight: '900',
  },
  letterPaper: {
    color: '#493F37',
  },
  letterGlass: {
    color: '#FFFFFF',
  },
  calendarPage: {
    ...StyleSheet.absoluteFill,
    zIndex: 3,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backfaceVisibility: 'hidden',
  },
  calendarPagePaper: {
    borderColor: '#D8CFC5',
    borderWidth: 1,
    backgroundColor: '#FFFDFC',
    boxShadow: '0 5px 9px rgba(86,67,51,0.18)',
  },
  calendarPageGlass: {
    borderColor: 'rgba(255,255,255,0.34)',
    borderWidth: 1,
    backgroundColor: '#193A28',
    boxShadow: '0 5px 9px rgba(0,0,0,0.22)',
  },
  perforation: {
    position: 'absolute',
    top: 12,
    left: 7,
    right: 7,
    borderTopWidth: 1,
    borderStyle: 'dashed',
  },
  perforationPaper: {
    borderColor: 'rgba(156,118,88,0.42)',
  },
  perforationGlass: {
    borderColor: 'rgba(203,234,155,0.38)',
  },
  pageQuestion: {
    fontWeight: '900',
  },
  index: {
    position: 'absolute',
    bottom: 7,
    fontSize: 10,
    fontWeight: '800',
  },
  pageIndex: {
    position: 'absolute',
    bottom: 6,
    fontSize: 10,
    fontWeight: '800',
  },
  indexPaper: {
    color: '#A69789',
  },
  indexGlass: {
    color: 'rgba(255,255,255,0.55)',
  },
});
