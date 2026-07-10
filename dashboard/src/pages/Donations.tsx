import { useMemo, useState } from 'react';
import { Check, X, Download, Wallet, Clock, FileSearch, BadgeCheck } from 'lucide-react';
import { donations as seed, paymentMethods, type Donation, type DonationStatus } from '@ahla/shared';
import { Card, Badge, Kpi, TableWrap, MobileRow } from '../components/ui';
import { exportCsv } from '../lib/csv';

/**
 * Donations & receipts module. Gateway donations stay «قيد التأكيد/قيد المعالجة»
 * until the payment server confirms; manual methods (bank transfer / InstaPay)
 * stay «قيد المراجعة» until an admin approves them HERE. The mobile app never
 * marks a donation successful on its own.
 */
const STATUSES: (DonationStatus | 'الكل')[] = ['الكل', 'قيد المراجعة', 'قيد المعالجة', 'مكتمل', 'فشل'];

const tone = (s: DonationStatus) => (s === 'مكتمل' ? 'green' : s === 'فشل' ? 'danger' : 'gold') as 'green' | 'danger' | 'gold';

export default function Donations() {
  const [rows, setRows] = useState<Donation[]>(seed);
  const [status, setStatus] = useState<(typeof STATUSES)[number]>('الكل');
  const [q, setQ] = useState('');

  const filtered = useMemo(
    () =>
      rows.filter(
        (d) =>
          (status === 'الكل' || d.status === status) &&
          (q === '' || d.donorName.includes(q) || d.cause.includes(q))
      ),
    [rows, status, q]
  );

  const setStatusFor = (id: string, s: DonationStatus) => {
    // TODO(backend): PATCH /admin/donations/:id/status + activity-log entry.
    setRows((prev) => prev.map((d) => (d.id === id ? { ...d, status: s } : d)));
  };

  const confirmedTotal = rows.filter((d) => d.status === 'مكتمل').reduce((s, d) => s + d.amount, 0);
  const pendingReview = rows.filter((d) => d.status === 'قيد المراجعة').length;
  const pendingGateway = rows.filter((d) => d.status === 'قيد المعالجة' || d.status === 'قيد التأكيد').length;

  const doExport = () =>
    exportCsv(
      'donations.csv',
      ['المتبرع', 'الوجهة', 'المبلغ', 'الطريقة', 'التاريخ', 'شهري', 'الحالة'],
      filtered.map((d) => [d.donorName, d.cause, d.amount, d.method, d.date, d.recurring ? 'نعم' : 'لا', d.status])
    );

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi icon={BadgeCheck} tone="green" value={`${confirmedTotal.toLocaleString('en-US')} ج.م`} label="إجمالي التبرعات المعتمدة" />
        <Kpi icon={FileSearch} tone="gold" value={String(pendingReview)} label="بانتظار مراجعة الإدارة" />
        <Kpi icon={Clock} value={String(pendingGateway)} label="بانتظار تأكيد بوابة الدفع" />
        <Kpi icon={Wallet} value={String(paymentMethods.filter((m) => m.availability === 'متاحة').length)} label="وسائل دفع مفعّلة" />
      </div>

      {pendingReview > 0 && (
        <div className="rounded-2xl border border-line bg-gold-soft/60 px-4 py-3 text-[13.5px] text-[#7a5210]">
          يوجد <b className="num">{pendingReview}</b> تبرع تحويل بنكي/إنستاباي بانتظار الاعتماد — لا يُحتسب أي تبرع في الإجماليات قبل اعتماده.
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button key={s} className={`chip ${status === s ? 'chip-on' : ''}`} onClick={() => setStatus(s)}>
            {s} {s !== 'الكل' && <span className="num">({rows.filter((d) => d.status === s).length})</span>}
          </button>
        ))}
      </div>

      <Card className="!p-0">
        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-line-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث بالمتبرع أو الوجهة..." className="field !w-auto flex-1 min-w-[200px]" />
          <button className="btn btn-sm" onClick={doExport}><Download size={15} /> تصدير CSV</button>
        </div>

        <div className="p-1 hidden md:block">
          <TableWrap>
            <thead>
              <tr>
                <th className="th">المتبرع</th>
                <th className="th">الوجهة</th>
                <th className="th">المبلغ</th>
                <th className="th">الطريقة</th>
                <th className="th">التاريخ</th>
                <th className="th">النوع</th>
                <th className="th">الحالة</th>
                <th className="th">إجراء</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id} className="hover:bg-paper-2">
                  <td className="td font-semibold">{d.donorName}</td>
                  <td className="td text-slate">{d.cause}</td>
                  <td className="td num font-bold text-navy-700">{d.amount.toLocaleString('en-US')} ج.م</td>
                  <td className="td text-slate">{d.method}</td>
                  <td className="td num text-slate">{d.date}</td>
                  <td className="td"><Badge tone={d.recurring ? 'navy' : 'muted'}>{d.recurring ? 'شهري' : 'مرة واحدة'}</Badge></td>
                  <td className="td"><Badge tone={tone(d.status)}>{d.status}</Badge></td>
                  <td className="td">
                    {d.status === 'قيد المراجعة' ? (
                      <div className="flex gap-1.5">
                        <button onClick={() => setStatusFor(d.id, 'مكتمل')} className="btn btn-sm !bg-green">اعتماد <Check size={14} /></button>
                        <button onClick={() => setStatusFor(d.id, 'فشل')} className="btn btn-outline btn-sm !text-danger !border-danger">رفض <X size={14} /></button>
                      </div>
                    ) : (
                      <span className="text-[12px] text-muted">{d.status === 'مكتمل' ? 'معتمد' : d.status === 'فشل' ? 'مرفوض/فاشل' : 'بانتظار البوابة'}</span>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td className="td text-center text-muted py-8" colSpan={8}>لا توجد تبرعات مطابقة</td></tr>}
            </tbody>
          </TableWrap>
        </div>

        {/* Cards (mobile) */}
        <div className="md:hidden p-3 flex flex-col gap-2.5">
          {filtered.map((d) => (
            <MobileRow
              key={d.id}
              title={d.donorName}
              subtitle={`${d.date} · ${d.method}`}
              status={<Badge tone={tone(d.status)}>{d.status}</Badge>}
              rows={[
                { label: 'الوجهة', value: d.cause },
                { label: 'المبلغ', value: <span className="num font-bold">{d.amount.toLocaleString('en-US')} ج.م</span> },
                { label: 'النوع', value: d.recurring ? 'شهري' : 'مرة واحدة' },
              ]}
              actions={
                d.status === 'قيد المراجعة' ? (
                  <>
                    <button onClick={() => setStatusFor(d.id, 'مكتمل')} className="btn btn-sm !bg-green">اعتماد <Check size={14} /></button>
                    <button onClick={() => setStatusFor(d.id, 'فشل')} className="btn btn-outline btn-sm !text-danger !border-danger">رفض <X size={14} /></button>
                  </>
                ) : undefined
              }
            />
          ))}
          {filtered.length === 0 && <div className="text-center text-muted py-8">لا توجد تبرعات مطابقة</div>}
        </div>
      </Card>
    </div>
  );
}
