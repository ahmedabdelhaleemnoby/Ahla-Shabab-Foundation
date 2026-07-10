import { Download, FileText, TrendingUp, Percent, CalendarCheck, Wallet, HandCoins, Hourglass } from 'lucide-react';
import { adminBookings, providers, donations, cases, projects, egp, pct, colors } from '@ahla/shared';
import { Card, Kpi, SectionHead, Badge, ProgressCell } from '../components/ui';
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

/* ---- Donations analytics ---- */
const confirmedDonations = donations.filter((d) => d.status === 'مكتمل');
const totalDonated = confirmedDonations.reduce((s, d) => s + d.amount, 0);
const pendingReview = donations.filter((d) => d.status === 'قيد المراجعة' || d.status === 'قيد التأكيد').length;
const avgDonation = confirmedDonations.length ? Math.round(totalDonated / confirmedDonations.length) : 0;
const recurringCount = donations.filter((d) => d.recurring).length;

const methodColors = [colors.navy700, colors.green, colors.gold, colors.navy300, colors.red];
const byMethod = Object.entries(
  donations.reduce<Record<string, number>>((acc, d) => {
    acc[d.method] = (acc[d.method] ?? 0) + 1;
    return acc;
  }, {})
)
  .map(([label, value], i) => ({ label, value, color: methodColors[i % methodColors.length] }))
  .sort((a, b) => b.value - a.value);

const byCause = Object.entries(
  confirmedDonations.reduce<Record<string, number>>((acc, d) => {
    acc[d.cause] = (acc[d.cause] ?? 0) + d.amount;
    return acc;
  }, {})
)
  .map(([label, value]) => ({ label, value: Math.round(value / 1000) }))
  .sort((a, b) => b.value - a.value)
  .slice(0, 6);

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

      {/* ---- Donations ---- */}
      <SectionHead title="تقارير التبرعات" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi icon={Wallet} tone="green" value={egp(totalDonated)} label="إجمالي التبرعات المعتمدة" />
        <Kpi icon={Hourglass} tone="gold" value={String(pendingReview)} label="بانتظار الاعتماد / التأكيد" />
        <Kpi icon={HandCoins} value={egp(avgDonation)} label="متوسط قيمة التبرع" />
        <Kpi icon={TrendingUp} tone="navy" value={String(recurringCount)} label="تبرعات شهرية متكررة" />
      </div>
      <div className="grid lg:grid-cols-[1fr_1fr] gap-4">
        <Card>
          <SectionHead title="التبرعات حسب وسيلة الدفع" />
          <Donut segments={byMethod} />
        </Card>
        <Card>
          <SectionHead title="أعلى الأوجه تحصيلاً (بالألف ج.م)" />
          <RankedBars data={byCause.map((d) => ({ ...d, color: colors.green }))} />
        </Card>
      </div>

      {/* Funding progress of live content */}
      <Card>
        <SectionHead title="نسب تمويل الحالات والمشروعات المنشورة" />
        <div className="flex flex-col gap-3">
          {cases.map((c) => (
            <div key={c.id} className="flex items-center gap-3 flex-wrap">
              <span className="text-[13px] font-bold text-navy-700 w-44 shrink-0 text-right truncate">{c.code}</span>
              <Badge tone={c.tag === 'عاجل' ? 'danger' : 'navy'}>{c.tag}</Badge>
              <div className="flex-1 min-w-[160px]"><ProgressCell percent={pct(c.raisedAmount, c.targetAmount)} color={colors.red} /></div>
              <span className="num text-[12px] text-slate shrink-0">{egp(c.raisedAmount)} / {egp(c.targetAmount)}</span>
            </div>
          ))}
          {projects.map((p) => (
            <div key={p.id} className="flex items-center gap-3 flex-wrap">
              <span className="text-[13px] font-bold text-navy-700 w-44 shrink-0 text-right truncate">{p.title}</span>
              <Badge tone="green">مشروع</Badge>
              <div className="flex-1 min-w-[160px]"><ProgressCell percent={pct(p.raisedAmount, p.targetAmount)} color={colors.green} /></div>
              <span className="num text-[12px] text-slate shrink-0">{egp(p.raisedAmount)} / {egp(p.targetAmount)}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* ---- Bookings ---- */}
      <SectionHead title="تقارير الحجوزات والخدمات" />
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

      {/* Notification performance (stub — TODO(backend): real delivery metrics) */}
      <Card>
        <SectionHead title="أداء الإشعارات" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
          {[['3,420', 'إشعار مُرسل'], ['78%', 'نسبة الفتح'], ['1,120', 'نقرة إلى التطبيق'], ['2.1%', 'إلغاء الاشتراك']].map(([v, l]) => (
            <div key={l} className="rounded-2xl border border-line bg-paper-2/50 py-4">
              <div className="num text-[22px] font-extrabold text-navy-700">{v}</div>
              <div className="text-[12.5px] text-slate mt-1">{l}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
