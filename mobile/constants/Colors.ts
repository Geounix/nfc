// Paleta de colores SafeTag — vibrant dark
// Misma dirección visual que la web: violet · magenta · electric cyan

export const Colors = {
  // Backgrounds
  bgPrimary:   '#F8FAFC',
  bgSecondary: '#F1F5F9',
  bgCard:      '#FFFFFF',
  bgCardHover: '#FFFFFF',
  glass:       'rgba(255, 255, 255, 0.8)',
  glassBorder: 'rgba(0, 0, 0, 0.08)',

  // Accent: indigo elegante
  accent:     '#4F46E5',
  accentLight:'#6366F1',
  accentDark: '#4338CA',
  magenta:    '#8B5CF6',
  accentGlow: 'rgba(79, 70, 229, 0.25)',

  // Secondary
  cyan:       '#06B6D4',
  blue:       '#3B82F6',
  cyanGlow:   'rgba(6, 182, 212, 0.3)',

  // States / UI
  green:      '#22C55E',
  red:        '#EF4444',
  orange:     '#F97316',
  yellow:     '#F59E0B',
  success:    'rgba(34,197,94,0.15)',
  error:      'rgba(239,68,68,0.15)',

  // Text - adaptados para modo claro
  textPrimary:   '#0F172A',
  textSecondary: '#475569',
  textMuted:     '#94A3B8',

  // Gradients (para LinearGradient)
  gradientAccent: ['#6366F1', '#4F46E5'],
  gradientCyan:   ['#4ADE80', '#22C55E'],
  gradientCard:   ['rgba(255,255,255,1)', 'rgba(248,250,252,1)'],
};

export type ColorScheme = typeof Colors;
