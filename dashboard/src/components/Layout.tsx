import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarCheck,
  Wallet,
  ListTree,
  Stethoscope,
  FolderKanban,
  Users,
  BarChart3,
  ShieldCheck,
  BellRing,
  Inbox as InboxIcon,
  Settings as SettingsIcon,
  LayoutTemplate,
  PanelRightClose,
  Files,
  Images,
  FormInput,
  Wrench,
  Search,
  Bell,
  Menu,
  X,
  type LucideIcon,
} from 'lucide-react';
import { donorProfile } from '@ahla/shared';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  title: string;
  sub: string;
  /** Renders a group heading above this item in the sidebar. */
  groupStart?: string;
}

export const NAV: NavItem[] = [
  { to: '/', label: 'لوحة المعلومات', icon: LayoutDashboard, title: 'لوحة المعلومات', sub: 'ملخص أداء المنصة والحجوزات' },
  { to: '/bookings', label: 'الحجوزات', icon: CalendarCheck, title: 'إدارة الحجوزات', sub: 'متابعة وتأكيد وإعادة جدولة المواعيد', groupStart: 'العمليات' },
  { to: '/donations', label: 'التبرعات والإيصالات', icon: Wallet, title: 'التبرعات والإيصالات', sub: 'اعتماد التحويلات اليدوية ومتابعة تأكيدات الدفع' },
  { to: '/services', label: 'الخدمات والفئات', icon: ListTree, title: 'الخدمات والفئات', sub: 'فئات متعددة المستويات وخدمات قابلة للحجز' },
  { to: '/providers', label: 'مقدمو الخدمة', icon: Stethoscope, title: 'مقدمو الخدمة', sub: 'الأطباء والمستشارون وجداول المواعيد' },
  { to: '/content', label: 'إدارة المحتوى', icon: FolderKanban, title: 'إدارة المحتوى', sub: 'المشروعات والحالات والقوافل والمقالات' },
  { to: '/users', label: 'المستخدمون', icon: Users, title: 'المستخدمون', sub: 'المستفيدون وسجل حجوزاتهم' },
  { to: '/notifications', label: 'الإشعارات', icon: BellRing, title: 'إشعارات التطبيق', sub: 'إرسال إشعارات للمستخدمين ومتابعة السجل' },
  { to: '/inbox', label: 'صندوق الوارد', icon: InboxIcon, title: 'صندوق الوارد', sub: 'طلبات التطوع ورسائل تواصل معنا من التطبيق' },
  { to: '/cms/home', label: 'بناء الرئيسية', icon: LayoutTemplate, title: 'بناء الصفحة الرئيسية', sub: 'إضافة وإخفاء وترتيب أقسام الرئيسية في التطبيق', groupStart: 'إدارة التطبيق (CMS)' },
  { to: '/cms/menu', label: 'القائمة الجانبية', icon: PanelRightClose, title: 'إدارة القائمة الجانبية', sub: 'مجموعات وعناصر قائمة البرجر داخل التطبيق' },
  { to: '/cms/pages', label: 'صفحات التطبيق', icon: Files, title: 'إدارة صفحات التطبيق', sub: 'كل الشاشات + إنشاء صفحات مخصّصة' },
  { to: '/cms/media', label: 'مكتبة الوسائط', icon: Images, title: 'مكتبة الوسائط', sub: 'رفع وإدارة الصور المستخدمة في التطبيق' },
  { to: '/cms/forms', label: 'نماذج الاستشارات', icon: FormInput, title: 'منشئ نماذج الاستشارات', sub: 'أنواع الاستشارات وحقول النماذج التي يراها المستخدم' },
  { to: '/cms/tools', label: 'أدوات النظام', icon: Wrench, title: 'أدوات وحفظ CMS', sub: 'تصدير/استيراد/إعادة ضبط بيانات العرض' },
  { to: '/reports', label: 'التقارير', icon: BarChart3, title: 'التقارير والإحصاءات', sub: 'تحليلات التبرعات والحجوزات والخدمات', groupStart: 'التحليلات والإعداد' },
  { to: '/settings', label: 'إعدادات التطبيق', icon: SettingsIcon, title: 'إعدادات التطبيق', sub: 'التحكم في كل ما يظهر للمستخدم داخل التطبيق' },
  { to: '/roles', label: 'الأدوار والصلاحيات', icon: ShieldCheck, title: 'الأدوار والصلاحيات', sub: 'مستويات الوصول وسجل النشاط' },
];

/** Sidebar contents, shared by the desktop column and the mobile drawer. */
function SidebarInner({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      <div className="flex items-center gap-3 px-2 pt-1.5 pb-5">
        <img src="/logo.png" alt="جمعية خواطر أحلى شباب" className="w-10 h-10 rounded-xl bg-white p-1 object-contain" />
        <div>
          <b className="text-[15px] font-extrabold block leading-tight">خواطر أحلى شباب</b>
          <span className="text-[11px] text-navy-300 font-semibold">لوحة التحكم</span>
        </div>
      </div>

      <nav className="flex flex-col gap-1 overflow-y-auto scroll-thin">
        {NAV.map((n) => (
          <div key={n.to}>
            {n.groupStart && (
              <div className="text-[10.5px] font-bold text-navy-300 px-3.5 pt-3 pb-1 tracking-wide">{n.groupStart}</div>
            )}
            <NavLink
              to={n.to}
              end={n.to === '/'}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[14px] font-semibold transition-colors ${
                  isActive ? 'bg-white/[.12] text-white' : 'text-[#C6D4E8] hover:bg-white/[.07] hover:text-white'
                }`
              }
            >
              <n.icon size={18} className="shrink-0" />
              {n.label}
            </NavLink>
          </div>
        ))}
      </nav>

      <div className="mt-auto flex items-center gap-2.5 p-3 rounded-2xl bg-white/[.06] border border-white/[.12]">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#c3d1e8] to-[#8ba0c2] shrink-0" />
        <div className="min-w-0">
          <b className="text-[13px] block truncate">{donorProfile.name}</b>
          <span className="text-[11px] text-navy-300">مدير عام</span>
        </div>
      </div>
    </>
  );
}

export function Layout() {
  const { pathname } = useLocation();
  const current = NAV.find((n) => n.to === pathname) ?? NAV[0];
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="grid grid-cols-1 md:grid-cols-[248px_1fr] min-h-screen">
      {/* Desktop sidebar (right column in RTL) */}
      <aside className="hidden md:flex flex-col gap-1.5 p-4 sticky top-0 h-screen text-white bg-gradient-to-b from-navy-800 to-navy-900">
        <SidebarInner />
      </aside>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-[rgba(20,40,74,.5)]" onClick={() => setMenuOpen(false)} />
          <aside className="absolute top-0 right-0 h-full w-[264px] flex flex-col gap-1.5 p-4 text-white bg-gradient-to-b from-navy-800 to-navy-900 shadow-raised">
            <button
              onClick={() => setMenuOpen(false)}
              aria-label="إغلاق القائمة"
              className="absolute top-4 left-4 w-9 h-9 grid place-items-center rounded-lg bg-white/10 text-white hover:bg-white/20"
            >
              <X size={18} />
            </button>
            <SidebarInner onNavigate={() => setMenuOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="min-w-0 flex flex-col">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-4 md:px-7 py-3.5 bg-paper/90 backdrop-blur border-b border-line sticky top-0 z-20">
          {/* Title row (with hamburger + bell on mobile) */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => setMenuOpen(true)}
              aria-label="فتح القائمة"
              className="md:hidden w-10 h-10 rounded-xl bg-white border border-line grid place-items-center text-navy-700 shrink-0"
            >
              <Menu size={20} />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-[19px] md:text-[22px] font-extrabold text-ink m-0 truncate">{current.title}</h1>
              <div className="text-[12.5px] md:text-[13px] text-slate mt-0.5 truncate">{current.sub}</div>
            </div>
            <button className="md:hidden relative w-10 h-10 rounded-xl bg-white border border-line grid place-items-center text-navy-700 shrink-0">
              <Bell size={18} />
              <span className="absolute -top-1 -left-1 bg-danger text-white text-[9px] font-extrabold w-4 h-4 rounded-full grid place-items-center border-2 border-paper">4</span>
            </button>
          </div>

          {/* Search row (full width on mobile, inline on desktop) + desktop bell */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-white border border-line rounded-full px-4 py-2 text-muted w-full md:w-auto md:min-w-[220px]">
              <Search size={16} className="shrink-0" />
              <input placeholder="بحث..." className="border-0 outline-none bg-transparent text-[13.5px] text-ink text-right w-full" />
            </div>
            <button className="hidden md:grid relative w-10 h-10 rounded-xl bg-white border border-line place-items-center text-navy-700 shrink-0">
              <Bell size={18} />
              <span className="absolute -top-1 -left-1 bg-danger text-white text-[9px] font-extrabold w-4 h-4 rounded-full grid place-items-center border-2 border-paper">4</span>
            </button>
          </div>
        </header>

        {/* Demo persistence badge — CMS edits are local to this browser */}
        <div className="flex items-center gap-2 justify-center bg-gold-soft text-[#8A5B10] text-[11.5px] font-bold px-4 py-1.5 border-b border-[#EAD9A8]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#B9791A]" />
          نسخة عرض — يتم حفظ التعديلات على هذا الجهاز فقط
        </div>

        <main className="p-4 sm:p-6 lg:p-7 max-w-[1200px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
