import React, { useState } from 'react';
import {
  fetchNotificationPreferences,
  updateNotificationPreferences,
  type NotificationPreferences,
} from '@ahla/shared';
import { hasSession } from '../store/session';
import { View, Text, Switch } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../components/Screen';
import { AppBar } from '../components/AppBar';
import { Card } from '../components/ui';
import { Icon, IconName } from '../components/Icon';
import { colors, font, row } from '../theme';

type Pref = { key: string; label: string; desc: string; icon: IconName; on: boolean };

const INITIAL: Pref[] = [
  { key: 'donations', label: 'التبرعات', desc: 'إيصالات التبرع وتأكيد الكفالات الشهرية', icon: 'heart', on: true },
  { key: 'cases', label: 'الحالات الإنسانية', desc: 'حالات عاجلة وتحديثات نسب التغطية', icon: 'users', on: true },
  { key: 'projects', label: 'المشروعات', desc: 'تحديثات مراحل المشروعات ونتائجها', icon: 'home', on: true },
  { key: 'bookings', label: 'الحجوزات والمواعيد', desc: 'تأكيد المواعيد والتذكير قبلها', icon: 'calendar', on: true },
  { key: 'news', label: 'الأخبار والأنشطة', desc: 'أحدث الأخبار والقوافل والفعاليات', icon: 'file-text', on: false },
  { key: 'system', label: 'رسائل النظام', desc: 'تنبيهات مهمة تخص حسابك', icon: 'bell', on: true },
];

export default function NotificationPreferencesScreen() {
  const nav = useNavigation<any>();
  const [prefs, setPrefs] = useState<Pref[]>(INITIAL);
  const [error, setError] = useState<string | null>(null);

  // Load the stored preferences for the signed-in user; guests keep the
  // defaults on screen (they have nothing to sync yet).
  React.useEffect(() => {
    if (!hasSession()) return;
    let cancelled = false;
    fetchNotificationPreferences()
      .then((server) => {
        if (cancelled || !server) return;
        setPrefs((p) => p.map((x) => (x.key in server ? { ...x, on: !!(server as any)[x.key] } : x)));
      })
      .catch(() => undefined); // defaults stay on screen; toggling still works
    return () => { cancelled = true; };
  }, []);

  /**
   * Optimistic toggle that reverts if the server refuses — a preference that
   * silently failed to save is worse than one that visibly did not change.
   */
  const toggle = async (key: string) => {
    const before = prefs;
    const next = prefs.map((x) => (x.key === key ? { ...x, on: !x.on } : x));
    setPrefs(next);
    setError(null);
    if (!hasSession()) return;
    try {
      await updateNotificationPreferences(
        Object.fromEntries(next.map((p) => [p.key, p.on])) as NotificationPreferences,
      );
    } catch (e: unknown) {
      setPrefs(before);
      setError((e as Error)?.message ?? 'تعذّر حفظ التفضيلات');
    }
  };

  return (
    <Screen header={<AppBar title="تفضيلات الإشعارات" onBack={() => nav.goBack()} onBell={undefined} />}>
      <Text style={[font('400'), { fontSize: 12, color: colors.slate, textAlign: 'right', marginBottom: 12, marginHorizontal: 2, lineHeight: 18 }]}>
        اختر أنواع الإشعارات التي ترغب في تلقّيها. يمكنك تعديلها في أي وقت.
      </Text>
      {error ? (
        <Text style={[font('700'), { fontSize: 11.5, color: colors.red, textAlign: 'right', marginBottom: 10 }]}>{error}</Text>
      ) : null}
      <Card style={{ padding: 0 }}>
        {prefs.map((p, i) => (
          <View key={p.key}>
            <View style={[row, { gap: 12, padding: 13 }]}>
              <Switch value={p.on} onValueChange={() => void toggle(p.key)} trackColor={{ true: colors.navy700, false: '#CBD4E1' }} thumbColor="#fff" />
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={[font('800'), { fontSize: 13, color: colors.navy700 }]}>{p.label}</Text>
                <Text style={[font('400'), { fontSize: 10.5, color: colors.slate, textAlign: 'right', marginTop: 2 }]}>{p.desc}</Text>
              </View>
              <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: colors.paper2, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={p.icon} size={17} color={colors.navy700} />
              </View>
            </View>
            {i < prefs.length - 1 && <View style={{ height: 1, backgroundColor: colors.line2, marginHorizontal: 13 }} />}
          </View>
        ))}
      </Card>
      <View style={{ height: 12 }} />
    </Screen>
  );
}
