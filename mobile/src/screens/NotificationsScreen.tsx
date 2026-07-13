import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { type AppNotification, type NotificationKind } from '@ahla/shared';
import { Screen } from '../components/Screen';
import { AppBar } from '../components/AppBar';
import { Card, Chip, EmptyState } from '../components/ui';
import { LoginGate } from '../components/LoginGate';
import { Icon, IconName } from '../components/Icon';
import { colors, font, num, row } from '../theme';
import { notificationStore, useNotifications } from '../store/notifications';

/* Notification center (§3): unread/read, category filters, date+time,
   mark-all-as-read, settings, tap-through to the related demo page. */

const kindMeta: Record<NotificationKind, { label: string; icon: IconName; color: string; bg: string }> = {
  booking: { label: 'حجوزات', icon: 'calendar', color: colors.navy700, bg: '#EAF0F8' },
  case: { label: 'حالات', icon: 'users', color: colors.red, bg: colors.redSoft },
  donation: { label: 'تبرعات', icon: 'heart', color: colors.green, bg: colors.greenSoft },
  project: { label: 'مشروعات', icon: 'home', color: colors.navy500, bg: '#EAF0F8' },
  system: { label: 'عام', icon: 'bell', color: colors.gold, bg: colors.goldSoft },
};

const FILTERS = ['الكل', 'غير مقروء', 'تبرعات', 'حجوزات', 'حالات', 'مشروعات', 'عام'];

export default function NotificationsScreen() {
  const nav = useNavigation<any>();
  const items = useNotifications();
  const [filter, setFilter] = useState('الكل');
  const unread = items.filter((n) => !n.read).length;

  const visible = items.filter((n) => {
    if (filter === 'الكل') return true;
    if (filter === 'غير مقروء') return !n.read;
    return kindMeta[n.kind].label === filter;
  });

  /** Tap-through — every notification leads somewhere meaningful. */
  const open = (n: AppNotification) => {
    notificationStore.markRead(n.id);
    switch (n.kind) {
      case 'case':
        return nav.navigate(n.targetId ? 'CaseDetail' : 'UrgentCases', n.targetId ? { id: n.targetId } : undefined);
      case 'project':
        return nav.navigate(n.targetId ? 'ProjectDetail' : 'Projects', n.targetId ? { id: n.targetId } : undefined);
      case 'donation':
        return nav.navigate('Receipts');
      case 'booking':
        return nav.navigate('MyBookings');
      default:
        return; // system: marked read, full text is already visible
    }
  };

  return (
    <LoginGate
      icon="bell"
      title="الإشعارات لحسابك"
      benefits={['وصول فوري لتحديثات تبرعاتك وحجوزاتك', 'تنبيهات الحالات العاجلة التي تدعمها', 'تقارير أثر كفالتك الشهرية']}
    >
      <Screen
        header={
          <AppBar
            title="الإشعارات"
            onBack={() => nav.goBack()}
            onBell={undefined}
          />
        }
      >
        {/* Toolbar */}
        <View style={[row, { justifyContent: 'space-between', marginBottom: 10, marginHorizontal: 2 }]}>
          <Pressable onPress={() => nav.navigate('NotificationPreferences')} style={[row, { gap: 5 }]}>
            <Icon name="settings" size={13} color={colors.navy500} />
            <Text style={[font('700'), { fontSize: 11.5, color: colors.navy500 }]}>إعدادات الإشعارات</Text>
          </Pressable>
          {unread > 0 ? (
            <Pressable onPress={notificationStore.markAllRead}>
              <Text style={[font('700'), { fontSize: 11.5, color: colors.navy700 }]}>تعليم الكل كمقروء ({unread})</Text>
            </Pressable>
          ) : (
            <Text style={[font('600'), { fontSize: 11.5, color: colors.muted }]}>كل الإشعارات مقروءة</Text>
          )}
        </View>

        {/* Category filters */}
        <View style={[row, { gap: 7, flexWrap: 'wrap', marginBottom: 12 }]}>
          {FILTERS.map((f) => (
            <Chip key={f} label={f} active={filter === f} onPress={() => setFilter(f)} />
          ))}
        </View>

        {visible.map((n) => {
          const m = kindMeta[n.kind];
          const hasTarget = n.kind !== 'system';
          return (
            <Pressable key={n.id} onPress={() => open(n)}>
              <Card style={[row, { gap: 12, marginBottom: 10, alignItems: 'flex-start', backgroundColor: n.read ? colors.card : '#FBFDFF', borderWidth: n.read ? 0 : 1, borderColor: '#DCE7F5' }]}>
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
                  <View style={[row, { gap: 8, marginTop: 7, alignSelf: 'stretch', justifyContent: 'space-between' }]}>
                    <View style={{ backgroundColor: m.bg, borderRadius: 100, paddingVertical: 2, paddingHorizontal: 9 }}>
                      <Text style={[font('700'), { fontSize: 8.5, color: m.color }]}>{m.label}</Text>
                    </View>
                    <Text style={[font('600'), num, { fontSize: 9.5, color: colors.muted }]}>
                      {n.date ?? ''} · {n.clock ?? n.time}
                    </Text>
                  </View>
                  {hasTarget && (
                    <Text style={[font('700'), { fontSize: 10, color: colors.navy500, marginTop: 6 }]}>عرض التفاصيل ‹</Text>
                  )}
                </View>
              </Card>
            </Pressable>
          );
        })}

        {visible.length === 0 && <EmptyState icon="bell" title="لا توجد إشعارات هنا" hint="جرّب تصفية أخرى أو عد لاحقاً" />}
        <View style={{ height: 12 }} />
      </Screen>
    </LoginGate>
  );
}
