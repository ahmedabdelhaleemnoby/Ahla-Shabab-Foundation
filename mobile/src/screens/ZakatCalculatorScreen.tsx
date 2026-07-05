import React, { useMemo, useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { egp } from '@ahla/shared';
import { Screen } from '../components/Screen';
import { AppBar } from '../components/AppBar';
import { Card, Button } from '../components/ui';
import { StickyFooter } from './DonateScreen';
import { Icon, IconName } from '../components/Icon';
import { colors, font, num, radius, row, rowBetween } from '../theme';

type FieldKey = 'cash' | 'gold' | 'trade' | 'owed' | 'liabilities';

const FIELDS: { key: FieldKey; label: string; hint: string; icon: IconName; subtract?: boolean }[] = [
  { key: 'cash', label: 'النقود والأرصدة البنكية', hint: 'المبالغ النقدية والمدخرات', icon: 'credit-card' },
  { key: 'gold', label: 'قيمة الذهب والفضة', hint: 'القيمة السوقية بالجنيه', icon: 'award' },
  { key: 'trade', label: 'عروض التجارة', hint: 'قيمة البضائع المُعدّة للبيع', icon: 'shopping-bag' },
  { key: 'owed', label: 'ديون مستحقة لك', hint: 'أموال تتوقع تحصيلها', icon: 'download' },
  { key: 'liabilities', label: 'الخصوم والديون عليك', hint: 'يُخصم من إجمالي المال', icon: 'arrow-up', subtract: true },
];

// Approximate nisab (value of 85g gold). Editable by the user.
const DEFAULT_NISAB = 200000;
const ZAKAT_RATE = 0.025;

export default function ZakatCalculatorScreen() {
  const nav = useNavigation<any>();
  const [values, setValues] = useState<Record<FieldKey, string>>({ cash: '', gold: '', trade: '', owed: '', liabilities: '' });
  const [nisab, setNisab] = useState(String(DEFAULT_NISAB));

  const set = (k: FieldKey, v: string) => setValues((prev) => ({ ...prev, [k]: v.replace(/[^0-9]/g, '') }));
  const n = (v: string) => Number(v || 0);

  const { zakatableWealth, aboveNisab, zakat } = useMemo(() => {
    const assets = n(values.cash) + n(values.gold) + n(values.trade) + n(values.owed);
    const wealth = Math.max(0, assets - n(values.liabilities));
    const above = wealth >= n(nisab) && wealth > 0;
    return { zakatableWealth: wealth, aboveNisab: above, zakat: above ? Math.round(wealth * ZAKAT_RATE) : 0 };
  }, [values, nisab]);

  return (
    <Screen
      header={<AppBar title="حاسبة الزكاة" onBack={() => nav.goBack()} onBell={undefined} />}
      footer={
        <StickyFooter>
          <Button
            label={zakat > 0 ? `تبرع بالزكاة (${egp(zakat)})` : 'تبرع بالزكاة'}
            icon="heart"
            style={{ flex: 1, opacity: zakat > 0 ? 1 : 0.6 }}
            onPress={() => zakat > 0 && nav.navigate('Main', { screen: 'Donate' })}
          />
        </StickyFooter>
      }
    >
      <Card style={[row, { gap: 11, backgroundColor: '#EAF0F8', marginBottom: 4 }]}>
        <Icon name="info" size={18} color={colors.navy700} />
        <Text style={[font('400'), { flex: 1, fontSize: 10.5, color: colors.slate, textAlign: 'right', lineHeight: 16 }]}>
          احسب زكاة مالك بسهولة. الزكاة واجبة إذا بلغ المال النصاب ومرّ عليه عام هجري (2.5%).
        </Text>
      </Card>

      {FIELDS.map((f) => (
        <View key={f.key} style={{ marginTop: 14 }}>
          <View style={[row, { gap: 7, marginBottom: 6 }]}>
            <Icon name={f.icon} size={15} color={f.subtract ? colors.red : colors.navy700} />
            <Text style={[font('700'), { fontSize: 12.5, color: f.subtract ? colors.red : colors.navy700 }]}>{f.label}</Text>
          </View>
          <View style={[row, { borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, backgroundColor: '#fff', paddingHorizontal: 14 }]}>
            <TextInput
              value={values[f.key]}
              onChangeText={(t) => set(f.key, t)}
              placeholder="0"
              placeholderTextColor={colors.muted}
              keyboardType="number-pad"
              style={[font('700'), num, { flex: 1, fontSize: 15, color: colors.ink, paddingVertical: 12, textAlign: 'left' }]}
            />
            <Text style={[font('600'), { color: colors.muted, fontSize: 12 }]}>ج.م</Text>
          </View>
          <Text style={[font('400'), { fontSize: 9.5, color: colors.muted, textAlign: 'right', marginTop: 3 }]}>{f.hint}</Text>
        </View>
      ))}

      {/* Nisab */}
      <View style={{ marginTop: 14 }}>
        <View style={[row, { gap: 7, marginBottom: 6 }]}>
          <Icon name="target" size={15} color={colors.navy500} />
          <Text style={[font('700'), { fontSize: 12.5, color: colors.navy500 }]}>قيمة النصاب</Text>
        </View>
        <View style={[row, { borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, backgroundColor: '#fff', paddingHorizontal: 14 }]}>
          <TextInput value={nisab} onChangeText={(t) => setNisab(t.replace(/[^0-9]/g, ''))} keyboardType="number-pad" style={[font('700'), num, { flex: 1, fontSize: 15, color: colors.ink, paddingVertical: 12, textAlign: 'left' }]} />
          <Text style={[font('600'), { color: colors.muted, fontSize: 12 }]}>ج.م</Text>
        </View>
        <Text style={[font('400'), { fontSize: 9.5, color: colors.muted, textAlign: 'right', marginTop: 3 }]}>ما يعادل 85 جراماً من الذهب — عدّلها حسب السعر الحالي.</Text>
      </View>

      {/* Result */}
      <Card style={{ marginTop: 18, backgroundColor: aboveNisab ? undefined : '#F6F9FD' }}>
        <View style={[rowBetween, { marginBottom: 8 }]}>
          <Text style={[font('700'), num, { fontSize: 13, color: colors.navy700 }]}>{egp(zakatableWealth)}</Text>
          <Text style={[font('400'), { fontSize: 12, color: colors.slate }]}>إجمالي المال الزكوي</Text>
        </View>
        <View style={{ height: 1, backgroundColor: colors.line2, marginVertical: 8 }} />
        <View style={rowBetween}>
          <Text style={[font('800'), num, { fontSize: 24, color: aboveNisab ? colors.green : colors.muted }]}>{egp(zakat)}</Text>
          <Text style={[font('800'), { fontSize: 14, color: colors.navy700 }]}>مقدار الزكاة (2.5%)</Text>
        </View>
        {!aboveNisab && (
          <Text style={[font('600'), { fontSize: 11, color: colors.slate, textAlign: 'right', marginTop: 8 }]}>
            {zakatableWealth > 0 ? 'المال لم يبلغ النصاب — لا تجب الزكاة.' : 'أدخل قيم أموالك لحساب الزكاة.'}
          </Text>
        )}
      </Card>
      <View style={{ height: 12 }} />
    </Screen>
  );
}
