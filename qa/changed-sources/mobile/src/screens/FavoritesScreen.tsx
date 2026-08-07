import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { projects, cases, pct, egp } from '@ahla/shared';
import { Screen } from '../components/Screen';
import { AppBar } from '../components/AppBar';
import { Card, ProgressBar, Pill, EmptyState } from '../components/ui';
import { Icon } from '../components/Icon';
import { colors, font, num, row, rowBetween } from '../theme';

/** Mock favorites: first two projects + first sponsorable case. TODO(backend): GET /me/favorites. */
const favProjects = projects.slice(0, 2);
const favCases = cases.filter((c) => c.sponsorable).slice(0, 1);

export default function FavoritesScreen() {
  const nav = useNavigation<any>();
  const empty = favProjects.length + favCases.length === 0;

  return (
    <Screen header={<AppBar title="المفضلة" onBack={() => nav.goBack()} onBell={undefined} />}>
      {empty ? (
        <EmptyState icon="heart" title="لا توجد عناصر مفضلة" hint="اضغط على أيقونة القلب في أي حالة أو مشروع لحفظه هنا" />
      ) : (
        <>
          {[...favProjects.map((p) => ({ kind: 'project' as const, p })), ...favCases.map((c) => ({ kind: 'case' as const, c }))].map((f) => {
            const item = f.kind === 'project' ? f.p : f.c;
            const percent = pct(item.raisedAmount, item.targetAmount);
            return (
              <Pressable
                key={item.id}
                onPress={() => nav.navigate(f.kind === 'project' ? 'ProjectDetail' : 'CaseDetail', { id: item.id })}
              >
                <Card style={[row, { gap: 11, marginBottom: 10, alignItems: 'flex-start' }]}>
                  <LinearGradient colors={item.gradient} style={{ width: 64, height: 76, borderRadius: 12 }} />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row-reverse' }}>
                      <Pill label={f.kind === 'project' ? 'مشروع' : 'حالة'} tone="navy" />
                    </View>
                    <Text style={[font('800'), { fontSize: 13, color: colors.navy700, textAlign: 'right', marginTop: 4 }]}>{item.title}</Text>
                    <View style={{ marginTop: 6 }}>
                      <ProgressBar percent={percent} color={colors.green} />
                    </View>
                    <View style={[rowBetween, { marginTop: 5 }]}>
                      <Text style={[font('400'), num, { fontSize: 9.5, color: colors.slate }]}>{egp(item.raisedAmount)} من {egp(item.targetAmount)}</Text>
                      <Text style={[font('800'), { fontSize: 11, color: colors.green }]}>{percent}%</Text>
                    </View>
                  </View>
                  <Icon name="heart" size={16} color={colors.red} />
                </Card>
              </Pressable>
            );
          })}
        </>
      )}
      <View style={{ height: 12 }} />
    </Screen>
  );
}
