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
  };
};

export type TabParamList = {
  Home: undefined;
  Discover: undefined;
  Donate: { caseId?: string; projectId?: string } | undefined;
  News: undefined;
  Profile: undefined;
};

export type RootProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;
