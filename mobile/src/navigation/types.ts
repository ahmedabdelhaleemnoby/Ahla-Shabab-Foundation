import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Main: { screen?: keyof TabParamList } | undefined;
  ProjectDetail: { id: string };
  CaseDetail: { id: string };
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
  Discover: { initialFilter?: string } | undefined;
  Donate: { caseId?: string; projectId?: string } | undefined;
  News: undefined;
  Profile: undefined;
};

export type RootProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;
