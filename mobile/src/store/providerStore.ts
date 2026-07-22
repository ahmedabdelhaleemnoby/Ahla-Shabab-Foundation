import { useSyncExternalStore } from 'react';

export interface ProviderBooking {
  id: string;
  reference: string;
  applicantName: string;
  email: string;
  phone: string;
  whatsapp?: string;
  age: number;
  governorate: string;
  consultationType: string;
  preferredComm: 'واتساب' | 'مكالمة هاتفية' | 'بريد إلكتروني';
  appointmentDate: string; // YYYY-MM-DD
  appointmentTime: string;
  generalDescription: string;
  specializedAnswers: Record<string, string>;
  hasAttachment?: boolean;
  submissionDate: string;
  status: 'جديد' | 'مؤكد' | 'مكتمل' | 'ملغي';
}

export interface ProviderProfile {
  name: string;
  specialty: string;
  bio: string;
  qualifications: string[];
  sessionTypes: string[];
  phone: string;
  email: string;
  available: boolean;
  availableDays: string[];
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  slots: string[];
  unavailableDates: string[];
}

interface ProviderStoreState {
  profile: ProviderProfile;
  bookings: ProviderBooking[];
}

const initialProfile: ProviderProfile = {
  name: 'د. محمد العربي',
  specialty: 'استشاري الصحة النفسية والعلاج المعرفي السلوكي',
  bio: 'استشاري الصحة النفسية والإرشاد الأسري بخبرة تزيد عن 10 سنوات، قدّم أكثر من 1200 جلسة دعم نفسي وأسري مجانية.',
  qualifications: [
    'دكتوراه في الفلسفة وعلم النفس الكلينيكي',
    'ماجستير الإرشاد الأسري والتربوي',
    'عضو الجمعية المصرية للمعالجين النفسيين',
  ],
  sessionTypes: ['استشارات نفسية أونلاين', 'إرشاد أسري ميداني', 'جلسات دعم جماعي'],
  phone: '01012345678',
  email: 'dr.arabi@ahlashabab.com',
  available: true,
  availableDays: ['الأحد', 'الإثنين', 'الأربعاء', 'الخميس'],
  startTime: '10:00 ص',
  endTime: '04:00 م',
  slotDurationMinutes: 45,
  slots: ['10:00 ص', '11:00 ص', '01:00 م', '02:00 م', '03:00 م'],
  unavailableDates: ['2026-08-01', '2026-08-15'],
};

const initialBookings: ProviderBooking[] = [
  {
    id: 'pb-101',
    reference: 'AS-849201',
    applicantName: 'أحمد محمود إسماعيل',
    email: 'ahmed.m@example.com',
    phone: '01098765432',
    whatsapp: '01098765432',
    age: 29,
    governorate: 'القاهرة',
    consultationType: 'استشارة نفسية',
    preferredComm: 'واتساب',
    appointmentDate: new Date().toISOString().slice(0, 10),
    appointmentTime: '11:00 ص',
    generalDescription: 'أعاني من قلق وتوتر مستمر يؤثر على النوم والعمل منذ عدة أسابيع.',
    specializedAnswers: {
      'مدة الأعراض': '3 أشهر',
      'تأثير على العمل': 'نعم، يسبب صعوبة بالغة في التركيز',
      'جلسات سابقة': 'لم أتناول أدوية أو أحضر جلسات من قبل',
    },
    hasAttachment: true,
    submissionDate: new Date().toISOString().slice(0, 10),
    status: 'جديد',
  },
  {
    id: 'pb-102',
    reference: 'AS-739102',
    applicantName: 'مريم علي حسن',
    email: 'mariam.ali@example.com',
    phone: '01122334455',
    whatsapp: '01122334455',
    age: 34,
    governorate: 'الجيزة',
    consultationType: 'استشارة أسرية',
    preferredComm: 'مكالمة هاتفية',
    appointmentDate: new Date().toISOString().slice(0, 10),
    appointmentTime: '01:00 م',
    generalDescription: 'خلافات أسرية متكررة وتحتاج للتوجيه والإرشاد لحلها بشكل هادئ.',
    specializedAnswers: {
      'عدد أفراد الأسرة': '4 أفراد',
      'طبيعة الاستشارة': 'إرشاد علاقات أسرية وتربية الأبناء',
    },
    hasAttachment: false,
    submissionDate: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
    status: 'مؤكد',
  },
  {
    id: 'pb-103',
    reference: 'AS-612349',
    applicantName: 'عمر خالد يوسف',
    email: 'omar.k@example.com',
    phone: '01234567890',
    age: 22,
    governorate: 'الإسكندرية',
    consultationType: 'إرشاد مهني',
    preferredComm: 'بريد إلكتروني',
    appointmentDate: '2026-07-25',
    appointmentTime: '02:00 م',
    generalDescription: 'خريج جديد يحتاج إلى توجيه لاختيار المسار المهني المناسب وإعداد السيرة الذاتية.',
    specializedAnswers: {
      'التخصص الدراسي': 'هندسة حاسبات',
      'الهدف من الاستشارة': 'تطوير المهارات وتجهيز للمقابلات',
    },
    hasAttachment: true,
    submissionDate: new Date(Date.now() - 172800000).toISOString().slice(0, 10),
    status: 'مكتمل',
  },
];

let state: ProviderStoreState = {
  profile: initialProfile,
  bookings: initialBookings,
};

const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

export const providerStore = {
  get: (): ProviderStoreState => state,

  updateStatus(bookingId: string, status: ProviderBooking['status']) {
    state = {
      ...state,
      bookings: state.bookings.map((b) => (b.id === bookingId ? { ...b, status } : b)),
    };
    emit();
  },

  toggleAvailability() {
    state = {
      ...state,
      profile: { ...state.profile, available: !state.profile.available },
    };
    emit();
  },

  toggleDay(day: string) {
    const current = state.profile.availableDays;
    const next = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day];
    state = {
      ...state,
      profile: { ...state.profile, availableDays: next },
    };
    emit();
  },

  addSlot(slot: string) {
    if (!slot.trim() || state.profile.slots.includes(slot.trim())) return;
    state = {
      ...state,
      profile: { ...state.profile, slots: [...state.profile.slots, slot.trim()] },
    };
    emit();
  },

  removeSlot(slot: string) {
    state = {
      ...state,
      profile: {
        ...state.profile,
        slots: state.profile.slots.filter((s) => s !== slot),
      },
    };
    emit();
  },

  addUnavailableDate(dateIso: string) {
    if (!dateIso || state.profile.unavailableDates.includes(dateIso)) return;
    state = {
      ...state,
      profile: {
        ...state.profile,
        unavailableDates: [...state.profile.unavailableDates, dateIso],
      },
    };
    emit();
  },

  removeUnavailableDate(dateIso: string) {
    state = {
      ...state,
      profile: {
        ...state.profile,
        unavailableDates: state.profile.unavailableDates.filter((d) => d !== dateIso),
      },
    };
    emit();
  },
};

export function useProviderStore(): ProviderStoreState {
  return useSyncExternalStore(
    (cb) => {
      subs.add(cb);
      return () => subs.delete(cb);
    },
    () => state
  );
}
