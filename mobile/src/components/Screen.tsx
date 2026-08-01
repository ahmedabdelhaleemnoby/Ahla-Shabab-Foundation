import React from 'react';
import { View, ScrollView, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme';

/**
 * Base screen frame: safe-area, paper background, optional scroll body with the
 * standard 16px gutter. `footer` renders a sticky CTA above the tab bar.
 *
 * On a TAB root the raised «تبرع» button is lifted 26px above the bar
 * (TabBar.styles.raiseWrap), so it overlaps the bottom-centre of a sticky footer
 * (QA D2-01). Pass `underRaisedTab` on the three tab roots that have a footer —
 * Cases, Donate and About — to reserve that clearance. It is opt-in rather than
 * automatic because the other 14 footer screens are pushed screens with no tab
 * bar, where the same padding would only add dead space.
 */
const RAISED_TAB_CLEARANCE = 28;
export function Screen({
  children,
  header,
  footer,
  scroll = true,
  contentStyle,
  underRaisedTab = false,
}: {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  /** Reserve room for the raised tab-bar button sitting over this footer. */
  underRaisedTab?: boolean;
}) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {header}
      {scroll ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.content, contentStyle]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, { flex: 1 }, contentStyle]}>{children}</View>
      )}
      {footer ? (
        <View style={underRaisedTab ? { paddingBottom: RAISED_TAB_CLEARANCE } : undefined}>{footer}</View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  content: { paddingHorizontal: 16, paddingBottom: spacing.s6 },
});
