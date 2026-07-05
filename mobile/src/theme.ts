import { StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { colors, spacing, radius, typography, shadows } from '@ahla/shared';

export { colors, spacing, radius, typography, shadows };

/**
 * The app is Arabic-first RTL. Rather than relying on I18nManager.forceRTL
 * (which needs a native reload to take effect and behaves inconsistently in
 * Expo Go), we lay every screen out explicitly RTL: horizontal rows use
 * `row-reverse` and text is right-aligned with `writingDirection: 'rtl'`.
 * This renders correctly on first launch with no reload.
 */

// Cairo weights loaded via @expo-google-fonts/cairo. Fall back to system.
export const font = (weight: '400' | '500' | '600' | '700' | '800'): TextStyle => {
  const map: Record<string, string> = {
    '400': 'Cairo_400Regular',
    '500': 'Cairo_500Medium',
    '600': 'Cairo_600SemiBold',
    '700': 'Cairo_700Bold',
    '800': 'Cairo_800ExtraBold',
  };
  return { fontFamily: map[weight] };
};

export const rtlText: TextStyle = {
  textAlign: 'right',
  writingDirection: 'rtl',
};

/** Latin digits/currency stay LTR inside RTL flow. */
export const num: TextStyle = {
  writingDirection: 'ltr',
  fontVariant: ['tabular-nums'],
};

export const row: ViewStyle = { flexDirection: 'row-reverse', alignItems: 'center' };
export const rowBetween: ViewStyle = {
  flexDirection: 'row-reverse',
  alignItems: 'center',
  justifyContent: 'space-between',
};

export const text = StyleSheet.create({
  display: { ...font('800'), fontSize: typography.display.size, color: colors.navy700, ...rtlText },
  h1: { ...font('800'), fontSize: typography.h1.size, color: colors.navy700, ...rtlText },
  h2: { ...font('700'), fontSize: typography.h2.size, color: colors.navy700, ...rtlText },
  h3: { ...font('700'), fontSize: typography.h3.size, color: colors.navy700, ...rtlText },
  body: { ...font('400'), fontSize: typography.body.size, lineHeight: typography.body.lineHeight, color: colors.slate, ...rtlText },
  bodyStrong: { ...font('600'), fontSize: typography.bodyStrong.size, color: colors.ink, ...rtlText },
  caption: { ...font('400'), fontSize: typography.caption.size, color: colors.slate, ...rtlText },
  meta: { ...font('600'), fontSize: typography.meta.size, color: colors.muted, ...rtlText },
});

export const cardShadow: ViewStyle = {
  shadowColor: shadows.card.shadowColor,
  shadowOpacity: shadows.card.shadowOpacity,
  shadowRadius: shadows.card.shadowRadius,
  shadowOffset: shadows.card.shadowOffset,
  elevation: shadows.card.elevation,
};

export const raisedShadow: ViewStyle = {
  shadowColor: shadows.raised.shadowColor,
  shadowOpacity: shadows.raised.shadowOpacity,
  shadowRadius: shadows.raised.shadowRadius,
  shadowOffset: shadows.raised.shadowOffset,
  elevation: shadows.raised.elevation,
};
