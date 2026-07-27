import { BlurView } from 'expo-blur';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Level } from '../types/game';

type Props = {
  dailyLevel: Level;
  dailyStreak: number;
  isCompletedToday: boolean;
  onClose: () => void;
  onStartDaily: () => void;
  paper?: boolean;
  visible: boolean;
};

export function DailyChallengeModal({
  dailyLevel,
  dailyStreak,
  isCompletedToday,
  onClose,
  onStartDaily,
  paper = false,
  visible,
}: Props) {
  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <Pressable onPress={onClose} style={styles.backdrop}>
        <BlurView
          intensity={paper ? 26 : 60}
          tint={paper ? 'light' : 'dark'}
          style={[styles.modalCard, paper && styles.modalCardPaper]}
        >
          <View style={styles.header}>
            <Text style={[styles.eyebrow, paper && styles.eyebrowPaper]}>
              GÜNLÜK BULMACA
            </Text>
            <Text style={[styles.title, paper && styles.titlePaper]}>
              Günün Meydan Okuması
            </Text>
          </View>

          <View style={[styles.streakBox, paper && styles.streakBoxPaper]}>
            <Text style={styles.fireIcon}>🔥</Text>
            <View>
              <Text style={[styles.streakTitle, paper && styles.streakTitlePaper]}>
                {dailyStreak} Günlük Seri
              </Text>
              <Text style={[styles.streakSub, paper && styles.mutedPaper]}>
                {isCompletedToday
                  ? 'Bugünün bulmacasını tamamladın! Tebrikler.'
                  : 'Her gün çöz, serini büyüt!'}
              </Text>
            </View>
          </View>

          <View style={[styles.infoBox, paper && styles.infoBoxPaper]}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, paper && styles.mutedPaper]}>HEDEF</Text>
              <Text style={[styles.infoValue, paper && styles.titlePaper]}>
                {String(dailyLevel.target)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, paper && styles.mutedPaper]}>SÜRE</Text>
              <Text style={[styles.infoValue, paper && styles.titlePaper]}>
                {dailyLevel.timeLimitSeconds} saniye
              </Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => {
              onClose();
              onStartDaily();
            }}
            style={({ pressed }) => [
              styles.startButton,
              paper && styles.startButtonPaper,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={[styles.startButtonText, paper && styles.startButtonTextPaper]}>
              {isCompletedToday ? 'Tekrar Oyna' : 'Bulmacayı Başlat'}
            </Text>
          </Pressable>

          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={[styles.closeText, paper && styles.mutedPaper]}>Kapat</Text>
          </Pressable>
        </BlurView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 26,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    backgroundColor: 'rgba(24, 38, 26, 0.94)',
    overflow: 'hidden',
  },
  modalCardPaper: {
    borderColor: '#DED6CE',
    backgroundColor: 'rgba(253, 253, 251, 0.98)',
  },
  header: {
    alignItems: 'center',
  },
  eyebrow: {
    color: '#007AFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  eyebrowPaper: {
    color: '#8C6E4A',
  },
  title: {
    marginTop: 4,
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  titlePaper: {
    color: '#4A443F',
  },
  streakBox: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 149, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.35)',
  },
  streakBoxPaper: {
    backgroundColor: '#FAF0E6',
    borderColor: '#E6D2C2',
  },
  fireIcon: {
    fontSize: 28,
  },
  streakTitle: {
    color: '#FF9500',
    fontSize: 16,
    fontWeight: '900',
  },
  streakTitlePaper: {
    color: '#C86400',
  },
  streakSub: {
    marginTop: 2,
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    fontWeight: '600',
  },
  mutedPaper: {
    color: '#8C847E',
  },
  infoBox: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
  },
  infoBoxPaper: {
    backgroundColor: '#F5F0EA',
  },
  infoRow: {
    alignItems: 'center',
  },
  infoLabel: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 9,
    fontWeight: '900',
  },
  infoValue: {
    marginTop: 2,
    fontSize: 18,
    fontWeight: '900',
  },
  startButton: {
    marginTop: 20,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
  },
  startButtonPaper: {
    backgroundColor: '#4A443F',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  startButtonTextPaper: {
    color: '#FFFFFF',
  },
  closeButton: {
    marginTop: 14,
    alignItems: 'center',
  },
  closeText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
