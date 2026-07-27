import React from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors, font } from '../theme';
import { Icon, IconName } from './Icon';

const META: Record<string, { label: string; icon: IconName; raised?: boolean }> = {
  Cases: { label: 'الأسر', icon: 'users' },
  UrgentCases: { label: 'الحالات العاجلة', icon: 'alert-circle' },
  Donate: { label: 'تبرع', icon: 'heart', raised: true },
  Consultations: { label: 'الاستشارات', icon: 'message-circle' },
  About: { label: 'اعرف عنا', icon: 'info' },
};

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  /* At 320 px each of the five items gets ~59 px, which is not enough for the
     longest label (الحالات العاجلة) at the default size — it wrapped to two
     lines and pushed its icon out of line with the rest of the bar. Tighten the
     type and the gutter on narrow screens so every label stays on one line. */
  const narrow = width < 360;
  const labelSize = narrow ? 8.3 : 9.5;
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12), paddingHorizontal: narrow ? 4 : 12 }]}>
      {state.routes.map((route, index) => {
        const meta = META[route.name];
        if (!meta) return null;
        const focused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        };

        if (meta.raised) {
          return (
            <Pressable key={route.key} style={styles.raiseWrap} onPress={onPress}>
              <View style={styles.raiseCircle}>
                <Icon name={meta.icon} size={22} color="#fff" />
              </View>
              <Text numberOfLines={1} style={[font('700'), styles.label, { fontSize: labelSize, color: focused ? colors.navy700 : colors.muted }]}>
                {meta.label}
              </Text>
            </Pressable>
          );
        }

        return (
          <Pressable key={route.key} style={styles.item} onPress={onPress}>
            <Icon name={meta.icon} size={20} color={focused ? colors.navy700 : colors.muted} />
            {/* numberOfLines keeps every item one line tall — without it the
                longest label (الحالات العاجلة) wraps at 320 px and pushes its
                icon out of line with the rest of the bar. */}
            <Text numberOfLines={1} style={[font('700'), styles.label, { fontSize: labelSize, color: focused ? colors.navy700 : colors.muted }]}>
              {meta.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row-reverse',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 10,
    paddingHorizontal: 12,
    alignItems: 'flex-end',
    justifyContent: 'space-around',
  },
  item: { flex: 1, alignItems: 'center', gap: 4 },
  label: { fontSize: 9.5, marginTop: 2 },
  raiseWrap: { flex: 1, alignItems: 'center', marginTop: -26 },
  raiseCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.navy700,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    shadowColor: colors.navy700,
    shadowOpacity: 0.4,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
});
