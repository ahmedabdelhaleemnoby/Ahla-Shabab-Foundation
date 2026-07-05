import { Link } from 'react-router-dom';
import { CalendarCheck, Clock, Stethoscope, ListTree, CheckCircle2 } from 'lucide-react';
import { adminBookings, services, providers, colors } from '@ahla/shared';
import { Card, Kpi, SectionHead, Badge, statusTone, MobileRow } from '../components/ui';
import { BarChart, Donut } from '../components/Charts';

const pending = adminBookings.filter((b) => b.status === 'قيد الانتظار').length;
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
