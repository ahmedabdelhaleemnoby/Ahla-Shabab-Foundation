/**
 * Admin / management mock data (Technical Offer §5).
 * Feeds the dashboard modules: Bookings, Users, Roles & Permissions, Reports.
 */
import type { ServiceBookingStatus } from './services';

export interface AdminBooking {
  reference: string;
  serviceId: string;
  serviceName: string;
  categoryName: string;
  providerId: string;
  providerName: string;
  applicantName: string;
  phone: string;
  age: number;
  gender: 'ذكر' | 'أنثى';
  governorate: string;
  city?: string;
  notes?: string;
  date: string; // ISO
  time: string;
  status: ServiceBookingStatus;
  createdAt: string; // ISO
}

export const bookingStatuses: ServiceBookingStatus[] = [
  'قيد الانتظار',
  'مؤكد',
  'مكتمل',
  'ملغي',
  'لم يحضر',
];

export const adminBookings: AdminBooking[] = [
  { reference: 'AS-482910', serviceId: 'sv-gen', serviceName: 'كشف باطنة عام', categoryName: 'العيادات الطبية', providerId: 'pr-tarek', providerName: 'د. طارق عبد الحميد', applicantName: 'محمود سعيد علي', phone: '01012345678', age: 42, gender: 'ذكر', governorate: 'القاهرة', city: 'المعادي', notes: 'ألم مزمن بالمعدة', date: '2025-05-22', time: '11:00 ص', status: 'مؤكد', createdAt: '2025-05-18' },
  { reference: 'AS-482911', serviceId: 'sv-psych', serviceName: 'جلسة استشارة نفسية', categoryName: 'الاستشارات والإرشاد', providerId: 'pr-arabi', providerName: 'د. محمد العربي', applicantName: 'فاطمة الزهراء محمد', phone: '01123456789', age: 29, gender: 'أنثى', governorate: 'الجيزة', notes: 'قلق واضطراب نوم', date: '2025-05-22', time: '1:00 م', status: 'قيد الانتظار', createdAt: '2025-05-19' },
  { reference: 'AS-482912', serviceId: 'sv-family', serviceName: 'استشارة أسرية', categoryName: 'الاستشارات والإرشاد', providerId: 'pr-khaled', providerName: 'د. خالد إبراهيم', applicantName: 'إسلام نبيل حسن', phone: '01234567890', age: 35, gender: 'ذكر', governorate: 'الإسكندرية', city: 'سموحة', date: '2025-05-23', time: '12:00 م', status: 'مؤكد', createdAt: '2025-05-19' },
  { reference: 'AS-482913', serviceId: 'sv-ped', serviceName: 'كشف أطفال', categoryName: 'العيادات الطبية', providerId: 'pr-hana', providerName: 'د. هناء مصطفى', applicantName: 'دعاء رمضان السيد', phone: '01098765432', age: 3, gender: 'أنثى', governorate: 'الدقهلية', city: 'المنصورة', notes: 'متابعة تطعيمات', date: '2025-05-21', time: '10:00 ص', status: 'مكتمل', createdAt: '2025-05-15' },
  { reference: 'AS-482914', serviceId: 'sv-quran', serviceName: 'حلقة تحفيظ قرآن', categoryName: 'الدعم التعليمي', providerId: 'pr-sheikh', providerName: 'الشيخ عبد الرحمن', applicantName: 'يوسف كامل إبراهيم', phone: '01187654321', age: 12, gender: 'ذكر', governorate: 'الشرقية', date: '2025-05-24', time: '5:00 م', status: 'مؤكد', createdAt: '2025-05-20' },
  { reference: 'AS-482915', serviceId: 'sv-dent', serviceName: 'كشف وعلاج أسنان', categoryName: 'العيادات الطبية', providerId: 'pr-samy', providerName: 'د. سامي فؤاد', applicantName: 'طارق فؤاد عبد الله', phone: '01011223344', age: 50, gender: 'ذكر', governorate: 'القاهرة', notes: 'خلع ضرس', date: '2025-05-24', time: '12:00 م', status: 'ملغي', createdAt: '2025-05-17' },
  { reference: 'AS-482916', serviceId: 'sv-assess', serviceName: 'دراسة حالة اجتماعية', categoryName: 'الخدمات الاجتماعية', providerId: 'pr-baheya', providerName: 'أ. بهية سعيد', applicantName: 'سعاد عبد الفتاح', phone: '01555667788', age: 45, gender: 'أنثى', governorate: 'المنيا', city: 'ملوي', notes: 'أسرة بلا معيل', date: '2025-05-20', time: '9:00 ص', status: 'مكتمل', createdAt: '2025-05-12' },
  { reference: 'AS-482917', serviceId: 'sv-tutor', serviceName: 'حصة دروس تقوية', categoryName: 'الدعم التعليمي', providerId: 'pr-ola', providerName: 'أ. علا حسن', applicantName: 'مريم أحمد سالم', phone: '01099887766', age: 15, gender: 'أنثى', governorate: 'الغربية', city: 'طنطا', date: '2025-05-25', time: '4:00 م', status: 'قيد الانتظار', createdAt: '2025-05-20' },
  { reference: 'AS-482918', serviceId: 'sv-career', serviceName: 'جلسة إرشاد مهني', categoryName: 'الاستشارات والإرشاد', providerId: 'pr-mona', providerName: 'أ. منى عبد الله', applicantName: 'عمر حسن فتحي', phone: '01033445566', age: 23, gender: 'ذكر', governorate: 'القليوبية', city: 'بنها', notes: 'مساعدة في السيرة الذاتية', date: '2025-05-19', time: '11:00 ص', status: 'لم يحضر', createdAt: '2025-05-14' },
  { reference: 'AS-482919', serviceId: 'sv-psych2', serviceName: 'جلسة دعم نفسي (سيدات)', categoryName: 'الاستشارات والإرشاد', providerId: 'pr-sara', providerName: 'أ. سارة محمود', applicantName: 'نورهان أشرف كمال', phone: '01566778899', age: 31, gender: 'أنثى', governorate: 'الإسكندرية', date: '2025-05-26', time: '12:00 م', status: 'مؤكد', createdAt: '2025-05-21' },
  { reference: 'AS-482920', serviceId: 'sv-food', serviceName: 'تسجيل مساعدات غذائية', categoryName: 'الخدمات الاجتماعية', providerId: 'pr-baheya', providerName: 'أ. بهية سعيد', applicantName: 'حسن علي محمود', phone: '01277889900', age: 60, gender: 'ذكر', governorate: 'أسيوط', notes: 'أسرة 6 أفراد', date: '2025-05-27', time: '10:00 ص', status: 'قيد الانتظار', createdAt: '2025-05-22' },
  { reference: 'AS-482921', serviceId: 'sv-gen', serviceName: 'كشف باطنة عام', categoryName: 'العيادات الطبية', providerId: 'pr-tarek', providerName: 'د. طارق عبد الحميد', applicantName: 'سميرة فتحي عبد ربه', phone: '01144556677', age: 55, gender: 'أنثى', governorate: 'الجيزة', city: 'إمبابة', date: '2025-05-21', time: '12:00 م', status: 'مكتمل', createdAt: '2025-05-16' },
];

export interface AdminUser {
  id: string;
  name: string;
  phone: string;
  governorate: string;
  bookings: number;
  lastBooking: string; // ISO
  registered: boolean; // false = guest
  blocked: boolean;
}

export const adminUsers: AdminUser[] = [
  { id: 'u-1', name: 'محمود سعيد علي', phone: '01012345678', governorate: 'القاهرة', bookings: 5, lastBooking: '2025-05-22', registered: true, blocked: false },
  { id: 'u-2', name: 'فاطمة الزهراء محمد', phone: '01123456789', governorate: 'الجيزة', bookings: 3, lastBooking: '2025-05-22', registered: true, blocked: false },
  { id: 'u-3', name: 'إسلام نبيل حسن', phone: '01234567890', governorate: 'الإسكندرية', bookings: 2, lastBooking: '2025-05-23', registered: false, blocked: false },
  { id: 'u-4', name: 'دعاء رمضان السيد', phone: '01098765432', governorate: 'الدقهلية', bookings: 4, lastBooking: '2025-05-21', registered: true, blocked: false },
  { id: 'u-5', name: 'يوسف كامل إبراهيم', phone: '01187654321', governorate: 'الشرقية', bookings: 1, lastBooking: '2025-05-24', registered: false, blocked: false },
  { id: 'u-6', name: 'طارق فؤاد عبد الله', phone: '01011223344', governorate: 'القاهرة', bookings: 6, lastBooking: '2025-05-24', registered: true, blocked: true },
  { id: 'u-7', name: 'سعاد عبد الفتاح', phone: '01555667788', governorate: 'المنيا', bookings: 2, lastBooking: '2025-05-20', registered: true, blocked: false },
  { id: 'u-8', name: 'مريم أحمد سالم', phone: '01099887766', governorate: 'الغربية', bookings: 3, lastBooking: '2025-05-25', registered: true, blocked: false },
  { id: 'u-9', name: 'عمر حسن فتحي', phone: '01033445566', governorate: 'القليوبية', bookings: 1, lastBooking: '2025-05-19', registered: false, blocked: false },
];

export type AdminRoleName = 'مدير عام' | 'مدير محتوى' | 'مدير حجوزات' | 'اطّلاع فقط';

export interface AdminRole {
  name: AdminRoleName;
  description: string;
  members: number;
  /** permission-key → allowed */
  permissions: Record<string, boolean>;
}

export const permissionModules: { key: string; label: string }[] = [
  { key: 'portfolio', label: 'إدارة المحتوى' },
  { key: 'services', label: 'الخدمات والفئات' },
  { key: 'providers', label: 'مقدمو الخدمة' },
  { key: 'bookings', label: 'الحجوزات' },
  { key: 'users', label: 'المستخدمون' },
  { key: 'reports', label: 'التقارير' },
  { key: 'roles', label: 'الأدوار والصلاحيات' },
];

const allowAll = () => Object.fromEntries(permissionModules.map((m) => [m.key, true]));

export const adminRoles: AdminRole[] = [
  { name: 'مدير عام', description: 'صلاحية كاملة على جميع الوحدات', members: 2, permissions: allowAll() },
  {
    name: 'مدير محتوى',
    description: 'إدارة محتوى المعرض والخدمات فقط',
    members: 3,
    permissions: { portfolio: true, services: true, providers: true, bookings: false, users: false, reports: true, roles: false },
  },
  {
    name: 'مدير حجوزات',
    description: 'متابعة وإدارة الحجوزات والمستخدمين',
    members: 4,
    permissions: { portfolio: false, services: false, providers: true, bookings: true, users: true, reports: true, roles: false },
  },
  {
    name: 'اطّلاع فقط',
    description: 'عرض البيانات دون تعديل',
    members: 2,
    permissions: { portfolio: false, services: false, providers: false, bookings: false, users: false, reports: true, roles: false },
  },
];

export interface ActivityEntry {
  id: string;
  actor: string;
  action: string;
  target: string;
  at: string; // ISO datetime
}

export const activityLog: ActivityEntry[] = [
  { id: 'a-1', actor: 'أحمد محمد', action: 'أكّد حجزاً', target: 'AS-482910', at: '2025-05-22 09:14' },
  { id: 'a-2', actor: 'منى إبراهيم', action: 'أضافت مقدّم خدمة', target: 'د. هناء مصطفى', at: '2025-05-21 16:40' },
  { id: 'a-3', actor: 'أحمد محمد', action: 'نشر مشروعاً', target: 'محطة تحلية مياه', at: '2025-05-21 11:02' },
  { id: 'a-4', actor: 'خالد سمير', action: 'ألغى حجزاً', target: 'AS-482915', at: '2025-05-20 13:25' },
  { id: 'a-5', actor: 'أحمد محمد', action: 'حظر مستخدماً', target: 'طارق فؤاد', at: '2025-05-20 10:11' },
  { id: 'a-6', actor: 'منى إبراهيم', action: 'عدّلت فئة خدمة', target: 'العيادات الطبية', at: '2025-05-19 15:30' },
];

/* ----------------------- Portfolio content (CMS) ----------------------- */
export type PortfolioType = 'مشروع' | 'حالة' | 'قافلة' | 'برنامج' | 'رحلة' | 'مقال';

export interface PortfolioItem {
  id: string;
  title: string;
  type: PortfolioType;
  governorate: string;
  date: string; // ISO
  published: boolean;
}

export const portfolioItems: PortfolioItem[] = [
  { id: 'pf-1', title: 'محطة تحلية مياه', type: 'مشروع', governorate: 'أسوان', date: '2025-05-10', published: true },
  { id: 'pf-2', title: 'أسرة رقم 1427', type: 'حالة', governorate: 'الجيزة', date: '2025-05-18', published: true },
  { id: 'pf-3', title: 'قافلة طبية بالصعيد', type: 'قافلة', governorate: 'أسيوط', date: '2025-05-05', published: true },
  { id: 'pf-4', title: 'برنامج كفالة الطلاب', type: 'برنامج', governorate: 'المنيا', date: '2025-04-28', published: true },
  { id: 'pf-5', title: 'رحلة أيتام إلى الإسكندرية', type: 'رحلة', governorate: 'الإسكندرية', date: '2025-04-20', published: false },
  { id: 'pf-6', title: 'كيف نصنع أثراً مستداماً', type: 'مقال', governorate: '—', date: '2025-05-15', published: true },
  { id: 'pf-7', title: 'مطابخ أحلى شباب', type: 'مشروع', governorate: 'القاهرة', date: '2025-05-01', published: true },
  { id: 'pf-8', title: 'قافلة إغاثية لسيناء', type: 'قافلة', governorate: 'شمال سيناء', date: '2025-03-30', published: false },
];

/* ----------------------- Volunteer applications inbox ----------------------- */
export type VolunteerStatus = 'جديد' | 'تم التواصل' | 'مقبول' | 'مؤرشف';

export interface VolunteerApplication {
  id: string;
  name: string;
  phone: string; // applicant's own contact — not beneficiary data
  age?: number;
  governorate: string;
  interests: string[];
  availability: string;
  submittedAt: string; // ISO datetime
  status: VolunteerStatus;
}

export const volunteerApplications: VolunteerApplication[] = [
  { id: 'v-1', name: 'سارة عبد الرحمن', phone: '01012345678', age: 24, governorate: 'القاهرة', interests: ['تعليم', 'إعلام'], availability: 'العطلات', submittedAt: '2025-05-22 10:20', status: 'جديد' },
  { id: 'v-2', name: 'محمود حسن', phone: '01123456789', age: 29, governorate: 'الجيزة', interests: ['إغاثة', 'لوجستيات'], availability: 'مرن', submittedAt: '2025-05-21 18:05', status: 'جديد' },
  { id: 'v-3', name: 'ندى الشاذلي', phone: '01234567890', age: 22, governorate: 'الإسكندرية', interests: ['طبي'], availability: 'أيام الأسبوع', submittedAt: '2025-05-20 14:32', status: 'تم التواصل' },
  { id: 'v-4', name: 'كريم فوزي', phone: '01087654321', age: 31, governorate: 'أسيوط', interests: ['إغاثة', 'مالية'], availability: 'مرن', submittedAt: '2025-05-18 09:47', status: 'مقبول' },
  { id: 'v-5', name: 'هاجر مصطفى', phone: '01156781234', age: 26, governorate: 'المنوفية', interests: ['تعليم'], availability: 'العطلات', submittedAt: '2025-05-16 20:15', status: 'مؤرشف' },
];

/* ----------------------- Contact messages inbox ----------------------- */
export type MessageStatus = 'جديدة' | 'تم الرد' | 'مؤرشفة';

export interface ContactMessage {
  id: string;
  name: string;
  phone: string;
  message: string;
  receivedAt: string; // ISO datetime
  status: MessageStatus;
}

export const contactMessages: ContactMessage[] = [
  { id: 'm-1', name: 'عمرو السيد', phone: '01011112222', message: 'أرغب في معرفة تفاصيل التبرع الشهري لكفالة الأيتام، وهل يمكن زيارة مقر الجمعية؟', receivedAt: '2025-05-22 11:40', status: 'جديدة' },
  { id: 'm-2', name: 'إيمان عادل', phone: '01233334444', message: 'حجزت استشارة أسرية ولم يصلني تأكيد حتى الآن. رقم الحجز AS-482913.', receivedAt: '2025-05-22 09:12', status: 'جديدة' },
  { id: 'm-3', name: 'حسين عبد الله', phone: '01144445555', message: 'هل تقبلون تبرعات عينية (ملابس وأجهزة كهربائية) في فرع المنصورة؟', receivedAt: '2025-05-21 16:55', status: 'تم الرد' },
  { id: 'm-4', name: 'منة شوقي', phone: '01055556666', message: 'أمثل شركة وترغب إدارتنا في رعاية إحدى قوافلكم الطبية القادمة.', receivedAt: '2025-05-20 13:08', status: 'تم الرد' },
  { id: 'm-5', name: 'طارق رمضان', phone: '01266667777', message: 'شكراً لكم على سرعة الاستجابة في حالة أسرة العريش.', receivedAt: '2025-05-19 10:30', status: 'مؤرشفة' },
];
