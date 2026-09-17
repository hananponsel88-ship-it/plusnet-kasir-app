import { StyleSheet } from 'react-native';

// Font Family Constant
export const fonts = {
  bold: 'Manrope_700Bold',
  semiBold: 'Manrope_600SemiBold',
  medium: 'Manrope_500Medium',
  regular: 'Manrope_400Regular',
};

// ==========================================
// 1. LIGHT PALETTE (Default)
// ==========================================
export const lightColors = {
  primary: '#00693a',
  primaryContainer: '#00b86b',
  onPrimaryContainer: '#003d20',
  onPrimary: '#ffffff',
  inversePrimary: '#4ce08e',
  background: '#f6f9f5',
  surface: '#f6f9f5',
  surfaceBright: '#ffffff',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f0f5ee',
  surfaceContainer: '#e9f1e7',
  surfaceContainerHigh: '#e1ece0',
  surfaceContainerHighest: '#d7e5d5',
  surfaceDim: '#eaf3e8',
  onSurface: '#101613',
  onSurfaceVariant: '#4a564c',
  outline: '#6c7b6e',
  outlineVariant: '#c6d4c8',
  secondary: '#5d5f5e',
  onSecondary: '#ffffff',
  secondaryContainer: '#e2e3e1',
  onSecondaryContainer: '#636564',
  error: '#ba1a1a',
  onError: '#ffffff',
  errorContainer: '#ffdad6',
  onErrorContainer: '#93000a',
  tertiary: '#a9353d',
  successBg: '#e6f4ea',
  successText: '#137333',
  warnBg: '#fef7e0',
  warnText: '#b06000',
  dangerBg: '#fce8e6',
  dangerText: '#c5221f',

  // Premium Accent
  ink: '#0e1a13',
  inkSoft: '#3a453d',
  accent: '#c8942f',
  accentSoft: '#f7ecd4',
  onAccent: '#2a1c00',
  hairline: 'rgba(14,26,19,0.08)',
  hairlineStrong: 'rgba(14,26,19,0.14)',
  primarySoft: 'rgba(0,184,107,0.14)',
  onSurfaceOverlay: 'rgba(13,15,14,0.06)',

  // Gradients
  gradient: { start: '#12c47f', end: '#014a29' },
  gradientPressed: { start: '#0aa668', end: '#00341c' },
  gradientDanger: { start: '#ef5b5b', end: '#b3261e' },
  gradientDark: { start: '#1a2b21', end: '#050a07' },
  gradientAccent: { start: '#e0ac47', end: '#a97418' },
  gradientPurple: { start: '#7C3AED', end: '#4C1D95' },
};

// ==========================================
// 2. DARK PALETTE (Opsional / Masa Depan)
// ==========================================
export const darkColors = {
  ...lightColors,
  primary: '#4ce08e',
  onPrimary: '#00381d',
  background: '#0a0f0c',
  surface: '#0a0f0c',
  surfaceBright: '#1a241e',
  surfaceContainerLowest: '#121a15',
  surfaceContainerLow: '#151d18',
  surfaceContainer: '#1b261f',
  surfaceContainerHigh: '#212f27',
  surfaceContainerHighest: '#28382f',
  onSurface: '#e2e8e4',
  onSurfaceVariant: '#a3b3a7',
  outline: '#7c8e80',
  outlineVariant: '#38483b',
  hairline: 'rgba(255,255,255,0.08)',
  hairlineStrong: 'rgba(255,255,255,0.15)',
  ink: '#f0f5ee',
  inkSoft: '#a3b3a7',
};

// Export default colors (Light mode)
export const colors = lightColors;

// ==========================================
// 3. SPACING & RADIUS
// ==========================================
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  full: 9999,
};

// ==========================================
// 4. TYPOGRAPHY (Termasuk Font Family)
// ==========================================
export const typography = StyleSheet.create({
  display: {
    fontSize: 48,
    lineHeight: 58,
    letterSpacing: -1.2,
    fontFamily: fonts.bold,
  },
  headlineXl: {
    fontSize: 38,
    lineHeight: 48,
    letterSpacing: -0.8,
    fontFamily: fonts.bold,
  },
  headlineLg: {
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.5,
    fontFamily: fonts.bold,
  },
  headlineMd: {
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.3,
    fontFamily: fonts.bold,
  },
  headlineSm: {
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.2,
    fontFamily: fonts.bold,
  },
  bodyLg: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: fonts.medium,
  },
  bodyMd: {
    fontSize: 14,
    lineHeight: 19,
    fontFamily: fonts.medium,
  },
  bodySm: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fonts.medium,
  },
  labelMd: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.4,
    fontFamily: fonts.bold,
  },
  numericLg: {
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.6,
    fontFamily: fonts.bold,
  },
});

// ==========================================
// 5. SHADOWS
// ==========================================
export const shadow = {
  soft: {
    shadowColor: '#04180d',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  card: {
    shadowColor: '#04180d',
    shadowOpacity: 0.09,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  cardElevated: {
    shadowColor: '#02110a',
    shadowOpacity: 0.16,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  btn: {
    shadowColor: '#031e12',
    shadowOpacity: 0.22,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  sheet: {
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 14 },
    elevation: 16,
  },
};