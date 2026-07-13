import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { cases, pct, egp } from '@ahla/shared';
import { Screen } from '../components/Screen';
import { AppBar } from '../components/AppBar';
import { Card, Button, Pill, ProgressBar } from '../components/ui';
import { Icon } from '../components/Icon';
import { colors, font, num, row, rowBetween } from '../theme';

/* اكفل أسرة — dedicated monthly-sponsorship page (§5). */

const POLICY = [
  'الكفالة اشتراك شهري ثابت يمكن إيقافه في أي وقت.',
  'كل أسرة موثقة ببحث اجتماعي ميداني قبل عرضها.',
  'يصلك تقرير دوري بأثر كفالتك داخل التطبيق.',
  'تُعرض بيانات الأسرة على مستوى المحافظة فقط حفاظاً على خصوصيتها.',
];

export default function SponsorshipScreen() {
  const nav = useNavigation<any>();
  const families = cases.filter((c) => c.sponsorable);

  return (
    <Screen header={<AppBar title="اكفل أسرة" onBack={() => nav.goBack()} onBell={undefined} />}>
      {/* Intro */}
      <LinearGradient colors={[colors.green, colors.greenDark]} start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }} style={{ borderRadius: 18, padding: 16 }}>
        <View style={[row, { gap: 11 }]}>
          <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: 'rgba(255,255,255,.2)', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="users" size={22} color="#fff" />
          </View>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text style={[font('800'), { fontSize: 16, color: '#fff' }]}>كفالة شهرية تغيّر حياة أسرة</Text>
            <Text style={[font('400'), { fontSize: 10.5, color: '#e8f6ee', marginTop: 3, textAlign: 'right', lineHeight: 15 }]}>
              مبلغ ثابت كل شهر يضمن لأسرة موثقة احتياجاتها الأساسية بكرامة.
            </Text>
          </View>
        </View>
      </LinearGradient>

      <Text style={[font('800'), { fontSize: 13.5, color: colors.navy700, textAlign: 'right', marginTop: 16, marginBottom: 10, marginHorizontal: 2 }]}>
        أسر متاحة للكفالة ({families.length})
      </Text>

      {families.map((c) => {
        const p = pct(c.raisedAmount, c.targetAmount);
        const remaining = c.targetAmount - c.raisedAmount;
        return (
          <Card key={c.id} style={{ padding: 0, overflow: 'hidden', marginBottom: 12 }}>
            <LinearGradient colors={c.gradient} style={{ height: 96, padding: 11, justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between' }}>
                <Pill label={c.sponsorshipStatus ?? 'متاحة للكفالة'} tone={c.sponsorshipStatus === 'مكفولة جزئياً' ? 'gold' : 'green'} />
                {c.verified && (
                  <View style={[row, { gap: 4, backgroundColor: 'rgba(255,255,255,.9)', borderRadius: 100, paddingVertical: 3, paddingHorizontal: 9 }]}>
                    <Icon name="check-circle" size={11} color={colors.green} />
                    <Text style={[font('700'), { fontSize: 9, color: colors.greenDark }]}>موثقة</Text>
                  </View>
                )}
              </View>
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 5 }}>
                <Icon name="map-pin" size={11} color="#fff" />
                <Text style={[font('700'), { fontSize: 10, color: '#fff' }]}>{c.location}</Text>
              </View>
            </LinearGradient>

            <View style={{ padding: 13 }}>
              <Text style={[font('800'), { fontSize: 14, color: colors.navy700, textAlign: 'right' }]}>{c.code}</Text>
              <Text style={[font('400'), { fontSize: 10.5, color: colors.slate, textAlign: 'right', marginTop: 2 }]} numberOfLines={2}>{c.summary}</Text>

              {/* Monthly amount + duration */}
              <View style={[row, { gap: 8, marginTop: 10 }]}>
                <InfoBox icon="calendar" label="المدة" value={c.sponsorshipDuration ?? '—'} />
                <InfoBox icon="credit-card" label="الكفالة الشهرية" value={c.monthlyAmount ? `${egp(c.monthlyAmount)} / شهر` : '—'} strong />
              </View>

              {/* Coverage */}
              <View style={{ marginTop: 11 }}>
                <ProgressBar percent={p} color={colors.green} />
                <View style={[rowBetween, { marginTop: 6 }]}>
                  <Text style={[font('400'), num, { fontSize: 9.5, color: colors.slate }]}>متبقي {egp(remaining)}</Text>
                  <Text style={[font('800'), num, { fontSize: 11.5, color: colors.green }]}>{p}% مُغطّى</Text>
                </View>
              </View>

              <View style={[row, { gap: 8, marginTop: 11 }]}>
                <Button label="التفاصيل" variant="outline" small style={{ width: 96 }} onPress={() => nav.navigate('CaseDetail', { id: c.id })} />
                <Button
                  label="اكفل الأسرة شهرياً"
                  variant="green"
                  small
                  icon="heart"
                  style={{ flex: 1 }}
                  onPress={() => nav.navigate('Main', { screen: 'Donate', params: { caseId: c.id, sponsor: true } })}
                />
              </View>
            </View>
          </Card>
        );
      })}

      {/* Policy */}
      <Card style={{ backgroundColor: '#F6F9FD', marginTop: 4 }}>
        <View style={[row, { gap: 7, justifyContent: 'flex-end', marginBottom: 8 }]}>
          <Text style={[font('800'), { fontSize: 12.5, color: colors.navy700 }]}>سياسة الكفالة</Text>
          <Icon name="shield" size={15} color={colors.navy700} />
        </View>
        {POLICY.map((p) => (
          <View key={p} style={{ flexDirection: 'row-reverse', gap: 8, marginBottom: 6, alignItems: 'flex-start' }}>
            <Icon name="check" size={12} color={colors.green} />
            <Text style={[font('400'), { flex: 1, fontSize: 10.5, color: colors.slate, textAlign: 'right', lineHeight: 16 }]}>{p}</Text>
          </View>
        ))}
      </Card>
      <View style={{ height: 12 }} />
    </Screen>
  );
}

function InfoBox({ icon, label, value, strong }: { icon: 'calendar' | 'credit-card'; label: string; value: string; strong?: boolean }) {
  return (
    <View style={{ flex: 1, backgroundColor: strong ? colors.greenSoft : colors.paper2, borderRadius: 12, padding: 9, alignItems: 'flex-end' }}>
      <View style={[row, { gap: 5 }]}>
        <Text style={[font('400'), { fontSize: 9, color: strong ? colors.greenDark : colors.muted }]}>{label}</Text>
        <Icon name={icon} size={11} color={strong ? colors.greenDark : colors.muted} />
      </View>
      <Text style={[font('800'), num, { fontSize: 12, color: strong ? colors.greenDark : colors.navy700, marginTop: 3 }]}>{value}</Text>
    </View>
  );
}
