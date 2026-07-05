import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import {
  childCategories,
  servicesInCategory,
  categoryById,
  providerById,
  providers,
  services,
} from '@ahla/shared';
import { Screen } from '../components/Screen';
import { AppBar } from '../components/AppBar';
import { Card, Pill } from '../components/ui';
import { Icon, IconName } from '../components/Icon';
import { colors, font, row } from '../theme';

// Pushed "ServicesBrowse" root-stack route: root level (from Home) has no
// params; nested levels carry parentId. Reached from the Home banner + quick-service tile.
type Props = { route?: { params?: { parentId?: string | null } } };

type Mode = 'categories' | 'providers';

/** Distinct category names a provider serves (from their assigned services). */
const providerCategories = (providerId: string): string[] => {
  const names = services
    .filter((s) => s.providerId === providerId)
    .map((s) => categoryById(s.categoryId)?.name)
    .filter(Boolean) as string[];
  return Array.from(new Set(names));
};

export default function ServicesBrowseScreen({ route }: Props) {
  const nav = useNavigation<any>();
  const parentId = route?.params?.parentId ?? null;

  // On the tab there is no stack `push`; navigating bubbles to the root stack.
  const openCategory = (cid: string) =>
    nav.push ? nav.push('ServicesBrowse', { parentId: cid }) : nav.navigate('ServicesBrowse', { parentId: cid });
  const current = parentId ? categoryById(parentId) : undefined;
  const isRoot = !current;

  const [mode, setMode] = useState<Mode>('categories');

  const categories = childCategories(parentId);
  const svcs = parentId ? servicesInCategory(parentId) : [];
  const showProviders = isRoot && mode === 'providers';

  return (
    <Screen header={<AppBar title={current ? current.name : 'الخدمات'} onBack={() => nav.goBack()} onBell={undefined} />}>
      {isRoot && (
        <>
          <View style={{ alignItems: 'center', marginVertical: 6 }}>
            <Text style={[font('800'), { fontSize: 22, color: colors.navy700 }]}>الخدمات المجانية</Text>
            <Text style={[font('400'), { fontSize: 12, color: colors.slate, marginTop: 3, textAlign: 'center' }]}>
              تصفّح حسب الفئة أو اختر المختص المناسب لك
            </Text>
          </View>

          {/* الفئات / مقدمو الخدمة toggle */}
          <View style={{ flexDirection: 'row-reverse', backgroundColor: colors.paper2, borderRadius: 12, padding: 4, marginTop: 8, marginBottom: 4 }}>
            <SegTab label="الخدمات والفئات" icon="grid" active={mode === 'categories'} onPress={() => setMode('categories')} />
            <SegTab label="مقدمو الخدمة" icon="users" active={mode === 'providers'} onPress={() => setMode('providers')} />
          </View>
        </>
      )}

      {/* Providers directory (root only) */}
      {showProviders &&
        providers.map((p) => {
          const cats = providerCategories(p.id);
          return (
            <Pressable key={p.id} onPress={() => nav.navigate('ProviderDetail', { providerId: p.id })}>
              <Card style={[row, { gap: 12, marginTop: 12, alignItems: 'flex-start' }]}>
                <LinearGradient colors={p.gradient} style={{ width: 60, height: 74, borderRadius: 13 }} />
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  <Text style={[font('800'), { fontSize: 14.5, color: colors.navy700 }]}>{p.name}</Text>
                  <Text style={[font('400'), { fontSize: 11.5, color: colors.slate, marginTop: 1 }]}>{p.specialization}</Text>
                  <View style={[row, { gap: 8, marginTop: 5 }]}>
                    <Text style={[font('700'), { fontSize: 11, color: colors.gold }]}>★ {p.rating}</Text>
                    <Text style={[font('400'), { fontSize: 10.5, color: colors.muted }]}>{p.yearsExperience} سنة خبرة</Text>
                  </View>
                  {cats.length > 0 && (
                    <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 5, marginTop: 7 }}>
                      {cats.map((c) => (
                        <View key={c} style={{ backgroundColor: colors.paper2, borderRadius: 100, paddingVertical: 3, paddingHorizontal: 9 }}>
                          <Text style={[font('600'), { fontSize: 10, color: colors.navy700 }]}>{c}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
                <Icon name="chevron-left" size={18} color={colors.muted} />
              </Card>
            </Pressable>
          );
        })}

      {/* Nested categories */}
      {!showProviders &&
        categories.map((c) => (
          <Pressable key={c.id} onPress={() => openCategory(c.id)}>
            <Card style={[row, { gap: 12, marginTop: 12 }]}>
              <View style={{ width: 46, height: 46, borderRadius: 13, backgroundColor: colors.paper2, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={c.icon as IconName} size={22} color={colors.navy700} />
              </View>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={[font('800'), { fontSize: 15, color: colors.navy700 }]}>{c.name}</Text>
                {c.description ? (
                  <Text style={[font('400'), { fontSize: 11, color: colors.slate, marginTop: 2, textAlign: 'right' }]}>{c.description}</Text>
                ) : null}
              </View>
              {/* chevron points left in RTL lists */}
              <Icon name="chevron-left" size={20} color={colors.muted} />
            </Card>
          </Pressable>
        ))}

      {/* Services at a leaf subcategory */}
      {!showProviders &&
        svcs.map((s) => {
          const p = providerById(s.providerId);
          return (
            <Pressable key={s.id} onPress={() => nav.navigate('ServiceDetail', { serviceId: s.id })}>
              <Card style={[row, { gap: 12, marginTop: 12, alignItems: 'flex-start' }]}>
                {p ? <LinearGradient colors={p.gradient} style={{ width: 56, height: 56, borderRadius: 13 }} /> : null}
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  <View style={[row, { gap: 6 }]}>
                    <Text style={[font('800'), { fontSize: 14, color: colors.navy700 }]}>{s.name}</Text>
                    {s.free ? <Pill label="مجاناً" tone="green" /> : null}
                  </View>
                  <Text style={[font('400'), { fontSize: 11, color: colors.slate, marginTop: 3, textAlign: 'right', lineHeight: 16 }]}>
                    {s.description}
                  </Text>
                  {p ? (
                    <View style={[row, { gap: 6, marginTop: 6 }]}>
                      <Icon name="user" size={13} color={colors.navy500} />
                      <Text style={[font('600'), { fontSize: 11, color: colors.navy500 }]}>{p.name}</Text>
                      <Text style={[font('600'), { fontSize: 11, color: colors.gold }]}>★ {p.rating}</Text>
                    </View>
                  ) : null}
                </View>
              </Card>
            </Pressable>
          );
        })}

      <View style={{ height: 16 }} />
    </Screen>
  );
}

function SegTab({ label, icon, active, onPress }: { label: string; icon: IconName; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{ flex: 1, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: 9, backgroundColor: active ? colors.navy700 : 'transparent' }}
    >
      <Icon name={icon} size={15} color={active ? '#fff' : colors.slate} />
      <Text style={[font('700'), { fontSize: 12.5, color: active ? '#fff' : colors.slate }]}>{label}</Text>
    </Pressable>
  );
}
