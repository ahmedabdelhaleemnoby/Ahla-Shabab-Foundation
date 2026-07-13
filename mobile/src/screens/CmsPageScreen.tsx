import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { PageSection } from '@ahla/shared';
import { Screen } from '../components/Screen';
import { AppBar } from '../components/AppBar';
import { Card, Button, EmptyState } from '../components/ui';
import { Icon } from '../components/Icon';
import { colors, font, num, row } from '../theme';
import { getCmsPageBySlug } from '../store/cms';
import type { RootProps } from '../navigation/types';

/**
 * Generic renderer for CMS pages created in the dashboard Page Manager.
 * Native/built-in screens have their own components — this only renders
 * "custom" pages composed of CMS sections, so admins can publish new pages
 * without shipping new React Native code.
 */
export default function CmsPageScreen({ route }: RootProps<'CmsPage'>) {
  const nav = useNavigation<any>();
  const page = getCmsPageBySlug(route.params.slug);

  if (!page || page.status !== 'published' || !page.visible) {
    return (
      <Screen header={<AppBar title="صفحة" onBack={() => nav.goBack()} onBell={undefined} />}>
        <EmptyState icon="file" title="الصفحة غير متاحة" hint="قد تكون مخفية أو غير منشورة حالياً." />
        <Button label="رجوع" style={{ marginTop: 12 }} onPress={() => nav.goBack()} />
      </Screen>
    );
  }

  const sections = [...page.sections].filter((s) => s.visible).sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <Screen header={<AppBar title={page.navTitle || page.title} onBack={() => nav.goBack()} onBell={undefined} />}>
      {sections.length === 0 ? (
        <EmptyState icon="layout" title={page.title} hint={page.emptyStateText ?? 'لا يوجد محتوى بعد'} />
      ) : (
        sections.map((s) => <SectionView key={s.id} section={s} onCta={(t) => handleCta(nav, t)} />)
      )}
      <View style={{ height: 12 }} />
    </Screen>
  );
}

function handleCta(nav: any, target?: PageSection['config']['ctaTarget']) {
  if (!target) return;
  if (target.kind === 'tab') nav.navigate('Main', { screen: target.tab });
  else if (target.kind === 'route') nav.navigate(target.route);
  else if (target.kind === 'cmsPage') nav.navigate('CmsPage', { slug: target.slug });
}

function SectionView({ section, onCta }: { section: PageSection; onCta: (t?: PageSection['config']['ctaTarget']) => void }) {
  const c = section.config;
  switch (section.type) {
    case 'hero':
      return (
        <LinearGradient colors={[colors.navy800, colors.navy900]} start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }} style={{ borderRadius: 20, padding: 18, marginBottom: 12 }}>
          <Text style={[font('800'), { color: '#fff', fontSize: 19, textAlign: 'right' }]}>{section.title}</Text>
          {c.body ? <Text style={[font('400'), { color: '#cfe', fontSize: 12, marginTop: 6, textAlign: 'right', lineHeight: 18 }]}>{c.body}</Text> : null}
          {c.ctaText ? <Button label={c.ctaText} variant="green" style={{ marginTop: 12 }} onPress={() => onCta(c.ctaTarget)} /> : null}
        </LinearGradient>
      );
    case 'text':
      return (
        <Card style={{ marginBottom: 12 }}>
          {section.title ? <Text style={[font('800'), { fontSize: 14, color: colors.navy700, textAlign: 'right', marginBottom: 6 }]}>{section.title}</Text> : null}
          <Text style={[font('400'), { fontSize: 12.5, color: colors.slate, textAlign: 'right', lineHeight: 20 }]}>{c.body}</Text>
        </Card>
      );
    case 'stats':
      return (
        <Card style={{ marginBottom: 12 }}>
          {section.title ? <Text style={[font('800'), { fontSize: 14, color: colors.navy700, textAlign: 'right', marginBottom: 10 }]}>{section.title}</Text> : null}
          <View style={[row, { flexWrap: 'wrap' }]}>
            {(c.stats ?? []).map((st, i) => (
              <View key={i} style={{ width: '50%', alignItems: 'center', paddingVertical: 8 }}>
                <Text style={[font('800'), num, { fontSize: 20, color: colors.navy700 }]}>{st.value}</Text>
                <Text style={[font('400'), { fontSize: 10.5, color: colors.slate, marginTop: 2 }]}>{st.label}</Text>
              </View>
            ))}
          </View>
        </Card>
      );
    case 'cardGrid':
    case 'list':
      return (
        <Card style={{ marginBottom: 12 }}>
          {section.title ? <Text style={[font('800'), { fontSize: 14, color: colors.navy700, textAlign: 'right', marginBottom: 8 }]}>{section.title}</Text> : null}
          {(c.items ?? []).map((it) => (
            <View key={it.id} style={[row, { gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.line2 }]}>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={[font('700'), { fontSize: 13, color: colors.navy700 }]}>{it.title}</Text>
                {it.subtitle ? <Text style={[font('400'), { fontSize: 10.5, color: colors.slate, marginTop: 2 }]}>{it.subtitle}</Text> : null}
              </View>
              <Icon name="chevron-left" size={16} color={colors.muted} />
            </View>
          ))}
        </Card>
      );
    case 'faq':
      return (
        <Card style={{ marginBottom: 12 }}>
          {section.title ? <Text style={[font('800'), { fontSize: 14, color: colors.navy700, textAlign: 'right', marginBottom: 8 }]}>{section.title}</Text> : null}
          {(c.faqs ?? []).map((f, i) => (
            <View key={i} style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.line2 }}>
              <Text style={[font('800'), { fontSize: 12.5, color: colors.navy700, textAlign: 'right' }]}>{f.q}</Text>
              <Text style={[font('400'), { fontSize: 11.5, color: colors.slate, textAlign: 'right', marginTop: 3, lineHeight: 17 }]}>{f.a}</Text>
            </View>
          ))}
        </Card>
      );
    case 'cta':
      return (
        <Card style={[row, { gap: 11, marginBottom: 12, backgroundColor: '#EAF0F8' }]}>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text style={[font('800'), { fontSize: 13, color: colors.navy700 }]}>{section.title}</Text>
            {c.body ? <Text style={[font('400'), { fontSize: 10.5, color: colors.slate, marginTop: 2, textAlign: 'right' }]}>{c.body}</Text> : null}
          </View>
          {c.ctaText ? <Button label={c.ctaText} small onPress={() => onCta(c.ctaTarget)} /> : null}
        </Card>
      );
    case 'image':
      return <View style={{ height: 140, borderRadius: 16, backgroundColor: colors.paper2, marginBottom: 12, alignItems: 'center', justifyContent: 'center' }}><Icon name="image" size={30} color={colors.muted} /></View>;
    default:
      return null;
  }
}
