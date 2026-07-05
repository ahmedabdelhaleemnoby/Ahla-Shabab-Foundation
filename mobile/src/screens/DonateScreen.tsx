import React, { useState } from 'react';
import { View, Text, Pressable, Switch } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../components/Screen';
import { AppBar } from '../components/AppBar';
import { Card, Button, Tile, Segmented } from '../components/ui';
import { Icon } from '../components/Icon';
import { colors, font, num, row, rowBetween } from '../theme';
import { makeBookingRef, type PaymentMethod } from '@ahla/shared';

const DESTINATIONS = [
  { id: 'cases', label: 'الحالات', icon: 'users' as const },
  { id: 'projects', label: 'المشروعات', icon: 'home' as const },
  { id: 'students', label: 'دعم الطلاب', icon: 'award' as const },
  { id: 'kitchens', label: 'مطابخ', icon: 'coffee' as const },
  { id: 'water', label: 'المياه', icon: 'droplet' as const },
];

const AMOUNTS = ['مبلغ آخر', '250', '500', '1000'];

const METHODS: { id: PaymentMethod; brand?: string; brandColor?: string; icon?: 'credit-card' | 'smartphone' | 'home' }[] = [
  { id: 'بطاقة بنكية', icon: 'credit-card' },
  { id: 'فوري', brand: 'fawry', brandColor: colors.fawryNavy },
  { id: 'إنستاباي', brand: 'instaPAY', brandColor: colors.instapay },
  { id: 'فودافون كاش', brand: 'Vodafone', brandColor: colors.vodafone },
  { id: 'تحويل بنكي', icon: 'home' },
];

export default function DonateScreen() {
  const nav = useNavigation<any>();
  const [dest, setDest] = useState('cases');
  const [amount, setAmount] = useState('500');
  const [recurring, setRecurring] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>('بطاقة بنكية');

  const destLabel = DESTINATIONS.find((d) => d.id === dest)?.label ?? '';
  const total = amount === 'مبلغ آخر' ? '—' : `${amount} ج.م`;

  const confirm = () => {
    nav.navigate('DonationSuccess', {
      amount: total,
      cause: destLabel,
      method,
      recurring,
      reference: makeBookingRef(Math.floor(Date.now() / 1000)),
    });
  };

  return (
    <Screen
      header={<AppBar title="طرق التبرع" />}
      footer={
        <StickyFooter>
          <Button label="تأكيد التبرع" onPress={confirm} style={{ flex: 1 }} />
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
      <View style={[rowBetween, { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, marginTop: 9 }]}>
        <Text style={[font('700'), num, { color: colors.navy700 }]}>{amount === 'مبلغ آخر' ? '0' : amount}</Text>
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
        {METHODS.map((m) => {
          const on = method === m.id;
          return (
            <Pressable
              key={m.id}
              onPress={() => setMethod(m.id)}
              style={[row, { gap: 10, borderWidth: 1, borderColor: on ? colors.navy700 : colors.line, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#fff' }]}
            >
              <View style={[styles_rd, on && { borderColor: colors.navy700 }]}>
                {on && <View style={styles_rdDot} />}
              </View>
              <Text style={[font('700'), { flex: 1, fontSize: 12.5, color: colors.ink, textAlign: 'right' }]}>{m.id}</Text>
              {m.brand ? (
                <Text style={[font('800'), { color: m.brandColor, fontSize: 11 }]}>{m.brand}</Text>
              ) : (
                <Icon name={m.icon ?? 'credit-card'} size={16} color={colors.navy700} />
              )}
            </Pressable>
          );
        })}
      </View>

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
