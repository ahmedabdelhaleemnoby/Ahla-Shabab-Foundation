import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { providerById, services, categoryById } from '@ahla/shared';
import { Screen } from '../components/Screen';
import { AppBar } from '../components/AppBar';
import { Card, Button, Pill } from '../components/ui';
import { Icon, IconName } from '../components/Icon';
import { colors, font, row, rowBetween } from '../theme';
import type { RootProps } from '../navigation/types';

const WEEKDAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

function InfoRow({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <View style={[rowBetween, { paddingVertical: 8 }]}>
      <Text style={[font('700'), { fontSize: 12.5, color: colors.navy700, flexShrink: 1, textAlign: 'left' }]}>{value}</Text>
      <View style={[row, { gap: 7 }]}>
        <Text style={[font('400'), { fontSize: 12, color: colors.slate }]}>{label}</Text>
        <Icon name={icon} size={15} color={colors.navy500} />
      </View>
    </View>
  );
}

export default function ProviderDetailScreen({ route }: RootProps<'ProviderDetail'>) {
  const nav = useNavigation<any>();
  const provider = providerById(route.params.providerId);

  if (!provider) {
    return (
      <Screen header={<AppBar onBack={() => nav.goBack()} onBell={() => {}} />}>
        <Text style={[font('700'), { color: colors.slate, textAlign: 'center', marginTop: 40 }]}>المختص غير متاح</Text>
      </Screen>
    );
  }

  const own = services.filter((s) => s.providerId === provider.id);
  const days = provider.availableDays.map((d) => WEEKDAYS[d]).join('، ');

  return (
    <Screen header={<AppBar title="ملف المختص" onBack={() => nav.goBack()} onBell={() => {}} />}>
      {/* Profile */}
      <Card>
        <View style={[row, { gap: 12, alignItems: 'flex-start' }]}>
          <LinearGradient colors={provider.gradient} style={{ width: 76, height: 92, borderRadius: 13 }} />
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text style={[font('800'), { fontSize: 17, color: colors.navy700 }]}>{provider.name}</Text>
            <Text style={[font('400'), { fontSize: 12, color: colors.slate, marginTop: 2 }]}>{provider.specialization}</Text>
            <View style={[row, { gap: 10, marginTop: 8 }]}>
              <Text style={[font('700'), { fontSize: 12, color: colors.gold }]}>★ {provider.rating}</Text>
              <Text style={[font('400'), { fontSize: 11, color: colors.slate }]}>({provider.reviews} تقييم)</Text>
              <Pill label={provider.availableDays.length ? 'متاح للحجز' : 'غير متاح'} tone="green" />
            </View>
          </View>
        </View>
        <Text style={[font('400'), { fontSize: 11.5, color: colors.slate, marginTop: 12, textAlign: 'right', lineHeight: 18 }]}>
          {provider.bio}
        </Text>
        <View style={{ height: 1, backgroundColor: colors.line2, marginVertical: 8 }} />
        <InfoRow icon="award" label="سنوات الخبرة" value={`${provider.yearsExperience} سنة`} />
        <InfoRow icon="calendar" label="أيام العمل" value={days} />
        <InfoRow icon="clock" label="المواعيد المتاحة" value={provider.slots.join(' · ')} />
      </Card>

      {/* Services offered */}
      <View style={[row, { gap: 7, marginTop: 16, marginBottom: 8, marginHorizontal: 2 }]}>
        <Icon name="list" size={16} color={colors.navy700} />
        <Text style={[font('800'), { fontSize: 15, color: colors.navy700 }]}>الخدمات المتاحة</Text>
      </View>
      {own.map((s) => {
        const cat = categoryById(s.categoryId);
        return (
          <Card key={s.id} style={{ marginBottom: 10 }}>
            <View style={[row, { gap: 8, justifyContent: 'space-between' }]}>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <View style={[row, { gap: 6 }]}>
                  <Text style={[font('800'), { fontSize: 13.5, color: colors.navy700 }]}>{s.name}</Text>
                  {s.free ? <Pill label="مجاناً" tone="green" /> : null}
                </View>
                {cat ? <Text style={[font('400'), { fontSize: 10.5, color: colors.muted, marginTop: 2 }]}>{cat.name}</Text> : null}
                <Text style={[font('400'), { fontSize: 11, color: colors.slate, marginTop: 3, textAlign: 'right', lineHeight: 16 }]}>
                  {s.description}
                </Text>
              </View>
            </View>
            <Button
              label="احجز موعد"
              icon="calendar"
              small
              style={{ marginTop: 10, alignSelf: 'flex-start', paddingHorizontal: 18 }}
              onPress={() => nav.navigate('BookAppointment', { serviceId: s.id })}
            />
          </Card>
        );
      })}
      <View style={{ height: 12 }} />
    </Screen>
  );
}
