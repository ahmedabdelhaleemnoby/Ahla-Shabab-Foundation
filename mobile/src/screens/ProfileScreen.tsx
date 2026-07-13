import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { donorProfile, donations, egp } from '@ahla/shared';
import { Screen } from '../components/Screen';
import { AppBar } from '../components/AppBar';
import { Card, Stat, SectionHeader, Button } from '../components/ui';
import { Icon, IconName } from '../components/Icon';
import { colors, font, num, row, rowBetween } from '../theme';
import { appState, useAppState } from '../store/appState';

const myDonations = donations.filter((d) => d.donorName === donorProfile.name);

const favorites: { id: string; title: string; amount: number; gradient: [string, string] }[] = [
  { id: 'f1', title: 'كفالة يتيم', amount: 12000, gradient: ['#b98a5e', '#7d5a3c'] },
  { id: 'f2', title: 'سقيا الماء', amount: 45000, gradient: ['#8fb4dd', '#5f86b5'] },
  { id: 'f3', title: 'تجهيز عيادة', amount: 30000, gradient: ['#a7b6d0', '#7186a6'] },
  { id: 'f4', title: 'مساعدات طبية', amount: 18000, gradient: ['#c3a888', '#8f7350'] },
];

type Row = { label: string; danger?: boolean; value?: string; route?: string; action?: 'logout' };

/** حسابي rows — order per UX spec. */
const SETTINGS: Row[] = [
  { label: 'بياناتي', route: 'AccountSettings' },
  { label: 'تبرعاتي', route: 'DonationHistory' },
  { label: 'إيصالاتي', route: 'Receipts' },
  { label: 'حجوزاتي', route: 'MyBookings' },
  { label: 'المفضلة', route: 'Favorites' },
  { label: 'الإشعارات', route: 'NotificationPreferences' },
  { label: 'اللغة', value: 'العربية ‹', route: 'Language' },
  { label: 'تواصل معنا', route: 'ContactUs' },
  { label: 'سياسة الخصوصية', route: 'PrivacyPolicy' },
  { label: 'تسجيل الخروج', danger: true, action: 'logout' },
];

const TOOLS: Row[] = [
  { label: 'حاسبة الزكاة', route: 'ZakatCalculator' },
  { label: 'الأسئلة الشائعة', route: 'Faq' },
  { label: 'جولة تعريفية', route: 'Onboarding' },
];

export default function ProfileScreen() {
  const nav = useNavigation<any>();
  const { loggedIn, email } = useAppState();

  if (!loggedIn) {
    // Guest state (UX v2): clear message + login CTA, tools still reachable.
    return (
      <Screen header={<AppBar title="حسابي" />}>
        <Card style={{ alignItems: 'center', paddingVertical: 28, marginTop: 8 }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.paper2, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="user" size={32} color={colors.navy500} />
          </View>
          <Text style={[font('800'), { fontSize: 16, color: colors.navy700, marginTop: 14, textAlign: 'center' }]}>
            سجل دخولك لمتابعة تبرعاتك وحجوزاتك
          </Text>
          <Text style={[font('400'), { fontSize: 12, color: colors.slate, marginTop: 6, textAlign: 'center', lineHeight: 18 }]}>
            بحساب واحد تتابع إيصالاتك ومواعيدك وتصلك الإشعارات المهمة.
          </Text>
          <Button label="تسجيل الدخول" icon="log-in" style={{ marginTop: 16, alignSelf: 'stretch' }} onPress={() => nav.navigate('EmailAuth')} />
        </Card>

        <SectionHeader title="أدوات" />
        <Card style={{ padding: 0 }}>
          {TOOLS.map((s, i) => (
            <View key={s.label}>
              <Pressable style={[rowBetween, { paddingVertical: 12, paddingHorizontal: 14 }]} onPress={() => s.route && nav.navigate(s.route)}>
                <Icon name="chevron-left" size={16} color={colors.muted} />
                <Text style={[font('700'), { color: colors.navy700 }]}>{s.label}</Text>
              </Pressable>
              {i < TOOLS.length - 1 && <View style={{ height: 1, backgroundColor: colors.line2, marginHorizontal: 12 }} />}
            </View>
          ))}
        </Card>
        <View style={{ height: 12 }} />
      </Screen>
    );
  }

  return (
    <Screen header={<AppBar title="حسابي" />}>
      {/* Profile card */}
      <View style={[row, { backgroundColor: colors.navy700, borderRadius: 18, padding: 16, gap: 13 }]}>
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <View style={[row, { gap: 6 }]}>
            <Text style={[font('800'), { fontSize: 17, color: '#fff' }]}>{donorProfile.name}</Text>
            <Icon name="check-circle" size={16} color="#7FC8FF" />
          </View>
          <Text style={[font('400'), { fontSize: 11, color: '#bcd', marginTop: 3 }]}>{donorProfile.role}</Text>
          {email ? (
            <View style={[row, { gap: 5, marginTop: 5 }]}>
              <Text style={[font('600'), { fontSize: 10.5, color: '#cde', writingDirection: 'ltr' }]}>{email}</Text>
              <Icon name="mail" size={11} color="#9fc3e8" />
            </View>
          ) : null}
          <Text style={[font('400'), { fontSize: 10, color: '#cde', lineHeight: 15, marginTop: 8, textAlign: 'right' }]}>
            {donorProfile.bio}
          </Text>
        </View>
        <LinearGradient colors={['#c3d1e8', '#8ba0c2']} style={{ width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: 'rgba(255,255,255,.3)' }} />
      </View>

      {/* Stats */}
      <View style={[row, { gap: 8, marginTop: 12 }]}>
        <Stat icon="heart" value={String(donorProfile.stats.donations)} label="تبرعات" />
        <Stat icon="home" value={String(donorProfile.stats.projects)} label="مشروعات" />
        <Stat icon="users" value={String(donorProfile.stats.sponsoredCases)} label="حالات مكفولة" />
        <Stat icon="award" value={String(donorProfile.stats.badges)} label="الشارات" />
      </View>

      {/* Recent donations */}
      <SectionHeader title="آخر التبرعات" more="عرض الكل" onMore={() => nav.navigate('DonationHistory')} />
      <Card style={{ padding: 0 }}>
        {myDonations.map((d, i) => (
          <View key={d.id}>
            <View style={[row, { gap: 10, padding: 11 }]}>
              <LinearGradient colors={['#a7b6d0', '#7186a6']} style={{ width: 40, height: 40, borderRadius: 9 }} />
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={[font('800'), { fontSize: 12, color: colors.navy700 }]}>{d.cause}</Text>
                <Text style={[font('400'), num, { fontSize: 9, color: colors.muted }]}>{d.date}</Text>
              </View>
              <Text style={[font('800'), num, { color: colors.navy700, fontSize: 13 }]}>{d.amount} ج.م</Text>
            </View>
            {i < myDonations.length - 1 && <View style={{ height: 1, backgroundColor: colors.line2, marginHorizontal: 11 }} />}
          </View>
        ))}
      </Card>

      {/* Favorites carousel */}
      <SectionHeader title="مشاريعي المفضلة" more="عرض الكل" onMore={() => nav.navigate('Favorites')} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 10, flexDirection: 'row-reverse', paddingHorizontal: 2 }}
      >
        {favorites.map((f) => (
          <Card key={f.id} style={{ width: 150, padding: 0, overflow: 'hidden' }}>
            <View style={{ height: 90, position: 'relative' }}>
              <LinearGradient colors={f.gradient} style={{ flex: 1 }} />
              <View style={{ position: 'absolute', top: 8, left: 8, width: 26, height: 26, borderRadius: 13, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="heart" size={14} color={colors.red} />
              </View>
            </View>
            <View style={{ padding: 10, alignItems: 'flex-end' }}>
              <Text style={[font('800'), { fontSize: 12.5, color: colors.navy700 }]} numberOfLines={1}>
                {f.title}
              </Text>
              <Text style={[font('700'), num, { fontSize: 11, color: colors.slate, marginTop: 3 }]}>{egp(f.amount)}</Text>
            </View>
          </Card>
        ))}
      </ScrollView>

      {/* Settings */}
      <Card style={{ marginTop: 12, padding: 0 }}>
        {SETTINGS.map((s, i) => (
          <View key={s.label}>
            <Pressable
              style={[rowBetween, { paddingVertical: 12, paddingHorizontal: 14 }]}
              onPress={() => (s.action === 'logout' ? appState.logout() : s.route && nav.navigate(s.route))}
            >
              {s.value ? (
                <Text style={[font('400'), { color: colors.muted, fontSize: 11 }]}>{s.value}</Text>
              ) : (
                <Icon name="chevron-left" size={16} color={s.danger ? colors.red : colors.muted} />
              )}
              <Text style={[font('700'), { color: s.danger ? colors.red : colors.navy700 }]}>{s.label}</Text>
            </Pressable>
            {i < SETTINGS.length - 1 && <View style={{ height: 1, backgroundColor: colors.line2, marginHorizontal: 12 }} />}
          </View>
        ))}
      </Card>
      {/* Tools */}
      <SectionHeader title="أدوات" />
      <Card style={{ padding: 0 }}>
        {TOOLS.map((s, i) => (
          <View key={s.label}>
            <Pressable style={[rowBetween, { paddingVertical: 12, paddingHorizontal: 14 }]} onPress={() => s.route && nav.navigate(s.route)}>
              <Icon name="chevron-left" size={16} color={colors.muted} />
              <Text style={[font('700'), { color: colors.navy700 }]}>{s.label}</Text>
            </Pressable>
            {i < TOOLS.length - 1 && <View style={{ height: 1, backgroundColor: colors.line2, marginHorizontal: 12 }} />}
          </View>
        ))}
      </Card>
      <View style={{ height: 12 }} />
    </Screen>
  );
}
