import type {
  HumanitarianCase,
  Project,
  Consultant,
  Donation,
  Appointment,
  DonorProfile,
  FoundationStats,
  AppNotification,
  Article,
  PaymentMethodInfo,
} from './types';

/**
 * Payment methods with live availability + confirmation mode (Offer/UX v2).
 * TODO(backend): serve from GET /config so the admin can toggle availability.
 */
export const paymentMethods: PaymentMethodInfo[] = [
  { id: 'بطاقة بنكية', group: 'دفع إلكتروني', description: 'فيزا / ماستركارد — تأكيد فوري من بوابة الدفع', availability: 'متاحة', manual: false },
  { id: 'فوري', group: 'دفع إلكتروني', description: 'ادفع بكود فوري من أقرب منفذ', availability: 'متاحة', manual: false },
  { id: 'إنستاباي', group: 'تحويل بنكي', description: 'حوِّل عبر إنستاباي — يُعتمد بعد مراجعة الإدارة', availability: 'متاحة', manual: true },
  { id: 'فودافون كاش', group: 'محفظة إلكترونية', description: 'الدفع عبر المحفظة الإلكترونية', availability: 'قيد التفعيل', manual: false },
  { id: 'تحويل بنكي', group: 'تحويل بنكي', description: 'تحويل على حساب الجمعية — يُعتمد بعد مراجعة الإدارة', availability: 'متاحة', manual: true },
];

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
    sponsorable: true,
    lastUpdate: 'تم توثيق الحالة وتحديث بياناتها منذ يومين',
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
    sponsorable: true,
    lastUpdate: 'تم صرف الدعم الدراسي للفصل الأول منذ أسبوع',
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
    sponsorable: false,
    lastUpdate: 'أُجريت جلسة العلاج الثالثة منذ 3 أيام',
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
    sponsorable: true,
    lastUpdate: 'جارٍ استكمال توثيق الحالة',
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
    updates: [
      { date: '2025-05-08', text: 'دخول المحطة مرحلة التركيب والتشغيل التجريبي.' },
      { date: '2025-04-20', text: 'وصول معدات التحلية واكتمال أعمال التجهيز.' },
      { date: '2025-03-30', text: 'اكتمال دراسة الاحتياج واختيار الموقع.' },
    ],
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
    updates: [
      { date: '2025-05-12', text: 'توزيع 1,200 وجبة ساخنة هذا الأسبوع.' },
      { date: '2025-04-28', text: 'تجهيز المطبخ المركزي الثاني.' },
    ],
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
    updates: [
      { date: '2025-05-01', text: 'اعتماد كشوف الطلاب المستحقين للفصل الجديد.' },
    ],
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
  { id: 'd-11', donorName: 'شريف عادل', cause: 'محطة تحلية مياه', amount: 2500, method: 'تحويل بنكي', date: '2025-05-15', recurring: false, status: 'قيد المراجعة' },
  { id: 'd-12', donorName: 'آية مصطفى', cause: 'كفالة أسرة محتاجة', amount: 900, method: 'إنستاباي', date: '2025-05-15', recurring: true, status: 'قيد المراجعة' },
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

export const notifications: AppNotification[] = [
  { id: 'n-1', kind: 'booking', title: 'تم تأكيد موعدك', body: 'تم تأكيد جلسة الاستشارة النفسية مع د. محمد العربي يوم الخميس 11:00 ص.', time: 'منذ 5 دقائق', read: false },
  { id: 'n-2', kind: 'case', title: 'اقتربت حالة من هدفها', body: 'حالة «أسرة رقم 1427» وصلت إلى 62% من المبلغ المطلوب. ساهم في إتمامها.', time: 'منذ ساعة', read: false },
  { id: 'n-3', kind: 'donation', title: 'شكراً لتبرعك', body: 'تم استلام تبرعك بمبلغ 250 ج.م لصالح كفالة أسرة محتاجة. جزاك الله خيراً.', time: 'منذ 3 ساعات', read: false },
  { id: 'n-4', kind: 'project', title: 'تحديث مشروع', body: 'مشروع «محطة تحلية مياه» انتقل إلى مرحلة التركيب والتشغيل.', time: 'أمس', read: true },
  { id: 'n-5', kind: 'system', title: 'تذكير بموعد', body: 'لديك موعد استشارة غداً الساعة 1:00 م. برجاء الحضور في الوقت المحدد.', time: 'أمس', read: true },
  { id: 'n-6', kind: 'donation', title: 'كفالة شهرية', body: 'تم تجديد كفالتك الشهرية للطالبة نور بنجاح.', time: 'منذ يومين', read: true },
];

export const articles: Article[] = [
  {
    id: 'a-caravan-sinai',
    category: 'قافلة',
    title: 'قافلة إغاثية تصل إلى قرى شمال سيناء',
    excerpt: 'وصلت قافلة «أحلى شباب» الإغاثية إلى عدد من القرى الأكثر احتياجاً، حاملةً مساعدات غذائية وطبية.',
    body:
      'في إطار جهودها المستمرة لخدمة المجتمعات الأكثر احتياجاً، نظّمت جمعية خواطر أحلى شباب قافلة إغاثية جديدة وصلت إلى عدد من قرى شمال سيناء. وزّعت القافلة مئات الطرود الغذائية والمستلزمات الطبية، إضافة إلى تنظيم كشوفات طبية مجانية للأهالي.\n\nوأكّد فريق العمل أن هذه القوافل تأتي ضمن خطة الجمعية لتوسيع نطاق خدماتها لتشمل جميع المحافظات، إيماناً منها بأن العطاء رسالة لا تتوقف.',
    date: '2025-05-14',
    location: 'شمال سيناء',
    readMinutes: 3,
    gradient: ['#b98a5e', '#7d5a3c'],
  },
  {
    id: 'a-water-station',
    category: 'نشاط',
    title: 'افتتاح محطة تحلية مياه جديدة في الصعيد',
    excerpt: 'دخلت محطة تحلية مياه جديدة الخدمة لتوفّر مياهاً نقية وآمنة لآلاف الأسر في المناطق النائية.',
    body:
      'احتفلت الجمعية بافتتاح محطة تحلية مياه جديدة ضمن مشروع «سقيا الماء»، لتخدم آلاف الأسر في المناطق التي تعاني من ندرة المياه النظيفة. تعتمد المحطة على أحدث تقنيات التحلية وتضمن استمرارية الخدمة عبر شبكة توزيع فعّالة وصيانة دورية.\n\nيُعدّ هذا الإنجاز خطوة جديدة نحو تحقيق أثر مستدام في حياة المجتمعات.',
    date: '2025-05-08',
    location: 'أسوان',
    readMinutes: 2,
    gradient: ['#8fb4dd', '#5f86b5'],
  },
  {
    id: 'a-students',
    category: 'خبر',
    title: 'انطلاق برنامج كفالة الطلاب للعام الدراسي الجديد',
    excerpt: 'أعلنت الجمعية بدء التسجيل في برنامج كفالة الطلاب المتفوقين غير القادرين لضمان استمرار تعليمهم.',
    body:
      'أطلقت جمعية خواطر أحلى شباب النسخة الجديدة من برنامج كفالة الطلاب، الذي يستهدف دعم الطلاب المتفوقين من الأسر غير القادرة. يشمل البرنامج تغطية المصاريف الدراسية والأدوات التعليمية والدروس الداعمة.\n\nويأتي البرنامج ضمن قناعة الجمعية بأن التعليم هو أقصر الطرق لبناء إنسان ومجتمع أفضل.',
    date: '2025-05-02',
    readMinutes: 2,
    gradient: ['#a7b6d0', '#7186a6'],
  },
  {
    id: 'a-ramadan',
    category: 'مقال',
    title: 'كيف نصنع أثراً مستداماً في حياة الآخرين؟',
    excerpt: 'الأثر الحقيقي لا يُقاس بحجم العطاء بل باستمراريته. نستعرض في هذا المقال فلسفة العمل الخيري المستدام.',
    body:
      'كثيراً ما نربط العمل الخيري بلحظة العطاء العابرة، لكن الأثر الحقيقي يكمن في الاستدامة. حين نوفّر مصدر دخل لأسرة، أو نعلّم طفلاً، أو نبني محطة مياه، فإننا نزرع أثراً يمتد لسنوات.\n\nتؤمن الجمعية بأن التمكين أبقى من المساعدة المؤقتة، ولذلك توجّه جهودها نحو المشروعات التنموية التي تصنع فرقاً دائماً.',
    date: '2025-04-25',
    readMinutes: 4,
    gradient: ['#8aa0bf', '#586f92'],
  },
];

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
