import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { foundationStats, foundationValues, foundationInitiatives, articles, workGovernorates } from '@ahla/shared';

const MILESTONES = [
  { year: '2013', label: 'بداية الفكرة' },
  { year: '2015', label: 'أول قافلة إغاثية' },
  { year: '2019', label: 'توسع في المحافظات' },
  { year: '2022', label: 'إطلاق وصلات المياه' },
  { year: '2025', label: 'مستمرون بفضلكم' },
];

const IMPACT = [
  { value: '+1,200,000', label: 'مستفيد من خدماتنا' },
  { value: '+650', label: 'مبادرة ومشروع' },
  { value: '+10,000', label: 'متطوع فعّال' },
];
import { Screen } from '../components/Screen';
import { AppBar } from '../components/AppBar';
import { Card, Button, Stat } from '../components/ui';
import { StickyFooter } from './DonateScreen';
import { Icon, IconName } from '../components/Icon';
import { colors, font, num, row } from '../theme';

const valueIcons: Record<string, IconName> = {
  الشفافية: 'shield',
  المسؤولية: 'users',
  التطوع: 'user',
  التفوق: 'award',
  الإيمان: 'star',
};

const initiativeIcons: Record<string, IconName> = {
  'دعم الطلاب': 'award',
  'وصلات المياه': 'droplet',
  'محطات التحلية': 'droplet',
  'القوافل الإغاثية': 'truck',
  'مطابخ أحلى شباب': 'coffee',
  'الحالات الإنسانية': 'users',
};

export default function NewsScreen() {
  const nav = useNavigation<any>();
  return (
    <Screen
      header={<AppBar title="عن الجمعية" onBack={() => nav.navigate('Home')} />}
      footer={
        <StickyFooter>
          <Button label="تواصل معنا" variant="outline" icon="message-square" style={{ width: 130 }} onPress={() => nav.navigate('ContactUs')} />
          <Button label="انضم متطوعاً" icon="user-plus" style={{ flex: 1 }} onPress={() => nav.navigate('Volunteer')} />
        </StickyFooter>
      }
    >
      {/* Hero */}
      <LinearGradient colors={[colors.navy800, colors.navy900]} start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }} style={{ height: 150, borderRadius: 18, padding: 16, justifyContent: 'center' }}>
        <View style={{ width: '65%', alignSelf: 'flex-end' }}>
          <Text style={[font('800'), { fontSize: 17, color: '#fff', textAlign: 'right' }]}>معاً نصنع أثرا</Text>
          <Text style={[font('400'), { fontSize: 9.5, color: '#cde', lineHeight: 15, marginTop: 8, textAlign: 'right' }]}>
            جمعية شبابية مصرية. نؤمن بأن الدين والتفوق والتطوع طريقنا في بناء إنسان ومجتمع أفضل.
          </Text>
        </View>
      </LinearGradient>

      {/* Stats */}
      <View style={[row, { gap: 9, marginTop: 12 }]}>
        <Stat icon="users" value={foundationStats.beneficiaries} label="مستفيد" />
        <Stat icon="calendar" value={String(foundationStats.yearsOfService)} label="سنوات عطاء" />
      </View>

      {/* Interactive Governorates Section */}
      <Card style={{ marginTop: 12 }}>
        <View style={[row, { gap: 6, justifyContent: 'flex-end', marginBottom: 4 }]}>
          <Text style={[font('800'), { fontSize: 13, color: colors.navy700 }]}>نطاق عملنا في المحافظات</Text>
          <Icon name="map-pin" size={16} color={colors.navy700} />
        </View>
        <Text style={[font('400'), { fontSize: 10.5, color: colors.slate, textAlign: 'right', marginBottom: 10 }]}>
          اضغط على المحافظة لمشاهدة المبادرات والخدمات المتاحة بها:
        </Text>
        <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 7 }}>
          {workGovernorates.map((g) => (
            <Pressable
              key={g}
              onPress={() => nav.navigate('GovernorateActivity', { governorate: g })}
              style={({ pressed }) => [
                {
                  backgroundColor: pressed ? colors.navy700 : colors.paper2,
                  borderRadius: 100,
                  paddingVertical: 7,
                  paddingHorizontal: 13,
                  borderWidth: 1,
                  borderColor: colors.line,
                },
              ]}
            >
              <Text style={[font('700'), { fontSize: 11, color: colors.navy700 }]}>📍 {g}</Text>
            </Pressable>
          ))}
          <View style={{ backgroundColor: '#EAF0F8', borderRadius: 100, paddingVertical: 7, paddingHorizontal: 13 }}>
            <Text style={[font('700'), { fontSize: 10.5, color: colors.navy500 }]}>وفي توسع مستمر…</Text>
          </View>
        </View>
      </Card>

      {/* News & activities */}
      <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, marginBottom: 10, marginHorizontal: 2 }}>
        <Text style={[font('800'), { fontSize: 14, color: colors.navy700 }]}>أخبار وأنشطة</Text>
        <Pressable onPress={() => nav.navigate('NewsFeed')}>
          <Text style={[font('700'), { fontSize: 11.5, color: colors.navy500 }]}>عرض الكل ‹</Text>
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, flexDirection: 'row-reverse', paddingHorizontal: 2 }}>
        {articles.slice(0, 4).map((a) => (
          <Pressable key={a.id} onPress={() => nav.navigate('ArticleDetail', { id: a.id })}>
            <Card style={{ width: 190, padding: 0, overflow: 'hidden' }}>
              <LinearGradient colors={a.gradient} style={{ height: 84 }} />
              <View style={{ padding: 10, alignItems: 'flex-end' }}>
                <Text style={[font('700'), { fontSize: 8.5, color: colors.navy500 }]}>{a.category}</Text>
                <Text style={[font('800'), { fontSize: 12, color: colors.navy700, textAlign: 'right', marginTop: 3 }]} numberOfLines={2}>
                  {a.title}
                </Text>
              </View>
            </Card>
          </Pressable>
        ))}
      </ScrollView>

      {/* Mission / Vision */}
      <View style={[row, { gap: 9, marginTop: 12 }]}>
        <MissionCard icon="send" title="رسالتنا" body="تمكين الشباب لخدمة الإنسان بمبادرات مبتكرة وشراكات فعّالة." />
        <MissionCard icon="eye" title="رؤيتنا" body="مجتمع واعٍ متكاتف نصنع فيه أثراً مستداماً." />
      </View>

      {/* Values */}
      <Text style={[font('800'), { fontSize: 13, color: colors.navy700, textAlign: 'center', marginVertical: 16 }]}>قيمنا</Text>
      <Card style={[row, { justifyContent: 'space-around' }]}>
        {foundationValues.map((v) => (
          <View key={v} style={{ alignItems: 'center' }}>
            <Icon name={valueIcons[v] ?? 'circle'} size={20} color={colors.navy700} />
            <Text style={[font('700'), { fontSize: 9, color: colors.navy700, marginTop: 4 }]}>{v}</Text>
          </View>
        ))}
      </Card>

      {/* Initiatives */}
      <Text style={[font('800'), { fontSize: 13, color: colors.navy700, textAlign: 'center', marginVertical: 16 }]}>مبادراتنا</Text>
      <Card>
        <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap' }}>
          {foundationInitiatives.map((it) => (
            <View key={it} style={{ width: '33.33%', alignItems: 'center', marginVertical: 8 }}>
              <Icon name={initiativeIcons[it] ?? 'circle'} size={20} color={colors.navy700} />
              <Text style={[font('700'), { fontSize: 8.5, color: colors.navy700, marginTop: 4, textAlign: 'center' }]}>{it}</Text>
            </View>
          ))}
        </View>
      </Card>

      {/* Impact in the community */}
      <Text style={[font('800'), { fontSize: 13, color: colors.navy700, textAlign: 'center', marginVertical: 16 }]}>أثرنا في المجتمع</Text>
      <Card>
        <View style={[row, { gap: 6, justifyContent: 'flex-end', marginBottom: 12 }]}>
          <Text style={[font('800'), { fontSize: 12, color: colors.navy700 }]}>محطات إنجاز</Text>
          <Icon name="trending-up" size={15} color={colors.navy700} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row-reverse', alignItems: 'flex-start' }}>
          {MILESTONES.map((m, i) => (
            <View key={m.year} style={{ flexDirection: 'row-reverse', alignItems: 'flex-start' }}>
              <View style={{ alignItems: 'center', width: 74 }}>
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: i === MILESTONES.length - 1 ? colors.green : colors.navy700 }} />
                <Text style={[font('800'), num, { fontSize: 12, color: colors.navy700, marginTop: 6 }]}>{m.year}</Text>
                <Text style={[font('400'), { fontSize: 8.5, color: colors.slate, marginTop: 2, textAlign: 'center' }]}>{m.label}</Text>
              </View>
              {i < MILESTONES.length - 1 && <View style={{ height: 2, width: 24, backgroundColor: colors.line, marginTop: 5 }} />}
            </View>
          ))}
        </ScrollView>
        <View style={{ height: 1, backgroundColor: colors.line2, marginVertical: 12 }} />
        <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap' }}>
          {IMPACT.map((s) => (
            <View key={s.label} style={{ width: '50%', flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginVertical: 5 }}>
              <Text style={[font('800'), num, { fontSize: 14, color: colors.navy700 }]}>{s.value}</Text>
              <Text style={[font('400'), { fontSize: 9.5, color: colors.slate, flex: 1, textAlign: 'right' }]}>{s.label}</Text>
            </View>
          ))}
        </View>
      </Card>

      <View style={{ height: 12 }} />
    </Screen>
  );
}

function MissionCard({ icon, title, body }: { icon: IconName; title: string; body: string }) {
  return (
    <Card style={{ flex: 1 }}>
      <View style={[row, { gap: 6, justifyContent: 'flex-end' }]}>
        <Text style={[font('800'), { fontSize: 12, color: colors.navy700 }]}>{title}</Text>
        <Icon name={icon} size={16} color={colors.navy700} />
      </View>
      <Text style={[font('400'), { fontSize: 9.5, color: colors.slate, lineHeight: 15, marginTop: 5, textAlign: 'right' }]}>{body}</Text>
    </Card>
  );
}
