import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ViewStyle } from 'react-native';

import { levels } from '../data/levels';
import { colors } from '../theme/colors';
import type { LevelRecord } from '../types/progress';

const hiddenWebScrollbarStyle =
  Platform.OS === 'web'
    ? ({
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      } as unknown as ViewStyle)
    : undefined;

type Props = {
  completedLevelNumbers: number[];
  currentLevelIndex: number;
  levelRecords: Record<number, LevelRecord>;
  onSelectLevel: (index: number) => void;
  paper?: boolean;
};

type LevelStarProps = {
  filled: boolean;
  paper: boolean;
  current: boolean;
};

function LevelStar({ filled, paper, current }: LevelStarProps) {
  return (
    <View style={styles.starShell}>
      <Text
        style={[
          styles.starDepth,
          !filled && styles.starDepthEmpty,
          paper && styles.starDepthPaper,
        ]}
      >
        ★
      </Text>
      <Text
        style={[
          styles.starFace,
          !filled && styles.starFaceEmpty,
          paper && !current && !filled && styles.starFaceEmptyPaper,
        ]}
      >
        ★
      </Text>
      {filled ? <Text style={styles.starShine}>•</Text> : null}
    </View>
  );
}

export function LevelPicker({
  completedLevelNumbers,
  currentLevelIndex,
  levelRecords,
  onSelectLevel,
  paper = false,
}: Props) {
  const [scrollOffset, setScrollOffset] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const trackHeight = Math.max(0, viewportHeight - 24);
  const thumbHeight =
    contentHeight > viewportHeight && viewportHeight > 0
      ? Math.max(30, (trackHeight * viewportHeight) / contentHeight)
      : trackHeight;
  const maxScroll = Math.max(0, contentHeight - viewportHeight);
  const maxThumbTravel = Math.max(0, trackHeight - thumbHeight);
  const thumbOffset =
    maxScroll > 0
      ? Math.min(maxThumbTravel, (scrollOffset / maxScroll) * maxThumbTravel)
      : 0;
  const showScrollIndicator = contentHeight > viewportHeight + 1;

  return (
    <>
      <View style={styles.header}>
        <Text style={[styles.title, paper && styles.textPaper]}>
          Bölümler
        </Text>
        <Text style={[styles.progress, paper && styles.mutedTextPaper]}>
          {completedLevelNumbers.length}/{levels.length} ✓
        </Text>
      </View>

      <View style={[styles.scrollFrame, paper && styles.scrollFramePaper]}>
        <ScrollView
          contentContainerStyle={styles.grid}
          nestedScrollEnabled
          onContentSizeChange={(_, height) => setContentHeight(height)}
          onLayout={(event) =>
            setViewportHeight(event.nativeEvent.layout.height)
          }
          onScroll={(event) =>
            setScrollOffset(event.nativeEvent.contentOffset.y)
          }
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          style={[styles.scrollArea, hiddenWebScrollbarStyle]}
        >
        {levels.map((level, index) => {
          const completed = completedLevelNumbers.includes(level.number);
          const current = index === currentLevelIndex;
          const unlocked = true;
          const record = levelRecords[level.number];
          const earnedStars = record?.stars ?? 0;

          return (
            <Pressable
              accessibilityLabel={`${level.number}. bölüm${completed ? `, tamamlandı, ${record?.stars ?? 1} yıldız${record?.bestScore ? `, en iyi ${record.bestScore} puan` : ''}` : ''}${current ? ', şu an açık' : ''}${unlocked ? '' : ', kilitli'}`}
              accessibilityRole="button"
              accessibilityState={{ disabled: !unlocked, selected: current }}
              disabled={!unlocked}
              key={level.id}
              onPress={() => onSelectLevel(index)}
              style={({ pressed }) => [
                styles.button,
                paper && styles.buttonPaper,
                completed && styles.buttonCompleted,
                current && styles.buttonCurrent,
                !unlocked && styles.buttonLocked,
                paper && completed && styles.buttonCompletedPaper,
                paper && current && styles.buttonCurrentPaper,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text
                style={[
                  styles.number,
                  paper && styles.textPaper,
                  completed && styles.numberCompleted,
                  paper && completed && styles.numberCompletedPaper,
                  paper && current && styles.numberCurrentPaper,
                ]}
              >
                {level.number}
              </Text>
              <View style={styles.stars}>
                {[0, 1, 2].map((starIndex) => (
                  <LevelStar
                    current={current}
                    filled={starIndex < earnedStars}
                    key={starIndex}
                    paper={paper}
                  />
                ))}
              </View>
              {record?.bestScore ? (
                <View
                  style={[
                    styles.scoreBadge,
                    paper && styles.scoreBadgePaper,
                    current && styles.scoreBadgeCurrent,
                  ]}
                >
                  <Text
                    style={[
                      styles.score,
                      paper && styles.scorePaper,
                      current && styles.scoreCurrent,
                    ]}
                  >
                    {record.bestScore} PUAN
                  </Text>
                </View>
              ) : !unlocked ? (
                <Text style={[styles.lock, paper && styles.lockPaper]}>⌑</Text>
              ) : null}
            </Pressable>
          );
        })}
        </ScrollView>
        {showScrollIndicator ? (
          <View
            pointerEvents="none"
            style={[styles.scrollTrack, paper && styles.scrollTrackPaper]}
          >
            <View
              style={[
                styles.scrollThumb,
                paper && styles.scrollThumbPaper,
                {
                  height: thumbHeight,
                  transform: [{ translateY: thumbOffset }],
                },
              ]}
            />
          </View>
        ) : null}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  eyebrow: {
    color: '#007AFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  title: {
    marginTop: 3,
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  progress: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
  },
  scrollFrame: {
    position: 'relative',
    height: 252,
    marginTop: 13,
    overflow: 'hidden',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  scrollFramePaper: {
    borderColor: '#E5E0DA',
    backgroundColor: '#F5F0EA',
  },
  scrollArea: {
    flex: 1,
  },
  scrollTrack: {
    position: 'absolute',
    top: 12,
    right: 5,
    bottom: 12,
    width: 2,
    overflow: 'hidden',
    borderRadius: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  scrollTrackPaper: {
    backgroundColor: 'rgba(140, 132, 126, 0.16)',
  },
  scrollThumb: {
    width: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(0, 122, 255, 0.9)',
  },
  scrollThumbPaper: {
    backgroundColor: '#8C847E',
  },
  grid: {
    padding: 12,
    paddingRight: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    columnGap: 8,
    rowGap: 11,
  },
  button: {
    width: 84,
    height: 92,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.24)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  buttonPaper: {
    borderColor: '#DED6CE',
    backgroundColor: '#FDFDFB',
  },
  textPaper: {
    color: '#4A443F',
  },
  mutedTextPaper: {
    color: '#8C847E',
  },
  buttonCompleted: {
    borderColor: 'rgba(0, 122, 255, 0.68)',
    backgroundColor: 'rgba(0, 122, 255, 0.22)',
  },
  buttonCurrent: {
    borderWidth: 2,
    borderColor: '#007AFF',
    backgroundColor: 'rgba(0, 122, 255, 0.4)',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonLocked: {
    opacity: 0.38,
  },
  eyebrowPaper: {
    color: '#8C847E',
  },
  buttonCompletedPaper: {
    borderColor: '#8C847E',
    backgroundColor: 'rgba(140, 132, 126, 0.24)',
  },
  buttonCurrentPaper: {
    borderColor: '#4A443F',
    backgroundColor: '#8C847E',
    shadowColor: '#8C847E',
  },
  lock: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '900',
  },
  lockPaper: {
    color: '#8C847E',
  },
  buttonPressed: {
    opacity: 0.76,
    transform: [{ scale: 0.96 }],
  },
  number: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  numberCompletedPaper: {
    color: '#4A443F',
  },
  starsCompletedPaper: {
    color: '#8C847E',
  },
  numberCurrentPaper: {
    color: '#FFFFFF',
  },
  starsCurrentPaper: {
    color: 'rgba(255, 255, 255, 0.72)',
  },
  numberCompleted: {
    color: '#FFFFFF',
  },
  stars: {
    height: 20,
    marginTop: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: 1,
  },
  starShell: {
    position: 'relative',
    width: 18,
    height: 19,
  },
  starDepth: {
    position: 'absolute',
    top: 3,
    left: 1,
    color: '#8B4E00',
    fontSize: 17,
    lineHeight: 18,
    textShadowColor: 'rgba(0, 0, 0, 0.72)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2,
  },
  starDepthEmpty: {
    color: 'rgba(4, 10, 7, 0.5)',
  },
  starDepthPaper: {
    textShadowColor: 'rgba(74, 68, 63, 0.35)',
  },
  starFace: {
    position: 'absolute',
    top: 0,
    left: 1,
    color: '#FFD54A',
    fontSize: 17,
    lineHeight: 18,
    textShadowColor: '#FFF2A8',
    textShadowOffset: { width: -1, height: -1 },
    textShadowRadius: 1,
  },
  starFaceEmpty: {
    color: 'rgba(255, 255, 255, 0.2)',
    textShadowColor: 'transparent',
  },
  starFaceEmptyPaper: {
    color: 'rgba(140, 132, 126, 0.28)',
  },
  starShine: {
    position: 'absolute',
    top: -3,
    left: 6,
    color: '#FFF9D2',
    fontSize: 8,
    fontWeight: '900',
  },
  starsCompleted: {
    color: '#FFFFFF',
  },
  scoreBadge: {
    minWidth: 60,
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    backgroundColor: 'rgba(3, 10, 7, 0.34)',
  },
  scoreBadgePaper: {
    borderColor: 'rgba(74, 68, 63, 0.14)',
    backgroundColor: 'rgba(74, 68, 63, 0.08)',
  },
  scoreBadgeCurrent: {
    borderColor: 'rgba(255, 255, 255, 0.24)',
    backgroundColor: 'rgba(2, 22, 40, 0.38)',
  },
  score: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.15,
    fontVariant: ['tabular-nums'],
  },
  scoreCompleted: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  scorePaper: {
    color: '#5F5852',
  },
  scoreCurrent: {
    color: '#FFFFFF',
  },
  scoreCurrentPaper: {
    color: 'rgba(255, 255, 255, 0.82)',
  },
});
