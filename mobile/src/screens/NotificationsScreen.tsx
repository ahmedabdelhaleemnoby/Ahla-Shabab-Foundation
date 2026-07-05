import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { notifications as seed, type AppNotification, type NotificationKind } from '@ahla/shared';
import { Screen } from '../components/Screen';
import { AppBar } from '../components/AppBar';
import { Card } from '../components/ui';
import { Icon, IconName } from '../components/Icon';
import { colors, font, row } from '../theme';

const kindMeta: Record<NotificationKind, { icon: IconName; color: string; bg: string }> = {
  booking: { icon: 'calendar', color: colors.navy700, bg: '#EAF0F8' },
  case: { icon: 'users', color: colors.red, bg: colors.redSoft },
  donation: { icon: 'heart', color: colors.green, bg: colors.greenSoft },
  project: { icon: 'home', color: colors.navy500, bg: '#EAF0F8' },
  system: { icon: 'bell', color: colors.gold, bg: colors.goldSoft },
};

export default function NotificationsScreen() {
  const nav = useNavigation<any>();
  const [items, setItems] = useState<AppNotification[]>(seed);
  const unread = items.filter((n) => !n.read).length;

  const markAllRead = () => setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  const toggleRead = (id: string) =>
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));

  return (
    <Screen header={<AppBar title="الإشعارات" onBack={() => nav.goBack()} onBell={undefined} />}>
      {/* Header row */}
      <View style={[row, { justifyContent: 'space-between', marginBottom: 8, marginHorizontal: 2 }]}>
        <Text style={[font('600'), { fontSize: 12, color: colors.slate }]}>
          {unread > 0 ? `${unread} إشعار غير مقروء` : 'كل الإشعارات مقروءة'}
        </Text>
        {unread > 0 && (
          <Pressable onPress={markAllRead}>
            <Text style={[font('700'), { fontSize: 12, color: colors.navy700 }]}>تعليم الكل كمقروء</Text>
          </Pressable>
        )}
      </View>

      {items.map((n) => {
        const m = kindMeta[n.kind];
        return (
          <Pressable key={n.id} onPress={() => toggleRead(n.id)}>
            <Card style={[row, { gap: 12, marginBottom: 10, alignItems: 'flex-start', backgroundColor: n.read ? colors.card : '#FBFDFF' }]}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: m.bg, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={m.icon} size={19} color={m.color} />
              </View>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <View style={[row, { gap: 6, alignSelf: 'stretch', justifyContent: 'space-between' }]}>
                  <Text style={[font('800'), { fontSize: 13.5, color: colors.navy700, flex: 1, textAlign: 'right' }]}>{n.title}</Text>
                  {!n.read && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.red, marginTop: 5 }} />}
                </View>
                <Text style={[font('400'), { fontSize: 11.5, color: colors.slate, lineHeight: 17, marginTop: 3, textAlign: 'right' }]}>
                  {n.body}
                </Text>
                <Text style={[font('600'), { fontSize: 10, color: colors.muted, marginTop: 6 }]}>{n.time}</Text>
              </View>
            </Card>
          </Pressable>
        );
      })}
      <View style={{ height: 12 }} />
    </Screen>
  );
}
