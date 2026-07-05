import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { projects, pct, egp } from '@ahla/shared';
import { Screen } from '../components/Screen';
import { AppBar } from '../components/AppBar';
import { Card, Button, ProgressBar, Pill } from '../components/ui';
import { StickyFooter } from './DonateScreen';
import { Icon, IconName } from '../components/Icon';
import { colors, font, num, row, rowBetween } from '../theme';
import type { RootProps } from '../navigation/types';

const IMPACT: { label: string; icon: IconName }[] = [
  { label: 'مجتمعات أقوى', icon: 'users' },
  { label: 'خدمة مستدامة', icon: 'droplet' },
  { label: 'جودة الحياة', icon: 'user' },
];

export default function ProjectDetailScreen({ route }: RootProps<'ProjectDetail'>) {
  const nav = useNavigation<any>();
  const project = projects.find((p) => p.id === route.params.id) ?? projects[0];
  const p = pct(project.raisedAmount, project.targetAmount);

  return (
    <Screen
      header={<AppBar onBack={() => nav.goBack()} onBell={() => {}} />}
      footer={
        <StickyFooter>
          <Button label="مشاركة" variant="outline" icon="share-2" style={{ width: 104 }} />
          <Button label="ادعم المشروع" icon="heart" style={{ flex: 1 }} onPress={() => nav.navigate('Main', { screen: 'Donate' })} />
        </StickyFooter>
      }
    >
      <LinearGradient colors={project.gradient} style={{ height: 150, borderRadius: 16 }} />

      <View style={{ alignItems: 'flex-end', marginTop: 14 }}>
        <Pill label={`مشروع ${project.status}`} tone="navy" />
        <Text style={[font('800'), { fontSize: 22, color: colors.navy700, marginTop: 8 }]}>{project.title}</Text>
        <Text style={[font('400'), { fontSize: 12.5, color: colors.slate, marginTop: 4, textAlign: 'right' }]}>
          توفير مياه نقية وآمنة للمناطق الأكثر احتياجاً
        </Text>
      </View>

      {/* Progress card */}
      <Card style={{ marginTop: 14 }}>
        <View style={rowBetween}>
          <Text style={[font('700'), { fontSize: 11.5, color: colors.slate }]}>نسبة الإنجاز</Text>
          <Text style={[font('800'), { color: colors.green, fontSize: 18 }]}>{p}%</Text>
        </View>
        <View style={{ marginVertical: 12 }}>
          <ProgressBar percent={p} color={colors.green} />
        </View>
        <View style={[row, { justifyContent: 'space-between' }]}>
          <MiniStat value={project.targetAmount.toLocaleString('en-US')} label="الهدف المالي" />
          <MiniStat value={project.raisedAmount.toLocaleString('en-US')} label="المبلغ المُجمع" border />
          <MiniStat value={project.supporters.toLocaleString('en-US')} label="داعم" />
        </View>
      </Card>

      {/* About */}
      <View style={[row, { gap: 7, marginTop: 16, marginBottom: 8, marginHorizontal: 2 }]}>
        <Icon name="info" size={16} color={colors.navy700} />
        <Text style={[font('800'), { fontSize: 15, color: colors.navy700 }]}>عن المشروع</Text>
      </View>
      <Text style={[font('400'), { fontSize: 11.5, color: colors.slate, lineHeight: 20, textAlign: 'right' }]}>
        {project.description}
      </Text>

      {/* Impact */}
      <View style={[row, { gap: 7, marginTop: 16, marginBottom: 8, marginHorizontal: 2 }]}>
        <Icon name="award" size={16} color={colors.navy700} />
        <Text style={[font('800'), { fontSize: 15, color: colors.navy700 }]}>الأثر المتوقع</Text>
      </View>
      <View style={[row, { gap: 8 }]}>
        {IMPACT.map((i) => (
          <Card key={i.label} style={{ flex: 1, alignItems: 'center', paddingVertical: 11, paddingHorizontal: 6 }}>
            <Icon name={i.icon} size={20} color={colors.navy700} />
            <Text style={[font('800'), { fontSize: 11, color: colors.navy700, marginTop: 6, textAlign: 'center' }]}>{i.label}</Text>
          </Card>
        ))}
      </View>

      {/* Stages */}
      <View style={[row, { gap: 7, marginTop: 16, marginBottom: 12, marginHorizontal: 2 }]}>
        <Icon name="list" size={16} color={colors.navy700} />
        <Text style={[font('800'), { fontSize: 15, color: colors.navy700 }]}>مراحل المشروع</Text>
      </View>
      <View style={[row, { justifyContent: 'space-between', paddingHorizontal: 4 }]}>
        {project.stages
          .slice()
          .reverse()
          .map((s, idx, arr) => (
            <React.Fragment key={s.label}>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: s.done ? colors.green : '#E8EEF6', alignItems: 'center', justifyContent: 'center' }}>
                  {s.done ? (
                    <Icon name="check" size={14} color="#fff" />
                  ) : (
                    <Text style={[font('800'), { fontSize: 11, color: colors.muted }]}>{arr.length - idx}</Text>
                  )}
                </View>
                <Text style={[font('400'), { fontSize: 8.5, color: s.done ? colors.slate : colors.muted, marginTop: 5 }]}>{s.label}</Text>
              </View>
              {idx < arr.length - 1 && (
                <View style={{ width: 22, height: 2, backgroundColor: arr[idx + 1].done ? colors.green : colors.line, marginTop: 12 }} />
              )}
            </React.Fragment>
          ))}
      </View>
      <View style={{ height: 12 }} />
    </Screen>
  );
}

function MiniStat({ value, label, border }: { value: string; label: string; border?: boolean }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', borderLeftWidth: border ? 1 : 0, borderRightWidth: border ? 1 : 0, borderColor: colors.line2 }}>
      <Text style={[font('800'), num, { color: colors.navy700, fontSize: 14 }]}>{value}</Text>
      <Text style={[font('400'), { fontSize: 9.5, color: colors.slate }]}>{label}</Text>
    </View>
  );
}
