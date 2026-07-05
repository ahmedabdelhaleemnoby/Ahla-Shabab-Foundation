/** Shared domain types used by the mobile app and the dashboard. */

export type CaseTag = 'عاجل' | 'علاج' | 'تعليم' | 'سكن';

export interface HumanitarianCase {
  id: string;
  code: string; // e.g. "أسرة رقم 1427"
  title: string;
  location: string;
  summary: string;
  need: string;
  tag: CaseTag;
  verified: boolean;
  targetAmount: number;
  raisedAmount: number;
  supporters: number;
  gradient: [string, string];
}

export type ProjectStatus = 'مستدام' | 'جارٍ' | 'مكتمل';

export interface Project {
  id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  targetAmount: number;
  raisedAmount: number;
  supporters: number;
  stages: { label: string; done: boolean }[];
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

export interface Donation {
  id: string;
  donorName: string;
  cause: string;
  amount: number;
  method: PaymentMethod;
  date: string; // ISO
  recurring: boolean;
  status: 'مكتمل' | 'قيد المعالجة' | 'فشل';
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

export type NotificationKind = 'donation' | 'case' | 'project' | 'booking' | 'system';

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  time: string; // relative Arabic label
  read: boolean;
}
