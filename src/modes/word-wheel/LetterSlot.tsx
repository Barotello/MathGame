import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';

const LETTERS = Array.from('ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ');

type Props = {
  index: number;
  paper: boolean;
  revealedLetter: string | null;
  spinning: boolean;
};

export function LetterSlot({ index, paper, revealedLetter, spinning }: Props) {
  const [displayLetter, setDisplayLetter] = useState(revealedLetter ?? '?');
  const motion = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!spinning || revealedLetter) {
      setDisplayLetter(revealedLetter ?? '?');
      motion.stopAnimation();
      motion.setValue(0);
      return;
    }

    const ticker = setInterval(() => {
      setDisplayLetter(LETTERS[Math.floor(Math.random() * LETTERS.length)]);
    }, 58);
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(motion, {
          duration: 90,
          toValue: -9,
          useNativeDriver: true,
        }),
        Animated.timing(motion, {
          duration: 90,
          toValue: 9,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();

    return () => {
      clearInterval(ticker);
      animation.stop();
      motion.setValue(0);
      setDisplayLetter(revealedLetter ?? '?');
    };
  }, [motion, revealedLetter, spinning]);

  return (
    <Animated.View
      accessibilityLabel={
        revealedLetter
          ? `${index + 1}. harf ${revealedLetter}`
          : `${index + 1}. harf kapalı`
      }
      style={[
        styles.slot,
        paper ? styles.slotPaper : styles.slotGlass,
        revealedLetter && (paper ? styles.revealedPaper : styles.revealedGlass),
        { transform: [{ translateY: motion }] },
      ]}
    >
      <Text style={[styles.letter, paper ? styles.letterPaper : styles.letterGlass]}>
        {displayLetter}
      </Text>
      <Text style={[styles.index, paper ? styles.indexPaper : styles.indexGlass]}>
        {index + 1}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  slot: {
    width: 78,
    height: 92,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 2,
  },
  slotPaper: {
    borderColor: '#D8CFC5',
    backgroundColor: '#FFFDFC',
    shadowColor: '#74685D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.13,
    shadowRadius: 14,
    elevation: 4,
  },
  slotGlass: {
    borderColor: 'rgba(255,255,255,0.48)',
    backgroundColor: 'rgba(15,35,24,0.72)',
  },
  revealedPaper: {
    borderColor: '#9C7658',
    backgroundColor: '#F6EBDD',
  },
  revealedGlass: {
    borderColor: '#CBEA9B',
    backgroundColor: 'rgba(82,107,57,0.8)',
  },
  letter: {
    fontSize: 38,
    fontWeight: '900',
  },
  letterPaper: {
    color: '#493F37',
  },
  letterGlass: {
    color: '#FFFFFF',
  },
  index: {
    position: 'absolute',
    bottom: 7,
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
