import { Download, FileText, TrendingUp, Percent, CalendarCheck } from 'lucide-react';
import { adminBookings, providers, colors } from '@ahla/shared';
import { Card, Kpi, SectionHead } from '../components/ui';
import { RankedBars, Donut } from '../components/Charts';
import { exportCsv } from '../lib/csv';

const countBy = (key: (b: (typeof adminBookings)[number]) => string) =>
  Object.entries(
    adminBookings.reduce<Record<string, number>>((acc, b) => {
      const k = key(b);
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    }, {})
  )
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

const byCategory = countBy((b) => b.categoryName);
const byProvider = countBy((b) => b.providerName).slice(0, 6);
const byGov = countBy((b) => b.governorate).slice(0, 6);

const statusColors: Record<string, string> = {
  مؤكد: colors.navy700,
  مكتمل: colors.green,
  'قيد الانتظار': colors.gold,
  ملغي: colors.red,
  'لم يحضر': colors.navy300,
};
const byStatus = countBy((b) => b.status).map((s) => ({ ...s, color: statusColors[s.label] ?? colors.navy500 }));

const total = adminBookings.length;
const completed = adminBookings.filter((b) => b.status === 'مكتمل').length;
const noShow = adminBookings.filter((b) => b.status === 'لم يحضر').length;
const utilization = Math.round((completed / total) * 100);

export default function Reports() {
  const exportSummary = () =>
    exportCsv(
      'report-by-category.csv',
      ['الفئة', 'عدد الحجوزات'],
      byCategory.map((c) => [c.label, c.value])
    );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          <button className="btn btn-sm" onClick={exportSummary}><Download size={15} /> تصدير Excel</button>
          <button className="btn btn-outline btn-sm"><FileText size={15} /> تصدير PDF</button>
        </div>
        <span className="text-[13px] text-slate">الفترة: مايو 2025</span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi icon={CalendarCheck} value={String(total)} label="إجمالي الحجوزات" />
        <Kpi icon={TrendingUp} tone="green" value={String(completed)} label="جلسات مكتملة" />
        <Kpi icon={Percent} tone="navy" value={`${utilization}%`} label="معدل الإنجاز" />
        <Kpi icon={Percent} tone="danger" value={String(noShow)} label="حالات عدم حضور" />
      </div>

      <div className="grid lg:grid-cols-[1fr_1fr] gap-4">
        <Card>
          <SectionHead title="الحجوزات حسب الفئة" />
          <RankedBars data={byCategory.map((d) => ({ ...d, color: colors.navy700 }))} />
        </Card>
        <Card>
          <SectionHead title="توزيع الحالات" />
          <Donut segments={byStatus} />
        </Card>
      </div>

      <div className="grid lg:grid-cols-[1fr_1fr] gap-4">
        <Card>
          <SectionHead title="الأكثر طلباً — مقدمو الخدمة" />
          <RankedBars data={byProvider.map((d) => ({ ...d, color: colors.green }))} />
        </Card>
        <Card>
          <SectionHead title="الحجوزات حسب المحافظة" />
          <RankedBars data={byGov.map((d) => ({ ...d, color: colors.navy500 }))} />
        </Card>
      </div>

      <Card>
        <SectionHead title="ملخص استغلال الخدمات" />
        <div className="text-[13.5px] text-slate leading-relaxed">
          إجمالي مقدمي الخدمة <b className="text-navy-700 num">{providers.length}</b> ·
          متوسط الحجوزات لكل مقدم <b className="text-navy-700 num">{(total / providers.length).toFixed(1)}</b> ·
          أعلى فئة طلباً <b className="text-navy-700">{byCategory[0]?.label}</b> بعدد <b className="text-navy-700 num">{byCategory[0]?.value}</b> حجز.
        </div>
      </Card>
    </div>
  );
}
