import React, { useState } from 'react';
import { View, Text, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { cases, pct, egp } from '@ahla/shared';
import { Screen } from '../components/Screen';
import { AppBar } from '../components/AppBar';
import { Card, Button, ProgressBar, Segmented } from '../components/ui';
import { StickyFooter } from './DonateScreen';
import { Icon, IconName } from '../components/Icon';
import { colors, font, num, row, rowBetween } from '../theme';
import type { RootProps } from '../navigation/types';

function SectionTitle({ label, icon }: { label: string; icon: IconName }) {
  return (
    <View style={[row, { gap: 7, justifyContent: 'flex-end' }]}>
      <Text style={[font('800'), { fontSize: 13, color: colors.navy700 }]}>{label}</Text>
      <Icon name={icon} size={16} color={colors.navy700} />
    </View>
  );
}

export default function CaseDetailScreen({ route }: RootProps<'CaseDetail'>) {
  const nav = useNavigation<any>();
  const item = cases.find((c) => c.id === route.params.id) ?? cases[0];
  const p = pct(item.raisedAmount, item.targetAmount);
  const remaining = item.targetAmount - item.raisedAmount;

  const [once, setOnce] = useState('500');
  const [monthly, setMonthly] = useState('600');
  const [recurring, setRecurring] = useState(false);

  return (
    <Screen
      header={<AppBar onBack={() => nav.goBack()} onBell={() => {}} />}
      footer={
        <StickyFooter>
          <Button label="أضف للمفضلة" variant="outline" icon="heart" style={{ width: 130 }} />
          <Button label="اكفل الحالة شهرياً" style={{ flex: 1 }} onPress={() => nav.navigate('Main', { screen: 'Donate' })} />
        </StickyFooter>
      }
    >
      {/* Hero */}
      <LinearGradient colors={item.gradient} style={{ height: 170, borderRadius: 16, padding: 12, justifyContent: 'space-between' }}>
        {item.verified && (
          <View style={[row, { gap: 4, backgroundColor: colors.green, borderRadius: 100, paddingVertical: 4, paddingHorizontal: 11, alignSelf: 'flex-start' }]}>
            <Icon name="check" size={12} color="#fff" />
            <Text style={[font('800'), { color: '#fff', fontSize: 10 }]}>حالة موثقة</Text>
          </View>
        )}
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[font('800'), { fontSize: 19, color: '#fff' }]}>{item.code}</Text>
          <Text style={[font('400'), { fontSize: 11, color: '#fff', opacity: 0.9 }]}>{item.location}</Text>
        </View>
      </LinearGradient>

      {/* About + need */}
      <Card style={{ marginTop: 12 }}>
        <SectionTitle label="نبذة عن الحالة" icon="user" />
        <Text style={[font('400'), { fontSize: 11, color: colors.slate, textAlign: 'right', lineHeight: 18, marginTop: 6 }]}>
          {item.summary}
        </Text>
        <View style={{ height: 12 }} />
        <SectionTitle label="الاحتياج الحالي" icon="package" />
        <Text style={[font('400'), { fontSize: 11, color: colors.slate, textAlign: 'right', marginTop: 6 }]}>{item.need}</Text>
      </Card>

      {/* Amounts */}
      <Card style={{ marginTop: 12 }}>
        <View style={[row, { justifyContent: 'space-between' }]}>
          <Amount value={item.targetAmount.toLocaleString('en-US')} label="المبلغ المطلوب" color={colors.navy700} />
          <Amount value={remaining.toLocaleString('en-US')} label="المبلغ المتبقي" color={colors.red} border />
          <Amount value={`${p}%`} label="نسبة التغطية" color={colors.green} />
        </View>
        <View style={{ marginTop: 11 }}>
          <ProgressBar percent={p} color={colors.green} />
        </View>
      </Card>

      {/* Donate options */}
      <Card style={{ marginTop: 12 }}>
        <SectionTitle label="تبرع لمرة واحدة" icon="heart" />
        <View style={{ marginTop: 9 }}>
          <Segmented options={['100', '200', '300', '500']} value={once} onChange={setOnce} />
        </View>
        <View style={{ height: 14 }} />
        <SectionTitle label="كفالة شهرية" icon="calendar" />
        <View style={{ marginTop: 9 }}>
          <Segmented options={['600', '800', '1,000']} value={monthly} onChange={setMonthly} />
        </View>
        <View style={[row, { gap: 10, marginTop: 12, justifyContent: 'flex-end' }]}>
          <Text style={[font('800'), { fontSize: 12, color: colors.navy700 }]}>تفعيل تبرع شهري مستمر</Text>
          <Switch value={recurring} onValueChange={setRecurring} trackColor={{ true: colors.navy700, false: '#CBD4E1' }} thumbColor="#fff" />
        </View>
      </Card>

      {/* Latest updates */}
      <Card style={{ marginTop: 12 }}>
        <SectionTitle label="آخر التحديثات" icon="file-text" />
        <View style={[row, { gap: 10, marginTop: 10, justifyContent: 'flex-end', alignItems: 'flex-start' }]}>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text style={[font('700'), { fontSize: 12, color: colors.navy700 }]}>تم توثيق الحالة</Text>
            <Text style={[font('400'), { fontSize: 10, color: colors.muted, marginTop: 2 }]}>منذ يومين</Text>
          </View>
          <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="check" size={13} color="#fff" />
          </View>
        </View>
        <View style={{ height: 1, backgroundColor: colors.line2, marginVertical: 10 }} />
        <View style={[row, { gap: 10, justifyContent: 'flex-end', alignItems: 'flex-start' }]}>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text style={[font('700'), { fontSize: 12, color: colors.navy700 }]}>زيارة ميدانية للأسرة</Text>
            <Text style={[font('400'), { fontSize: 10, color: colors.muted, marginTop: 2 }]}>منذ 5 أيام</Text>
          </View>
          <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.paper2, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="map-pin" size={12} color={colors.navy700} />
          </View>
        </View>
      </Card>

      <View style={{ height: 12 }} />
    </Screen>
  );
}

function Amount({ value, label, color, border }: { value: string; label: string; color: string; border?: boolean }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', borderLeftWidth: border ? 1 : 0, borderRightWidth: border ? 1 : 0, borderColor: colors.line2 }}>
      <Text style={[font('800'), num, { color, fontSize: 14 }]}>{value}</Text>
      <Text style={[font('400'), { fontSize: 9, color: colors.slate }]}>{label}</Text>
    </View>
  );
}
