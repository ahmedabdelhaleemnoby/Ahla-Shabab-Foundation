import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import {
  cases,
  projects,
  foundationStats,
  quickServices,
  pct,
  egp,
} from '@ahla/shared';
import { Screen } from '../components/Screen';
import { AppBar } from '../components/AppBar';
import { Card, Button, ProgressBar, Pill, Tile, Stat, SectionHeader } from '../components/ui';
import { Icon, IconName } from '../components/Icon';
import { colors, font, num, row, rowBetween, text } from '../theme';

const serviceIcon: Record<string, IconName> = {
  droplet: 'droplet',
  'file-text': 'file-text',
  'heart-handshake': 'heart',
  building: 'home',
  'map-pin': 'map-pin',
};

export default function HomeScreen() {
  const nav = useNavigation<any>();
  const urgent = cases.find((c) => c.tag === 'عاجل')!;
  const featured = projects[0];

  return (
    <Screen header={<AppBar />}>
      {/* Hero */}
      <LinearGradient
        colors={[colors.navy800, colors.navy900]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ borderRadius: 20, padding: 20, height: 186, justifyContent: 'space-between' }}
      >
        <View style={{ width: '65%', alignSelf: 'flex-end' }}>
          <Text style={[font('800'), { color: '#fff', fontSize: 21, lineHeight: 27, textAlign: 'right' }]}>
            معاً نصنع{'\n'}أثراً يدوم
          </Text>
          <Text style={[font('400'), { color: '#cfe', fontSize: 10.5, marginTop: 8, textAlign: 'right', lineHeight: 16 }]}>
            من الإسكندرية إلى أسوان،{'\n'}22 محافظة في خدمتكم
          </Text>
        </View>
        <Pressable
          onPress={() => nav.navigate('Main', { screen: 'Donate' })}
          style={[row, { backgroundColor: '#fff', borderRadius: 100, paddingVertical: 8, paddingHorizontal: 16, alignSelf: 'flex-end', gap: 6 }]}
        >
          <Icon name="heart" size={15} color={colors.navy700} />
          <Text style={[font('800'), { color: colors.navy700, fontSize: 12 }]}>تبرع الآن</Text>
        </Pressable>
      </LinearGradient>

      {/* Stats */}
      <View style={[row, { gap: 9, marginTop: 14 }]}>
        <Stat icon="map-pin" value={String(foundationStats.governorates)} label="محافظة" />
        <Stat icon="users" value={foundationStats.beneficiaries} label="مستفيد" />
        <Stat icon="calendar" value={String(foundationStats.yearsOfService)} label="سنة عطاء" />
      </View>

      {/* Book a free service — main entry point (Offer §4.2) */}
      <Pressable onPress={() => nav.navigate('ServicesBrowse', { parentId: null })} style={{ marginTop: 14 }}>
        <LinearGradient
          colors={[colors.navy700, colors.navy600]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ borderRadius: 16, padding: 14, flexDirection: 'row-reverse', alignItems: 'center', gap: 12 }}
        >
          <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,.15)', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="calendar" size={22} color="#fff" />
          </View>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text style={[font('800'), { fontSize: 15, color: '#fff' }]}>احجز خدمة مجانية</Text>
            <Text style={[font('400'), { fontSize: 11, color: '#cfe', marginTop: 2, textAlign: 'right' }]}>
              عيادات · استشارات · دعم تعليمي · خدمات اجتماعية
            </Text>
          </View>
          <Icon name="chevron-left" size={20} color="#cfe" />
        </LinearGradient>
      </Pressable>

      {/* Quick services */}
      <SectionHeader title="خدمات سريعة" more="عرض الكل ‹" />
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
            }}
          />
        ))}
      </View>

      {/* Urgent case */}
      <View style={[rowBetween, { marginTop: 16, marginBottom: 10, marginHorizontal: 2 }]}>
        <View style={[row, { gap: 7 }]}>
          <Text style={[font('800'), { color: colors.navy700, fontSize: 15 }]}>حالة إنسانية عاجلة</Text>
          <Pill label="عاجل" tone="red" />
        </View>
      </View>
      <CaseRow item={urgent} onPress={() => nav.navigate('CaseDetail', { id: urgent.id })} />

      {/* Featured project */}
      <SectionHeader title="مشروع مميز" more="عرض الكل ‹" onMore={() => nav.navigate('Projects')} />
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
            label="ادعم المشروع"
            variant="green"
            small
            style={{ marginTop: 8 }}
            onPress={() => nav.navigate('ProjectDetail', { id: featured.id })}
          />
        </View>
      </Card>
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
        <Button label="ساهم الآن" variant="red" small style={{ marginTop: 8 }} onPress={onPress} />
      </View>
    </Card>
  );
}
