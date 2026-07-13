import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { cases, pct, egp } from '@ahla/shared';
import { Screen } from '../components/Screen';
import { AppBar } from '../components/AppBar';
import { Card, Button, ProgressBar } from '../components/ui';
import { Icon } from '../components/Icon';
import { colors, font, num, row, rowBetween } from '../theme';

/* حالات عاجلة (§6) — visually distinct from monthly sponsorship:
   red urgency accents, remaining-amount focus, one-tap donate. */

export default function UrgentCasesScreen() {
  const nav = useNavigation<any>();
  const urgent = cases.filter((c) => c.tag === 'عاجل');

  return (
    <Screen header={<AppBar title="حالات عاجلة" onBack={() => nav.goBack()} onBell={undefined} />}>
      {/* Urgency banner */}
      <View style={[row, { gap: 11, backgroundColor: colors.redSoft, borderRadius: 16, padding: 13, marginTop: 4 }]}>
        <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="zap" size={20} color={colors.red} />
        </View>
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <Text style={[font('800'), { fontSize: 13, color: colors.red }]}>حالات لا تحتمل التأجيل</Text>
          <Text style={[font('400'), { fontSize: 10.5, color: colors.slate, marginTop: 2, textAlign: 'right' }]}>
            موثقة ميدانياً وتحتاج تدخلاً سريعاً — كل مساهمة تقرّبها من هدفها.
          </Text>
        </View>
      </View>

      <Text style={[font('800'), { fontSize: 13.5, color: colors.navy700, textAlign: 'right', marginTop: 16, marginBottom: 10, marginHorizontal: 2 }]}>
        الحالات العاجلة الآن ({urgent.length})
      </Text>

      {urgent.map((c) => {
        const p = pct(c.raisedAmount, c.targetAmount);
        const remaining = c.targetAmount - c.raisedAmount;
        return (
          <Card key={c.id} style={{ padding: 0, overflow: 'hidden', marginBottom: 12, borderWidth: 1, borderColor: '#F3D5D5' }}>
            <LinearGradient colors={c.gradient} style={{ height: 96, padding: 11, justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between' }}>
                <View style={[row, { gap: 4, backgroundColor: colors.red, borderRadius: 100, paddingVertical: 3, paddingHorizontal: 10 }]}>
                  <Icon name="zap" size={11} color="#fff" />
                  <Text style={[font('800'), { fontSize: 9.5, color: '#fff' }]}>عاجل</Text>
                </View>
                <View style={{ backgroundColor: 'rgba(255,255,255,.9)', borderRadius: 100, paddingVertical: 3, paddingHorizontal: 9, maxWidth: 190 }}>
                  <Text numberOfLines={1} style={[font('700'), { fontSize: 9, color: colors.navy700 }]}>{c.need.replace(/\.$/, '')}</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 5 }}>
                <Icon name="map-pin" size={11} color="#fff" />
                <Text style={[font('700'), { fontSize: 10, color: '#fff' }]}>{c.location}</Text>
              </View>
            </LinearGradient>

            <View style={{ padding: 13 }}>
              <Text style={[font('800'), { fontSize: 14, color: colors.navy700, textAlign: 'right' }]}>{c.title}</Text>
              <Text style={[font('400'), { fontSize: 10.5, color: colors.slate, textAlign: 'right', marginTop: 2 }]} numberOfLines={2}>{c.summary}</Text>

              {/* Amounts */}
              <View style={[row, { gap: 8, marginTop: 10 }]}>
                <AmountBox label="المتبقي" value={egp(remaining)} tone="red" />
                <AmountBox label="تم جمع" value={egp(c.raisedAmount)} tone="green" />
                <AmountBox label="المطلوب" value={egp(c.targetAmount)} />
              </View>

              <View style={{ marginTop: 11 }}>
                <ProgressBar percent={p} color={colors.red} />
                <View style={[rowBetween, { marginTop: 6 }]}>
                  <Text style={[font('400'), { fontSize: 9.5, color: colors.muted }]}>{c.lastUpdate}</Text>
                  <Text style={[font('800'), num, { fontSize: 11.5, color: colors.red }]}>{p}%</Text>
                </View>
              </View>

              <View style={[row, { gap: 8, marginTop: 11 }]}>
                <Button label="التفاصيل" variant="outline" small style={{ width: 96 }} onPress={() => nav.navigate('CaseDetail', { id: c.id })} />
                <Button
                  label="تبرع الآن"
                  variant="red"
                  small
                  icon="heart"
                  style={{ flex: 1 }}
                  onPress={() => nav.navigate('Main', { screen: 'Donate', params: { caseId: c.id } })}
                />
              </View>
            </View>
          </Card>
        );
      })}

      {/* All-cases browser (search + filters) */}
      <Button label="تصفح كل الحالات الإنسانية" variant="outline" icon="search" onPress={() => nav.navigate('Cases')} />
      <View style={{ height: 12 }} />
    </Screen>
  );
}

function AmountBox({ label, value, tone }: { label: string; value: string; tone?: 'red' | 'green' }) {
  const fg = tone === 'red' ? colors.red : tone === 'green' ? colors.greenDark : colors.navy700;
  const bg = tone === 'red' ? colors.redSoft : tone === 'green' ? colors.greenSoft : colors.paper2;
  return (
    <View style={{ flex: 1, backgroundColor: bg, borderRadius: 12, paddingVertical: 8, alignItems: 'center' }}>
      <Text style={[font('400'), { fontSize: 8.5, color: fg }]}>{label}</Text>
      <Text style={[font('800'), num, { fontSize: 11, color: fg, marginTop: 2 }]}>{value}</Text>
    </View>
  );
}
