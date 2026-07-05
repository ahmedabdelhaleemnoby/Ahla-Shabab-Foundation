/**
 * Ahla Shabab — Design Tokens
 * Single source of truth for both the mobile app and the admin dashboard.
 * Values are lifted directly from the approved design-system spec.
 */

export const colors = {
  // Brand — Navy ramp
  navy900: '#14284A', // hero gradient end, deepest
  navy800: '#182F58', // gradient start
  navy700: '#1B3A6B', // PRIMARY — buttons, logo, headings
  navy600: '#22467E', // pressed / hover
  navy500: '#2B5490', // icons, secondary
  navy300: '#5E7BAA', // accents on dark

  // Semantic
  green: '#2E9E52', // progress, verified, on-track
  greenSoft: '#E4F4E9',
  greenDark: '#227D40',
  gold: '#F5A623', // ratings, stars, mid progress
  goldSoft: '#FDF1DC',
  red: '#E0342F', // عاجل, logout, low coverage
  redSoft: '#FBE6E5',

  // Neutrals — blue-biased
  card: '#FFFFFF',
  paper: '#F7F9FC', // app background
  paper2: '#EEF3FA', // progress tracks, tint
  tile: '#F4F7FC',
  line: '#E3E9F2', // borders, hairlines
  line2: '#EDF1F7',
  ink: '#14284A',
  slate: '#55627A', // body text
  muted: '#93A0B5', // captions, placeholders
  white: '#FFFFFF',

  // Payment brands (use official logos, do not recolor)
  fawryYellow: '#FFCC00',
  fawryNavy: '#16006D',
  instapay: '#6D2E8A',
  vodafone: '#E60000',
} as const;

/** 4-point spacing scale */
export const spacing = {
  s1: 4,
  s2: 8,
  s3: 12, // card gap
  s4: 16, // card padding
  s5: 20, // screen gutter
  s6: 24, // section gap
  s8: 32,
  s10: 40,
} as const;

export const radius = {
  sm: 10, // inputs, small chips
  md: 14, // buttons
  lg: 20, // cards, sheets
  pill: 100, // pills, chips, FAB
} as const;

/** Type scale — tuned for a 390px frame. Sizes in px, weights as RN/CSS strings. */
export const typography = {
  display: { size: 30, lineHeight: 32, weight: '800' },
  h1: { size: 28, lineHeight: 32, weight: '800' },
  h2: { size: 24, lineHeight: 28, weight: '700' },
  h3: { size: 19, lineHeight: 24, weight: '700' },
  body: { size: 16, lineHeight: 26, weight: '400' },
  bodyStrong: { size: 16, lineHeight: 24, weight: '600' },
  caption: { size: 13.5, lineHeight: 20, weight: '400' },
  button: { size: 16, lineHeight: 20, weight: '700' },
  meta: { size: 11.5, lineHeight: 16, weight: '600' },
} as const;

/** Soft, navy-tinted elevation — the app never uses hard drop shadows. */
export const shadows = {
  card: {
    // web
    css: '0 4px 20px rgba(20,40,74,.06)',
    // react-native
    shadowColor: '#14284A',
    shadowOpacity: 0.06,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  raised: {
    css: '0 8px 30px rgba(20,40,74,.10)',
    shadowColor: '#14284A',
    shadowOpacity: 0.1,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
} as const;

export const fonts = {
  // Cairo (primary Arabic) with Tajawal fallback — configured per-platform.
  arabic: 'Cairo',
  arabicFallback: 'Tajawal',
} as const;

export type Colors = typeof colors;
export type Spacing = typeof spacing;
export type Radius = typeof radius;
export type Typography = typeof typography;
