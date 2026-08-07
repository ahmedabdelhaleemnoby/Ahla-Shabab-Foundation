import React from 'react';
import { View, Text, ActivityIndicator, Pressable } from 'react-native';
import { colors, font, row } from '../theme';
import { Icon, IconName } from './Icon';
import { Button, Card } from './ui';

/**
 * The four states an account screen can be in before it has rows to show.
 * Kept in one place so «سجّل دخولك» / loading / failure / empty look and read
 * the same on bookings, donations, receipts, favorites and notifications.
 *
 * Returns `null` when there is data to render, so a screen can do:
 *   const state = <AccountState … />; if (state) return <Screen>{state}</Screen>;
 */
export function AccountState({
  isGuest,
  loading,
  error,
  isEmpty,
  emptyIcon = 'inbox',
  emptyTitle,
  emptyHint,
  guestHint,
  onSignIn,
  onRetry,
}: {
  isGuest: boolean;
  loading: boolean;
  error: string | null;
  isEmpty: boolean;
  emptyIcon?: IconName;
  emptyTitle: string;
  emptyHint?: string;
  guestHint: string;
  onSignIn: () => void;
  onRetry?: () => void;
}): React.ReactElement | null {
  if (isGuest) {
    return (
      <Card style={{ alignItems: 'center', paddingVertical: 28, marginTop: 8 }}>
        <View style={{ width: 68, height: 68, borderRadius: 34, backgroundColor: colors.paper2, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="user" size={30} color={colors.navy500} />
        </View>
        <Text style={[font('800'), { fontSize: 15.5, color: colors.navy700, marginTop: 13, textAlign: 'center' }]}>
          سجّل دخولك لعرض بياناتك
        </Text>
        <Text style={[font('400'), { fontSize: 12, color: colors.slate, marginTop: 6, textAlign: 'center', lineHeight: 18 }]}>
          {guestHint}
        </Text>
        <Button label="تسجيل الدخول" icon="log-in" style={{ marginTop: 16, alignSelf: 'stretch' }} onPress={onSignIn} />
      </Card>
    );
  }

  if (loading) {
    return (
      <View style={{ alignItems: 'center', paddingVertical: 48 }}>
        <ActivityIndicator color={colors.navy700} />
        <Text style={[font('600'), { fontSize: 12, color: colors.muted, marginTop: 12 }]}>جارٍ التحميل…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <Card style={{ alignItems: 'center', paddingVertical: 26, marginTop: 8, backgroundColor: colors.redSoft }}>
        <Icon name="alert-triangle" size={26} color={colors.red} />
        <Text style={[font('800'), { fontSize: 14, color: colors.red, marginTop: 10, textAlign: 'center' }]}>
          تعذّر تحميل البيانات
        </Text>
        <Text style={[font('400'), { fontSize: 11.5, color: colors.slate, marginTop: 6, textAlign: 'center', lineHeight: 17 }]}>
          {error}
        </Text>
        {onRetry ? (
          <Pressable onPress={onRetry} style={[row, { gap: 7, marginTop: 14 }]}>
            <Icon name="refresh-cw" size={15} color={colors.navy700} />
            <Text style={[font('800'), { fontSize: 12.5, color: colors.navy700 }]}>إعادة المحاولة</Text>
          </Pressable>
        ) : null}
      </Card>
    );
  }

  if (isEmpty) {
    return (
      <View style={{ alignItems: 'center', paddingVertical: 44 }}>
        <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: colors.paper2, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={emptyIcon} size={28} color={colors.muted} />
        </View>
        <Text style={[font('700'), { fontSize: 14, color: colors.slate, marginTop: 12 }]}>{emptyTitle}</Text>
        {emptyHint ? (
          <Text style={[font('400'), { fontSize: 11.5, color: colors.muted, marginTop: 4, textAlign: 'center' }]}>{emptyHint}</Text>
        ) : null}
      </View>
    );
  }

  return null;
}
