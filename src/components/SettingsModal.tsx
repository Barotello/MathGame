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
import { LevelPicker } from './LevelPicker';
import { ThemePicker } from './ThemePicker';

type Props = {
  completedLevelNumbers: number[];
  currentLevelIndex: number;
  levelRecords: Record<number, LevelRecord>;
  onClose: () => void;
  onOpenWallBreaker: () => void;
  onOpenWordWheel: () => void;
  onRestart: () => void;
  onSelectLevel: (index: number) => void;
  onShowHintsChange: (value: boolean) => void;
  onThemeChange: (themeId: ThemeId) => void;
  showHints: boolean;
  themeId: ThemeId;
  visible: boolean;
};

export function SettingsModal({
  completedLevelNumbers,
  currentLevelIndex,
  levelRecords,
  onClose,
  onOpenWallBreaker,
  onOpenWordWheel,
  onRestart,
  onSelectLevel,
  onShowHintsChange,
  onThemeChange,
  showHints,
  themeId,
  visible,
}: Props) {
  const [screen, setScreen] = useState<'settings' | 'themes'>('settings');
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
                {screen === 'themes' ? (
                  <Text style={[styles.eyebrow, paper && styles.eyebrowPaper]}>
                    GÖRÜNÜM
                  </Text>
                ) : null}
                <Text style={[styles.title, paper && styles.textPaper]}>
                  {screen === 'themes' ? 'Tema' : 'Ayarlar'}
                </Text>
              </View>
              <View style={styles.headerActions}>
                <Pressable
                  accessibilityLabel={screen === 'themes' ? 'Ayarlara dön' : 'Ayarları kapat'}
                  accessibilityRole="button"
                  onPress={screen === 'themes' ? () => setScreen('settings') : onClose}
                  style={[styles.closeButton, paper && styles.closeButtonPaper]}
                >
                  <Text style={[styles.closeText, paper && styles.textPaper]}>
                    {screen === 'themes' ? '‹' : '×'}
                  </Text>
                </Pressable>
              </View>
            </View>

            {screen === 'themes' ? (
              <ThemePicker onSelect={onThemeChange} themeId={themeId} />
            ) : (
              <>
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

                <Pressable
                  accessibilityLabel="Ekstra Modlar, Duvar Yıkma"
                  accessibilityRole="button"
                  onPress={onOpenWallBreaker}
                  style={({ pressed }) => [
                    styles.modeRow,
                    paper && styles.modeRowPaper,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <View style={styles.modeIcon}>
                    <Text style={styles.modeIconText}>3D</Text>
                  </View>
                  <View style={styles.rowCopy}>
                    <Text style={[styles.modeEyebrow, paper && styles.eyebrowPaper]}>
                      EKSTRA MODLAR
                    </Text>
                    <Text style={[styles.rowTitle, paper && styles.textPaper]}>
                      Duvar Yıkma
                    </Text>
                    <Text style={[styles.rowText, paper && styles.mutedTextPaper]}>
                      Three.js destekli zincir ve duvar modu
                    </Text>
                  </View>
                  <Text style={[styles.themeChevron, paper && styles.mutedTextPaper]}>
                    ›
                  </Text>
                </Pressable>


                <Pressable
                  accessibilityLabel="Ana Oyun Modu, Türkçe"
                  accessibilityRole="button"
                  onPress={onOpenWordWheel}
                  style={({ pressed }) => [
                    styles.modeRow,
                    paper && styles.modeRowPaper,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <View style={[styles.modeIcon, styles.wordModeIcon]}>
                    <Text style={styles.modeIconText}>ABC</Text>
                  </View>
                  <View style={styles.rowCopy}>
                    <Text style={[styles.modeEyebrow, paper && styles.eyebrowPaper]}>
                      ANA OYUN MODU · TÜRKÇE
                    </Text>
                    <Text style={[styles.rowTitle, paper && styles.textPaper]}>
                      Kelime Çarkı
                    </Text>
                    <Text style={[styles.rowText, paper && styles.mutedTextPaper]}>
                      İpucunu oku, harfleri aç ve kelimeyi bul
                    </Text>
                  </View>
                  <Text style={[styles.themeChevron, paper && styles.mutedTextPaper]}>
                    ›
                  </Text>
                </Pressable>
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
    backgroundColor: '#007AFF',
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
    backgroundColor: '#8C847E',
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
  modeRow: {
    marginTop: 16,
    marginBottom: 4,
    minHeight: 76,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(185, 218, 130, 0.34)',
    backgroundColor: 'rgba(82, 107, 57, 0.28)',
  },
  modeRowPaper: {
    borderColor: '#D8D0C8',
    backgroundColor: '#F2EDE7',
  },
  modeIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#6F845D',
  },
  wordModeIcon: {
    backgroundColor: '#9C7658',
  },
  modeIconText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  modeEyebrow: {
    marginBottom: 3,
    color: '#B9DA82',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.1,
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
