import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, Modal, Animated, ScrollView, Image, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { appConfig } from '@ahla/shared';
import { colors, font } from '../theme';
import { Icon, IconName } from './Icon';
import { navRef } from '../navigation/ref';
import { useDrawerOpen, closeDrawer } from '../store/drawer';
import { useAppState, appState } from '../store/appState';
import type { RootStackParamList, TabParamList } from '../navigation/types';

const DRAWER_W = 296;

type Target =
  | { tab: keyof TabParamList }
  | { route: keyof RootStackParamList; params?: RootStackParamList[keyof RootStackParamList] };

interface Item {
  icon: IconName;
  label: string;
  target: Target;
}

/* Sidebar menu (§11) — the full drawer from the review document. */
const SECTIONS: { title?: string; items: Item[] }[] = [
  {
    items: [
      { icon: 'home', label: 'الرئيسية', target: { tab: 'Home' } },
      { icon: 'zap', label: 'حالات عاجلة', target: { route: 'UrgentCases' } },
      { icon: 'users', label: 'اكفل أسرة', target: { route: 'Sponsorship' } },
      { icon: 'briefcase', label: 'المشروعات', target: { route: 'Projects' } },
      { icon: 'grid', label: 'خدماتنا', target: { tab: 'Discover' } },
      { icon: 'message-circle', label: 'الاستشارات', target: { route: 'Consultations' } },
      { icon: 'heart', label: 'طرق التبرع', target: { tab: 'Donate' } },
    ],
  },
  {
    title: 'حسابك',
    items: [
      { icon: 'user', label: 'حسابي', target: { tab: 'Profile' } },
      { icon: 'credit-card', label: 'تبرعاتي', target: { route: 'DonationHistory' } },
      { icon: 'file-text', label: 'الإيصالات', target: { route: 'Receipts' } },
      { icon: 'calendar', label: 'حجوزاتي', target: { route: 'MyBookings' } },
      { icon: 'star', label: 'المفضلة', target: { route: 'Favorites' } },
      { icon: 'bell', label: 'الإشعارات', target: { route: 'Notifications' } },
      { icon: 'percent', label: 'حاسبة الزكاة', target: { route: 'ZakatCalculator' } },
    ],
  },
  {
    title: 'الجمعية',
    items: [
      { icon: 'info', label: 'عن الجمعية', target: { route: 'About' } },
      { icon: 'rss', label: 'أخبارنا', target: { tab: 'News' } },
      { icon: 'user-plus', label: 'انضم متطوعاً', target: { route: 'Volunteer' } },
      { icon: 'phone', label: 'تواصل معنا', target: { route: 'ContactUs' } },
      { icon: 'help-circle', label: 'الأسئلة الشائعة', target: { route: 'Faq' } },
      { icon: 'shield', label: 'سياسة الخصوصية', target: { route: 'PrivacyPolicy' } },
    ],
  },
];

function go(target: Target) {
  closeDrawer();
  if (!navRef.isReady()) return;
  if ('tab' in target) navRef.navigate('Main', { screen: target.tab });
  else (navRef.navigate as (name: string, params?: object) => void)(target.route, target.params as object | undefined);
}

export function AppDrawer() {
  const open = useDrawerOpen();
  const { loggedIn, phone } = useAppState();
  const insets = useSafeAreaInsets();
  const slide = useRef(new Animated.Value(0)).current;

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
                {loggedIn && phone ? `مرحباً · ${phone}` : 'زائر — سجّل دخولك'}
              </Text>
            </View>
            <Pressable onPress={closeDrawer} style={styles.closeBtn} accessibilityLabel="إغلاق">
              <Icon name="x" size={18} color={colors.slate} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
            {SECTIONS.map((section, si) => (
              <View key={section.title ?? 'main'} style={si > 0 ? styles.section : undefined}>
                {section.title ? (
                  <Text style={[font('700'), styles.sectionTitle]}>{section.title}</Text>
                ) : null}
                {section.items.map((item) => (
                  <Pressable
                    key={item.label}
                    onPress={() => go(item.target)}
                    style={({ pressed }) => [styles.item, pressed && { backgroundColor: colors.paper2 }]}
                  >
                    {/* row-reverse: icon chip sits right, chevron points toward content (left) */}
                    <View style={styles.itemIcon}>
                      <Icon name={item.icon} size={17} color={colors.navy700} />
                    </View>
                    <Text style={[font('700'), styles.itemLabel]}>{item.label}</Text>
                    <Icon name="chevron-left" size={15} color={colors.muted} />
                  </Pressable>
                ))}
              </View>
            ))}
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
              <Pressable onPress={() => go({ route: 'PhoneAuth' })} style={[styles.authBtn, { backgroundColor: colors.navy700 }]}>
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
