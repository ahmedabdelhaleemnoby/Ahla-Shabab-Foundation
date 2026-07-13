import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { serviceCategories, services } from '@ahla/shared';
import { Screen } from '../components/Screen';
import { AppBar } from '../components/AppBar';
import { Card, Button } from '../components/ui';
import { Icon, IconName } from '../components/Icon';
import { colors, font, row } from '../theme';

/* خدماتنا (§8) — replaces the generic "Discover" tab. One card per section
   of the foundation's work, each with details + request actions. */

const CAT_VISUAL: Record<string, { icon: IconName; gradient: [string, string] }> = {
  clinics: { icon: 'activity', gradient: ['#8fb4dd', '#5f86b5'] },
  counseling: { icon: 'message-circle', gradient: ['#a7b6d0', '#7186a6'] },
  education: { icon: 'book-open', gradient: ['#c3a888', '#8f7350'] },
  social: { icon: 'users', gradient: ['#8f9f7d', '#5f6d50'] },
};

export default function OurServicesScreen() {
  const nav = useNavigation<any>();
  const mains = serviceCategories.filter((c) => c.parentId === null && c.active);

  return (
    <Screen header={<AppBar />}>
      <View style={{ alignItems: 'center', marginVertical: 6 }}>
        <Text style={[font('800'), { fontSize: 23, color: colors.navy700 }]}>خدماتنا</Text>
        <Text style={[font('400'), { fontSize: 12, color: colors.slate, marginTop: 3, textAlign: 'center' }]}>
          خدمات مجانية بالكامل تقدمها الجمعية للأسر الأولى بالرعاية
        </Text>
      </View>

      {/* Service sections */}
      {mains.map((cat) => {
        const v = CAT_VISUAL[cat.id] ?? { icon: 'grid' as IconName, gradient: ['#8296b5', '#4d6386'] as [string, string] };
        const count = services.filter((s) => serviceCategories.find((c) => c.id === s.categoryId)?.parentId === cat.id).length;
        return (
          <Card key={cat.id} style={{ padding: 0, overflow: 'hidden', marginBottom: 12 }}>
            <LinearGradient colors={v.gradient} style={{ height: 76, padding: 12, flexDirection: 'row-reverse', alignItems: 'center', gap: 11 }}>
              <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: 'rgba(255,255,255,.22)', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={v.icon} size={22} color="#fff" />
              </View>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={[font('800'), { fontSize: 15, color: '#fff' }]}>{cat.name}</Text>
                <Text style={[font('600'), { fontSize: 10, color: 'rgba(255,255,255,.85)', marginTop: 2 }]}>{count} خدمة متاحة للحجز</Text>
              </View>
            </LinearGradient>
            <View style={{ padding: 12 }}>
              <Text style={[font('400'), { fontSize: 11.5, color: colors.slate, textAlign: 'right', lineHeight: 17 }]}>
                {cat.description ?? ''} — جميع الخدمات مجانية ويتم الحجز بموعد مسبق من التطبيق.
              </Text>
              <View style={[row, { gap: 8, marginTop: 11 }]}>
                <Button label="عرض التفاصيل" variant="outline" small style={{ flex: 1 }} onPress={() => nav.navigate('ServicesBrowse', { parentId: cat.id })} />
                <Button label="اطلب الخدمة" small icon="calendar" style={{ flex: 1 }} onPress={() => nav.navigate('ServicesBrowse', { parentId: cat.id })} />
              </View>
            </View>
          </Card>
        );
      })}

      {/* Online consultations */}
      <Card style={{ padding: 0, overflow: 'hidden', marginBottom: 12 }}>
        <LinearGradient colors={[colors.navy700, colors.navy900]} style={{ height: 76, padding: 12, flexDirection: 'row-reverse', alignItems: 'center', gap: 11 }}>
          <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: 'rgba(255,255,255,.22)', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="video" size={22} color="#fff" />
          </View>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text style={[font('800'), { fontSize: 15, color: '#fff' }]}>استشارات أونلاين</Text>
            <Text style={[font('600'), { fontSize: 10, color: 'rgba(255,255,255,.85)', marginTop: 2 }]}>نفسية · دينية · طبية · أسرية · أعمال</Text>
          </View>
        </LinearGradient>
        <View style={{ padding: 12 }}>
          <Text style={[font('400'), { fontSize: 11.5, color: colors.slate, textAlign: 'right', lineHeight: 17 }]}>
            جلسات سرية مجانية مع مختصين معتمدين، عن بُعد وبموعد يناسبك.
          </Text>
          <View style={[row, { gap: 8, marginTop: 11 }]}>
            <Button label="عرض التفاصيل" variant="outline" small style={{ flex: 1 }} onPress={() => nav.navigate('Consultations')} />
            <Button label="اطلب استشارة" small icon="message-circle" style={{ flex: 1 }} onPress={() => nav.navigate('Consultations')} />
          </View>
        </View>
      </Card>

      {/* Donation-side sections */}
      <Text style={[font('800'), { fontSize: 13.5, color: colors.navy700, textAlign: 'right', marginTop: 6, marginBottom: 10, marginHorizontal: 2 }]}>
        أقسام العطاء
      </Text>
      <View style={[row, { gap: 9 }]}>
        <SmallSection icon="zap" title="حالات عاجلة" tone={colors.red} bg={colors.redSoft} onPress={() => nav.navigate('UrgentCases')} />
        <SmallSection icon="users" title="اكفل أسرة" tone={colors.greenDark} bg={colors.greenSoft} onPress={() => nav.navigate('Sponsorship')} />
        <SmallSection icon="home" title="المشروعات" tone={colors.navy700} bg="#EAF0F8" onPress={() => nav.navigate('Projects')} />
      </View>
      <View style={{ height: 12 }} />
    </Screen>
  );
}

function SmallSection({ icon, title, tone, bg, onPress }: { icon: IconName; title: string; tone: string; bg: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ flex: 1, backgroundColor: bg, borderRadius: 15, paddingVertical: 14, alignItems: 'center' }}>
      <Icon name={icon} size={19} color={tone} />
      <Text style={[font('800'), { fontSize: 10.5, color: tone, marginTop: 6 }]}>{title}</Text>
    </Pressable>
  );
}
