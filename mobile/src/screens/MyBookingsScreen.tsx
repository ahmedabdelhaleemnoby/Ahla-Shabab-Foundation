import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { appointments, type Appointment, type AppointmentStatus } from '@ahla/shared';
import { Screen } from '../components/Screen';
import { AppBar } from '../components/AppBar';
import { Card, Pill } from '../components/ui';
import { Icon, IconName } from '../components/Icon';
import { colors, font, num, row, rowBetween } from '../theme';

const UPCOMING: AppointmentStatus[] = ['مؤكد', 'قيد الانتظار'];

const statusTone = (s: AppointmentStatus): 'green' | 'gold' | 'red' | 'navy' =>
  s === 'مؤكد' ? 'navy' : s === 'مكتمل' ? 'green' : s === 'قيد الانتظار' ? 'gold' : 'red';

const modeIcon: Record<Appointment['mode'], IconName> = {
  'مكالمة فيديو': 'video',
  'مكالمة صوتية': 'phone',
  'محادثة نصية': 'message-square',
};

// Treat these mock appointments as "mine" for the demo.
const mine = appointments.slice(0, 5);

export default function MyBookingsScreen() {
  const nav = useNavigation<any>();
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');

  const list = mine.filter((a) =>
    tab === 'upcoming' ? UPCOMING.includes(a.status) : !UPCOMING.includes(a.status)
  );

  return (
    <Screen header={<AppBar title="حجوزاتي" onBack={() => nav.goBack()} onBell={undefined} />}>
      {/* Tabs */}
      <View style={{ flexDirection: 'row-reverse', backgroundColor: colors.paper2, borderRadius: 12, padding: 4, marginBottom: 4 }}>
        {(['upcoming', 'past'] as const).map((t) => {
          const on = tab === t;
          return (
            <Text
              key={t}
              onPress={() => setTab(t)}
              style={[
                font('700'),
                {
                  flex: 1,
                  textAlign: 'center',
                  paddingVertical: 9,
                  borderRadius: 9,
                  fontSize: 12.5,
                  color: on ? '#fff' : colors.slate,
                  backgroundColor: on ? colors.navy700 : 'transparent',
                  overflow: 'hidden',
                },
              ]}
            >
              {t === 'upcoming' ? 'القادمة' : 'السابقة'}
            </Text>
          );
        })}
      </View>

      {list.map((a) => (
        <Card key={a.id} style={{ marginTop: 12 }}>
          <View style={rowBetween}>
            <Pill label={a.status} tone={statusTone(a.status)} />
            <Text style={[font('800'), num, { fontSize: 11, color: colors.muted }]}>#{a.id.toUpperCase()}</Text>
          </View>
          <View style={[row, { gap: 6, marginTop: 8, justifyContent: 'flex-end' }]}>
            <Text style={[font('800'), { fontSize: 15, color: colors.navy700 }]}>{a.consultantName}</Text>
            <Icon name="user" size={15} color={colors.navy500} />
          </View>
          <Text style={[font('400'), { fontSize: 11.5, color: colors.slate, textAlign: 'right', marginTop: 2 }]}>
            استشارة {a.type}
          </Text>
          <View style={{ height: 1, backgroundColor: colors.line2, marginVertical: 10 }} />
          <View style={rowBetween}>
            <InfoChip icon="calendar" text={`${a.date}`} />
            <InfoChip icon="clock" text={a.time} />
            <InfoChip icon={modeIcon[a.mode]} text={a.mode} />
          </View>
        </Card>
      ))}

      {list.length === 0 && (
        <View style={{ alignItems: 'center', paddingVertical: 48 }}>
          <Icon name="calendar" size={34} color={colors.muted} />
          <Text style={[font('700'), { fontSize: 14, color: colors.slate, marginTop: 12 }]}>
            {tab === 'upcoming' ? 'لا توجد حجوزات قادمة' : 'لا توجد حجوزات سابقة'}
          </Text>
        </View>
      )}
      <View style={{ height: 12 }} />
    </Screen>
  );
}

function InfoChip({ icon, text }: { icon: IconName; text: string }) {
  return (
    <View style={[row, { gap: 5 }]}>
      <Icon name={icon} size={13} color={colors.navy500} />
      <Text style={[font('600'), num, { fontSize: 10.5, color: colors.slate }]}>{text}</Text>
    </View>
  );
}
