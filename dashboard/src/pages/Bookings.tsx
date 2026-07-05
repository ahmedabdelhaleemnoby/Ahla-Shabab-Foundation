import { useMemo, useState, type ReactNode } from 'react';
import { Download, Check, X, RotateCcw, Eye } from 'lucide-react';
import {
  adminBookings as seed,
  bookingStatuses,
  serviceCategories,
  providers,
  governorates,
  type AdminBooking,
  type ServiceBookingStatus,
} from '@ahla/shared';
import { Card, Badge, statusTone, Modal, TableWrap, MobileRow } from '../components/ui';
import { exportCsv } from '../lib/csv';

const mainCategories = serviceCategories.filter((c) => c.parentId === null);

export default function Bookings() {
  const [rows, setRows] = useState<AdminBooking[]>(seed);
  const [status, setStatus] = useState<ServiceBookingStatus | 'الكل'>('الكل');
  const [category, setCategory] = useState('الكل');
  const [provider, setProvider] = useState('الكل');
  const [gov, setGov] = useState('الكل');
  const [q, setQ] = useState('');
  const [detail, setDetail] = useState<AdminBooking | null>(null);

  const filtered = useMemo(
    () =>
      rows.filter(
        (b) =>
          (status === 'الكل' || b.status === status) &&
          (category === 'الكل' || b.categoryName === category) &&
          (provider === 'الكل' || b.providerName === provider) &&
          (gov === 'الكل' || b.governorate === gov) &&
          (q === '' || b.applicantName.includes(q) || b.phone.includes(q) || b.reference.includes(q))
      ),
    [rows, status, category, provider, gov, q]
  );

  const setStatusFor = (ref: string, s: ServiceBookingStatus) =>
    setRows((prev) => prev.map((b) => (b.reference === ref ? { ...b, status: s } : b)));

  const doExport = () =>
    exportCsv(
      'bookings.csv',
      ['المرجع', 'المستفيد', 'الهاتف', 'الخدمة', 'الفئة', 'مقدم الخدمة', 'المحافظة', 'التاريخ', 'الوقت', 'الحالة'],
      filtered.map((b) => [b.reference, b.applicantName, b.phone, b.serviceName, b.categoryName, b.providerName, b.governorate, b.date, b.time, b.status])
    );

  const counts = bookingStatuses.map((s) => ({ s, n: rows.filter((b) => b.status === s).length }));

  return (
    <div className="flex flex-col gap-5">
      {/* Status summary chips */}
      <div className="flex flex-wrap gap-2">
        <button className={`chip ${status === 'الكل' ? 'chip-on' : ''}`} onClick={() => setStatus('الكل')}>
          الكل <span className="num">({rows.length})</span>
        </button>
        {counts.map(({ s, n }) => (
          <button key={s} className={`chip ${status === s ? 'chip-on' : ''}`} onClick={() => setStatus(s)}>
            {s} <span className="num">({n})</span>
          </button>
        ))}
      </div>

      <Card className="!p-0">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-line-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث بالاسم أو الهاتف أو المرجع..." className="field !w-auto flex-1 min-w-[200px]" />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="field !w-auto">
            <option value="الكل">كل الفئات</option>
            {mainCategories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
          <select value={provider} onChange={(e) => setProvider(e.target.value)} className="field !w-auto">
            <option value="الكل">كل المقدمين</option>
            {providers.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
          </select>
          <select value={gov} onChange={(e) => setGov(e.target.value)} className="field !w-auto">
            <option value="الكل">كل المحافظات</option>
            {governorates.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          <button className="btn btn-sm" onClick={doExport}><Download size={15} /> تصدير CSV</button>
        </div>

        {/* Table (desktop) */}
        <div className="p-1 hidden md:block">
          <TableWrap>
            <thead>
              <tr>
                <th className="th">المرجع</th>
                <th className="th">المستفيد</th>
                <th className="th">الخدمة</th>
                <th className="th">مقدم الخدمة</th>
                <th className="th">المحافظة</th>
                <th className="th">الموعد</th>
                <th className="th">الحالة</th>
                <th className="th">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.reference} className="hover:bg-paper-2">
                  <td className="td num font-bold text-navy-700">{b.reference}</td>
                  <td className="td">
                    <div className="font-semibold">{b.applicantName}</div>
                    <div className="num text-[12px] text-muted">{b.phone}</div>
                  </td>
                  <td className="td text-slate">{b.serviceName}</td>
                  <td className="td text-slate">{b.providerName}</td>
                  <td className="td text-slate">{b.governorate}</td>
                  <td className="td num text-slate">{b.date} · {b.time}</td>
                  <td className="td"><Badge tone={statusTone(b.status)}>{b.status}</Badge></td>
                  <td className="td">
                    <div className="flex items-center gap-1.5">
                      <IconBtn title="تفاصيل" onClick={() => setDetail(b)}><Eye size={15} /></IconBtn>
                      <IconBtn title="تأكيد" tone="green" onClick={() => setStatusFor(b.reference, 'مؤكد')}><Check size={15} /></IconBtn>
                      <IconBtn title="إعادة جدولة" tone="gold" onClick={() => setStatusFor(b.reference, 'قيد الانتظار')}><RotateCcw size={14} /></IconBtn>
                      <IconBtn title="إلغاء" tone="danger" onClick={() => setStatusFor(b.reference, 'ملغي')}><X size={15} /></IconBtn>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td className="td text-center text-muted py-8" colSpan={8}>لا توجد حجوزات مطابقة</td></tr>
              )}
            </tbody>
          </TableWrap>
        </div>

        {/* Cards (mobile) */}
        <div className="md:hidden p-3 flex flex-col gap-2.5">
          {filtered.map((b) => (
            <MobileRow
              key={b.reference}
              title={b.applicantName}
              subtitle={b.phone}
              status={<Badge tone={statusTone(b.status)}>{b.status}</Badge>}
              rows={[
                { label: 'المرجع', value: <span className="num">{b.reference}</span> },
                { label: 'الخدمة', value: b.serviceName },
                { label: 'المحافظة', value: b.governorate },
                { label: 'الموعد', value: <span className="num">{b.date} · {b.time}</span> },
              ]}
              actions={
                <>
                  <IconBtn title="تفاصيل" onClick={() => setDetail(b)}><Eye size={15} /></IconBtn>
                  <IconBtn title="تأكيد" tone="green" onClick={() => setStatusFor(b.reference, 'مؤكد')}><Check size={15} /></IconBtn>
                  <IconBtn title="إعادة جدولة" tone="gold" onClick={() => setStatusFor(b.reference, 'قيد الانتظار')}><RotateCcw size={14} /></IconBtn>
                  <IconBtn title="إلغاء" tone="danger" onClick={() => setStatusFor(b.reference, 'ملغي')}><X size={15} /></IconBtn>
                </>
              }
            />
          ))}
          {filtered.length === 0 && <div className="text-center text-muted py-8">لا توجد حجوزات مطابقة</div>}
        </div>
      </Card>

      {/* Detail modal */}
      <Modal open={!!detail} title={`تفاصيل الحجز · ${detail?.reference ?? ''}`} onClose={() => setDetail(null)}>
        {detail && (
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-[13.5px]">
            <Field label="المستفيد" value={detail.applicantName} />
            <Field label="الهاتف" value={detail.phone} num />
            <Field label="العمر" value={`${detail.age} سنة`} />
            <Field label="النوع" value={detail.gender} />
            <Field label="المحافظة" value={detail.governorate} />
            <Field label="المدينة" value={detail.city ?? '—'} />
            <Field label="الخدمة" value={detail.serviceName} />
            <Field label="مقدم الخدمة" value={detail.providerName} />
            <Field label="التاريخ" value={detail.date} num />
            <Field label="الوقت" value={detail.time} />
            <div className="col-span-2">
              <div className="text-muted mb-1">ملاحظات</div>
              <div className="text-ink">{detail.notes || '—'}</div>
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <span className="text-muted">الحالة:</span>
              <Badge tone={statusTone(detail.status)}>{detail.status}</Badge>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function IconBtn({ children, onClick, title, tone = 'navy' }: { children: ReactNode; onClick: () => void; title: string; tone?: 'navy' | 'green' | 'gold' | 'danger' }) {
  const map = { navy: 'text-navy-700 hover:bg-paper-2', green: 'text-green hover:bg-green-soft', gold: 'text-[#B9791A] hover:bg-gold-soft', danger: 'text-danger hover:bg-danger-soft' };
  return (
    <button title={title} onClick={onClick} className={`w-8 h-8 grid place-items-center rounded-lg border border-line ${map[tone]}`}>
      {children}
    </button>
  );
}

function Field({ label, value, num }: { label: string; value: string; num?: boolean }) {
  return (
    <div>
      <div className="text-muted mb-0.5">{label}</div>
      <div className={`text-ink font-semibold ${num ? 'num' : ''}`}>{value}</div>
    </div>
  );
}
