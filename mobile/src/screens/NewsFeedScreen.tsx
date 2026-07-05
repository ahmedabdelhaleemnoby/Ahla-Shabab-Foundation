import React, { useMemo, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { articles, type ArticleCategory } from '@ahla/shared';
import { Screen } from '../components/Screen';
import { AppBar } from '../components/AppBar';
import { Card, Pill, Chip } from '../components/ui';
import { Icon } from '../components/Icon';
import { colors, font, num, row } from '../theme';

const FILTERS: (ArticleCategory | 'الكل')[] = ['الكل', 'خبر', 'نشاط', 'قافلة', 'مقال'];

const catTone = (c: ArticleCategory) =>
  c === 'خبر' ? 'navy' : c === 'نشاط' ? 'green' : c === 'قافلة' ? 'gold' : 'red';

export default function NewsFeedScreen() {
  const nav = useNavigation<any>();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('الكل');
  const list = useMemo(
    () => (filter === 'الكل' ? articles : articles.filter((a) => a.category === filter)),
    [filter]
  );

  const [featured, ...rest] = list;

  return (
    <Screen header={<AppBar title="أخبارنا وأنشطتنا" onBack={() => nav.goBack()} onBell={undefined} />}>
      {/* Filters */}
      <View style={[row, { gap: 7, flexWrap: 'wrap', marginBottom: 4 }]}>
        {FILTERS.map((f) => (
          <Chip key={f} label={f} active={filter === f} onPress={() => setFilter(f)} />
        ))}
      </View>

      {/* Featured */}
      {featured && (
        <Pressable onPress={() => nav.navigate('ArticleDetail', { id: featured.id })} style={{ marginTop: 12 }}>
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <LinearGradient colors={featured.gradient} style={{ height: 150, justifyContent: 'flex-start', padding: 12 }}>
              <View style={{ flexDirection: 'row-reverse' }}>
                <Pill label={featured.category} tone={catTone(featured.category)} />
              </View>
            </LinearGradient>
            <View style={{ padding: 12, alignItems: 'flex-end' }}>
              <Text style={[font('800'), { fontSize: 15.5, color: colors.navy700, textAlign: 'right' }]}>{featured.title}</Text>
              <Text style={[font('400'), { fontSize: 11.5, color: colors.slate, textAlign: 'right', lineHeight: 17, marginTop: 5 }]} numberOfLines={2}>
                {featured.excerpt}
              </Text>
              <Meta date={featured.date} readMinutes={featured.readMinutes} />
            </View>
          </Card>
        </Pressable>
      )}

      {/* Rest */}
      {rest.map((a) => (
        <Pressable key={a.id} onPress={() => nav.navigate('ArticleDetail', { id: a.id })}>
          <Card style={[row, { gap: 11, marginTop: 12, alignItems: 'flex-start' }]}>
            <LinearGradient colors={a.gradient} style={{ width: 84, height: 84, borderRadius: 12 }} />
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <Pill label={a.category} tone={catTone(a.category)} />
              <Text style={[font('800'), { fontSize: 13.5, color: colors.navy700, textAlign: 'right', marginTop: 5 }]} numberOfLines={2}>
                {a.title}
              </Text>
              <Meta date={a.date} readMinutes={a.readMinutes} />
            </View>
          </Card>
        </Pressable>
      ))}
      <View style={{ height: 16 }} />
    </Screen>
  );
}

function Meta({ date, readMinutes }: { date: string; readMinutes: number }) {
  return (
    <View style={[row, { gap: 10, marginTop: 7 }]}>
      <View style={[row, { gap: 4 }]}>
        <Icon name="calendar" size={12} color={colors.muted} />
        <Text style={[font('600'), num, { fontSize: 9.5, color: colors.muted }]}>{date}</Text>
      </View>
      <View style={[row, { gap: 4 }]}>
        <Icon name="clock" size={12} color={colors.muted} />
        <Text style={[font('600'), { fontSize: 9.5, color: colors.muted }]}>{readMinutes} دقائق قراءة</Text>
      </View>
    </View>
  );
}
