import { BlurView } from 'expo-blur';
import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors } from '../theme/colors';
import { themeOptions, type ThemeId } from '../theme/themes';
import type { LevelRecord } from '../types/progress';
import { LeaderboardPanel } from './LeaderboardPanel';
import { LevelPicker } from './LevelPicker';
import { ThemePicker } from './ThemePicker';

type Props = {
  activeGameMode: 'math' | 'word';
  completedLevelNumbers: number[];
  currentLevelIndex: number;
  levelRecords: Record<number, LevelRecord>;
  playerName?: string;
  onClose: () => void;
  onOpenMath: () => void;
  onOpenWordWheel: () => void;
  onRestart: () => void;
  onSelectLevel: (index: number) => void;
  onShowHintsChange: (value: boolean) => void;
  onThemeChange: (themeId: ThemeId) => void;
  showHints: boolean;
  showMathProgress?: boolean;
  themeId: ThemeId;
  visible: boolean;
};

export function SettingsModal({
  activeGameMode,
  completedLevelNumbers,
  currentLevelIndex,
  levelRecords,
  playerName,
  onClose,
  onOpenMath,
  onOpenWordWheel,
  onRestart,
  onSelectLevel,
  onShowHintsChange,
  onThemeChange,
  showHints,
  showMathProgress = true,
  themeId,
  visible,
}: Props) {
  const [screen, setScreen] = useState<'settings' | 'themes' | 'leaderboard'>('settings');
  const paper = themeId === 'paper';

  useEffect(() => {
    if (!visible) setScreen('settings');
  }, [visible]);

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.modal}>
        <Pressable
          accessibilityLabel="Ayarları kapat"
          onPress={onClose}
          style={[styles.backdrop, paper && styles.backdropPaper]}
        />

        <BlurView
          intensity={paper ? 78 : 60}
          tint={paper ? 'systemThinMaterialLight' : 'dark'}
          style={[styles.panel, paper && styles.panelPaper]}
        >
          {paper ? <View pointerEvents="none" style={styles.paperGlassSheen} /> : null}
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.header, paper && styles.headerPaper]}>
              <View>
                {screen !== 'settings' ? (
                  <Text style={[styles.eyebrow, paper && styles.eyebrowPaper]}>
                    {screen === 'themes' ? 'GÖRÜNÜM' : 'REKABET'}
                  </Text>
                ) : null}
                <Text style={[styles.title, paper && styles.textPaper]}>
                  {screen === 'themes' ? 'Tema' : screen === 'leaderboard' ? 'Genel Sıralama' : 'Ayarlar'}
                </Text>
              </View>
              <View style={styles.headerActions}>
                <Pressable
                  accessibilityLabel={screen !== 'settings' ? 'Ayarlara dön' : 'Ayarları kapat'}
                  accessibilityRole="button"
                  onPress={screen !== 'settings' ? () => setScreen('settings') : onClose}
                  style={[styles.closeButton, paper && styles.closeButtonPaper]}
                >
                  <Text style={[styles.closeText, paper && styles.textPaper]}>
                    {screen !== 'settings' ? '‹' : '×'}
                  </Text>
                </Pressable>
              </View>
            </View>

            {screen === 'themes' ? (
              <ThemePicker onSelect={onThemeChange} themeId={themeId} />
            ) : screen === 'leaderboard' ? (
              <LeaderboardPanel levelRecords={levelRecords} paper={paper} playerName={playerName} />
            ) : (
              <>
                <View style={styles.mainModesSection}>
                  <Text style={[styles.sectionEyebrow, paper && styles.sectionEyebrowPaper]}>
                    ANA OYUNLAR
                  </Text>
                  <Text style={[styles.sectionDescription, paper && styles.mutedTextPaper]}>
                    Oynamak istediğin alanı seç.
                  </Text>

                  <View style={styles.mainModesGrid}>
                    <Pressable
                      accessibilityLabel={
                        activeGameMode === 'math'
                          ? 'Matematik, aktif oyun alanı'
                          : 'Matematik oyun alanına geç'
                      }
                      accessibilityRole="button"
                      accessibilityState={{ selected: activeGameMode === 'math' }}
                      onPress={activeGameMode === 'math' ? onClose : onOpenMath}
                      style={({ pressed }) => [
                        styles.mainModeCard,
                        paper && styles.mainModeCardPaper,
                        activeGameMode === 'math'
                          ? styles.mathModeCard
                          : styles.inactiveModeCard,
                        paper &&
                          (activeGameMode === 'math'
                            ? styles.mathModeCardPaper
                            : styles.inactiveModeCardPaper),
                        pressed && styles.buttonPressed,
                      ]}
                    >
                      <View style={[styles.mainModeIcon, styles.mathMainModeIcon]}>
                        <Text style={styles.mainModeIconText}>∑</Text>
                      </View>
                      <Text style={[styles.mainModeTitle, paper && styles.textPaper]}>
                        Matematik
                      </Text>
                      <Text style={[styles.mainModeDescription, paper && styles.mutedTextPaper]}>
                        Hedef sayıyı bul
                      </Text>
                      {activeGameMode === 'math' ? (
                        <View style={[styles.activeModeBadge, paper && styles.activeModeBadgePaper]}>
                          <Text style={[styles.activeModeBadgeText, paper && styles.activeModeBadgeTextPaper]}>
                            ✓ AKTİF
                          </Text>
                        </View>
                      ) : (
                        <View style={[styles.enterModeBadge, paper && styles.enterModeBadgePaper]}>
                          <Text style={[styles.enterModeBadgeText, paper && styles.enterModeBadgeTextPaper]}>
                            OYNA  ›
                          </Text>
                        </View>
                      )}
                    </Pressable>

                    <Pressable
                      accessibilityLabel={
                        activeGameMode === 'word'
                          ? 'Kelime Bulma, aktif oyun alanı'
                          : 'Kelime Bulma oyun alanına geç'
                      }
                      accessibilityRole="button"
                      accessibilityState={{ selected: activeGameMode === 'word' }}
                      onPress={activeGameMode === 'word' ? onClose : onOpenWordWheel}
                      style={({ pressed }) => [
                        styles.mainModeCard,
                        paper && styles.mainModeCardPaper,
                        activeGameMode === 'word'
                          ? styles.wordMainModeCard
                          : styles.inactiveModeCard,
                        paper &&
                          (activeGameMode === 'word'
                            ? styles.wordMainModeCardPaper
                            : styles.inactiveModeCardPaper),
                        pressed && styles.buttonPressed,
                      ]}
                    >
                      <View style={[styles.mainModeIcon, styles.wordMainModeIcon]}>
                        <Text style={styles.mainModeIconText}>ABC</Text>
                      </View>
                      <Text style={[styles.mainModeTitle, paper && styles.textPaper]}>
                        Kelime Bulma
                      </Text>
                      <Text style={[styles.mainModeDescription, paper && styles.mutedTextPaper]}>
                        İpucundan kelimeyi çöz
                      </Text>
                      {activeGameMode === 'word' ? (
                        <View style={[styles.activeModeBadge, paper && styles.activeModeBadgePaper]}>
                          <Text style={[styles.activeModeBadgeText, paper && styles.activeModeBadgeTextPaper]}>
                            ✓ AKTİF
                          </Text>
                        </View>
                      ) : (
                        <View style={[styles.enterModeBadge, paper && styles.enterModeBadgePaper]}>
                          <Text style={[styles.enterModeBadgeText, paper && styles.enterModeBadgeTextPaper]}>
                            OYNA  ›
                          </Text>
                        </View>
                      )}
                    </Pressable>
                  </View>
                </View>

                <Pressable
                  accessibilityLabel="Genel sıralamayı aç"
                  accessibilityRole="button"
                  onPress={() => setScreen('leaderboard')}
                  style={({ pressed }) => [
                    styles.leaderboardRow,
                    paper && styles.leaderboardRowPaper,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <View style={[styles.leaderboardIcon, paper && styles.leaderboardIconPaper]}>
                    <Text style={styles.leaderboardIconText}>🏆</Text>
                  </View>
                  <View style={styles.rowCopy}>
                    <Text style={[styles.rowTitle, paper && styles.textPaper]}>
                      Genel Sıralama
                    </Text>
                    <Text style={[styles.rowText, paper && styles.mutedTextPaper]}>
                      Tüm oyuncularla puanını karşılaştır.
                    </Text>
                  </View>
                  <Text style={[styles.themeChevron, paper && styles.mutedTextPaper]}>›</Text>
                </Pressable>

                <Pressable
                  accessibilityLabel={`Tema, ${themeOptions[themeId].name}`}
                  accessibilityRole="button"
                  onPress={() => setScreen('themes')}
                  style={({ pressed }) => [
                    styles.themeRow,
                    paper && styles.themeRowPaper,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <View style={styles.rowCopy}>
                    <Text style={[styles.rowTitle, paper && styles.textPaper]}>Tema</Text>
                    <Text style={[styles.rowText, paper && styles.mutedTextPaper]}>
                      {themeOptions[themeId].name}
                    </Text>
                  </View>
                  <View style={[styles.themeSwatch, paper && styles.themeSwatchPaper]} />
                  <Text style={[styles.themeChevron, paper && styles.mutedTextPaper]}>›</Text>
                </Pressable>

                <SettingRow
                  description="İpuçlarını aşama aşama açmana izin verir."
                  label="İpuçlarını göster"
                  onValueChange={onShowHintsChange}
                  paper={paper}
                  value={showHints}
                />

                {showMathProgress ? (
                  <>
                    <LevelPicker
                      completedLevelNumbers={completedLevelNumbers}
                      currentLevelIndex={currentLevelIndex}
                      levelRecords={levelRecords}
                      onSelectLevel={onSelectLevel}
                      paper={paper}
                    />

                    <Pressable
                      accessibilityRole="button"
                      onPress={onRestart}
                      style={({ pressed }) => [
                        styles.restartButton,
                        paper && styles.restartButtonPaper,
                        pressed && styles.buttonPressed,
                      ]}
                    >
                      <Text style={styles.restartText}>Bölümü Yeniden Başlat</Text>
                    </Pressable>
                  </>
                ) : null}
              </>
            )}
          </ScrollView>
        </BlurView>
      </View>
    </Modal>
  );
}

type SettingRowProps = {
  compact?: boolean;
  paper: boolean;
  description: string;
  label: string;
  onValueChange: (value: boolean) => void;
  value: boolean;
};

function SettingRow({
  compact = false,
  description,
  label,
  onValueChange,
  paper,
  value,
}: SettingRowProps) {
  return (
    <View style={[styles.row, compact && styles.rowCompact, paper && styles.rowPaper]}>
      <View style={styles.rowCopy}>
        <Text style={[styles.rowTitle, paper && styles.textPaper]}>{label}</Text>
        <Text style={[styles.rowText, paper && styles.mutedTextPaper]}>{description}</Text>
      </View>
      <Pressable
        accessibilityLabel={label}
        accessibilityRole="switch"
        accessibilityState={{ checked: value }}
        hitSlop={8}
        onPress={() => onValueChange(!value)}
        style={({ pressed }) => [
          styles.switchTrack,
          value && styles.switchTrackOn,
          paper && value && styles.switchTrackOnPaper,
          pressed && styles.switchPressed,
        ]}
      >
        <View
          pointerEvents="none"
          style={[styles.switchThumb, value && styles.switchThumbOn]}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  modal: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(5, 12, 7, 0.62)',
  },
  panel: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '88%',
    overflow: 'hidden',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    backgroundColor: 'rgba(19, 32, 22, 0.84)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.42,
    shadowRadius: 32,
    elevation: 18,
  },
  content: {
    zIndex: 1,
    padding: 20,
  },
  header: {
    zIndex: 5,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerPaper: {
    backgroundColor: 'transparent',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eyebrow: {
    color: '#007AFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  title: {
    marginTop: 2,
    color: colors.text,
    fontSize: 26,
    fontWeight: '900',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  closeText: {
    marginTop: -3,
    color: colors.text,
    fontSize: 28,
    fontWeight: '500',
  },
  row: {
    marginTop: 22,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  rowCompact: {
    marginTop: 0,
    borderTopWidth: 0,
  },
  rowCopy: {
    flex: 1,
  },
  switchTrack: {
    width: 46,
    height: 28,
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderRadius: 14,
    backgroundColor: 'rgba(120, 120, 128, 0.32)',
  },
  switchTrackOn: {
    borderWidth: 1,
    borderColor: '#8CFFB9',
    backgroundColor: '#22C96B',
    shadowColor: '#22C96B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 7,
    elevation: 6,
  },
  switchThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2,
    elevation: 3,
    transform: [{ translateX: 0 }],
  },
  switchThumbOn: {
    backgroundColor: '#F7FFF9',
    shadowColor: '#087A3A',
    shadowOpacity: 0.38,
    shadowRadius: 4,
    transform: [{ translateX: 18 }],
  },
  switchPressed: {
    opacity: 0.82,
  },
  rowTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  rowText: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  restartButton: {
    marginTop: 18,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.26,
    shadowRadius: 14,
    elevation: 6,
  },
  restartText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  eyebrowPaper: {
    color: '#8C847E',
  },
  switchTrackOnPaper: {
    borderColor: '#0D9548',
    backgroundColor: '#18B95A',
    shadowColor: '#18B95A',
    shadowOpacity: 0.34,
  },
  restartButtonPaper: {
    backgroundColor: '#4A443F',
    shadowColor: '#4A443F',
  },
  backdropPaper: {
    backgroundColor: 'rgba(74, 68, 63, 0.22)',
  },
  panelPaper: {
    borderColor: 'rgba(255, 255, 255, 0.88)',
    backgroundColor: 'rgba(249, 246, 242, 0.38)',
    shadowColor: '#8C847E',
    shadowOpacity: 0.24,
  },
  paperGlassSheen: {
    ...StyleSheet.absoluteFill,
    borderRadius: 28,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  textPaper: {
    color: '#4A443F',
  },
  mutedTextPaper: {
    color: '#8C847E',
  },
  closeButtonPaper: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.82)',
    backgroundColor: 'rgba(242, 237, 231, 0.7)',
  },
  mainModesSection: {
    marginTop: 10,
  },
  sectionEyebrow: {
    color: '#F1C66E',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  sectionEyebrowPaper: {
    color: '#A5681F',
  },
  sectionDescription: {
    marginTop: 3,
    color: 'rgba(255, 255, 255, 0.66)',
    fontSize: 11,
    fontWeight: '600',
  },
  mainModesGrid: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 10,
  },
  mainModeCard: {
    flex: 1,
    minHeight: 150,
    padding: 13,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  mainModeCardPaper: {
    backgroundColor: 'rgba(255, 252, 247, 0.9)',
  },
  inactiveModeCard: {
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  inactiveModeCardPaper: {
    borderColor: '#D8CFC5',
    backgroundColor: '#FFFDFC',
  },
  mathModeCard: {
    borderColor: '#E5A33B',
    backgroundColor: 'rgba(120, 77, 17, 0.54)',
  },
  mathModeCardPaper: {
    borderColor: '#D78A2C',
    backgroundColor: '#FFF0D2',
  },
  wordMainModeCard: {
    borderColor: 'rgba(196, 154, 116, 0.72)',
    backgroundColor: 'rgba(103, 70, 48, 0.48)',
  },
  wordMainModeCardPaper: {
    borderColor: '#C9A27F',
    backgroundColor: '#F7E9DC',
  },
  mainModeIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  mathMainModeIcon: {
    backgroundColor: '#D78A2C',
  },
  wordMainModeIcon: {
    backgroundColor: '#9C7658',
  },
  mainModeIconText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  mainModeTitle: {
    marginTop: 10,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  mainModeDescription: {
    marginTop: 3,
    minHeight: 30,
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '600',
  },
  activeModeBadge: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 9,
    backgroundColor: '#E5A33B',
  },
  activeModeBadgePaper: {
    backgroundColor: '#D78A2C',
  },
  activeModeBadgeText: {
    color: '#2E1B04',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.7,
  },
  activeModeBadgeTextPaper: {
    color: '#FFFFFF',
  },
  enterModeBadge: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  enterModeBadgePaper: {
    backgroundColor: '#E9D3BF',
  },
  enterModeBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.7,
  },
  enterModeBadgeTextPaper: {
    color: '#76543A',
  },
  themeRow: {
    marginTop: 20,
    minHeight: 64,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  themeRowPaper: {
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E0DA',
    borderRadius: 0,
    backgroundColor: 'transparent',
  },
  leaderboardRow: {
    marginTop: 20,
    minHeight: 72,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 209, 102, 0.38)',
    backgroundColor: 'rgba(181, 120, 24, 0.18)',
  },
  leaderboardRowPaper: {
    borderColor: '#E1BD84',
    backgroundColor: '#FFF4DE',
  },
  leaderboardIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: 'rgba(255, 209, 102, 0.18)',
  },
  leaderboardIconPaper: { backgroundColor: '#F4D39D' },
  leaderboardIconText: { fontSize: 21 },
  themeSwatch: {
    width: 28,
    height: 28,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    backgroundColor: '#526343',
  },
  themeSwatchPaper: {
    borderColor: '#E5E0DA',
    backgroundColor: '#F9F6F2',
  },
  themeChevron: {
    marginTop: -3,
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 28,
    fontWeight: '500',
  },
  rowPaper: {
    borderColor: '#E5E0DA',
  },
  buttonPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },
});
