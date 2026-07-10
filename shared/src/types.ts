/** Shared domain types used by the mobile app and the dashboard. */

export type CaseTag = 'عاجل' | 'علاج' | 'تعليم' | 'سكن';

export interface HumanitarianCase {
  id: string;
  code: string; // e.g. "أسرة رقم 1427"
  title: string;
  /** Governorate-level only — NEVER exact address (beneficiary privacy). */
  location: string;
  summary: string;
  need: string;
  tag: CaseTag;
  verified: boolean;
  targetAmount: number;
  raisedAmount: number;
  supporters: number;
  /** Approved image from the admin panel (privacy-vetted). Fallback = branded gradient. */
  imageUrl?: string;
  /** Eligible for monthly sponsorship (كفالة شهرية). */
  sponsorable?: boolean;
  /** Latest public update label, e.g. "تم توثيق الحالة منذ يومين". */
  lastUpdate?: string;
  gradient: [string, string];
}

export type ProjectStatus = 'مستدام' | 'جارٍ' | 'مكتمل';

export interface ProjectUpdate {
  date: string; // ISO
  text: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  targetAmount: number;
  raisedAmount: number;
  supporters: number;
  stages: { label: string; done: boolean }[];
  /** Approved image from the admin panel. */
  imageUrl?: string;
  /** Public timeline updates shown on the project detail page. */
  updates?: ProjectUpdate[];
  gradient: [string, string];
}

export type ConsultationType =
  | 'نفسية'
  | 'دينية'
  | 'أسرية'
  | 'تربوية'
  | 'مهنية'
  | 'قانونية';

export interface Consultant {
  id: string;
  /** Approved photo or professional avatar from the admin panel. */
  imageUrl?: string;
  name: string;
  specialty: string;
  type: ConsultationType;
  yearsExperience: number;
  sessions: number;
  rating: number;
  reviews: number;
  available: boolean;
  featured: boolean;
}

export type PaymentMethod =
  | 'بطاقة بنكية'
  | 'فوري'
  | 'إنستاباي'
  | 'فودافون كاش'
  | 'تحويل بنكي';

export type PaymentAvailability = 'متاحة' | 'قيد التفعيل' | 'غير متاحة حالياً';

export interface PaymentMethodInfo {
  id: PaymentMethod;
  /** Method family shown to the user. */
  group: 'دفع إلكتروني' | 'تحويل بنكي' | 'محفظة إلكترونية';
  description: string;
  availability: PaymentAvailability;
  /**
   * true = manual method (bank transfer / InstaPay): the donation stays
   * "قيد المراجعة" until an admin approves it. false = gateway method:
   * stays "قيد التأكيد" until the SERVER confirms the payment callback.
   * The app NEVER marks a donation successful on its own.
   */
  manual: boolean;
}

/** 'مكتمل' is set ONLY by backend confirmation or admin approval — never by the app UI. */
export type DonationStatus = 'مكتمل' | 'قيد المعالجة' | 'قيد التأكيد' | 'قيد المراجعة' | 'فشل';

export interface Donation {
  id: string;
  donorName: string;
  cause: string;
  amount: number;
  method: PaymentMethod;
  date: string; // ISO
  recurring: boolean;
  status: DonationStatus;
}

export type AppointmentStatus = 'مؤكد' | 'قيد الانتظار' | 'مكتمل' | 'ملغي';

export interface Appointment {
  id: string;
  clientName: string;
  consultantName: string;
  type: ConsultationType;
  date: string; // ISO
  time: string;
  mode: 'مكالمة فيديو' | 'مكالمة صوتية' | 'محادثة نصية';
  status: AppointmentStatus;
}

export interface DonorProfile {
  name: string;
  role: string;
  bio: string;
  stats: { donations: number; projects: number; sponsoredCases: number; badges: number };
}

export interface FoundationStats {
  governorates: number;
  beneficiaries: string;
  yearsOfService: number;
}

export type ArticleCategory = 'خبر' | 'نشاط' | 'مقال' | 'قافلة';

export interface Article {
  id: string;
  /** Approved cover image from the admin panel. */
  imageUrl?: string;
  category: ArticleCategory;
  title: string;
  excerpt: string;
  body: string;
  date: string;
  location?: string;
  readMinutes: number;
  gradient: [string, string];
}

/**
 * App-wide configuration surfaced in the mobile app and controlled from the
 * dashboard settings page. TODO(backend): GET/PUT /admin/config.
 */
export interface AppConfig {
  hotline: string;
  email: string;
  address: string;
  workingHours: string;
  website: string;
  socials: { facebook: string; instagram: string; youtube: string; twitter: string };
  heroTitle: string;
  heroSubtitle: string;
  /** Zakat nisab in EGP used by the mobile calculator. */
  zakatNisabEgp: number;
}

export type NotificationKind = 'donation' | 'case' | 'project' | 'booking' | 'system';

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  time: string; // relative Arabic label
  read: boolean;
}
