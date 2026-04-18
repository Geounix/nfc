// Paleta de colores SafeTag — vibrant dark
// Misma dirección visual que la web: violet · magenta · electric cyan

export const Colors = {
  // Backgrounds
  bgPrimary:   '#0D0D1A',
  bgSecondary: '#12122A',
  bgCard:      'rgba(124, 58, 237, 0.08)',
  bgCardHover: 'rgba(124, 58, 237, 0.14)',
  glass:       'rgba(255, 255, 255, 0.06)',
  glassBorder: 'rgba(139, 92, 246, 0.22)',

  // Accent: violet → magenta
  accent:     '#8B5CF6',
  accentLight:'#A78BFA',
  accentDark: '#6D28D9',
  magenta:    '#D946EF',
  accentGlow: 'rgba(139, 92, 246, 0.35)',

  // Secondary: cyan → blue
  cyan:       '#06B6D4',
  blue:       '#3B82F6',
  cyanGlow:   'rgba(6, 182, 212, 0.3)',

  // States / UI
  green:      '#06B6D4',
  red:        '#F43F5E',
  orange:     '#FB923C',
  yellow:     '#F59E0B',
  success:    'rgba(6,182,212,0.15)',
  error:      'rgba(244,63,94,0.15)',

  // Text
  textPrimary:   '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted:     '#475569',

  // Gradients (para LinearGradient)
  gradientAccent: ['#8B5CF6', '#D946EF'],
  gradientCyan:   ['#06B6D4', '#3B82F6'],
  gradientCard:   ['rgba(139,92,246,0.12)', 'rgba(217,70,239,0.06)'],
};

export type ColorScheme = typeof Colors;
