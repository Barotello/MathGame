import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

type Props = {
  compact?: boolean;
  paper?: boolean;
};

export function GestureTutorialOverlay({ compact = false, paper = false }: Props) {
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
    <View pointerEvents="none" style={[styles.overlay, compact && styles.overlayCompact]}>
      <View style={[styles.badge, compact && styles.badgeCompact, paper && styles.badgePaper]}>
        <Animated.View style={{ transform: [{ translateY }] }}>
          <Text style={styles.handIcon}>☝️</Text>
        </Animated.View>
        <Text style={[styles.text, paper && styles.textPaper]}>
          Bir sayıya dokun, komşusunu seç ve işlemi yap. İstersen sürükle!
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
    marginTop: 12,
    marginBottom: 12,
  },
  overlayCompact: {
    marginTop: 8,
    marginBottom: 8,
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
    backgroundColor: 'rgba(67, 106, 63, 0.94)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  badgeCompact: {
    minHeight: 42,
    paddingVertical: 8,
  },
  badgePaper: {
    borderWidth: 1,
    borderColor: '#E1BF86',
    backgroundColor: '#FFF0D2',
  },
  handIcon: {
    fontSize: 20,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    flexShrink: 1,
    lineHeight: 16,
  },
  textPaper: {
    color: '#6A4316',
  },
});
