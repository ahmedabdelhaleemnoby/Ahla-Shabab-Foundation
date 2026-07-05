import React, { useMemo, useState } from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { projects, pct, egp, type ProjectStatus } from '@ahla/shared';
import { Screen } from '../components/Screen';
import { AppBar } from '../components/AppBar';
import { Card, Button, ProgressBar, Pill, Chip } from '../components/ui';
import { colors, font, num, row, rowBetween } from '../theme';

const FILTERS: (ProjectStatus | 'الكل')[] = ['الكل', 'مستدام', 'جارٍ', 'مكتمل'];

export default function ProjectsScreen() {
  const nav = useNavigation<any>();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('الكل');

  const list = useMemo(
    () => (filter === 'الكل' ? projects : projects.filter((p) => p.status === filter)),
    [filter]
  );

  return (
    <Screen header={<AppBar title="المشروعات" onBack={() => nav.goBack()} onBell={undefined} />}>
      <View style={{ alignItems: 'center', marginTop: 4, marginBottom: 12 }}>
        <Text style={[font('800'), { fontSize: 21, color: colors.navy700 }]}>مشروعاتنا</Text>
        <Text style={[font('400'), { fontSize: 11.5, color: colors.slate, marginTop: 3, textAlign: 'center' }]}>
          مشروعات تنموية ومستدامة تصنع أثراً يدوم
        </Text>
      </View>

      {/* Filters */}
      <View style={[row, { gap: 7, flexWrap: 'wrap' }]}>
        {FILTERS.map((f) => (
          <Chip key={f} label={f} active={filter === f} onPress={() => setFilter(f)} />
        ))}
      </View>

      {list.map((p) => {
        const percent = pct(p.raisedAmount, p.targetAmount);
        const doneStages = p.stages.filter((s) => s.done).length;
        return (
          <Card key={p.id} style={{ marginTop: 12, padding: 12 }}>
            <View style={[row, { gap: 11, alignItems: 'flex-start' }]}>
              <LinearGradient colors={p.gradient} style={{ width: 78, height: 96, borderRadius: 12 }} />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row-reverse' }}>
                  <Pill label={`مشروع ${p.status}`} tone="navy" />
                </View>
                <Text style={[font('800'), { fontSize: 14, color: colors.navy700, textAlign: 'right', marginTop: 5 }]}>{p.title}</Text>
                <Text style={[font('400'), { fontSize: 10.5, color: colors.slate, textAlign: 'right', lineHeight: 15, marginTop: 3 }]} numberOfLines={2}>
                  {p.description}
                </Text>
                <View style={{ marginTop: 8 }}>
                  <ProgressBar percent={percent} color={colors.green} />
                </View>
                <View style={[rowBetween, { marginTop: 6 }]}>
                  <Text style={[font('400'), num, { fontSize: 9.5, color: colors.slate }]}>
                    {egp(p.raisedAmount)} من {egp(p.targetAmount)}
                  </Text>
                  <Text style={[font('800'), { color: colors.green, fontSize: 12 }]}>{percent}%</Text>
                </View>
              </View>
            </View>
            <View style={[rowBetween, { marginTop: 10, borderTopWidth: 1, borderTopColor: colors.line2, paddingTop: 10 }]}>
              <Text style={[font('600'), num, { fontSize: 10.5, color: colors.muted }]}>
                {p.supporters.toLocaleString('en-US')} داعم · {doneStages}/{p.stages.length} مراحل
              </Text>
              <Button label="ادعم المشروع" variant="green" small onPress={() => nav.navigate('ProjectDetail', { id: p.id })} />
            </View>
          </Card>
        );
      })}
      <View style={{ height: 16 }} />
    </Screen>
  );
}
