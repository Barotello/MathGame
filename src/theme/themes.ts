export type ThemeId = 'nature' | 'paper';

export const themeOptions = {
  nature: {
    id: 'nature',
    name: 'Doğa Camı',
    description: 'Manzara ve koyu sıvı-cam yüzeyler',
  },
  paper: {
    id: 'paper',
    name: 'Sıcak Kâğıt',
    description: 'Arka plansız, açık ve doğal mat yüzeyler',
  },
} as const;

export const paperColors = {
  background: '#F9F6F2',
  text: '#4A443F',
  textMuted: '#8C847E',
  border: '#E5E0DA',
  borderSoft: '#F2EDE7',
  panel: 'rgba(255, 255, 255, 0.85)',
  panelSolid: '#FDFDFB',
  accent: '#8C847E',
  accentSoft: '#F2EDE7',
} as const;
