import React, { useState } from 'react';
import { View, Text, Pressable, Switch } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../components/Screen';
import { AppBar } from '../components/AppBar';
import { Card, Button, Tile, Segmented } from '../components/ui';
import { Icon } from '../components/Icon';
import { colors, font, num, row, rowBetween } from '../theme';
import { makeBookingRef, paymentMethods, initialDonationStatus, isMethodUsable, isValidDonationAmount, type PaymentMethod } from '@ahla/shared';
import { appState } from '../store/appState';
import { TextInput } from 'react-native';

const DESTINATIONS = [
  { id: 'cases', label: 'الحالات', icon: 'users' as const },
  { id: 'projects', label: 'المشروعات', icon: 'home' as const },
  { id: 'students', label: 'دعم الطلاب', icon: 'award' as const },
  { id: 'kitchens', label: 'مطابخ', icon: 'coffee' as const },
  { id: 'water', label: 'المياه', icon: 'droplet' as const },
];

const AMOUNTS = ['مبلغ آخر', '250', '500', '1000'];

/** Brand visuals per method — availability/behavior comes from shared paymentMethods. */
const BRAND: Record<PaymentMethod, { brand?: string; brandColor?: string; icon?: 'credit-card' | 'smartphone' | 'home' }> = {
  'بطاقة بنكية': { icon: 'credit-card' },
  فوري: { brand: 'fawry', brandColor: colors.fawryNavy },
  إنستاباي: { brand: 'instaPAY', brandColor: colors.instapay },
  'فودافون كاش': { brand: 'Vodafone', brandColor: colors.vodafone },
  'تحويل بنكي': { icon: 'home' },
};

export default function DonateScreen() {
  const nav = useNavigation<any>();
  const [dest, setDest] = useState('cases');
  const [amount, setAmount] = useState('500');
  const [custom, setCustom] = useState('');
  const [recurring, setRecurring] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>('بطاقة بنكية');

  const destLabel = DESTINATIONS.find((d) => d.id === dest)?.label ?? '';
  const effective = amount === 'مبلغ آخر' ? custom : amount;
  const total = effective ? `${effective} ج.م` : '—';
  const methodInfo = paymentMethods.find((m) => m.id === method);
  const canConfirm = isValidDonationAmount(effective) && isMethodUsable(method);

  const confirm = () => {
    if (!canConfirm || !methodInfo) return;
    // Donation is recorded PENDING only. 'مكتمل' can come solely from the
    // payment-gateway server callback, or admin approval for manual methods.
    const receipt = {
      reference: makeBookingRef(Math.floor(Date.now() / 1000)),
      date: new Date().toISOString().slice(0, 10),
      amount: total,
      cause: destLabel,
      method,
      recurring,
      status: initialDonationStatus(method), // rule lives in @ahla/shared (unit-tested)
    };
    appState.addReceipt(receipt);
    // TODO(backend): POST /donations → navigate with the server's reference/status.
    nav.navigate('DonationSuccess', receipt);
  };

  return (
    <Screen
      header={<AppBar title="طرق التبرع" />}
      footer={
        <StickyFooter>
          <Button label="تأكيد التبرع" onPress={confirm} style={{ flex: 1, opacity: canConfirm ? 1 : 0.55 }} />
        </StickyFooter>
      }
    >
      {/* Zakat calculator shortcut */}
      <Pressable
        onPress={() => nav.navigate('ZakatCalculator')}
        style={[row, { gap: 11, backgroundColor: '#EAF0F8', borderRadius: 14, padding: 12, marginTop: 4 }]}
      >
        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="percent" size={19} color={colors.navy700} />
        </View>
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <Text style={[font('800'), { fontSize: 12.5, color: colors.navy700 }]}>لست متأكداً من زكاتك؟</Text>
          <Text style={[font('400'), { fontSize: 10, color: colors.slate, marginTop: 1 }]}>احسب مقدار زكاة مالك في ثوانٍ</Text>
        </View>
        <Icon name="chevron-left" size={18} color={colors.muted} />
      </Pressable>

      <Label text="اختر وجهة التبرع" />
      <View style={[row, { gap: 6 }]}>
        {DESTINATIONS.map((d) => (
          <Tile key={d.id} label={d.label} icon={d.icon} active={dest === d.id} onPress={() => setDest(d.id)} />
        ))}
      </View>

      <Label text="اختر مبلغ التبرع" />
      <Segmented options={AMOUNTS} value={amount} onChange={setAmount} />
      <View style={[rowBetween, { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: 12, paddingHorizontal: 14, marginTop: 9 }]}>
        {amount === 'مبلغ آخر' ? (
          <TextInput
            value={custom}
            onChangeText={(t) => setCustom(t.replace(/[^0-9]/g, '').slice(0, 7))}
            placeholder="اكتب المبلغ"
            placeholderTextColor={colors.muted}
            keyboardType="number-pad"
            style={[font('700'), num, { flex: 1, color: colors.navy700, fontSize: 15, paddingVertical: 12, textAlign: 'left' }]}
          />
        ) : (
          <Text style={[font('700'), num, { color: colors.navy700, paddingVertical: 12 }]}>{amount}</Text>
        )}
        <Text style={[font('400'), { color: colors.muted }]}>ج.م</Text>
      </View>

      {/* Recurring */}
      <Card style={[row, { gap: 11, marginTop: 12 }]}>
        <Switch
          value={recurring}
          onValueChange={setRecurring}
          trackColor={{ true: colors.navy700, false: '#CBD4E1' }}
          thumbColor="#fff"
        />
        <View style={{ alignItems: 'flex-end', flex: 1 }}>
          <Text style={[font('800'), { fontSize: 12.5, color: colors.navy700 }]}>تبرع شهري مستمر</Text>
          <Text style={[font('400'), { fontSize: 10, color: colors.slate }]}>سيتم خصم المبلغ شهرياً بنفس القيمة</Text>
        </View>
      </Card>

      <Label text="اختر طريقة الدفع" />
      <View style={{ gap: 8 }}>
        {paymentMethods.map((m) => {
          const on = method === m.id;
          const available = m.availability === 'متاحة';
          const b = BRAND[m.id];
          return (
            <Pressable
              key={m.id}
              disabled={!available}
              onPress={() => setMethod(m.id)}
              style={[row, { gap: 10, borderWidth: 1, borderColor: on ? colors.navy700 : colors.line, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#fff', alignItems: 'flex-start', opacity: available ? 1 : 0.55 }]}
            >
              <View style={[styles_rd, { marginTop: 3 }, on && { borderColor: colors.navy700 }]}>
                {on && <View style={styles_rdDot} />}
              </View>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <View style={[row, { gap: 6 }]}>
                  <Text style={[font('700'), { fontSize: 13, color: colors.ink }]}>{m.id}</Text>
                  <Text style={[font('600'), { fontSize: 9.5, color: colors.muted }]}>· {m.group}</Text>
                  <View style={{ backgroundColor: available ? colors.greenSoft : colors.goldSoft, borderRadius: 100, paddingVertical: 2, paddingHorizontal: 8 }}>
                    <Text style={[font('700'), { fontSize: 9, color: available ? colors.greenDark : '#B9791A' }]}>{m.availability}</Text>
                  </View>
                </View>
                <Text style={[font('400'), { fontSize: 10, color: colors.slate, marginTop: 3, textAlign: 'right', lineHeight: 14 }]}>{m.description}</Text>
              </View>
              {b.brand ? (
                <Text style={[font('800'), { color: b.brandColor, fontSize: 11, marginTop: 4 }]}>{b.brand}</Text>
              ) : (
                <Icon name={b.icon ?? 'credit-card'} size={16} color={colors.navy700} />
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Security reassurance */}
      <Card style={[row, { gap: 10, marginTop: 12, backgroundColor: colors.greenSoft }]}>
        <Icon name="lock" size={16} color={colors.greenDark} />
        <Text style={[font('600'), { flex: 1, fontSize: 10.5, color: colors.greenDark, textAlign: 'right', lineHeight: 16 }]}>
          الدفع آمن ومشفّر بالكامل. لن يُعتمد تبرعك إلا بعد تأكيد العملية من بوابة الدفع أو مراجعة الإدارة.{'\n'}هذه نسخة عرض تقديمي — لا يتم تنفيذ أي عملية دفع حقيقية.
        </Text>
      </Card>

      {/* Summary */}
      <Card style={{ marginTop: 12, backgroundColor: '#F6F9FD' }}>
        <Text style={[font('800'), { fontSize: 12.5, color: colors.navy700, textAlign: 'right', marginBottom: 8 }]}>ملخص التبرع</Text>
        <View style={[rowBetween, { marginBottom: 5 }]}>
          <Text style={[font('400'), { fontSize: 11, color: colors.slate }]}>{destLabel}</Text>
          <Text style={[font('400'), { fontSize: 11, color: colors.slate }]}>وجهة التبرع:</Text>
        </View>
        <View style={rowBetween}>
          <Text style={[font('400'), num, { fontSize: 11, color: colors.slate }]}>{total}</Text>
          <Text style={[font('400'), { fontSize: 11, color: colors.slate }]}>مبلغ التبرع:</Text>
        </View>
        <View style={{ height: 1, backgroundColor: colors.line2, marginVertical: 10 }} />
        <View style={rowBetween}>
          <Text style={[font('800'), num, { fontSize: 16, color: colors.navy700 }]}>{total}</Text>
          <Text style={[font('800'), { fontSize: 12.5, color: colors.navy700 }]}>الإجمالي:</Text>
        </View>
      </Card>
      <View style={{ height: 12 }} />
    </Screen>
  );
}

function Label({ text }: { text: string }) {
  return (
    <Text style={[font('800'), { fontSize: 12.5, color: colors.navy700, textAlign: 'right', marginTop: 16, marginBottom: 10, marginHorizontal: 2 }]}>
      {text}
    </Text>
  );
}

export function StickyFooter({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row-reverse', gap: 10, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: colors.line, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 20 }}>
      {children}
    </View>
  );
}

const styles_rd = {
  width: 17,
  height: 17,
  borderRadius: 9,
  borderWidth: 2,
  borderColor: colors.muted,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};
const styles_rdDot = { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.navy700 };
