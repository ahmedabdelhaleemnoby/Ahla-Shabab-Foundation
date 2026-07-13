import {
  CMS_SCHEMA_VERSION,
  type CmsState,
  type MenuGroup,
  type HomeSection,
  type CmsPage,
  type CmsSettings,
  type MediaItem,
  type NavTarget,
} from './cmsTypes';
import { appConfig } from '../data';

/** Fixed seed timestamp so defaults are deterministic across reloads. */
const SEED_AT = '2026-07-13T09:00:00.000Z';

/* ---------------- Settings (seeded from appConfig) ---------------- */
export const defaultSettings: CmsSettings = {
  appName: 'خواطر أحلى شباب',
  heroTitle: appConfig.heroTitle,
  heroSubtitle: appConfig.heroSubtitle,
  splashText: 'معاً نصنع أثراً يدوم',
  primaryColor: '#18489F',
  secondaryColor: '#E9AF31',
  hotline: appConfig.hotline,
  email: appConfig.email,
  address: appConfig.address,
  workingHours: appConfig.workingHours,
  website: appConfig.website,
  socials: { ...appConfig.socials },
  zakatNisabEgp: appConfig.zakatNisabEgp,
  donationReassurance:
    'لن يُعتمد تبرعك إلا بعد تأكيد العملية من بوابة الدفع أو مراجعة الإدارة. هذه نسخة عرض — لا يتم تنفيذ أي عملية دفع حقيقية.',
  demoLabel: 'نسخة عرض — يتم حفظ التعديلات على هذا الجهاز فقط',
};

/* ---------------- Sidebar menu (mirrors mobile AppDrawer) ---------------- */
const tab = (t: 'Home' | 'Discover' | 'Donate' | 'News' | 'Profile'): NavTarget => ({ kind: 'tab', tab: t });
const route = (r: string): NavTarget => ({ kind: 'route', route: r });

export const defaultMenu: MenuGroup[] = [
  {
    id: 'grp-main',
    visible: true,
    sortOrder: 0,
    items: [
      { id: 'm-home', label: 'الرئيسية', icon: 'home', target: tab('Home'), visible: true, loginRequired: false, sortOrder: 0 },
      { id: 'm-urgent', label: 'حالات عاجلة', icon: 'zap', target: route('UrgentCases'), visible: true, loginRequired: false, sortOrder: 1 },
      { id: 'm-sponsor', label: 'اكفل أسرة', icon: 'users', target: route('Sponsorship'), visible: true, loginRequired: false, sortOrder: 2 },
      { id: 'm-projects', label: 'المشروعات', icon: 'briefcase', target: route('Projects'), visible: true, loginRequired: false, sortOrder: 3 },
      { id: 'm-services', label: 'خدماتنا', icon: 'grid', target: tab('Discover'), visible: true, loginRequired: false, sortOrder: 4 },
      { id: 'm-consult', label: 'الاستشارات', icon: 'message-circle', target: route('Consultations'), visible: true, loginRequired: false, sortOrder: 5 },
      { id: 'm-donate', label: 'طرق التبرع', icon: 'heart', target: tab('Donate'), visible: true, loginRequired: false, sortOrder: 6 },
    ],
  },
  {
    id: 'grp-account',
    title: 'حسابك',
    visible: true,
    sortOrder: 1,
    items: [
      { id: 'm-profile', label: 'حسابي', icon: 'user', target: tab('Profile'), visible: true, loginRequired: false, sortOrder: 0 },
      { id: 'm-donations', label: 'تبرعاتي', icon: 'credit-card', target: route('DonationHistory'), visible: true, loginRequired: true, sortOrder: 1 },
      { id: 'm-receipts', label: 'الإيصالات', icon: 'file-text', target: route('Receipts'), visible: true, loginRequired: true, sortOrder: 2 },
      { id: 'm-bookings', label: 'حجوزاتي', icon: 'calendar', target: route('MyBookings'), visible: true, loginRequired: true, sortOrder: 3 },
      { id: 'm-favorites', label: 'المفضلة', icon: 'star', target: route('Favorites'), visible: true, loginRequired: true, sortOrder: 4 },
      { id: 'm-notifications', label: 'الإشعارات', icon: 'bell', target: route('Notifications'), visible: true, loginRequired: false, sortOrder: 5 },
      { id: 'm-zakat', label: 'حاسبة الزكاة', icon: 'percent', target: route('ZakatCalculator'), visible: true, loginRequired: false, sortOrder: 6 },
    ],
  },
  {
    id: 'grp-org',
    title: 'الجمعية',
    visible: true,
    sortOrder: 2,
    items: [
      { id: 'm-about', label: 'عن الجمعية', icon: 'info', target: route('About'), visible: true, loginRequired: false, sortOrder: 0 },
      { id: 'm-news', label: 'أخبارنا', icon: 'rss', target: tab('News'), visible: true, loginRequired: false, sortOrder: 1 },
      { id: 'm-volunteer', label: 'انضم متطوعاً', icon: 'user-plus', target: route('Volunteer'), visible: true, loginRequired: false, sortOrder: 2 },
      { id: 'm-contact', label: 'تواصل معنا', icon: 'phone', target: route('ContactUs'), visible: true, loginRequired: false, sortOrder: 3 },
      { id: 'm-faq', label: 'الأسئلة الشائعة', icon: 'help-circle', target: route('Faq'), visible: true, loginRequired: false, sortOrder: 4 },
      { id: 'm-privacy', label: 'سياسة الخصوصية', icon: 'shield', target: route('PrivacyPolicy'), visible: true, loginRequired: false, sortOrder: 5 },
    ],
  },
];

/* ---------------- Home layout (mirrors HomeScreen order) ---------------- */
const hs = (
  id: string,
  type: HomeSection['type'],
  sortOrder: number,
  extra: Partial<HomeSection> = {}
): HomeSection => ({
  id,
  type,
  visible: true,
  sortOrder,
  audience: 'all',
  config: {},
  ...extra,
});

export const defaultHome: HomeSection[] = [
  hs('h-hero', 'hero', 0, { title: appConfig.heroTitle, subtitle: appConfig.heroSubtitle, config: { background: 'navy' } }),
  hs('h-impact', 'impactStats', 1, { title: 'أثرنا' }),
  hs('h-areas', 'workAreas', 2, { title: 'مناطق عمل الجمعية' }),
  hs('h-quick', 'quickServices', 3, { title: 'خدمات سريعة', config: { layout: 'twoColumn' } }),
  hs('h-urgent', 'urgentCases', 4, { title: 'حالة إنسانية عاجلة', config: { itemCount: 1 } }),
  hs('h-sponsor', 'sponsorship', 5, { title: 'اكفل أسرة' }),
  hs('h-projects', 'featuredProjects', 6, { title: 'مشروع مميز', config: { itemCount: 1 } }),
  hs('h-news', 'latestNews', 7, { title: 'أحدث الأخبار', config: { itemCount: 2 } }),
  hs('h-consult', 'consultations', 8, { title: 'استشارات أونلاين مجانية', config: { background: 'navy' } }),
];

/* ---------------- Pages registry ---------------- */
const now = SEED_AT;
const page = (
  slug: string,
  title: string,
  navTitle: string,
  icon: string,
  sortOrder: number,
  extra: Partial<CmsPage> = {}
): CmsPage => ({
  id: `pg-${slug}`,
  slug,
  title,
  navTitle,
  icon,
  status: 'published',
  visible: true,
  inSidebar: true,
  loginRequired: false,
  template: 'native',
  builtin: true,
  sections: [],
  sortOrder,
  createdAt: now,
  updatedAt: now,
  ...extra,
});

export const defaultPages: CmsPage[] = [
  page('Home', 'الرئيسية', 'الرئيسية', 'home', 0, { description: 'الشاشة الرئيسية للتطبيق' }),
  page('About', 'عن الجمعية', 'عن الجمعية', 'info', 1),
  page('News', 'أخبارنا وأنشطتنا', 'أخبارنا', 'rss', 2),
  page('Discover', 'خدماتنا', 'خدماتنا', 'grid', 3),
  page('UrgentCases', 'حالات عاجلة', 'حالات عاجلة', 'zap', 4),
  page('Sponsorship', 'اكفل أسرة', 'اكفل أسرة', 'users', 5),
  page('Projects', 'المشروعات', 'المشروعات', 'briefcase', 6),
  page('Consultations', 'الاستشارات الأونلاين', 'الاستشارات', 'message-circle', 7),
  page('Donate', 'طرق التبرع', 'التبرع', 'heart', 8),
  page('DonationHistory', 'تبرعاتي', 'تبرعاتي', 'credit-card', 9, { loginRequired: true }),
  page('Receipts', 'إيصالاتي', 'الإيصالات', 'file-text', 10, { loginRequired: true }),
  page('MyBookings', 'حجوزاتي', 'حجوزاتي', 'calendar', 11, { loginRequired: true }),
  page('Notifications', 'الإشعارات', 'الإشعارات', 'bell', 12),
  page('Favorites', 'المفضلة', 'المفضلة', 'star', 13, { loginRequired: true }),
  page('Faq', 'الأسئلة الشائعة', 'الأسئلة الشائعة', 'help-circle', 14),
  page('ZakatCalculator', 'حاسبة الزكاة', 'الزكاة', 'percent', 15),
  page('Volunteer', 'التطوع', 'انضم متطوعاً', 'user-plus', 16),
  page('ContactUs', 'تواصل معنا', 'تواصل معنا', 'phone', 17),
  page('PrivacyPolicy', 'سياسة الخصوصية', 'سياسة الخصوصية', 'shield', 18),
];

/* ---------------- Media library (branded placeholders) ---------------- */
/** Tiny inline SVG placeholder so the library is never empty. */
function svgPlaceholder(label: string, from: string, to: string): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="360" viewBox="0 0 600 360">` +
    `<defs><linearGradient id="g" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>` +
    `<rect width="600" height="360" fill="url(#g)"/>` +
    `<text x="300" y="190" font-family="Cairo,Arial" font-size="30" font-weight="800" fill="#ffffff" text-anchor="middle">${label}</text>` +
    `</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const defaultMedia: MediaItem[] = [
  { id: 'md-brand-navy', title: 'بانر أزرق', alt: 'خلفية بالهوية الزرقاء', folder: 'بانرات', src: svgPlaceholder('خواطر أحلى شباب', '#123877', '#0D2B66'), type: 'svg', width: 600, height: 360, sizeBytes: 620, createdAt: SEED_AT, updatedAt: SEED_AT },
  { id: 'md-brand-gold', title: 'بانر ذهبي', alt: 'خلفية باللون الذهبي', folder: 'بانرات', src: svgPlaceholder('معاً نصنع أثراً', '#E9AF31', '#B9791A'), type: 'svg', width: 600, height: 360, sizeBytes: 610, createdAt: SEED_AT, updatedAt: SEED_AT },
  { id: 'md-case', title: 'صورة حالة (نموذج)', alt: 'صورة عامة لحالة', folder: 'حالات', src: svgPlaceholder('حالة إنسانية', '#8296b5', '#4d6386'), type: 'svg', width: 600, height: 360, sizeBytes: 600, createdAt: SEED_AT, updatedAt: SEED_AT },
  { id: 'md-project', title: 'صورة مشروع (نموذج)', alt: 'صورة عامة لمشروع', folder: 'مشروعات', src: svgPlaceholder('مشروع خيري', '#8fb4dd', '#5f86b5'), type: 'svg', width: 600, height: 360, sizeBytes: 600, createdAt: SEED_AT, updatedAt: SEED_AT },
  { id: 'md-news', title: 'صورة خبر (نموذج)', alt: 'صورة عامة لخبر', folder: 'أخبار', src: svgPlaceholder('خبر ونشاط', '#8f9f7d', '#5f6d50'), type: 'svg', width: 600, height: 360, sizeBytes: 600, createdAt: SEED_AT, updatedAt: SEED_AT },
];

/* ---------------- Root default ---------------- */
export function makeDefaultCmsState(): CmsState {
  return {
    version: CMS_SCHEMA_VERSION,
    settings: { ...defaultSettings, socials: { ...defaultSettings.socials } },
    menu: defaultMenu.map((g) => ({ ...g, items: g.items.map((i) => ({ ...i })) })),
    home: defaultHome.map((s) => ({ ...s, config: { ...s.config } })),
    pages: defaultPages.map((p) => ({ ...p })),
    media: defaultMedia.map((m) => ({ ...m })),
    activity: [],
    updatedAt: SEED_AT,
  };
}
