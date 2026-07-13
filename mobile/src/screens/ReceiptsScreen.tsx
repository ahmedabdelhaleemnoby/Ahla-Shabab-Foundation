import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { donations, donorProfile } from '@ahla/shared';
import { Screen } from '../components/Screen';
import { AppBar } from '../components/AppBar';
import { Card, Pill, EmptyState, Button } from '../components/ui';
import { LoginGate } from '../components/LoginGate';
import { Icon } from '../components/Icon';
import { colors, font, num, row, rowBetween } from '../theme';
import { useAppState, type Receipt } from '../store/appState';

/** Historic (already confirmed) donations shown as receipts alongside session ones. */
const history: Receipt[] = donations
  .filter((d) => d.donorName === donorProfile.name)
  .map((d) => ({
    reference: `AS-${100000 + parseInt(d.id.replace(/\D/g, ''), 10) * 7919}`,
    date: d.date,
    amount: `${d.amount} ج.م`,
    cause: d.cause,
    method: d.method,
    recurring: d.recurring,
    status: d.status === 'قيد المعالجة' ? 'قيد التأكيد' : (d.status as Receipt['status']),
  }));

const tone = (s: Receipt['status']) => (s === 'مكتمل' ? 'green' : s === 'فشل' ? 'red' : 'gold');

export default function ReceiptsScreen() {
  const nav = useNavigation<any>();
  const { receipts } = useAppState();
  const all = [...receipts, ...history];

  return (
    <LoginGate
      icon="file-text"
      title="إيصالاتك في حسابك"
      benefits={['أرشيف كامل لكل إيصالات تبرعاتك', 'متابعة حالة كل تبرع حتى اعتماده', 'مشاركة وحفظ الإيصالات في أي وقت']}
    >
    <Screen header={<AppBar title="إيصالاتي" onBack={() => nav.goBack()} onBell={undefined} />}>
      <Text style={[font('400'), { fontSize: 12, color: colors.slate, textAlign: 'right', marginBottom: 10, marginHorizontal: 2, lineHeight: 18 }]}>
        كل إيصالات تبرعاتك في مكان واحد. الإيصالات قيد التأكيد/المراجعة تُعتمد بعد تأكيد الدفع أو مراجعة الإدارة.
      </Text>
      <Card style={[row, { gap: 9, marginBottom: 12, backgroundColor: colors.goldSoft }]}>
        <Icon name="alert-triangle" size={14} color="#B9791A" />
        <Text style={[font('700'), { flex: 1, fontSize: 10, color: '#8A5B10', textAlign: 'right' }]}>
          إيصالات تجريبية لغرض العرض فقط — لا تمثل عمليات دفع حقيقية.
        </Text>
      </Card>

      {all.map((r, i) => (
        <Pressable key={`${r.reference}-${i}`} onPress={() => nav.navigate('DonationSuccess', r)}>
          <Card style={[row, { gap: 11, marginBottom: 10 }]}>
            <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: colors.paper2, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="file-text" size={19} color={colors.navy700} />
            </View>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <View style={[rowBetween, { alignSelf: 'stretch' }]}>
                <Text style={[font('800'), num, { fontSize: 13.5, color: colors.navy700 }]}>{r.amount}</Text>
                <Text style={[font('800'), { fontSize: 12.5, color: colors.navy700, flex: 1, textAlign: 'right' }]} numberOfLines={1}>
                  {r.cause}
                </Text>
              </View>
              <View style={[row, { gap: 6, marginTop: 5 }]}>
                <Pill label={r.status} tone={tone(r.status) as any} />
                <Text style={[font('400'), num, { fontSize: 9.5, color: colors.muted }]}>
                  {r.reference} · {r.date}
                </Text>
              </View>
            </View>
            <Icon name="chevron-left" size={17} color={colors.muted} />
          </Card>
        </Pressable>
      ))}

      {all.length === 0 && (
        <>
          <EmptyState icon="file-text" title="لا توجد إيصالات بعد" hint="عند تبرعك سيظهر الإيصال هنا فور استلام الطلب" />
          <Button label="تبرع الآن" icon="heart" onPress={() => nav.navigate('Main', { screen: 'Donate' })} />
        </>
      )}
      <View style={{ height: 12 }} />
    </Screen>
    </LoginGate>
  );
}
