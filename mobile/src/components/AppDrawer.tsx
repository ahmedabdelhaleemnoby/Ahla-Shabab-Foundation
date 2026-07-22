import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, Modal, Animated, ScrollView, Image, StyleSheet, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { appConfig, makeDefaultCmsState, type NavTarget, type MenuGroup } from '@ahla/shared';
import { colors, font } from '../theme';
import { Icon, IconName } from './Icon';
import { navRef } from '../navigation/ref';
import { useDrawerOpen, closeDrawer } from '../store/drawer';
import { useAppState, appState } from '../store/appState';
import { getMenu } from '../store/cms';

const DRAWER_W = 296;

/** Navigate a CMS menu target. Unknown/invalid targets are ignored safely. */
function go(target: NavTarget) {
  closeDrawer();
  if (target.kind === 'external') {
    Linking.openURL(target.url).catch(() => {});
    return;
  }
  if (!navRef.isReady()) return;
  const nav = navRef.navigate as (name: string, params?: object) => void;
  if (target.kind === 'tab') nav('Main', { screen: target.tab });
  else if (target.kind === 'route') nav(target.route);
  else if (target.kind === 'cmsPage') nav('CmsPage', { slug: target.slug });
}

/** Read visible CMS menu; fall back to the built-in default if it's empty/invalid. */
function useMenu(loggedIn: boolean): MenuGroup[] {
  const menu = getMenu(loggedIn);
  if (menu.length > 0) return menu;
  return makeDefaultCmsState()
    .menu.filter((g) => g.visible)
    .map((g) => ({ ...g, items: g.items.filter((i) => i.visible && (!i.loginRequired || loggedIn)) }));
}

export function AppDrawer() {
  const open = useDrawerOpen();
  const { loggedIn, email } = useAppState();
  const insets = useSafeAreaInsets();
  const slide = useRef(new Animated.Value(0)).current;
  const sections = useMenu(loggedIn);

  useEffect(() => {
    if (open) {
      Animated.timing(slide, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    } else {
      slide.setValue(0);
    }
  }, [open, slide]);

  const translateX = slide.interpolate({ inputRange: [0, 1], outputRange: [DRAWER_W, 0] });

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={closeDrawer} statusBarTranslucent>
      <View style={styles.wrap}>
        <Pressable style={styles.overlay} onPress={closeDrawer} accessibilityLabel="إغلاق القائمة" />
        <Animated.View style={[styles.drawer, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 12, transform: [{ translateX }] }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoWrap}>
              <Image source={require('../../assets/logo.png')} style={{ width: 40, height: 40 }} resizeMode="contain" />
            </View>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <Text style={[font('800'), { fontSize: 14.5, color: colors.navy700 }]}>{appConfig.heroTitle}</Text>
              <Text style={[font('600'), { fontSize: 10.5, color: colors.muted, marginTop: 1 }]}>
                {loggedIn && email ? email : 'زائر — سجّل دخولك'}
              </Text>
            </View>
            <Pressable onPress={closeDrawer} style={styles.closeBtn} accessibilityLabel="إغلاق">
              <Icon name="x" size={18} color={colors.slate} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
            {sections.map((section, si) => (
              <View key={section.id} style={si > 0 ? styles.section : undefined}>
                {section.title ? (
                  <Text style={[font('700'), styles.sectionTitle]}>{section.title}</Text>
                ) : null}
                {section.items.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => go(item.target)}
                    style={({ pressed }) => [styles.item, pressed && { backgroundColor: colors.paper2 }]}
                  >
                    {/* row-reverse: icon chip sits right, chevron points toward content (left) */}
                    <View style={styles.itemIcon}>
                      <Icon name={item.icon as IconName} size={17} color={colors.navy700} />
                    </View>
                    <Text style={[font('700'), styles.itemLabel]}>{item.label}</Text>
                    <Icon name="chevron-left" size={15} color={colors.muted} />
                  </Pressable>
                ))}
              </View>
            ))}

            {/* Provider Portal Quick Link */}
            <Pressable
              onPress={() => go({ kind: 'route', route: 'ConsultantDashboard' })}
              style={({ pressed }) => [styles.item, { marginTop: 10, backgroundColor: colors.goldSoft }, pressed && { opacity: 0.85 }]}
            >
              <View style={[styles.itemIcon, { backgroundColor: '#fff' }]}>
                <Icon name="briefcase" size={17} color="#B9791A" />
              </View>
              <Text style={[font('800'), styles.itemLabel, { color: '#8A5B10' }]}>لوحة مقدم الاستشارة</Text>
              <Icon name="chevron-left" size={15} color="#B9791A" />
            </Pressable>
          </ScrollView>

          {/* Footer: login / logout */}
          <View style={styles.footer}>
            {loggedIn ? (
              <Pressable
                onPress={() => {
                  appState.logout();
                  closeDrawer();
                }}
                style={[styles.authBtn, { backgroundColor: colors.paper2 }]}
              >
                <Text style={[font('800'), { fontSize: 12.5, color: colors.red }]}>تسجيل الخروج</Text>
                <Icon name="log-out" size={16} color={colors.red} />
              </Pressable>
            ) : (
              <Pressable onPress={() => go({ kind: 'route', route: 'EmailAuth' })} style={[styles.authBtn, { backgroundColor: colors.navy700 }]}>
                <Text style={[font('800'), { fontSize: 12.5, color: '#fff' }]}>تسجيل الدخول</Text>
                <Icon name="log-in" size={16} color="#fff" />
              </Pressable>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, flexDirection: 'row-reverse' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(13, 43, 102, 0.45)',
  },
  drawer: {
    width: DRAWER_W,
    height: '100%',
    backgroundColor: colors.paper,
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
    paddingHorizontal: 14,
    shadowColor: '#0D2B66',
    shadowOpacity: 0.25,
    shadowRadius: 24,
    shadowOffset: { width: -6, height: 0 },
    elevation: 16,
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 9,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    marginBottom: 10,
  },
  logoWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  sectionTitle: {
    fontSize: 10.5,
    color: colors.muted,
    textAlign: 'right',
    marginBottom: 4,
    marginHorizontal: 6,
  },
  item: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  itemIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLabel: { flex: 1, fontSize: 13, color: colors.navy700, textAlign: 'right' },
  footer: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 10 },
  authBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 100,
    paddingVertical: 12,
  },
});
