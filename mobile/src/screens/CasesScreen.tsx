import React, { useMemo, useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { cases, pct, type CaseTag } from '@ahla/shared';
import { Screen } from '../components/Screen';
import { AppBar } from '../components/AppBar';
import { Card, Button, ProgressBar, Pill, Chip } from '../components/ui';
import { Icon } from '../components/Icon';
import { colors, font, row, rowBetween } from '../theme';

const FILTERS: (CaseTag | 'الكل')[] = ['عاجل', 'علاج', 'تعليم', 'سكن', 'الكل'];

const tagTone = (tag: CaseTag) =>
  tag === 'عاجل' ? 'red' : tag === 'تعليم' ? 'gold' : 'green';
const tagColor = (tag: CaseTag) =>
  tag === 'عاجل' ? colors.red : tag === 'تعليم' ? colors.gold : colors.green;

export default function CasesScreen() {
  const nav = useNavigation<any>();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('الكل');
  const [query, setQuery] = useState('');
  const list = useMemo(() => {
    const q = query.trim();
    return cases.filter(
      (c) =>
        (filter === 'الكل' || c.tag === filter) &&
        (q === '' || c.code.includes(q) || c.title.includes(q) || c.summary.includes(q) || c.location.includes(q))
    );
  }, [filter, query]);

  return (
    <Screen header={<AppBar />}>
      <View style={{ alignItems: 'center', marginTop: 4, marginBottom: 12 }}>
        <Text style={[font('800'), { fontSize: 21, color: colors.navy700 }]}>الحالات المستحقة</Text>
        <Text style={[font('400'), { fontSize: 11, color: colors.slate, marginTop: 3 }]}>
          اختر حالة إنسانية وكن سبباً في تغيير حياة
        </Text>
      </View>

      {/* Search */}
      <View style={[row, { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: 12, paddingHorizontal: 14, gap: 8 }]}>
        <Icon name="search" size={16} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="ابحث عن حالة إنسانية..."
          placeholderTextColor={colors.muted}
          style={[font('600'), { flex: 1, fontSize: 13, color: colors.ink, paddingVertical: 12, textAlign: 'right', writingDirection: 'rtl' }]}
        />
        {query.length > 0 && (
          <Text onPress={() => setQuery('')} style={[font('700'), { color: colors.muted, fontSize: 16 }]}>
            ✕
          </Text>
        )}
      </View>

      {/* Filters */}
      <View style={[row, { gap: 7, marginTop: 12, flexWrap: 'wrap' }]}>
        {FILTERS.map((f) => (
          <Chip
            key={f}
            label={f}
            active={filter === f}
            tone={f === 'عاجل' && filter !== f ? 'red' : undefined}
            onPress={() => setFilter(f)}
          />
        ))}
      </View>

      {/* List */}
      {list.map((item) => {
        const p = pct(item.raisedAmount, item.targetAmount);
        const c = tagColor(item.tag);
        return (
          <Card key={item.id} style={{ flexDirection: 'row-reverse', gap: 11, marginTop: 12, padding: 11 }}>
            <LinearGradient colors={item.gradient} style={{ width: 80, height: 96, borderRadius: 12 }} />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row-reverse' }}>
                <Pill label={item.tag === 'عاجل' ? '⚡ عاجل' : item.tag} tone={tagTone(item.tag)} />
              </View>
              <Text style={[font('800'), { fontSize: 13.5, color: colors.navy700, textAlign: 'right', marginTop: 5 }]}>
                {item.code}
              </Text>
              <Text style={[font('400'), { fontSize: 10, color: colors.slate, textAlign: 'right', lineHeight: 14, marginVertical: 3 }]}>
                {item.summary}
              </Text>
              <ProgressBar percent={p} color={c} />
              <View style={[rowBetween, { marginTop: 6 }]}>
                <Button
                  label={item.tag === 'تعليم' ? 'اكفل شهرياً' : 'ساهم الآن'}
                  variant={item.tag === 'تعليم' ? 'outline' : 'primary'}
                  small
                  onPress={() => nav.navigate('CaseDetail', { id: item.id })}
                />
                <Text style={[font('800'), { color: c, fontSize: 12 }]}>{p}%</Text>
              </View>
            </View>
          </Card>
        );
      })}

      {list.length === 0 && (
        <View style={{ alignItems: 'center', paddingVertical: 48 }}>
          <Icon name="search" size={34} color={colors.muted} />
          <Text style={[font('700'), { fontSize: 14, color: colors.slate, marginTop: 12 }]}>لا توجد نتائج مطابقة</Text>
          <Text style={[font('400'), { fontSize: 11.5, color: colors.muted, marginTop: 4, textAlign: 'center' }]}>
            جرّب كلمة بحث أخرى أو غيّر التصنيف
          </Text>
        </View>
      )}
      <View style={{ height: 12 }} />
    </Screen>
  );
}
