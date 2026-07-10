import { Link } from 'react-router-dom';
import { CalendarCheck, Clock, Stethoscope, ListTree, CheckCircle2, Wallet, Inbox as InboxIcon } from 'lucide-react';
import { adminBookings, services, providers, donations, volunteerApplications, contactMessages, appConfig, colors } from '@ahla/shared';
import { Card, Kpi, SectionHead, Badge, statusTone, MobileRow } from '../components/ui';
import { BarChart, Donut } from '../components/Charts';

const pending = adminBookings.filter((b) => b.status === 'قيد الانتظار').length;
const pendingDonations = donations.filter((d) => d.status === 'قيد المراجعة' || d.status === 'قيد التأكيد').length;
const newInbox =
  volunteerApplications.filter((v) => v.status === 'جديد').length +
  contactMessages.filter((m) => m.status === 'جديدة').length;
const confirmed = adminBookings.filter((b) => b.status === 'مؤكد').length;
const completed = adminBookings.filter((b) => b.status === 'مكتمل').length;

// bookings over the week (mock distribution)
const byDay = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'].map((label, i) => ({
  label,
  value: [4, 7, 5, 9, 6, 8][i],
}));

const catColors: Record<string, string> = {
  'العيادات الطبية': colors.navy700,
  'الاستشارات والإرشاد': colors.green,
  'الدعم التعليمي': colors.gold,
  'الخدمات الاجتماعية': colors.navy300,
};
const byCategory = Object.entries(
  adminBookings.reduce<Record<string, number>>((acc, b) => {
    acc[b.categoryName] = (acc[b.categoryName] ?? 0) + 1;
    return acc;
  }, {})
).map(([label, value]) => ({ label, value, color: catColors[label] ?? colors.navy500 }));

export default function Overview() {
  return (
    <div className="flex flex-col gap-5">
      {/* Hero — same visual language as the app's home header */}
      <div className="rounded-card p-5 sm:p-6 text-white bg-gradient-to-bl from-navy-800 to-navy-900 flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-white grid place-items-center shrink-0">
            <img src="/logo.png" alt="" className="w-11 h-11 object-contain" />
          </div>
          <div className="min-w-0">
            <b className="text-[18px] sm:text-[20px] font-extrabold block leading-tight">{appConfig.heroTitle}</b>
            <span className="text-[12.5px] text-[#cfe0f5]">كل ما يظهر في التطبيق يُدار من هذه اللوحة — محتوى وخدمات وتبرعات وإشعارات.</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Link to="/donations" className="flex items-center gap-2 bg-white text-navy-700 font-bold text-[12.5px] rounded-full px-4 py-2">
            <Wallet size={14} /> تبرعات بانتظار الاعتماد <span className="num bg-danger text-white rounded-full px-1.5 text-[11px]">{pendingDonations}</span>
          </Link>
          <Link to="/bookings" className="flex items-center gap-2 border-[1.5px] border-white/60 text-white font-bold text-[12.5px] rounded-full px-4 py-2">
            <Clock size={14} /> حجوزات بانتظار التأكيد <span className="num bg-gold text-navy-900 rounded-full px-1.5 text-[11px]">{pending}</span>
          </Link>
          <Link to="/inbox" className="flex items-center gap-2 border-[1.5px] border-white/60 text-white font-bold text-[12.5px] rounded-full px-4 py-2">
            <InboxIcon size={14} /> وارد جديد <span className="num bg-white text-navy-900 rounded-full px-1.5 text-[11px]">{newInbox}</span>
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi icon={CalendarCheck} value={String(adminBookings.length)} label="إجمالي الحجوزات" delta={{ text: '12%', up: true }} />
        <Kpi icon={Clock} tone="gold" value={String(pending)} label="بانتظار التأكيد" />
        <Kpi icon={CheckCircle2} tone="green" value={String(confirmed + completed)} label="مؤكدة / مكتملة" delta={{ text: '8%', up: true }} />
        <Kpi icon={Stethoscope} value={String(providers.length)} label="مقدمو الخدمة" />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-4">
        <Card>
          <SectionHead title="الحجوزات خلال الأسبوع" />
          <BarChart data={byDay} />
        </Card>
        <Card>
          <SectionHead title="الحجوزات حسب الفئة" />
          <Donut segments={byCategory} />
        </Card>
      </div>

      {/* Recent bookings + active services */}
      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-4">
        <Card>
          <SectionHead title="أحدث الحجوزات" action={<Link to="/bookings" className="btn btn-outline btn-sm">عرض الكل</Link>} />
          <div className="overflow-x-auto scroll-thin hidden md:block">
            <table className="w-full border-collapse text-[14px] min-w-[520px]">
              <thead>
                <tr>
                  <th className="th">المرجع</th>
                  <th className="th">المستفيد</th>
                  <th className="th">الخدمة</th>
                  <th className="th">الموعد</th>
                  <th className="th">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {adminBookings.slice(0, 6).map((b) => (
                  <tr key={b.reference} className="hover:bg-paper-2">
                    <td className="td num font-bold text-navy-700">{b.reference}</td>
                    <td className="td">{b.applicantName}</td>
                    <td className="td text-slate">{b.serviceName}</td>
                    <td className="td num text-slate">{b.date} · {b.time}</td>
                    <td className="td"><Badge tone={statusTone(b.status)}>{b.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Cards (mobile) */}
          <div className="md:hidden flex flex-col gap-2.5">
            {adminBookings.slice(0, 6).map((b) => (
              <MobileRow
                key={b.reference}
                title={b.applicantName}
                subtitle={b.reference}
                status={<Badge tone={statusTone(b.status)}>{b.status}</Badge>}
                rows={[
                  { label: 'الخدمة', value: b.serviceName },
                  { label: 'الموعد', value: <span className="num">{b.date} · {b.time}</span> },
                ]}
              />
            ))}
          </div>
        </Card>

        <Card>
          <SectionHead title="الخدمات النشطة" action={<Link to="/services" className="btn btn-outline btn-sm"><ListTree size={15} /> إدارة</Link>} />
          <div className="flex flex-col gap-3">
            {services.slice(0, 6).map((s) => {
              const p = providers.find((x) => x.id === s.providerId);
              return (
                <div key={s.id} className="flex items-center justify-between border-b border-line-2 pb-3 last:border-0 last:pb-0">
                  <div className="min-w-0">
                    <b className="text-[13.5px] text-navy-700 block truncate">{s.name}</b>
                    <span className="text-[12px] text-slate">{p?.name}</span>
                  </div>
                  <Badge tone="green">مجاناً</Badge>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
