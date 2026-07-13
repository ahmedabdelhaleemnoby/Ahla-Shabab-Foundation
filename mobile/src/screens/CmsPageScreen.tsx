import React from 'react';
import { View, Text, Image, Pressable, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { appConfig, type PageSection, type ContentBlock, type NavTarget } from '@ahla/shared';
import { Screen } from '../components/Screen';
import { AppBar } from '../components/AppBar';
import { Card, Button, EmptyState } from '../components/ui';
import { Icon } from '../components/Icon';
import { colors, font, num, row } from '../theme';
import { getCmsPageBySlug, getMediaSrc } from '../store/cms';
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
  const blocks = [...(page.content ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
  const isEmpty = sections.length === 0 && blocks.length === 0;

  return (
    <Screen header={<AppBar title={page.navTitle || page.title} onBack={() => nav.goBack()} onBell={undefined} />}>
      {isEmpty ? (
        <EmptyState icon="layout" title={page.title} hint={page.emptyStateText ?? 'لا يوجد محتوى بعد'} />
      ) : (
        <>
          {blocks.map((b) => <BlockView key={b.id} block={b} onCta={(t) => handleCta(nav, t)} />)}
          {sections.map((s) => <SectionView key={s.id} section={s} onCta={(t) => handleCta(nav, t)} />)}
        </>
      )}
      <View style={{ height: 12 }} />
    </Screen>
  );
}

function handleCta(nav: any, target?: NavTarget) {
  if (!target) return;
  if (target.kind === 'tab') nav.navigate('Main', { screen: target.tab });
  else if (target.kind === 'route') nav.navigate(target.route);
  else if (target.kind === 'cmsPage') nav.navigate('CmsPage', { slug: target.slug });
  else if (target.kind === 'external') Linking.openURL(target.url).catch(() => {});
}

/* ---------------- Rich content block renderer ---------------- */
const HL_TONE: Record<string, { bg: string; fg: string }> = {
  green: { bg: colors.greenSoft, fg: colors.greenDark },
  navy: { bg: '#EAF0F8', fg: colors.navy700 },
  gold: { bg: colors.goldSoft, fg: '#8A5B10' },
  danger: { bg: colors.redSoft, fg: colors.red },
};

function contactUrl(kind: string, value: string): string {
  if (kind === 'phone') return `tel:${value}`;
  if (kind === 'email') return `mailto:${value}`;
  if (kind === 'whatsapp') return `https://wa.me/${value.replace(/[^0-9]/g, '')}`;
  return value.startsWith('http') ? value : `https://${value}`;
}

function BlockView({ block: b, onCta }: { block: ContentBlock; onCta: (t?: NavTarget) => void }) {
  switch (b.type) {
    case 'heading': {
      const size = b.level === 1 ? 20 : b.level === 3 ? 14 : 16.5;
      return <Text style={[font('800'), { fontSize: size, color: colors.navy700, textAlign: 'right', marginTop: 6, marginBottom: 6 }]}>{b.text}</Text>;
    }
    case 'paragraph':
      return <Text style={[font('400'), { fontSize: 13, color: colors.slate, textAlign: 'right', lineHeight: 21, marginBottom: 10 }]}>{b.text}</Text>;
    case 'quote':
      return (
        <View style={{ borderRightWidth: 3, borderRightColor: colors.navy500, paddingRight: 12, marginVertical: 8 }}>
          <Text style={[font('600'), { fontSize: 13, color: colors.navy700, textAlign: 'right', lineHeight: 20, fontStyle: 'italic' }]}>“{b.text}”</Text>
          {b.author ? <Text style={[font('700'), { fontSize: 10.5, color: colors.muted, textAlign: 'right', marginTop: 4 }]}>— {b.author}</Text> : null}
        </View>
      );
    case 'highlight': {
      const t = HL_TONE[b.tone ?? 'green'];
      return (
        <View style={[row, { gap: 9, backgroundColor: t.bg, borderRadius: 14, padding: 12, marginVertical: 8 }]}>
          <Icon name="info" size={16} color={t.fg} />
          <Text style={[font('700'), { flex: 1, fontSize: 11.5, color: t.fg, textAlign: 'right', lineHeight: 18 }]}>{b.text}</Text>
        </View>
      );
    }
    case 'bulletList':
    case 'orderedList':
      return (
        <View style={{ marginVertical: 6, gap: 6 }}>
          {(b.items ?? []).map((it, i) => (
            <View key={i} style={[row, { gap: 8, alignItems: 'flex-start' }]}>
              <Text style={[font('700'), num, { fontSize: 12, color: colors.navy500, marginTop: 1 }]}>{b.type === 'orderedList' ? `${i + 1}.` : '•'}</Text>
              <Text style={[font('400'), { flex: 1, fontSize: 12.5, color: colors.slate, textAlign: 'right', lineHeight: 19 }]}>{it}</Text>
            </View>
          ))}
        </View>
      );
    case 'image': {
      const src = getMediaSrc(b.mediaId);
      return (
        <View style={{ marginVertical: 8 }}>
          {src ? <Image source={{ uri: src }} style={{ width: '100%', height: 170, borderRadius: 16 }} resizeMode="cover" /> : <View style={{ height: 150, borderRadius: 16, backgroundColor: colors.paper2, alignItems: 'center', justifyContent: 'center' }}><Icon name="image" size={28} color={colors.muted} /></View>}
          {b.caption ? <Text style={[font('400'), { fontSize: 10, color: colors.muted, textAlign: 'center', marginTop: 5 }]}>{b.caption}</Text> : null}
        </View>
      );
    }
    case 'cta':
      return <Button label={b.ctaLabel ?? 'اضغط هنا'} style={{ marginVertical: 8 }} onPress={() => onCta(b.ctaTarget)} />;
    case 'contact':
      return (
        <Pressable
          onPress={() => Linking.openURL(contactUrl(b.contactKind ?? 'website', b.contactValue ?? appConfig.website)).catch(() => {})}
          style={[row, { gap: 10, borderWidth: 1, borderColor: colors.line, borderRadius: 14, padding: 12, marginVertical: 8, backgroundColor: '#fff' }]}
        >
          <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: colors.paper2, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={b.contactKind === 'email' ? 'mail' : b.contactKind === 'phone' ? 'phone' : 'external-link'} size={17} color={colors.navy700} />
          </View>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text style={[font('800'), { fontSize: 12.5, color: colors.navy700 }]}>{b.contactLabel ?? 'تواصل'}</Text>
            <Text style={[font('600'), num, { fontSize: 11, color: colors.slate }]}>{b.contactValue}</Text>
          </View>
          <Icon name="chevron-left" size={16} color={colors.muted} />
        </Pressable>
      );
    case 'divider':
      return <View style={{ height: 1, backgroundColor: colors.line2, marginVertical: 10 }} />;
    default:
      return null;
  }
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
    case 'image': {
      const src = getMediaSrc(c.imageId);
      if (src) return <Image source={{ uri: src }} style={{ width: '100%', height: 160, borderRadius: 16, marginBottom: 12 }} resizeMode="cover" />;
      return <View style={{ height: 140, borderRadius: 16, backgroundColor: colors.paper2, marginBottom: 12, alignItems: 'center', justifyContent: 'center' }}><Icon name="image" size={30} color={colors.muted} /></View>;
    }
    default:
      return null;
  }
}
