import React from 'react';
import { View, Text, Pressable, StyleSheet, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, cardShadow, font } from '../theme';
import { Icon } from './Icon';

/** Official association logo — sits top-right in the RTL app bar. */
export function Logo({ small }: { small?: boolean }) {
  return (
    <Image
      source={require('../../assets/logo.png')}
      style={{ width: small ? 42 : 54, height: small ? 42 : 54 }}
      resizeMode="contain"
      accessibilityLabel="جمعية خواطر أحلى شباب"
    />
  );
}

export function AppBar({
  title,
  onBack,
  onBell,
  notifications = 3,
}: {
  title?: string;
  onBack?: () => void;
  /** Optional override; by default the bell opens the Notifications screen. */
  onBell?: () => void;
  notifications?: number;
}) {
  const nav = useNavigation<any>();
  const openBell = onBell ?? (() => nav.navigate('Notifications'));
  return (
    <View style={styles.bar}>
      {onBack ? (
        <Pressable style={[styles.iconBtn, cardShadow]} onPress={onBack}>
          {/* Back arrow points right in RTL */}
          <Icon name="chevron-right" size={20} color={colors.navy700} />
        </Pressable>
      ) : (
        <Pressable style={[styles.iconBtn, cardShadow]} onPress={openBell}>
          <Icon name="bell" size={20} color={colors.navy700} />
          {notifications > 0 && (
            <View style={styles.badge}>
              <Text style={[font('800'), { color: '#fff', fontSize: 9 }]}>{notifications}</Text>
            </View>
          )}
        </Pressable>
      )}

      {title ? (
        <Text style={[font('800'), { fontSize: 17, color: colors.navy700 }]}>{title}</Text>
      ) : (
        <View />
      )}

      <Logo small={!!title} />
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
