/**
 * Free Services Booking catalog (Technical Offer §4).
 * Hierarchical categories (unlimited nesting) → services → providers → schedules.
 * All mock data for now; shapes mirror what the backend/dashboard will manage.
 */

export interface ServiceCategory {
  id: string;
  name: string;
  /** Feather icon name for the mobile app. */
  icon: string;
  description?: string;
  /** null = top-level main category. Otherwise the parent category id (supports unlimited depth). */
  parentId: string | null;
  active: boolean;
}

export interface Provider {
  id: string;
  name: string;
  specialization: string;
  bio: string;
  yearsExperience: number;
  rating: number;
  reviews: number;
  /** Weekday numbers the provider works: 0=Sunday … 6=Saturday. */
  availableDays: number[];
  /** Bookable time slots (Arabic labels) offered on working days. */
  slots: string[];
  /** ISO dates the provider is explicitly unavailable (holidays, vacation). */
  unavailableDates: string[];
  gradient: [string, string];
}

export interface Service {
  id: string;
  name: string;
  description: string;
  /** The (sub)category this bookable service belongs to. */
  categoryId: string;
  providerId: string;
  /** Free of charge — every foundation service is free, but kept explicit. */
  free: boolean;
  /** Optional per-service overrides marking extra fields required/hidden. */
  requireNationalId?: boolean;
}

/* ----------------------- Categories (nested) ----------------------- */
export const serviceCategories: ServiceCategory[] = [
  // Main categories
  { id: 'clinics', name: 'العيادات الطبية', icon: 'activity', description: 'كشف وعلاج مجاني في تخصصات متعددة', parentId: null, active: true },
  { id: 'counseling', name: 'الاستشارات والإرشاد', icon: 'message-circle', description: 'دعم نفسي وأسري ومهني', parentId: null, active: true },
  { id: 'education', name: 'الدعم التعليمي', icon: 'book-open', description: 'تحفيظ ودروس تقوية', parentId: null, active: true },
  { id: 'social', name: 'الخدمات الاجتماعية', icon: 'users', description: 'دراسة الحالة والمساعدات', parentId: null, active: true },

  // Clinics → subcategories
  { id: 'clinic-general', name: 'طب عام', icon: 'thermometer', parentId: 'clinics', active: true },
  { id: 'clinic-pediatrics', name: 'أطفال', icon: 'smile', parentId: 'clinics', active: true },
  { id: 'clinic-dental', name: 'أسنان', icon: 'smile', parentId: 'clinics', active: true },
  { id: 'clinic-eye', name: 'رمد وعيون', icon: 'eye', parentId: 'clinics', active: true },

  // Counseling → subcategories
  { id: 'counsel-psych', name: 'استشارات نفسية', icon: 'heart', parentId: 'counseling', active: true },
  { id: 'counsel-family', name: 'استشارات أسرية', icon: 'users', parentId: 'counseling', active: true },
  { id: 'counsel-career', name: 'إرشاد مهني', icon: 'briefcase', parentId: 'counseling', active: true },

  // Education → subcategories
  { id: 'edu-quran', name: 'تحفيظ القرآن', icon: 'book', parentId: 'education', active: true },
  { id: 'edu-tutoring', name: 'دروس تقوية', icon: 'edit-3', parentId: 'education', active: true },

  // Social → subcategories
  { id: 'social-assessment', name: 'دراسة الحالة', icon: 'clipboard', parentId: 'social', active: true },
  { id: 'social-food', name: 'تسجيل مساعدات غذائية', icon: 'shopping-bag', parentId: 'social', active: true },
];

/* ----------------------- Providers ----------------------- */
export const providers: Provider[] = [
  {
    id: 'pr-tarek', name: 'د. طارق عبد الحميد', specialization: 'استشاري طب عام', bio: 'استشاري باطنة وطب أسرة بخبرة تتجاوز 15 عاماً في خدمة المجتمع.',
    yearsExperience: 15, rating: 4.9, reviews: 280, availableDays: [0, 1, 2, 3], slots: ['10:00 ص', '11:00 ص', '12:00 م', '1:00 م'], unavailableDates: [], gradient: ['#8296b5', '#4d6386'],
  },
  {
    id: 'pr-hana', name: 'د. هناء مصطفى', specialization: 'أخصائية أطفال', bio: 'أخصائية طب الأطفال وحديثي الولادة، حاصلة على الزمالة المصرية.',
    yearsExperience: 9, rating: 4.8, reviews: 190, availableDays: [1, 2, 3, 4], slots: ['9:00 ص', '10:00 ص', '11:00 ص'], unavailableDates: [], gradient: ['#a7b6d0', '#7186a6'],
  },
  {
    id: 'pr-samy', name: 'د. سامي فؤاد', specialization: 'طبيب أسنان', bio: 'جراحة وتركيبات الأسنان وعلاج الجذور.',
    yearsExperience: 11, rating: 4.7, reviews: 150, availableDays: [6, 0, 2], slots: ['11:00 ص', '12:00 م', '1:00 م', '2:00 م'], unavailableDates: [], gradient: ['#c3a888', '#8f7350'],
  },
  {
    id: 'pr-arabi', name: 'د. محمد العربي', specialization: 'استشاري نفسي', bio: 'استشاري الصحة النفسية والعلاج المعرفي السلوكي، أكثر من 1250 جلسة.',
    yearsExperience: 10, rating: 4.9, reviews: 320, availableDays: [0, 1, 3, 4], slots: ['10:00 ص', '11:00 ص', '1:00 م', '2:00 م'], unavailableDates: [], gradient: ['#8296b5', '#4d6386'],
  },
  {
    id: 'pr-sara', name: 'أ. سارة محمود', specialization: 'أخصائية نفسية', bio: 'أخصائية نفسية وإرشاد أسري بخبرة 7 سنوات.',
    yearsExperience: 7, rating: 4.8, reviews: 190, availableDays: [2, 3, 4, 5], slots: ['10:00 ص', '11:00 ص', '12:00 م'], unavailableDates: [], gradient: ['#a7b6d0', '#7186a6'],
  },
  {
    id: 'pr-khaled', name: 'د. خالد إبراهيم', specialization: 'مستشار أسري', bio: 'مستشار العلاقات الأسرية وحل النزاعات.',
    yearsExperience: 12, rating: 4.9, reviews: 410, availableDays: [0, 2, 4], slots: ['12:00 م', '1:00 م', '2:00 م'], unavailableDates: [], gradient: ['#8aa0bf', '#586f92'],
  },
  {
    id: 'pr-mona', name: 'أ. منى عبد الله', specialization: 'مرشدة مهنية', bio: 'إرشاد مهني وتطوير المسار الوظيفي للشباب.',
    yearsExperience: 8, rating: 4.7, reviews: 120, availableDays: [1, 3, 5], slots: ['10:00 ص', '11:00 ص', '12:00 م'], unavailableDates: [], gradient: ['#93a7c4', '#617699'],
  },
  {
    id: 'pr-sheikh', name: 'الشيخ عبد الرحمن', specialization: 'محفّظ قرآن', bio: 'محفّظ ومجاز بالقراءات، يشرف على حلقات التحفيظ.',
    yearsExperience: 20, rating: 5.0, reviews: 500, availableDays: [6, 0, 1, 2, 3], slots: ['4:00 م', '5:00 م', '6:00 م'], unavailableDates: [], gradient: ['#8f9f7d', '#5f6d50'],
  },
  {
    id: 'pr-ola', name: 'أ. علا حسن', specialization: 'معلمة دروس تقوية', bio: 'معلمة رياضيات وعلوم للمرحلتين الإعدادية والثانوية.',
    yearsExperience: 6, rating: 4.6, reviews: 90, availableDays: [0, 1, 2, 3, 4], slots: ['3:00 م', '4:00 م', '5:00 م'], unavailableDates: [], gradient: ['#a7b6d0', '#7186a6'],
  },
  {
    id: 'pr-baheya', name: 'أ. بهية سعيد', specialization: 'باحثة اجتماعية', bio: 'باحثة اجتماعية معتمدة لدراسة وتقييم الحالات.',
    yearsExperience: 13, rating: 4.8, reviews: 210, availableDays: [0, 1, 2, 3, 4], slots: ['9:00 ص', '10:00 ص', '11:00 ص', '12:00 م'], unavailableDates: [], gradient: ['#b98a5e', '#7d5a3c'],
  },
];

/* ----------------------- Services ----------------------- */
export const services: Service[] = [
  { id: 'sv-gen', name: 'كشف باطنة عام', description: 'كشف طبي عام وتشخيص مبدئي.', categoryId: 'clinic-general', providerId: 'pr-tarek', free: true },
  { id: 'sv-ped', name: 'كشف أطفال', description: 'متابعة صحة الطفل والتطعيمات.', categoryId: 'clinic-pediatrics', providerId: 'pr-hana', free: true },
  { id: 'sv-dent', name: 'كشف وعلاج أسنان', description: 'فحص وعلاج مشكلات الأسنان.', categoryId: 'clinic-dental', providerId: 'pr-samy', free: true },
  { id: 'sv-psych', name: 'جلسة استشارة نفسية', description: 'جلسة فردية سرية للدعم النفسي.', categoryId: 'counsel-psych', providerId: 'pr-arabi', free: true },
  { id: 'sv-psych2', name: 'جلسة دعم نفسي (سيدات)', description: 'جلسة استشارية للسيدات مع أخصائية.', categoryId: 'counsel-psych', providerId: 'pr-sara', free: true },
  { id: 'sv-family', name: 'استشارة أسرية', description: 'إرشاد للعلاقات الأسرية والزوجية.', categoryId: 'counsel-family', providerId: 'pr-khaled', free: true },
  { id: 'sv-career', name: 'جلسة إرشاد مهني', description: 'توجيه المسار الوظيفي وكتابة السيرة الذاتية.', categoryId: 'counsel-career', providerId: 'pr-mona', free: true },
  { id: 'sv-quran', name: 'حلقة تحفيظ قرآن', description: 'حلقة تحفيظ وتجويد فردية.', categoryId: 'edu-quran', providerId: 'pr-sheikh', free: true },
  { id: 'sv-tutor', name: 'حصة دروس تقوية', description: 'دعم دراسي في الرياضيات والعلوم.', categoryId: 'edu-tutoring', providerId: 'pr-ola', free: true },
  { id: 'sv-assess', name: 'دراسة حالة اجتماعية', description: 'زيارة وتقييم لتحديد أوجه الدعم المناسبة.', categoryId: 'social-assessment', providerId: 'pr-baheya', free: true, requireNationalId: true },
  { id: 'sv-food', name: 'تسجيل مساعدات غذائية', description: 'تسجيل الأسرة في قوائم المساعدات الغذائية.', categoryId: 'social-food', providerId: 'pr-baheya', free: true, requireNationalId: true },
];

/* ----------------------- Egyptian governorates ----------------------- */
export const governorates: string[] = [
  'القاهرة', 'الجيزة', 'الإسكندرية', 'القليوبية', 'الدقهلية', 'الشرقية', 'الغربية', 'المنوفية',
  'البحيرة', 'كفر الشيخ', 'دمياط', 'بورسعيد', 'الإسماعيلية', 'السويس', 'الفيوم', 'بني سويف',
  'المنيا', 'أسيوط', 'سوهاج', 'قنا', 'الأقصر', 'أسوان', 'البحر الأحمر', 'الوادي الجديد',
  'مطروح', 'شمال سيناء', 'جنوب سيناء',
];

/* ----------------------- Booking form schema (configurable) ----------------------- */
export type FieldType = 'text' | 'phone' | 'number' | 'select' | 'textarea' | 'date' | 'time';

export interface FormFieldConfig {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
  options?: string[];
}

/** Default field set from Offer §4.3. Admin can toggle required/hidden per service. */
export const bookingFormSchema: FormFieldConfig[] = [
  { key: 'fullName', label: 'الاسم بالكامل', type: 'text', required: true, placeholder: 'اكتب اسمك الكامل' },
  { key: 'phone', label: 'رقم الهاتف', type: 'phone', required: true, placeholder: '01xxxxxxxxx' },
  { key: 'age', label: 'العمر', type: 'number', required: true, placeholder: 'السن' },
  { key: 'gender', label: 'النوع', type: 'select', required: true, options: ['ذكر', 'أنثى'] },
  { key: 'governorate', label: 'المحافظة', type: 'select', required: true, options: governorates },
  { key: 'city', label: 'المدينة / المنطقة', type: 'text', required: false, placeholder: 'اختياري' },
  { key: 'nationalId', label: 'الرقم القومي', type: 'text', required: false, placeholder: 'اختياري' },
  { key: 'notes', label: 'سبب الحجز / ملاحظات', type: 'textarea', required: false, placeholder: 'أضف أي تفاصيل تساعدنا' },
];

/* ----------------------- Booking type + helpers ----------------------- */
export type ServiceBookingStatus = 'قيد الانتظار' | 'مؤكد' | 'مكتمل' | 'ملغي' | 'لم يحضر';

export interface ServiceBooking {
  reference: string;
  serviceId: string;
  providerId: string;
  date: string; // ISO
  time: string;
  form: Record<string, string>;
  status: ServiceBookingStatus;
}

export const childCategories = (parentId: string | null): ServiceCategory[] =>
  serviceCategories.filter((c) => c.parentId === parentId && c.active);

export const servicesInCategory = (categoryId: string): Service[] =>
  services.filter((s) => s.categoryId === categoryId);

export const providerById = (id: string): Provider | undefined =>
  providers.find((p) => p.id === id);

export const serviceById = (id: string): Service | undefined =>
  services.find((s) => s.id === id);

export const categoryById = (id: string): ServiceCategory | undefined =>
  serviceCategories.find((c) => c.id === id);

/** Deterministic-ish booking reference (no Date.now dependency for testability). */
export const makeBookingRef = (seed: number): string => {
  const n = 100000 + (seed % 900000);
  return `AS-${n}`;
};

const WEEKDAYS_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

export interface DayOption {
  iso: string;
  weekday: string;
  day: number;
  month: string;
  available: boolean;
}

/**
 * Build the next `count` days from a base date, flagging which fall on the
 * provider's working weekdays and aren't in their unavailable list.
 */
export const buildAvailableDays = (provider: Provider, base: Date, count = 14): DayOption[] => {
  const out: DayOption[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const weekday = d.getDay();
    const available = provider.availableDays.includes(weekday) && !provider.unavailableDates.includes(iso);
    out.push({ iso, weekday: WEEKDAYS_AR[weekday], day: d.getDate(), month: MONTHS_AR[d.getMonth()], available });
  }
  return out;
};
