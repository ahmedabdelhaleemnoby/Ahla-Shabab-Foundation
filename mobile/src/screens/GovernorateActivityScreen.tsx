import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { cases, projects, serviceCategories } from '@ahla/shared';
import { Screen } from '../components/Screen';
import { AppBar } from '../components/AppBar';
import { Card, Button, Pill, SectionHeader } from '../components/ui';
import { Icon } from '../components/Icon';
import { colors, font, num, row, rowBetween } from '../theme';
import type { RootProps } from '../navigation/types';

export default function GovernorateActivityScreen({ route }: RootProps<'GovernorateActivity'>) {
  const nav = useNavigation<any>();
  const governorate = route.params?.governorate ?? 'القاهرة';

  // Local mock filter for cases in or near this governorate
  const govCases = cases.slice(0, 2);

  return (
    <Screen header={<AppBar title={`محافظة ${governorate}`} onBack={() => nav.goBack()} />}>
      {/* Hero Banner */}
      <LinearGradient
        colors={[colors.navy800, colors.navy900]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ borderRadius: 20, padding: 18 }}
      >
        <View style={[row, { gap: 10, justifyContent: 'flex-end' }]}>
          <View style={{ alignItems: 'flex-end', flex: 1 }}>
            <View style={[row, { gap: 6, marginBottom: 6 }]}>
              <Text style={[font('800'), { color: '#fff', fontSize: 18 }]}>نشاط الجمعية في {governorate}</Text>
              <Icon name="map-pin" size={20} color={colors.gold} />
            </View>
            <Text style={[font('400'), { color: '#cfe', fontSize: 11.5, textAlign: 'right', lineHeight: 17 }]}>
              تقدم جمعية خواطر أحلى شباب في محافظة {governorate} حزمة من الخدمات التنموية والإغاثية والأسرية لدعم الفئات الأكثر احتياجاً.
            </Text>
          </View>
        </View>

        <View style={[row, { gap: 8, marginTop: 14, flexWrap: 'wrap' }]}>
          <Pill label="خدمات ميدانية" tone="green" />
          <Pill label="كفالة أسر" tone="navy" />
          <Pill label="استشارات أونلاين" tone="gold" />
        </View>
      </LinearGradient>

      {/* Services in Governorate */}
      <SectionHeader title={`الخدمات المتاحة في ${governorate}`} />
      <View style={{ gap: 9 }}>
        {serviceCategories.slice(0, 3).map((cat) => (
          <Card key={cat.id} style={[row, { gap: 12, padding: 12 }]}>
            <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: colors.paper2, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={cat.icon as any} size={20} color={colors.navy700} />
            </View>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <Text style={[font('800'), { fontSize: 13.5, color: colors.navy700 }]}>{cat.name}</Text>
              <Text style={[font('400'), { fontSize: 11, color: colors.slate, marginTop: 2, textAlign: 'right' }]}>
                {cat.description ?? `تغطية وتوفير كافة متطلبات ${cat.name} لأسر المحافظة.`}
              </Text>
            </View>
          </Card>
        ))}
      </View>

      {/* Active Cases in Governorate */}
      <SectionHeader title={`حالات مستحقة في ${governorate}`} more="عرض كل الحالات ‹" onMore={() => nav.navigate('Main', { screen: 'Cases' })} />
      <View style={{ gap: 10 }}>
        {govCases.map((item) => (
          <Card key={item.id} style={{ padding: 12 }}>
            <View style={[rowBetween, { marginBottom: 6 }]}>
              <Pill label={item.tag} tone={item.tag === 'عاجل' ? 'red' : 'navy'} />
              <Text style={[font('800'), { fontSize: 13.5, color: colors.navy700 }]}>{item.title}</Text>
            </View>
            <Text style={[font('400'), { fontSize: 11, color: colors.slate, textAlign: 'right', lineHeight: 16, marginBottom: 8 }]}>
              {item.summary}
            </Text>
            <Button
              label="تبرع للحالة"
              variant="red"
              small
              onPress={() => nav.navigate('CaseDetail', { id: item.id })}
            />
          </Card>
        ))}
      </View>

      {/* Initiatives & Projects */}
      <SectionHeader title={`المبادرات والمشاريع الجارية`} />
      <Card style={[row, { gap: 12, padding: 14, backgroundColor: colors.greenSoft }]}>
        <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="droplet" size={22} color={colors.greenDark} />
        </View>
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <Text style={[font('800'), { fontSize: 14, color: colors.greenDark }]}>مبادرة وصلات المياه في {governorate}</Text>
          <Text style={[font('400'), { fontSize: 11, color: colors.slate, marginTop: 2, textAlign: 'right' }]}>
            تركيب وصلات مياه شرب صحية للأسر في القرى الأكثر احتياجاً بالمحافظة.
          </Text>
        </View>
      </Card>

      {/* Consultation Availability */}
      <LinearGradient
        colors={['#EAF0F8', '#D8E4F4']}
        style={{ borderRadius: 18, padding: 16, marginTop: 16, borderWidth: 1, borderColor: colors.line }}
      >
        <View style={[row, { gap: 10, justifyContent: 'flex-end' }]}>
          <Text style={[font('800'), { fontSize: 14.5, color: colors.navy700 }]}>الاستشارات المجانية في {governorate}</Text>
          <Icon name="message-circle" size={20} color={colors.navy700} />
        </View>
        <Text style={[font('400'), { fontSize: 11, color: colors.slate, marginTop: 4, textAlign: 'right', lineHeight: 16 }]}>
          الاستشارات متاحة لأبناء محافظة {governorate} أونلاين وميدانياً عبر كوادرنا المتخصصة.
        </Text>
        <Button
          label={`احجز استشارة في ${governorate}`}
          icon="calendar"
          style={{ marginTop: 12 }}
          onPress={() => nav.navigate('Main', { screen: 'Consultations' })}
        />
      </LinearGradient>

      <View style={{ height: 20 }} />
    </Screen>
  );
}
