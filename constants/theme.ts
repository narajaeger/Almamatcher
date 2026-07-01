// constants/theme.ts
// AlmaMatcher Design System v2 — warm beige base + coral/teal complementary
// Trendy refresh: liquid-glass tokens, gradient presets, Sora + Plus Jakarta Sans.

import { Platform } from 'react-native';

export const Colors = {
  // ── Backgrounds ───────────────────────────────────────────────
  background: '#F7F3EE',       // warm beige — main background
  backgroundWarm: '#FBF4EE',   // lighter warm top for gradients
  surface: '#FDFBF7',          // warm near-white — cards, inputs
  surfaceAlt: '#EDE9E1',       // slightly deeper beige — dividers, subtle sections
  surfaceOverlay: 'rgba(247,243,238,0.96)', // for modals/sheets

  // ── Primary accent — CORAL (love / energy) ────────────────────
  primary: '#FF6B6B',
  primaryHover: '#F2545B',
  primaryDeep: '#E23E48',
  primaryLight: '#FFE3DE',     // coral blush tint for backgrounds
  primaryMid: '#FFB3AC',       // midtone for borders/chips
  primarySoft: '#FF8A7A',      // lighter coral for gradients

  // ── Secondary accent — TEAL (fresh / calm / trust) ────────────
  secondary: '#2DB5A8',
  secondaryHover: '#1E9488',
  secondaryLight: '#D2F0EB',
  secondaryMid: '#9CDDD4',

  // Keep a dusty-rose alias for legacy romantic accents
  rose: '#C9737A',
  roseLight: '#F2DEDE',

  // Study / indigo — soft lavender
  indigo: '#8F8FCA',
  indigoLight: '#E2E2F5',

  // Premium — warm gold
  gold: '#C9A455',
  goldLight: '#F5E9CC',

  // ── Text ──────────────────────────────────────────────────────
  textPrimary: '#1C1917',      // warm near-black
  textSecondary: '#78716C',    // warm gray
  textTertiary: '#A8A29E',     // light warm gray
  textInverse: '#FDFBF7',      // on dark surfaces

  // ── Borders ───────────────────────────────────────────────────
  border: '#E7E2D8',           // warm light border
  borderMid: '#D4CEC3',        // slightly darker for inputs

  // ── Status ────────────────────────────────────────────────────
  success: '#2DB5A8',
  error: '#E2545B',
  warning: '#C9A455',
};

// ── Liquid-glass tokens ─────────────────────────────────────────
// Use with the <GlassView /> component. `intensity` drives blur strength.
export const Glass = {
  light: {
    tint: 'rgba(253,251,247,0.55)',     // warm frosted fill
    border: 'rgba(255,255,255,0.6)',
    intensity: 28,
  },
  ultraLight: {
    tint: 'rgba(255,255,255,0.18)',     // for chips on photos
    border: 'rgba(255,255,255,0.35)',
    intensity: 18,
  },
  dark: {
    tint: 'rgba(28,25,23,0.45)',
    border: 'rgba(255,255,255,0.14)',
    intensity: 30,
  },
};

// ── Gradient presets (arrays for expo-linear-gradient) ──────────
export const Gradients = {
  // Soft beige → coral blush → teal whisper. Login / hero backdrop.
  dawn: ['#FBF4EE', '#FBE7DD', '#F3DFE4', '#E7EFEC'] as const,
  // Vibrant coral CTA / like button
  coral: ['#FF8A7A', '#FF6B6B', '#F2545B'] as const,
  // Fresh teal — study / secondary CTAs
  teal: ['#5BD0C4', '#2DB5A8', '#1E9488'] as const,
  // Sunset romance — match moments
  romance: ['#FFC08A', '#FF8A7A', '#FF6B6B'] as const,
  // Coral → teal duotone for decorative blobs
  duo: ['#FF8A7A', '#2DB5A8'] as const,
  // Photo scrim
  scrim: ['rgba(10,7,5,0)', 'rgba(10,7,5,0.55)', 'rgba(10,7,5,0.92)'] as const,
};

export const Radii = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  full: 999,                   // pill/circle
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

// Clearance so screen content / bottom buttons aren't hidden behind the
// floating (absolute) tab bar. Use as paddingBottom on scroll content or
// as marginBottom on pinned bottom rows of tab screens.
export const TAB_SAFE_BOTTOM = 116;

// ── Fonts ───────────────────────────────────────────────────────
// Loaded via expo-font in app/_layout.tsx (works on native + web).
// `display` = Sora (geometric, headlines/wordmark)
// `sans`    = Plus Jakarta Sans (warm humanist, body/UI)
const webDisplay = "'Sora', system-ui, sans-serif";
const webSans = "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";

export const Fonts = {
  display: {
    regular: Platform.OS === 'web' ? webDisplay : 'Sora_400Regular',
    medium: Platform.OS === 'web' ? webDisplay : 'Sora_500Medium',
    semibold: Platform.OS === 'web' ? webDisplay : 'Sora_600SemiBold',
    bold: Platform.OS === 'web' ? webDisplay : 'Sora_700Bold',
    extrabold: Platform.OS === 'web' ? webDisplay : 'Sora_800ExtraBold',
  },
  sans: {
    regular: Platform.OS === 'web' ? webSans : 'PlusJakartaSans_400Regular',
    medium: Platform.OS === 'web' ? webSans : 'PlusJakartaSans_500Medium',
    semibold: Platform.OS === 'web' ? webSans : 'PlusJakartaSans_600SemiBold',
    bold: Platform.OS === 'web' ? webSans : 'PlusJakartaSans_700Bold',
    extrabold: Platform.OS === 'web' ? webSans : 'PlusJakartaSans_800ExtraBold',
  },
};

export const Typography = {
  // Display — hero numbers / wordmark (Sora)
  display: {
    fontFamily: Fonts.display.extrabold,
    fontSize: 36,
    fontWeight: '800' as const,
    color: Colors.textPrimary,
    letterSpacing: -0.8,
  },
  h1: {
    fontFamily: Fonts.display.bold,
    fontSize: 26,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
    letterSpacing: -0.4,
  },
  h2: {
    fontFamily: Fonts.sans.bold,
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  h3: {
    fontFamily: Fonts.sans.semibold,
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.textPrimary,
  },
  // Body (Plus Jakarta Sans)
  body: {
    fontFamily: Fonts.sans.regular,
    fontSize: 15,
    fontWeight: '400' as const,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  bodySmall: {
    fontFamily: Fonts.sans.regular,
    fontSize: 13,
    fontWeight: '400' as const,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  label: {
    fontFamily: Fonts.sans.semibold,
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    letterSpacing: 0.3,
  },
  caption: {
    fontFamily: Fonts.sans.regular,
    fontSize: 11,
    fontWeight: '400' as const,
    color: Colors.textTertiary,
  },
};

// Shadow presets
export const Shadows = {
  sm: {
    shadowColor: '#8A7F6A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#8A7F6A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#6B6355',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  // Coral glow for primary CTAs / like button
  primary: {
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.32,
    shadowRadius: 14,
    elevation: 8,
  },
  teal: {
    shadowColor: '#2DB5A8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 8,
  },
};
