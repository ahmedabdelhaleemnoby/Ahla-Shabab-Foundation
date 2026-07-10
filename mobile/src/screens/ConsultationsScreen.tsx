import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { consultants, consultationTypes, type ConsultationType } from '@ahla/shared';
import { Screen } from '../components/Screen';
import { AppBar } from '../components/AppBar';
import { Card, Button, Tile } from '../components/ui';
import { Icon, IconName } from '../components/Icon';
import { colors, font, row, rowBetween } from '../theme';

const typeIcon: Record<ConsultationType, IconName> = {
  نفسية: 'heart',
  دينية: 'book-open',
  أسرية: 'users',
  تربوية: 'award',
  مهنية: 'briefcase',
  قانونية: 'shield',
};

export default function ConsultationsScreen() {
  const nav = useNavigation<any>();
  const [type, setType] = useState<ConsultationType>('نفسية');
  const featured = consultants.find((c) => c.featured)!;

  return (
    <Screen header={<AppBar onBack={() => nav.goBack()} />}>
      <View style={{ alignItems: 'center', marginVertical: 6 }}>
        <Text style={[font('800'), { fontSize: 23, color: colors.navy700 }]}>الاستشارات</Text>
        <Text style={[font('400'), { fontSize: 12, color: colors.slate, marginTop: 3 }]}>
          استشارات متخصصة، سرية وآمنة
        </Text>
      </View>

      <Text style={[font('800'), { fontSize: 12.5, color: colors.navy700, textAlign: 'center', marginTop: 12, marginBottom: 12 }]}>
        اختر نوع الاستشارة
      </Text>
      <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 9 }}>
        {consultationTypes.map((t) => (
          <View key={t.type} style={{ width: '31%' }}>
            <Tile label={t.label} icon={typeIcon[t.type]} active={type === t.type} onPress={() => setType(t.type)} />
          </View>
        ))}
      </View>

      {/* Featured consultant */}
      <Card style={{ marginTop: 16, backgroundColor: '#F6F9FD' }}>
        <View style={[row, { gap: 6, justifyContent: 'flex-end' }]}>
          <Text style={[font('800'), { fontSize: 11, color: colors.navy700 }]}>مستشار مميز</Text>
          <Icon name="star" size={16} color={colors.gold} />
        </View>
        <View style={[row, { gap: 12, marginTop: 10, alignItems: 'flex-start' }]}>
          <LinearGradient colors={['#8296b5', '#4d6386']} style={{ width: 76, height: 96, borderRadius: 12 }} />
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text style={[font('800'), { fontSize: 15, color: colors.navy700 }]}>{featured.name}</Text>
            <Text style={[font('400'), { fontSize: 11, color: colors.slate }]}>{featured.specialty}</Text>
            <Text style={[font('400'), { fontSize: 9, color: colors.slate, marginVertical: 6 }]}>
              +{featured.sessions.toLocaleString('en-US')} جلسة · خبرة {featured.yearsExperience} سنوات
            </Text>
            <View style={{ backgroundColor: '#fff', borderRadius: 10, paddingVertical: 6, paddingHorizontal: 8, alignItems: 'center', alignSelf: 'stretch' }}>
              <Text>
                <Text style={[font('800'), { color: colors.navy700 }]}>{featured.rating}</Text>
                <Text style={{ color: colors.gold }}>  ★★★★★</Text>
              </Text>
              <Text style={[font('400'), { fontSize: 9, color: colors.slate }]}>({featured.reviews} تقييم)</Text>
            </View>
          </View>
        </View>
        <View style={[row, { gap: 8, marginTop: 10 }]}>
          <Button label="تعرف على الخدمة" variant="outline" small style={{ flex: 1 }} onPress={() => nav.navigate('ServiceDetail', { serviceId: 'sv-psych' })} />
          <Button label="احجز الآن" small style={{ flex: 1 }} onPress={() => nav.navigate('BookAppointment', { serviceId: 'sv-psych' })} />
        </View>
      </Card>

      {/* Privacy note */}
      <Card style={[row, { gap: 11, marginTop: 12, backgroundColor: '#EAF0F8' }]}>
        <View style={{ width: 40, height: 40, borderRadius: 11, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="lock" size={20} color={colors.navy700} />
        </View>
        <View style={{ alignItems: 'flex-end', flex: 1 }}>
          <Text style={[font('800'), { fontSize: 12.5, color: colors.navy700 }]}>خصوصيتك تهمنا</Text>
          <Text style={[font('400'), { fontSize: 10, color: colors.slate }]}>جميع جلسات الاستشارة سرية وآمنة 100%</Text>
        </View>
      </Card>

      {/* Book CTA */}
      <Button label="احجز موعد استشارة" icon="calendar" style={{ marginTop: 16 }} onPress={() => nav.navigate('ServicesBrowse', { parentId: 'counseling' })} />
      <View style={{ height: 12 }} />
    </Screen>
  );
}
