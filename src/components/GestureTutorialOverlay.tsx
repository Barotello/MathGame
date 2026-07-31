import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

type Props = {
  paper?: boolean;
};

export function GestureTutorialOverlay({ paper = false }: Props) {
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: -5,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();

    return () => animation.stop();
  }, [translateY]);

  return (
    <View pointerEvents="none" style={styles.overlay}>
      <View style={[styles.badge, paper && styles.badgePaper]}>
        <Animated.View style={{ transform: [{ translateY }] }}>
          <Text style={styles.handIcon}>☝️</Text>
        </Animated.View>
        <Text style={[styles.text, paper && styles.textPaper]}>
          Sayıya basılı tut ve yukarı kaydırarak işlemi seç!
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    marginBottom: 14,
  },
  badge: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    borderCurve: 'continuous',
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 122, 255, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  badgePaper: {
    backgroundColor: 'rgba(74, 68, 63, 0.92)',
  },
  handIcon: {
    fontSize: 20,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  textPaper: {
    color: '#FFFFFF',
  },
});
