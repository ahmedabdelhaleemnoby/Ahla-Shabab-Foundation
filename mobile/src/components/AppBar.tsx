import React from 'react';
import { View, Text, Pressable, StyleSheet, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, cardShadow, font } from '../theme';
import { Icon } from './Icon';
import { openDrawer } from '../store/drawer';
import { useUnreadCount } from '../store/notifications';

/** Official association logo. */
export function Logo({ small }: { small?: boolean }) {
  const nav = useNavigation<any>();
  return (
    <Pressable onPress={() => nav.navigate('Home')} accessibilityLabel="جمعية خواطر أحلى شباب — الرئيسية">
      <Image
        source={require('../../assets/logo.png')}
        style={{ width: small ? 42 : 54, height: small ? 42 : 54 }}
        resizeMode="contain"
      />
    </Pressable>
  );
}

/**
 * App bar. Two modes:
 * - Main screens (no onBack): hamburger (opens the sidebar) on the right,
 *   bell on the left, title — or the logo on Home — in the middle.
 * - Pushed screens (onBack): back arrow right, title middle, logo left.
 */
export function AppBar({
  title,
  onBack,
  onBell,
  notifications,
}: {
  title?: string;
  onBack?: () => void;
  /** Optional override; by default the bell opens the Notifications screen. */
  onBell?: () => void;
  notifications?: number;
}) {
  const nav = useNavigation<any>();
  const openBell = onBell ?? (() => nav.navigate('Notifications'));
  const unread = useUnreadCount();
  const badge = notifications ?? unread;

  if (onBack) {
    return (
      <View style={styles.bar}>
        <Pressable style={[styles.iconBtn, cardShadow]} onPress={onBack}>
          {/* Back arrow points right in RTL */}
          <Icon name="chevron-right" size={20} color={colors.navy700} />
        </Pressable>
        {title ? <Text style={[font('800'), { fontSize: 17, color: colors.navy700 }]}>{title}</Text> : <View />}
        <Logo small={!!title} />
      </View>
    );
  }

  return (
    <View style={styles.bar}>
      <Pressable style={[styles.iconBtn, cardShadow]} onPress={openDrawer} accessibilityLabel="القائمة">
        <Icon name="menu" size={20} color={colors.navy700} />
      </Pressable>

      {title ? (
        <Text style={[font('800'), { fontSize: 17, color: colors.navy700 }]}>{title}</Text>
      ) : (
        <Logo small />
      )}

      <Pressable style={[styles.iconBtn, cardShadow]} onPress={openBell}>
        <Icon name="bell" size={20} color={colors.navy700} />
        {badge > 0 && (
          <View style={styles.badge}>
            <Text style={[font('800'), { color: '#fff', fontSize: 9 }]}>{badge}</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 12,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    left: -4,
    backgroundColor: colors.red,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.paper,
  },
});
