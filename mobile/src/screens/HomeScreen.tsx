import React from 'react';
import { View, Text, Pressable, Image, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { cases, projects, articles, foundationStats, quickServices, appConfig, workGovernorates, pct, egp } from '@ahla/shared';
import { Screen } from '../components/Screen';
import { AppBar } from '../components/AppBar';
import { Card, Button, ProgressBar, Pill, Tile, Stat, SectionHeader } from '../components/ui';
import { Icon, IconName } from '../components/Icon';
import { colors, font, num, row, rowBetween } from '../theme';

const serviceIcon: Record<string, IconName> = {
  droplet: 'droplet',
  'file-text': 'file-text',
  'heart-handshake': 'heart',
  building: 'home',
  'map-pin': 'map-pin',
};

/* Home v2 — section order per UX spec:
   hero → impact numbers → quick services → urgent cases → featured projects
   → latest news → online consultations (most important, emphasized last). */
export default function HomeScreen() {
  const nav = useNavigation<any>();
  const urgent = cases.find((c) => c.tag === 'عاجل')!;
  const featured = projects[0];

  return (
    <Screen header={<AppBar />}>
      {/* 1 — SECTION 1: Donation Hero (Most Prominent) */}
      <LinearGradient
        colors={[colors.navy800, colors.navy900]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ borderRadius: 20, padding: 18 }}
      >
        <View style={[row, { gap: 10, justifyContent: 'flex-end' }]}>
          <View style={{ alignItems: 'flex-end', flex: 1 }}>
            <Text style={[font('800'), { color: '#fff', fontSize: 19.5, textAlign: 'right' }]}>
              ساهم في دعم الأسر الكريمة
            </Text>
            <Text style={[font('400'), { color: '#cfe', fontSize: 11.5, marginTop: 5, textAlign: 'right', lineHeight: 17 }]}>
              تبرعك يصل مباشرة للأسر الأشد احتياجاً ويصنع فارقاً حقيقياً في حياتهم اليومية.
            </Text>
          </View>
          <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
            <Image source={require('../../assets/logo.png')} style={{ width: 42, height: 42 }} resizeMode="contain" />
          </View>
        </View>
        <View style={[row, { gap: 9, marginTop: 16 }]}>
          <Pressable
            onPress={() => nav.navigate('Main', { screen: 'Donate' })}
            style={[row, { flex: 1, backgroundColor: '#fff', borderRadius: 100, paddingVertical: 12, justifyContent: 'center', gap: 6 }]}
          >
            <Icon name="heart" size={16} color={colors.navy700} />
            <Text style={[font('800'), { color: colors.navy700, fontSize: 13.5 }]}>تبرع الآن</Text>
          </Pressable>
          <Pressable
            onPress={() => nav.navigate('Main', { screen: 'Cases' })}
            style={[row, { flex: 1, borderWidth: 1.5, borderColor: 'rgba(255,255,255,.65)', borderRadius: 100, paddingVertical: 12, justifyContent: 'center', gap: 6 }]}
          >
            <Icon name="users" size={16} color="#fff" />
            <Text style={[font('800'), { color: '#fff', fontSize: 13.5 }]}>حالات التبرع</Text>
          </Pressable>
        </View>
      </LinearGradient>

      {/* 2 — SECTION 2: Consultations Hero (Second Action) */}
      <LinearGradient
        colors={['#EAF0F8', '#D8E4F4']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ borderRadius: 20, padding: 18, marginTop: 14, borderWidth: 1, borderColor: colors.line }}
      >
        <View style={[row, { gap: 12 }]}>
          <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: colors.navy700, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="message-circle" size={24} color="#fff" />
          </View>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text style={[font('800'), { fontSize: 16, color: colors.navy700 }]}>خدمة الاستشارات المجانية</Text>
            <Text style={[font('400'), { fontSize: 11, color: colors.slate, marginTop: 4, textAlign: 'right', lineHeight: 16 }]}>
              جلسات أونلاين وميدانية سرية مع مستشارين متخصصين في المجالات النفسية، الأسرية، والتربوية.
            </Text>
          </View>
        </View>
        <View style={[row, { gap: 9, marginTop: 14 }]}>
          <Pressable
            onPress={() => nav.navigate('Main', { screen: 'Consultations' })}
            style={[row, { flex: 1, backgroundColor: colors.navy700, borderRadius: 100, paddingVertical: 12, justifyContent: 'center', gap: 6 }]}
          >
            <Icon name="calendar" size={16} color="#fff" />
            <Text style={[font('800'), { color: '#fff', fontSize: 13.5 }]}>احجز استشارة</Text>
          </Pressable>
          <Pressable
            onPress={() => nav.navigate('ServicesBrowse', { parentId: 'counseling' })}
            style={[row, { flex: 1, borderWidth: 1.5, borderColor: colors.navy700, borderRadius: 100, paddingVertical: 12, justifyContent: 'center', gap: 6 }]}
          >
            <Icon name="info" size={16} color={colors.navy700} />
            <Text style={[font('800'), { color: colors.navy700, fontSize: 13.5 }]}>تعرف على الاستشارات</Text>
          </Pressable>
        </View>
      </LinearGradient>

      {/* 3 — Vision & Mission Section */}
      <SectionHeader title="رسالتنا ورؤيتنا" />
      <View style={[row, { gap: 9 }]}>
        <Card style={{ flex: 1, padding: 13 }}>
          <View style={[row, { gap: 8, marginBottom: 6 }]}>
            <View style={{ width: 28, height: 28, borderRadius: 9, backgroundColor: '#EAF0F8', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="send" size={14} color={colors.navy700} />
            </View>
            <Text style={[font('800'), { fontSize: 13.5, color: colors.navy700 }]}>رسالتنا</Text>
          </View>
          <Text style={[font('400'), { fontSize: 10.5, color: colors.slate, lineHeight: 16, textAlign: 'right' }]}>
            تمكين الشباب لخدمة الإنسان بمبادرات تنموية مبتكرة وشراكات فعّالة لتأمين رعاية الأسر الكريمة.
          </Text>
        </Card>

        <Card style={{ flex: 1, padding: 13 }}>
          <View style={[row, { gap: 8, marginBottom: 6 }]}>
            <View style={{ width: 28, height: 28, borderRadius: 9, backgroundColor: '#EAF0F8', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="eye" size={14} color={colors.navy700} />
            </View>
            <Text style={[font('800'), { fontSize: 13.5, color: colors.navy700 }]}>رؤيتنا</Text>
          </View>
          <Text style={[font('400'), { fontSize: 10.5, color: colors.slate, lineHeight: 16, textAlign: 'right' }]}>
            بناء مجتمع واعٍ متكاتف نصنع فيه أثراً مستداماً يرفع المعاناة ويكفل العيش الكريم للجميع.
          </Text>
        </Card>
      </View>

      {/* 4 — Urgent Cases Preview */}
      <View style={[rowBetween, { marginTop: 18, marginBottom: 10, marginHorizontal: 2 }]}>
        <View style={[row, { gap: 7 }]}>
          <Text style={[font('800'), { color: colors.navy700, fontSize: 15 }]}>حالة إنسانية عاجلة</Text>
          <Pill label="عاجل" tone="red" />
        </View>
        <Pressable onPress={() => nav.navigate('Main', { screen: 'UrgentCases' })}>
          <Text style={[font('700'), { color: colors.navy500, fontSize: 11.5 }]}>عرض الكل ‹</Text>
        </Pressable>
      </View>
      <CaseRow item={urgent} onPress={() => nav.navigate('CaseDetail', { id: urgent.id })} />

      {/* 4 — Monthly Family Sponsorship Preview */}
      <Pressable
        onPress={() => nav.navigate('Sponsorship')}
        style={[row, { gap: 11, marginTop: 14, backgroundColor: colors.greenSoft, borderRadius: 16, padding: 14 }]}
      >
        <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="users" size={22} color={colors.greenDark} />
        </View>
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <Text style={[font('800'), { fontSize: 14, color: colors.greenDark }]}>اكفل أسرة شهرياً</Text>
          <Text style={[font('400'), { fontSize: 10.5, color: colors.slate, marginTop: 2 }]}>كفالة شهرية منتظمة لتأمين الاحتياجات الأساسية لأسرة مستحقة</Text>
        </View>
        <Icon name="chevron-left" size={18} color={colors.greenDark} />
      </Pressable>

      {/* 5 — Featured Project */}
      <SectionHeader title="مشروع مميز" more="عرض المزيد ‹" onMore={() => nav.navigate('Projects')} />
      <Card style={{ flexDirection: 'row-reverse', gap: 11, padding: 11 }}>
        <LinearGradient colors={featured.gradient} style={{ width: 70, height: 92, borderRadius: 12 }} />
        <View style={{ flex: 1 }}>
          <Text style={[font('800'), { fontSize: 13.5, color: colors.navy700, textAlign: 'right' }]}>{featured.title}</Text>
          <Text style={[font('400'), { fontSize: 10.5, color: colors.slate, textAlign: 'right', lineHeight: 15, marginVertical: 3 }]}>
            {featured.description}
          </Text>
          <ProgressBar percent={pct(featured.raisedAmount, featured.targetAmount)} color={colors.green} />
          <View style={[rowBetween, { marginTop: 7 }]}>
            <Text style={[font('400'), num, { fontSize: 10, color: colors.slate }]}>
              {egp(featured.raisedAmount)} من {egp(featured.targetAmount)}
            </Text>
            <Text style={[font('800'), { color: colors.green, fontSize: 12 }]}>
              {pct(featured.raisedAmount, featured.targetAmount)}%
            </Text>
          </View>
          <Button
            label="دعم المشروع"
            variant="green"
            small
            style={{ marginTop: 8 }}
            onPress={() => nav.navigate('ProjectDetail', { id: featured.id })}
          />
        </View>
      </Card>

      <View style={{ height: 16 }} />
    </Screen>
  );
}

export function CaseRow({ item, onPress }: { item: (typeof cases)[number]; onPress?: () => void }) {
  const p = pct(item.raisedAmount, item.targetAmount);
  return (
    <Card style={{ flexDirection: 'row-reverse', gap: 11, padding: 11 }}>
      <LinearGradient colors={item.gradient} style={{ width: 70, height: 92, borderRadius: 12 }} />
      <View style={{ flex: 1 }}>
        <Text style={[font('800'), { fontSize: 13.5, color: colors.navy700, textAlign: 'right' }]}>{item.title}</Text>
        <Text style={[font('400'), { fontSize: 10.5, color: colors.slate, textAlign: 'right', lineHeight: 15, marginVertical: 3 }]}>
          {item.summary}
        </Text>
        <ProgressBar percent={p} color={colors.red} />
        <View style={[rowBetween, { marginTop: 7 }]}>
          <Text style={[font('400'), num, { fontSize: 10, color: colors.slate }]}>
            {egp(item.raisedAmount)} من {egp(item.targetAmount)}
          </Text>
          <Text style={[font('800'), { color: colors.red, fontSize: 12 }]}>{p}%</Text>
        </View>
        <Button label="تبرع للحالة" variant="red" small style={{ marginTop: 8 }} onPress={onPress} />
      </View>
    </Card>
  );
}
