import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { consultants } from '@ahla/shared';
import { Screen } from '../components/Screen';
import { AppBar } from '../components/AppBar';
import { Card, Segmented } from '../components/ui';
import { StickyFooter } from './DonateScreen';
import { Button } from '../components/ui';
import { Icon, IconName } from '../components/Icon';
import { colors, font, row, rowBetween } from '../theme';

const DAYS = [
  { d: 'السبت', n: '24', m: 'مايو' },
  { d: 'الجمعة', n: '23', m: 'مايو' },
  { d: 'الخميس', n: '22', m: 'مايو' },
  { d: 'الأربعاء', n: '21', m: 'مايو' },
];
const TIMES = ['2:00 م', '1:00 م', '11:00 ص', '10:00 ص'];
const MODES: { label: string; icon: IconName }[] = [
  { label: 'مكالمة فيديو', icon: 'video' },
  { label: 'مكالمة صوتية', icon: 'phone' },
  { label: 'محادثة نصية', icon: 'message-square' },
];

function SectionTitle({ label, icon }: { label: string; icon: IconName }) {
  return (
    <View style={[row, { gap: 7, marginTop: 16, marginBottom: 8, marginHorizontal: 2 }]}>
      <Icon name={icon} size={16} color={colors.navy700} />
      <Text style={[font('800'), { fontSize: 13, color: colors.navy700 }]}>{label}</Text>
    </View>
  );
}

export default function BookingScreen() {
  const nav = useNavigation<any>();
  const consultant = consultants.find((c) => !c.featured) ?? consultants[1];
  const [day, setDay] = useState('22');
  const [time, setTime] = useState('11:00 ص');
  const [mode, setMode] = useState('مكالمة صوتية');

  return (
    <Screen
      header={<AppBar onBack={() => nav.goBack()} onBell={() => {}} />}
      footer={
        <StickyFooter>
          <Button label="تأكيد الحجز" style={{ flex: 1 }} onPress={() => nav.goBack()} />
        </StickyFooter>
      }
    >
      <View style={[row, { gap: 8, justifyContent: 'flex-end', marginTop: 2 }]}>
        <Text style={[font('800'), { fontSize: 20, color: colors.navy700 }]}>حجز موعد</Text>
        <Icon name="chevron-right" size={22} color={colors.navy700} />
      </View>
      <Text style={[font('400'), { fontSize: 12, color: colors.slate, textAlign: 'right' }]}>
        حجز جلسة استشارية أونلاين
      </Text>

      <SectionTitle label="اختر التخصص" icon="grid" />
      <View style={[rowBetween, { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14 }]}>
        <Icon name="chevron-down" size={16} color={colors.navy700} />
        <Text style={[font('700'), { color: colors.navy700 }]}>دعم نفسي</Text>
      </View>

      <SectionTitle label="اختر المستشار" icon="user" />
      <Card style={[row, { gap: 11 }]}>
        <Icon name="chevron-down" size={16} color={colors.muted} />
        <View style={{ backgroundColor: '#EAF0F8', borderRadius: 10, paddingVertical: 3, paddingHorizontal: 8 }}>
          <Text style={[font('800'), { fontSize: 10, color: '#B9791A' }]}>★ {consultant.rating}</Text>
        </View>
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <Text style={[font('800'), { fontSize: 13.5, color: colors.navy700 }]}>{consultant.name}</Text>
          <Text style={[font('400'), { fontSize: 10, color: colors.slate }]}>
            {consultant.specialty} · خبرة {consultant.yearsExperience} سنوات
          </Text>
        </View>
        <LinearGradient colors={['#a7b6d0', '#7186a6']} style={{ width: 48, height: 48, borderRadius: 11 }} />
      </Card>

      <SectionTitle label="اختر التاريخ" icon="calendar" />
      <View style={[row, { gap: 6 }]}>
        {DAYS.map((dd) => {
          const on = dd.n === day;
          return (
            <Pressable
              key={dd.n}
              onPress={() => setDay(dd.n)}
              style={{ flex: 1, alignItems: 'center', borderRadius: 12, paddingVertical: 8, borderWidth: on ? 0 : 1, borderColor: colors.line, backgroundColor: on ? colors.navy700 : '#fff' }}
            >
              <Text style={[font('400'), { fontSize: 9, color: on ? '#fff' : colors.slate }]}>{dd.d}</Text>
              <Text style={[font('800'), { fontSize: 16, color: on ? '#fff' : colors.navy700 }]}>{dd.n}</Text>
              <Text style={[font('400'), { fontSize: 8, color: on ? '#fff' : colors.slate }]}>{dd.m}</Text>
            </Pressable>
          );
        })}
      </View>

      <SectionTitle label="اختر الوقت المتاح" icon="clock" />
      <Segmented options={TIMES} value={time} onChange={setTime} />

      <SectionTitle label="نوع الجلسة" icon="video" />
      <View style={[row, { gap: 8 }]}>
        {MODES.map((m) => {
          const on = m.label === mode;
          return (
            <Pressable
              key={m.label}
              onPress={() => setMode(m.label)}
              style={{ flex: 1, alignItems: 'center', borderRadius: 12, paddingVertical: 11, borderWidth: 1, borderColor: on ? colors.navy700 : colors.line, backgroundColor: on ? colors.navy700 : '#fff' }}
            >
              <Icon name={m.icon} size={16} color={on ? '#fff' : colors.slate} />
              <Text style={[font('700'), { fontSize: 10.5, color: on ? '#fff' : colors.slate, marginTop: 4, textAlign: 'center' }]}>
                {m.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Card style={[row, { gap: 10, marginTop: 12, backgroundColor: '#EAF0F8' }]}>
        <Icon name="lock" size={16} color={colors.navy700} />
        <Text style={[font('400'), { flex: 1, fontSize: 10, color: colors.slate, textAlign: 'right', lineHeight: 15 }]}>
          تنبيه: جميع الجلسات أونلاين وآمنة وسرية. خصوصيتك تهمنا.
        </Text>
      </Card>
      <View style={{ height: 12 }} />
    </Screen>
  );
}
