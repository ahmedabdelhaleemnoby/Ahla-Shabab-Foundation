import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import {
  pct,
  egp,
} from '@ahla/shared';
import { getProjects, getCases } from '../store/content';
import { fetchMyFavorites } from '@ahla/shared';
import { useMyData } from '../hooks/useMyData';
import { AccountState } from '../components/AccountState';
import { Screen } from '../components/Screen';
import { AppBar } from '../components/AppBar';
import { Card, ProgressBar, Pill, EmptyState } from '../components/ui';
import { Icon } from '../components/Icon';
import { LoginGate } from '../components/LoginGate';
import { colors, font, num, row, rowBetween } from '../theme';

export default function FavoritesScreen() {
  const nav = useNavigation<any>();
  /**
   * Real favorites for the signed-in user. The server returns
   * { entityType, entityId } pairs, which are resolved against the already
   * loaded content stores — no second round-trip per row.
   */
  const { items: rows, loading, error, reload } = useMyData(fetchMyFavorites, (r) => ({
    entityType: String(r.entityType ?? ''),
    entityId: String(r.entityId ?? ''),
  }));
  const favProjects = getProjects().filter((p) =>
    rows.some((f) => f.entityType === 'project' && f.entityId === p.id));
  const favCases = getCases().filter((c) =>
    rows.some((f) => f.entityType === 'case' && f.entityId === c.id));
  const empty = favProjects.length + favCases.length === 0;

  const state = (
    <AccountState
      isGuest={false}
      loading={loading}
      error={error}
      isEmpty={empty}
      emptyIcon="heart"
      emptyTitle="لا توجد عناصر مفضلة"
      emptyHint="اضغط على أيقونة القلب في أي حالة أو مشروع لحفظه هنا"
      guestHint="سجّل دخولك لحفظ الحالات والمشروعات ومتابعتها."
      onSignIn={() => nav.navigate('EmailAuth')}
      onRetry={reload}
    />
  );

  return (
    <LoginGate
      icon="star"
      title="مفضلتك في حسابك"
      benefits={['احفظ الحالات والمشروعات لمتابعتها', 'تنبيهات عند اقتراب أهدافها من الاكتمال', 'وصول سريع من أي جهاز بعد تسجيل الدخول']}
    >
    <Screen header={<AppBar title="المفضلة" onBack={() => nav.goBack()} onBell={undefined} />}>
      {state ? (
        state
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
    </LoginGate>
  );
}
