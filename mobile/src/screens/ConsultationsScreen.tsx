import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { consultants, makeDefaultCmsState } from '@ahla/shared';
import { Screen } from '../components/Screen';
import { AppBar } from '../components/AppBar';
import { Card, Button } from '../components/ui';
import { Icon, IconName } from '../components/Icon';
import { colors, font, row } from '../theme';
import { getConsultationTypes } from '../store/cms';

/* Each type opens its own dedicated request form (§7 / §12).
   The list is CMS-authored (Form Builder) with a safe default fallback. */
export default function ConsultationsScreen() {
  const nav = useNavigation<any>();
  const featured = consultants.find((c) => c.featured)!;
  const cmsTypes = getConsultationTypes();
  const types = (cmsTypes.length > 0 ? cmsTypes : makeDefaultCmsState().consultations).map((c) => ({
    type: c.key,
    name: c.name,
    icon: c.icon as IconName,
    hint: c.description,
  }));

  return (
    <Screen header={<AppBar title="الاستشارات" onBack={() => nav.navigate('Home')} />}>
      <View style={{ alignItems: 'center', marginVertical: 6 }}>
        <Text style={[font('800'), { fontSize: 23, color: colors.navy700 }]}>الاستشارات</Text>
        <Text style={[font('400'), { fontSize: 12, color: colors.slate, marginTop: 3 }]}>
          استشارات متخصصة، سرية وآمنة
        </Text>
      </View>

      <Text style={[font('800'), { fontSize: 12.5, color: colors.navy700, textAlign: 'center', marginTop: 12, marginBottom: 12 }]}>
        اختر نوع الاستشارة لفتح نموذج الطلب
      </Text>
      <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 9 }}>
        {types.map((t) => (
          <Pressable
            key={t.type}
            onPress={() => nav.navigate('ConsultationRequest', { type: t.type })}
            style={{ width: '48%', flexGrow: 1, backgroundColor: '#fff', borderRadius: 15, borderWidth: 1, borderColor: colors.line, padding: 12, alignItems: 'flex-end' }}
          >
            <View style={[row, { gap: 8, alignSelf: 'stretch', justifyContent: 'flex-end' }]}>
              <View style={{ alignItems: 'flex-end', flex: 1 }}>
                <Text style={[font('800'), { fontSize: 13, color: colors.navy700 }]} numberOfLines={1}>{t.name}</Text>
                <Text style={[font('400'), { fontSize: 9.5, color: colors.muted, marginTop: 2 }]} numberOfLines={1}>{t.hint}</Text>
              </View>
              <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: colors.paper2, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={t.icon} size={17} color={colors.navy700} />
              </View>
            </View>
            <Text style={[font('700'), { fontSize: 10.5, color: colors.navy500, marginTop: 8 }]}>اطلب الآن ‹</Text>
          </Pressable>
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
