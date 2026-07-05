import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, cardShadow, font } from '../theme';
import { Icon } from './Icon';

/** Brand logo lockup — sits top-right in the RTL app bar. */
export function Logo({ small }: { small?: boolean }) {
  return (
    <View style={{ alignItems: 'flex-end' }}>
      <Text style={[font('800'), { fontSize: small ? 20 : 24, color: colors.navy700 }]}>خَواطِر</Text>
      {!small && (
        <Text style={[font('700'), { fontSize: 8.5, color: colors.navy500, marginTop: 2 }]}>
          جمعية أحلى شباب
        </Text>
      )}
    </View>
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
  onBell?: () => void;
  notifications?: number;
}) {
  return (
    <View style={styles.bar}>
      {onBack ? (
        <Pressable style={[styles.iconBtn, cardShadow]} onPress={onBack}>
          {/* Back arrow points right in RTL */}
          <Icon name="chevron-right" size={20} color={colors.navy700} />
        </Pressable>
      ) : (
        <Pressable style={[styles.iconBtn, cardShadow]} onPress={onBell}>
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
