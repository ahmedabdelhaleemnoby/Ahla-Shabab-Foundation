import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { serviceById, providerById, categoryById } from '@ahla/shared';
import { Screen } from '../components/Screen';
import { AppBar } from '../components/AppBar';
import { Card, Button, Pill } from '../components/ui';
import { StickyFooter } from './DonateScreen';
import { Icon, IconName } from '../components/Icon';
import { colors, font, row, rowBetween } from '../theme';
import type { RootProps } from '../navigation/types';

const WEEKDAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

function InfoRow({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <View style={[rowBetween, { paddingVertical: 8 }]}>
      <Text style={[font('700'), { fontSize: 12.5, color: colors.navy700 }]}>{value}</Text>
      <View style={[row, { gap: 7 }]}>
        <Text style={[font('400'), { fontSize: 12, color: colors.slate }]}>{label}</Text>
        <Icon name={icon} size={15} color={colors.navy500} />
      </View>
    </View>
  );
}

export default function ServiceDetailScreen({ route }: RootProps<'ServiceDetail'>) {
  const nav = useNavigation<any>();
  const service = serviceById(route.params.serviceId);
  const provider = service ? providerById(service.providerId) : undefined;
  const category = service ? categoryById(service.categoryId) : undefined;

  if (!service || !provider) {
    return (
      <Screen header={<AppBar onBack={() => nav.goBack()} onBell={() => {}} />}>
        <Text style={[font('700'), { color: colors.slate, textAlign: 'center', marginTop: 40 }]}>الخدمة غير متاحة</Text>
      </Screen>
    );
  }

  const days = provider.availableDays.map((d) => WEEKDAYS[d]).join('، ');

  return (
    <Screen
      header={<AppBar title="تفاصيل الخدمة" onBack={() => nav.goBack()} onBell={() => {}} />}
      footer={
        <StickyFooter>
          <Button label="احجز موعد" icon="calendar" style={{ flex: 1 }} onPress={() => nav.navigate('BookAppointment', { serviceId: service.id })} />
        </StickyFooter>
      }
    >
      {/* Service header */}
      <View style={{ alignItems: 'flex-end', marginTop: 4 }}>
        <View style={[row, { gap: 6 }]}>
          <Text style={[font('800'), { fontSize: 20, color: colors.navy700 }]}>{service.name}</Text>
          {service.free ? <Pill label="مجاناً" tone="green" /> : null}
        </View>
        {category ? <Text style={[font('400'), { fontSize: 12, color: colors.slate, marginTop: 3 }]}>{category.name}</Text> : null}
        <Text style={[font('400'), { fontSize: 12.5, color: colors.slate, marginTop: 8, textAlign: 'right', lineHeight: 19 }]}>
          {service.description}
        </Text>
      </View>

      {/* Provider card */}
      <Card style={{ marginTop: 16 }}>
        <View style={[row, { gap: 12, alignItems: 'flex-start' }]}>
          <LinearGradient colors={provider.gradient} style={{ width: 72, height: 88, borderRadius: 13 }} />
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text style={[font('800'), { fontSize: 15, color: colors.navy700 }]}>{provider.name}</Text>
            <Text style={[font('400'), { fontSize: 11.5, color: colors.slate, marginTop: 2 }]}>{provider.specialization}</Text>
            <View style={[row, { gap: 10, marginTop: 6 }]}>
              <Text style={[font('700'), { fontSize: 11, color: colors.gold }]}>★ {provider.rating}</Text>
              <Text style={[font('400'), { fontSize: 11, color: colors.slate }]}>({provider.reviews} تقييم)</Text>
            </View>
          </View>
        </View>
        <Text style={[font('400'), { fontSize: 11.5, color: colors.slate, marginTop: 12, textAlign: 'right', lineHeight: 18 }]}>
          {provider.bio}
        </Text>
        <View style={{ height: 1, backgroundColor: colors.line2, marginVertical: 8 }} />
        <InfoRow icon="award" label="سنوات الخبرة" value={`${provider.yearsExperience} سنة`} />
        <InfoRow icon="calendar" label="أيام العمل" value={days} />
      </Card>

      {/* Reassurance */}
      <Card style={[row, { gap: 11, marginTop: 12, backgroundColor: '#EAF0F8' }]}>
        <Icon name="shield" size={20} color={colors.navy700} />
        <Text style={[font('400'), { flex: 1, fontSize: 11, color: colors.slate, textAlign: 'right', lineHeight: 16 }]}>
          خدمة مجانية بالكامل. بياناتك سرية وتُستخدم فقط لتأكيد الموعد.
        </Text>
      </Card>
      <View style={{ height: 12 }} />
    </Screen>
  );
}
