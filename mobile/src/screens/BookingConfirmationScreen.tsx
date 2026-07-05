import React from 'react';
import { View, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { serviceById, providerById } from '@ahla/shared';
import { Screen } from '../components/Screen';
import { Card, Button } from '../components/ui';
import { StickyFooter } from './DonateScreen';
import { Icon, IconName } from '../components/Icon';
import { colors, font, num, rowBetween } from '../theme';
import type { RootProps } from '../navigation/types';

function Line({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <View style={[rowBetween, { paddingVertical: 10 }]}>
      <Text style={[font('700'), { fontSize: 13, color: colors.navy700 }]}>{value}</Text>
      <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 7 }}>
        <Text style={[font('400'), { fontSize: 12, color: colors.slate }]}>{label}</Text>
        <Icon name={icon} size={15} color={colors.navy500} />
      </View>
    </View>
  );
}

export default function BookingConfirmationScreen({ route }: RootProps<'BookingConfirmation'>) {
  const nav = useNavigation<any>();
  const { reference, serviceId, providerId, date, time } = route.params;
  const service = serviceById(serviceId);
  const provider = providerById(providerId);

  return (
    <Screen
      scroll={false}
      contentStyle={{ flex: 1, justifyContent: 'center' }}
      footer={
        <StickyFooter>
          <Button
            label="العودة للرئيسية"
            style={{ flex: 1 }}
            onPress={() => nav.reset({ index: 0, routes: [{ name: 'Main' }] })}
          />
        </StickyFooter>
      }
    >
      {/* Success mark */}
      <View style={{ alignItems: 'center', marginBottom: 8 }}>
        <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: colors.greenSoft, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="check" size={30} color="#fff" />
          </View>
        </View>
        <Text style={[font('800'), { fontSize: 20, color: colors.navy700, marginTop: 16 }]}>تم تأكيد حجزك</Text>
        <Text style={[font('400'), { fontSize: 12.5, color: colors.slate, marginTop: 6, textAlign: 'center' }]}>
          سنتواصل معك لتأكيد الموعد. احتفظ برقم الحجز للمراجعة.
        </Text>
      </View>

      {/* Reference */}
      <Card style={{ marginTop: 8, alignItems: 'center', backgroundColor: '#F6F9FD' }}>
        <Text style={[font('400'), { fontSize: 11, color: colors.slate }]}>رقم الحجز</Text>
        <Text style={[font('800'), num, { fontSize: 22, color: colors.navy700, marginTop: 4, letterSpacing: 1 }]}>{reference}</Text>
      </Card>

      {/* Details */}
      <Card style={{ marginTop: 12 }}>
        {service ? <Line icon="clipboard" label="الخدمة" value={service.name} /> : null}
        {provider ? (
          <>
            <View style={{ height: 1, backgroundColor: colors.line2 }} />
            <Line icon="user" label="مقدّم الخدمة" value={provider.name} />
          </>
        ) : null}
        <View style={{ height: 1, backgroundColor: colors.line2 }} />
        <Line icon="calendar" label="التاريخ" value={date} />
        <View style={{ height: 1, backgroundColor: colors.line2 }} />
        <Line icon="clock" label="الوقت" value={time} />
      </Card>
    </Screen>
  );
}
