import type {
  HumanitarianCase,
  Project,
  Consultant,
  Donation,
  Appointment,
  DonorProfile,
  FoundationStats,
} from './types';

export const foundationStats: FoundationStats = {
  governorates: 22,
  beneficiaries: '1.2M+',
  yearsOfService: 12,
};

export const cases: HumanitarianCase[] = [
  {
    id: 'c-1427',
    code: 'أسرة رقم 1427',
    title: 'أسرة في مواجهة صعوبة شديدة',
    location: 'الجيزة، مصر',
    summary:
      'أسرة مكونة من 5 أفراد، يعولهم الأب الذي يعمل بأجر يومي غير ثابت. يقطنون في منزل بسيط ويعانون من ظروف معيشية صعبة.',
    need: 'مساعدات معيشية لتوفير الاحتياجات الأساسية للأسرة.',
    tag: 'عاجل',
    verified: true,
    targetAmount: 18000,
    raisedAmount: 10800,
    supporters: 214,
    gradient: ['#b98a5e', '#7d5a3c'],
  },
  {
    id: 'c-nour',
    code: 'الطالبة نور',
    title: 'دعم تعليم الطالبة نور',
    location: 'أسيوط، مصر',
    summary: 'طالبة في المرحلة الثانوية تحتاج إلى دعم لمواصلة تعليمها.',
    need: 'مصاريف دراسية وأدوات تعليمية للعام الدراسي.',
    tag: 'تعليم',
    verified: true,
    targetAmount: 12000,
    raisedAmount: 4800,
    supporters: 96,
    gradient: ['#93a7c4', '#617699'],
  },
  {
    id: 'c-abomohamed',
    code: 'الحاج أبو محمد',
    title: 'علاج عاجل للحاج أبو محمد',
    location: 'الشرقية، مصر',
    summary: 'حالة صحية حرجة تحتاج إلى علاج عاجل وجلسات دورية.',
    need: 'تكاليف علاج وجلسات طبية دورية.',
    tag: 'علاج',
    verified: true,
    targetAmount: 40000,
    raisedAmount: 20000,
    supporters: 331,
    gradient: ['#a08768', '#6d543a'],
  },
  {
    id: 'c-2201',
    code: 'أسرة رقم 2201',
    title: 'ترميم مسكن أسرة',
    location: 'المنيا، مصر',
    summary: 'أسرة تسكن في منزل آيل للسقوط بحاجة إلى ترميم عاجل.',
    need: 'مواد بناء وأعمال ترميم أساسية.',
    tag: 'سكن',
    verified: false,
    targetAmount: 60000,
    raisedAmount: 15000,
    supporters: 120,
    gradient: ['#8aa0bf', '#586f92'],
  },
];

export const projects: Project[] = [
  {
    id: 'p-water',
    title: 'محطة تحلية مياه',
    description:
      'توفير مياه نقية وآمنة للأسر والمجتمعات الأكثر احتياجاً، من خلال محطات تحلية متطورة وشبكات توزيع فعّالة.',
    status: 'مستدام',
    targetAmount: 400000,
    raisedAmount: 245000,
    supporters: 1248,
    stages: [
      { label: 'الدراسة', done: true },
      { label: 'التجهيز', done: true },
      { label: 'التركيب', done: false },
      { label: 'التسليم', done: false },
    ],
    gradient: ['#8fb4dd', '#5f86b5'],
  },
  {
    id: 'p-kitchen',
    title: 'مطابخ أحلى شباب',
    description: 'إعداد وتوزيع وجبات يومية للأسر الأكثر احتياجاً في المناطق المستهدفة.',
    status: 'جارٍ',
    targetAmount: 200000,
    raisedAmount: 132000,
    supporters: 640,
    stages: [
      { label: 'التخطيط', done: true },
      { label: 'التجهيز', done: true },
      { label: 'التشغيل', done: false },
    ],
    gradient: ['#c3a888', '#8f7350'],
  },
  {
    id: 'p-students',
    title: 'دعم الطلاب',
    description: 'كفالة تعليمية للطلاب المتفوقين غير القادرين لضمان استمرار مسيرتهم الدراسية.',
    status: 'جارٍ',
    targetAmount: 150000,
    raisedAmount: 90000,
    supporters: 512,
    stages: [
      { label: 'الحصر', done: true },
      { label: 'الكفالة', done: false },
    ],
    gradient: ['#a7b6d0', '#7186a6'],
  },
];

export const consultants: Consultant[] = [
  {
    id: 'con-arabi',
    name: 'د. محمد العربي',
    specialty: 'استشاري نفسي',
    type: 'نفسية',
    yearsExperience: 10,
    sessions: 1250,
    rating: 4.9,
    reviews: 320,
    available: true,
    featured: true,
  },
  {
    id: 'con-sara',
    name: 'أ. سارة محمود',
    specialty: 'أخصائية نفسية',
    type: 'نفسية',
    yearsExperience: 7,
    sessions: 680,
    rating: 4.8,
    reviews: 190,
    available: true,
    featured: false,
  },
  {
    id: 'con-khaled',
    name: 'د. خالد إبراهيم',
    specialty: 'مستشار أسري',
    type: 'أسرية',
    yearsExperience: 12,
    sessions: 1400,
    rating: 4.9,
    reviews: 410,
    available: false,
    featured: false,
  },
  {
    id: 'con-mona',
    name: 'أ. منى عبد الله',
    specialty: 'مستشارة تربوية',
    type: 'تربوية',
    yearsExperience: 8,
    sessions: 520,
    rating: 4.7,
    reviews: 150,
    available: true,
    featured: false,
  },
];

export const consultationTypes: { type: Consultant['type']; label: string }[] = [
  { type: 'نفسية', label: 'نفسية' },
  { type: 'دينية', label: 'دينية' },
  { type: 'أسرية', label: 'أسرية' },
  { type: 'تربوية', label: 'تربوية' },
  { type: 'مهنية', label: 'مهنية' },
  { type: 'قانونية', label: 'قانونية' },
];

export const donations: Donation[] = [
  { id: 'd-1', donorName: 'أحمد محمد', cause: 'كفالة أسرة محتاجة', amount: 250, method: 'بطاقة بنكية', date: '2025-05-12', recurring: true, status: 'مكتمل' },
  { id: 'd-2', donorName: 'أحمد محمد', cause: 'دعم مشروع سقيا الماء', amount: 300, method: 'إنستاباي', date: '2025-05-05', recurring: false, status: 'مكتمل' },
  { id: 'd-3', donorName: 'أحمد محمد', cause: 'مساهمة في صندوق الزكاة', amount: 150, method: 'فودافون كاش', date: '2025-05-01', recurring: false, status: 'مكتمل' },
  { id: 'd-4', donorName: 'سلمى فاروق', cause: 'محطة تحلية مياه', amount: 1000, method: 'بطاقة بنكية', date: '2025-05-14', recurring: false, status: 'مكتمل' },
  { id: 'd-5', donorName: 'عمر حسن', cause: 'علاج الحاج أبو محمد', amount: 500, method: 'فوري', date: '2025-05-13', recurring: false, status: 'قيد المعالجة' },
  { id: 'd-6', donorName: 'ليلى سمير', cause: 'دعم الطلاب', amount: 200, method: 'إنستاباي', date: '2025-05-11', recurring: true, status: 'مكتمل' },
  { id: 'd-7', donorName: 'يوسف كامل', cause: 'مطابخ أحلى شباب', amount: 750, method: 'تحويل بنكي', date: '2025-05-10', recurring: false, status: 'مكتمل' },
  { id: 'd-8', donorName: 'هبة علي', cause: 'كفالة الطالبة نور', amount: 600, method: 'بطاقة بنكية', date: '2025-05-09', recurring: true, status: 'مكتمل' },
  { id: 'd-9', donorName: 'كريم ماهر', cause: 'ترميم مسكن أسرة', amount: 400, method: 'فوري', date: '2025-05-08', recurring: false, status: 'فشل' },
  { id: 'd-10', donorName: 'نورهان أشرف', cause: 'الحالات الإنسانية', amount: 300, method: 'فودافون كاش', date: '2025-05-07', recurring: false, status: 'مكتمل' },
];

export const appointments: Appointment[] = [
  { id: 'a-1', clientName: 'محمود سعيد', consultantName: 'د. محمد العربي', type: 'نفسية', date: '2025-05-22', time: '11:00 ص', mode: 'مكالمة صوتية', status: 'مؤكد' },
  { id: 'a-2', clientName: 'فاطمة الزهراء', consultantName: 'أ. سارة محمود', type: 'نفسية', date: '2025-05-22', time: '1:00 م', mode: 'مكالمة فيديو', status: 'قيد الانتظار' },
  { id: 'a-3', clientName: 'إسلام نبيل', consultantName: 'د. خالد إبراهيم', type: 'أسرية', date: '2025-05-23', time: '10:00 ص', mode: 'محادثة نصية', status: 'مؤكد' },
  { id: 'a-4', clientName: 'دعاء رمضان', consultantName: 'أ. منى عبد الله', type: 'تربوية', date: '2025-05-21', time: '2:00 م', mode: 'مكالمة فيديو', status: 'مكتمل' },
  { id: 'a-5', clientName: 'طارق فؤاد', consultantName: 'د. محمد العربي', type: 'نفسية', date: '2025-05-24', time: '12:00 م', mode: 'مكالمة صوتية', status: 'ملغي' },
];

export const donorProfile: DonorProfile = {
  name: 'أحمد محمد',
  role: 'داعم للجمعية',
  bio: 'أؤمن أن التغيير يبدأ بخطوة، وسعيد بأني جزء من صناعة الأثر.',
  stats: { donations: 28, projects: 5, sponsoredCases: 3, badges: 2 },
};

export const quickServices = [
  { id: 'water', label: 'وصلات مياه', icon: 'droplet' },
  { id: 'consult', label: 'استشارات', icon: 'file-text' },
  { id: 'donate', label: 'طرق التبرع', icon: 'heart-handshake' },
  { id: 'projects', label: 'المشروعات', icon: 'building' },
  { id: 'cases', label: 'الحالات', icon: 'map-pin' },
] as const;

export const foundationValues = ['الشفافية', 'المسؤولية', 'التطوع', 'التفوق', 'الإيمان'];

export const foundationInitiatives = [
  'دعم الطلاب',
  'وصلات المياه',
  'محطات التحلية',
  'القوافل الإغاثية',
  'مطابخ أحلى شباب',
  'الحالات الإنسانية',
];

/** Helpers */
export const pct = (raised: number, target: number) =>
  Math.min(100, Math.round((raised / target) * 100));

export const egp = (n: number) =>
  new Intl.NumberFormat('en-US').format(n) + ' ج.م';
