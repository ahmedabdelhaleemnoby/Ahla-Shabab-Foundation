import { useMemo, useState, type ReactNode } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { portfolioItems as seed, governorates, foundationStats, type PortfolioItem, type PortfolioType } from '@ahla/shared';
import { Card, Badge, Toggle, Modal, TableWrap, MobileRow, SectionHead } from '../components/ui';

const TYPES: (PortfolioType | 'الكل')[] = ['الكل', 'مشروع', 'حالة', 'قافلة', 'برنامج', 'رحلة', 'مقال'];
const typeTone = (t: PortfolioType) =>
  t === 'مشروع' ? 'navy' : t === 'حالة' ? 'danger' : t === 'مقال' ? 'gold' : 'green';

const blank = (): PortfolioItem => ({ id: '', title: '', type: 'مشروع', governorate: 'القاهرة', date: '2025-05-01', published: true });

export default function Content() {
  const [rows, setRows] = useState<PortfolioItem[]>(seed);
  const [type, setType] = useState<(typeof TYPES)[number]>('الكل');
  const [editing, setEditing] = useState<PortfolioItem | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [impact, setImpact] = useState<Record<string, string | number>>({ ...foundationStats });
  const [impactSaved, setImpactSaved] = useState(true);

  const filtered = useMemo(() => (type === 'الكل' ? rows : rows.filter((r) => r.type === type)), [rows, type]);

  const togglePub = (id: string) => setRows((prev) => prev.map((r) => (r.id === id ? { ...r, published: !r.published } : r)));
  const remove = (id: string) => setRows((prev) => prev.filter((r) => r.id !== id));

  const openNew = () => { setEditing(blank()); setIsNew(true); };
  const openEdit = (item: PortfolioItem) => { setEditing({ ...item }); setIsNew(false); };
  const save = () => {
    if (!editing || !editing.title.trim()) return;
    if (isNew) setRows((prev) => [{ ...editing, id: `pf-${Date.now()}` }, ...prev]);
    else setRows((prev) => prev.map((r) => (r.id === editing.id ? editing : r)));
    setEditing(null);
  };

  return (
    <div className="flex flex-col gap-5">

      {/* Impact numbers editor — feeds the mobile home/about stats.
          TODO(backend): PUT /admin/config/impact. */}
      <Card>
        <SectionHead title="أرقام الأثر (الصفحة الرئيسية للتطبيق)" action={impactSaved ? <Badge tone="green">تم الحفظ</Badge> : <button className="btn btn-sm" onClick={() => setImpactSaved(true)}>حفظ</button>} />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {([['governorates', 'عدد المحافظات'], ['beneficiaries', 'عدد المستفيدين'], ['yearsOfService', 'سنوات العطاء']] as const).map(([k, label]) => (
            <div key={k}>
              <label className="text-[13px] font-bold text-navy-700 block mb-2 text-right">{label}</label>
              <input className="field num" value={String(impact[k])} onChange={(e) => { setImpact({ ...impact, [k]: e.target.value }); setImpactSaved(false); }} />
            </div>
          ))}
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <button key={t} className={`chip ${type === t ? 'chip-on' : ''}`} onClick={() => setType(t)}>{t}</button>
          ))}
        </div>
        <button className="btn btn-sm" onClick={openNew}><Plus size={15} /> محتوى جديد</button>
      </div>

      <Card className="!p-1">
        <div className="hidden md:block">
        <TableWrap>
          <thead>
            <tr>
              <th className="th">العنوان</th>
              <th className="th">النوع</th>
              <th className="th">المحافظة</th>
              <th className="th">التاريخ</th>
              <th className="th">النشر</th>
              <th className="th">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="hover:bg-paper-2">
                <td className="td font-semibold text-ink">{r.title}</td>
                <td className="td"><Badge tone={typeTone(r.type)}>{r.type}</Badge></td>
                <td className="td text-slate">{r.governorate}</td>
                <td className="td num text-slate">{r.date}</td>
                <td className="td">
                  <div className="flex items-center gap-2">
                    <Toggle on={r.published} onChange={() => togglePub(r.id)} />
                    <span className="text-[12px] text-muted">{r.published ? 'منشور' : 'مسودة'}</span>
                  </div>
                </td>
                <td className="td">
                  <div className="flex gap-1.5">
                    <button title="تعديل" onClick={() => openEdit(r)} className="w-8 h-8 grid place-items-center rounded-lg border border-line text-navy-700 hover:bg-paper-2"><Pencil size={14} /></button>
                    <button title="حذف" onClick={() => remove(r.id)} className="w-8 h-8 grid place-items-center rounded-lg border border-line text-danger hover:bg-danger-soft"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td className="td text-center text-muted py-8" colSpan={6}>لا يوجد محتوى</td></tr>}
          </tbody>
        </TableWrap>
        </div>

        {/* Cards (mobile) */}
        <div className="md:hidden p-3 flex flex-col gap-2.5">
          {filtered.map((r) => (
            <MobileRow
              key={r.id}
              title={r.title}
              status={<Badge tone={typeTone(r.type)}>{r.type}</Badge>}
              rows={[
                { label: 'المحافظة', value: r.governorate },
                { label: 'التاريخ', value: <span className="num">{r.date}</span> },
                { label: 'الحالة', value: r.published ? 'منشور' : 'مسودة' },
              ]}
              actions={
                <>
                  <Toggle on={r.published} onChange={() => togglePub(r.id)} />
                  <button title="تعديل" onClick={() => openEdit(r)} className="w-8 h-8 grid place-items-center rounded-lg border border-line text-navy-700 hover:bg-paper-2"><Pencil size={14} /></button>
                  <button title="حذف" onClick={() => remove(r.id)} className="w-8 h-8 grid place-items-center rounded-lg border border-line text-danger hover:bg-danger-soft"><Trash2 size={14} /></button>
                </>
              }
            />
          ))}
          {filtered.length === 0 && <div className="text-center text-muted py-8">لا يوجد محتوى</div>}
        </div>
      </Card>

      <Modal
        open={!!editing}
        title={isNew ? 'إضافة محتوى جديد' : 'تعديل المحتوى'}
        onClose={() => setEditing(null)}
        footer={
          <>
            <button className="btn" onClick={save}>حفظ</button>
            <button className="btn btn-outline" onClick={() => setEditing(null)}>إلغاء</button>
          </>
        }
      >
        {editing && (
          <div className="flex flex-col gap-4">
            <Labeled label="العنوان">
              <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="field" placeholder="عنوان المحتوى" />
            </Labeled>
            <div className="grid grid-cols-2 gap-4">
              <Labeled label="النوع">
                <select value={editing.type} onChange={(e) => setEditing({ ...editing, type: e.target.value as PortfolioType })} className="field">
                  {TYPES.filter((t) => t !== 'الكل').map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </Labeled>
              <Labeled label="المحافظة">
                <select value={editing.governorate} onChange={(e) => setEditing({ ...editing, governorate: e.target.value })} className="field">
                  <option value="—">—</option>
                  {governorates.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </Labeled>
            </div>
            <Labeled label="التاريخ">
              <input type="date" value={editing.date} onChange={(e) => setEditing({ ...editing, date: e.target.value })} className="field" />
            </Labeled>
            <label className="flex items-center gap-2 justify-end">
              <span className="text-[13px] font-semibold text-navy-700">نشر مباشرة</span>
              <Toggle on={editing.published} onChange={(v) => setEditing({ ...editing, published: v })} />
            </label>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Labeled({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="text-[13px] font-bold text-navy-700 block mb-2 text-right">{label}</label>
      {children}
    </div>
  );
}
