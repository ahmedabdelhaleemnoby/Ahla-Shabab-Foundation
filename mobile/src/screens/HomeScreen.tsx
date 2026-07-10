import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { cases, projects, articles, foundationStats, quickServices, appConfig, pct, egp } from '@ahla/shared';
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
      {/* 1 — Hero: logo mark + explainer + dual CTAs */}
      <LinearGradient
        colors={[colors.navy800, colors.navy900]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ borderRadius: 20, padding: 18 }}
      >
        <View style={[row, { gap: 10, justifyContent: 'flex-end' }]}>
          <View style={{ alignItems: 'flex-end', flex: 1 }}>
            <Text style={[font('800'), { color: '#fff', fontSize: 20, textAlign: 'right' }]}>{appConfig.heroTitle}</Text>
            <Text style={[font('400'), { color: '#cfe', fontSize: 11.5, marginTop: 5, textAlign: 'right', lineHeight: 17 }]}>
              {appConfig.heroSubtitle}
            </Text>
          </View>
          <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
            <Image source={require('../../assets/logo.png')} style={{ width: 42, height: 42 }} resizeMode="contain" />
          </View>
        </View>
        <View style={[row, { gap: 9, marginTop: 14 }]}>
          <Pressable
            onPress={() => nav.navigate('Main', { screen: 'Donate' })}
            style={[row, { flex: 1, backgroundColor: '#fff', borderRadius: 100, paddingVertical: 11, justifyContent: 'center', gap: 6 }]}
          >
            <Icon name="heart" size={15} color={colors.navy700} />
            <Text style={[font('800'), { color: colors.navy700, fontSize: 13 }]}>تبرع الآن</Text>
          </Pressable>
          <Pressable
            onPress={() => nav.navigate('ServicesBrowse', { parentId: null })}
            style={[row, { flex: 1, borderWidth: 1.5, borderColor: 'rgba(255,255,255,.65)', borderRadius: 100, paddingVertical: 11, justifyContent: 'center', gap: 6 }]}
          >
            <Icon name="calendar" size={15} color="#fff" />
            <Text style={[font('800'), { color: '#fff', fontSize: 13 }]}>اطلب خدمة</Text>
          </Pressable>
        </View>
      </LinearGradient>

      {/* 2 — Impact numbers */}
      <View style={[row, { gap: 9, marginTop: 14 }]}>
        <Stat icon="map-pin" value={String(foundationStats.governorates)} label="محافظة" />
        <Stat icon="users" value={foundationStats.beneficiaries} label="مستفيد" />
        <Stat icon="calendar" value={String(foundationStats.yearsOfService)} label="سنة عطاء" />
      </View>

      {/* 3 — Quick services */}
      <SectionHeader title="خدمات سريعة" />
      <View style={[row, { gap: 7 }]}>
        {quickServices.map((s) => (
          <Tile
            key={s.id}
            label={s.label}
            icon={serviceIcon[s.icon] ?? 'circle'}
            onPress={() => {
              if (s.id === 'consult') nav.navigate('ServicesBrowse', { parentId: null });
              else if (s.id === 'cases') nav.navigate('Discover');
              else if (s.id === 'donate') nav.navigate('Main', { screen: 'Donate' });
              else if (s.id === 'projects') nav.navigate('Projects');
              else if (s.id === 'water') nav.navigate('ContactUs');
            }}
          />
        ))}
      </View>

      {/* 4 — Urgent cases */}
      <View style={[rowBetween, { marginTop: 16, marginBottom: 10, marginHorizontal: 2 }]}>
        <Pressable onPress={() => nav.navigate('Discover')}>
          <Text style={[font('700'), { color: colors.navy500, fontSize: 11.5 }]}>عرض المزيد ‹</Text>
        </Pressable>
        <View style={[row, { gap: 7 }]}>
          <Text style={[font('800'), { color: colors.navy700, fontSize: 15 }]}>حالة إنسانية عاجلة</Text>
          <Pill label="عاجل" tone="red" />
        </View>
      </View>
      <CaseRow item={urgent} onPress={() => nav.navigate('CaseDetail', { id: urgent.id })} />

      {/* أكفل حالة — sponsorship entry */}
      <Pressable
        onPress={() => nav.navigate('Main', { screen: 'Discover', params: { initialFilter: 'كفالة شهرية' } })}
        style={[row, { gap: 11, marginTop: 12, backgroundColor: colors.greenSoft, borderRadius: 16, padding: 13 }]}
      >
        <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="users" size={20} color={colors.greenDark} />
        </View>
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <Text style={[font('800'), { fontSize: 13.5, color: colors.greenDark }]}>أكفل حالة</Text>
          <Text style={[font('400'), { fontSize: 10.5, color: colors.slate, marginTop: 2 }]}>كفالة شهرية ثابتة تغيّر حياة أسرة كاملة</Text>
        </View>
        <Icon name="chevron-left" size={18} color={colors.greenDark} />
      </Pressable>

      {/* 5 — Featured projects */}
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

      {/* 6 — Latest news */}
      <SectionHeader title="أحدث الأخبار" more="عرض المزيد ‹" onMore={() => nav.navigate('NewsFeed')} />
      {articles.slice(0, 2).map((a) => (
        <Pressable key={a.id} onPress={() => nav.navigate('ArticleDetail', { id: a.id })}>
          <Card style={[row, { gap: 11, marginBottom: 10, alignItems: 'flex-start' }]}>
            <LinearGradient colors={a.gradient} style={{ width: 64, height: 64, borderRadius: 12 }} />
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <Text style={[font('700'), { fontSize: 9, color: colors.navy500 }]}>{a.category} · <Text style={num}>{a.date}</Text></Text>
              <Text style={[font('800'), { fontSize: 12.5, color: colors.navy700, textAlign: 'right', marginTop: 3 }]} numberOfLines={2}>
                {a.title}
              </Text>
            </View>
            <Icon name="chevron-left" size={16} color={colors.muted} />
          </Card>
        </Pressable>
      ))}

      {/* 7 — Online consultations (most important — emphasized) */}
      <LinearGradient
        colors={[colors.navy700, colors.navy900]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ borderRadius: 20, padding: 16, marginTop: 6 }}
      >
        <View style={[row, { gap: 12 }]}>
          <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(255,255,255,.15)', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="message-circle" size={24} color="#fff" />
          </View>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text style={[font('800'), { fontSize: 15.5, color: '#fff' }]}>استشارات أونلاين مجانية</Text>
            <Text style={[font('400'), { fontSize: 11, color: '#cfe', marginTop: 3, textAlign: 'right', lineHeight: 16 }]}>
              نفسية · أسرية · تربوية · قانونية — جلسات سرية مع مختصين معتمدين
            </Text>
          </View>
        </View>
        <Pressable
          onPress={() => nav.navigate('ServicesBrowse', { parentId: 'counseling' })}
          style={[row, { backgroundColor: '#fff', borderRadius: 100, paddingVertical: 12, justifyContent: 'center', gap: 7, marginTop: 12 }]}
        >
          <Icon name="calendar" size={16} color={colors.navy700} />
          <Text style={[font('800'), { color: colors.navy700, fontSize: 14 }]}>احجز استشارة</Text>
        </Pressable>
      </LinearGradient>
      <View style={{ height: 12 }} />
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
