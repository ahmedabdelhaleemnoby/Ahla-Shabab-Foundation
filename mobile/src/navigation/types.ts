import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Main: { screen?: keyof TabParamList; params?: TabParamList[keyof TabParamList] } | undefined;
  ProjectDetail: { id: string };
  CaseDetail: { id: string };
  /** Browse all humanitarian cases (search + tag filters). */
  Cases: { initialFilter?: string } | undefined;
  /** حالات عاجلة — urgent cases section (§6). */
  UrgentCases: undefined;
  /** اكفل أسرة — monthly sponsorship page (§5). */
  Sponsorship: undefined;
  /** عن الجمعية — dedicated about page (§9). */
  About: undefined;
  /** Per-type consultation request form (§7). */
  ConsultationRequest: { type: string };
  /** Server payment-confirmation explainer (§13 — visual placeholder). */
  PaymentInfo: undefined;
  Consultations: undefined;
  Booking: { consultantId?: string } | undefined;
  Notifications: undefined;
  PhoneAuth: undefined;
  Otp: { phone: string };
  Projects: undefined;
  MyBookings: undefined;
  NewsFeed: undefined;
  ArticleDetail: { id: string };
  Volunteer: undefined;
  ContactUs: undefined;
  NotificationPreferences: undefined;
  AccountSettings: undefined;
  Language: undefined;
  DonationHistory: undefined;
  ZakatCalculator: undefined;
  Onboarding: undefined;
  Faq: undefined;
  DonationSuccess: {
    amount: string;
    cause: string;
    method: string;
    recurring: boolean;
    reference: string;
    date: string;
    /** Pending by default — 'مكتمل' only after backend/admin confirmation. */
    status: 'قيد التأكيد' | 'قيد المراجعة' | 'مكتمل' | 'فشل';
  };
  Receipts: undefined;
  PrivacyPolicy: undefined;
  Favorites: undefined;
  // Free Services Booking flow (Technical Offer §4)
  ServicesBrowse: { parentId: string | null } | undefined;
  ProviderDetail: { providerId: string };
  ServiceDetail: { serviceId: string };
  BookAppointment: { serviceId: string };
  BookingConfirmation: {
    reference: string;
    serviceId: string;
    providerId: string;
    date: string;
    time: string;
    /** Preferred communication channel chosen in the wizard. */
    mode?: string;
  };
};

export type TabParamList = {
  Home: undefined;
  /** خدماتنا — the foundation's service sections (§8, was "Discover"). */
  Discover: undefined;
  Donate: { caseId?: string; projectId?: string; sponsor?: boolean } | undefined;
  News: undefined;
  Profile: undefined;
};

export type RootProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;
