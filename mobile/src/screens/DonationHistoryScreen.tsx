import React, { useMemo, useState } from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { donations, egp } from '@ahla/shared';
import { useAppState } from '../store/appState';
import { Screen } from '../components/Screen';
import { AppBar } from '../components/AppBar';
import { Card, Pill, Chip } from '../components/ui';
import { Icon } from '../components/Icon';
import { colors, font, num, row, rowBetween } from '../theme';

// Broaden to all donations so the demo history has depth.
const mine = donations;

const statusTone = (s: string) => (s === 'مكتمل' ? 'green' : s === 'فشل' ? 'red' : 'gold');
const FILTERS = ['الكل', 'مكتمل', 'قيد المعالجة', 'شهري'] as const;

export default function DonationHistoryScreen() {
  const nav = useNavigation<any>();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('الكل');
  const { receipts } = useAppState();

  // Session donations (pending until backend/admin confirms) shown on top.
  const combined = useMemo(
    () => [
      ...receipts.map((r, i) => ({
        id: `rc-${i}`,
        donorName: '',
        cause: r.cause,
        amount: parseInt(r.amount.replace(/\D/g, ''), 10) || 0,
        method: r.method,
        date: r.date,
        recurring: r.recurring,
        status: r.status as (typeof mine)[number]['status'],
      })),
      ...mine,
    ],
    [receipts]
  );

  const list = useMemo(
    () =>
      combined.filter((d) =>
        filter === 'الكل' ? true : filter === 'شهري' ? d.recurring : d.status === filter
      ),
    [combined, filter]
  );

  // Only backend/admin-confirmed donations count toward the total.
  const total = combined.filter((d) => d.status === 'مكتمل').reduce((s, d) => s + d.amount, 0);

  return (
    <Screen header={<AppBar title="سجل التبرعات" onBack={() => nav.goBack()} onBell={undefined} />}>
      {/* Summary */}
      <LinearGradient colors={[colors.navy800, colors.navy900]} start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }} style={{ borderRadius: 18, padding: 18 }}>
        <View style={rowBetween}>
          <View style={{ alignItems: 'flex-start' }}>
            <Text style={[font('800'), num, { fontSize: 26, color: '#fff' }]}>{egp(total)}</Text>
            <Text style={[font('400'), { fontSize: 11, color: '#bcd', marginTop: 2 }]}>إجمالي تبرعاتك</Text>
          </View>
          <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: 'rgba(255,255,255,.12)', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="heart" size={22} color="#fff" />
          </View>
        </View>
        <View style={[row, { gap: 20, marginTop: 14 }]}>
          <SummaryStat value={String(combined.length)} label="عملية" />
          <SummaryStat value={String(combined.filter((d) => d.recurring).length)} label="كفالة شهرية" />
        </View>
      </LinearGradient>

      {/* Filters */}
      <View style={[row, { gap: 7, flexWrap: 'wrap', marginTop: 14, marginBottom: 2 }]}>
        {FILTERS.map((f) => (
          <Chip key={f} label={f} active={filter === f} onPress={() => setFilter(f)} />
        ))}
      </View>

      {/* List */}
      {list.map((d) => (
        <Card key={d.id} style={[row, { gap: 11, marginTop: 12 }]}>
          <LinearGradient colors={['#a7b6d0', '#7186a6']} style={{ width: 42, height: 42, borderRadius: 11 }} />
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <View style={[rowBetween, { alignSelf: 'stretch' }]}>
              <Text style={[font('800'), num, { fontSize: 14, color: colors.navy700 }]}>{d.amount} ج.م</Text>
              <Text style={[font('800'), { fontSize: 12.5, color: colors.navy700, flex: 1, textAlign: 'right' }]} numberOfLines={1}>
                {d.cause}
              </Text>
            </View>
            <View style={[row, { gap: 6, marginTop: 6 }]}>
              <Pill label={d.status} tone={statusTone(d.status) as any} />
              {d.recurring && <Pill label="شهري" tone="navy" />}
              <Text style={[font('400'), num, { fontSize: 9.5, color: colors.muted }]}>{d.date} · {d.method}</Text>
            </View>
          </View>
        </Card>
      ))}
      <View style={{ height: 16 }} />
    </Screen>
  );
}

function SummaryStat({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ alignItems: 'flex-start' }}>
      <Text style={[font('800'), num, { fontSize: 17, color: '#fff' }]}>{value}</Text>
      <Text style={[font('400'), { fontSize: 10, color: '#bcd', marginTop: 1 }]}>{label}</Text>
    </View>
  );
}
