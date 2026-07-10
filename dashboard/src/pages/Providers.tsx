import { useState, type ReactNode } from 'react';
import { Plus, Star, CalendarDays, Clock, X } from 'lucide-react';
import { providers as seed, services as seedServices, serviceCategories, type Provider, type Service } from '@ahla/shared';
import { Card, Badge, Toggle, Modal, SectionHead } from '../components/ui';

const WEEK = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const SLOT_CHOICES = ['9:00 ص', '10:00 ص', '11:00 ص', '12:00 م', '1:00 م', '2:00 م', '3:00 م', '4:00 م', '5:00 م', '6:00 م'];

type Row = Provider & { available: boolean };

const blank = (): Row => ({
  id: '', name: '', specialization: '', bio: '', yearsExperience: 1, rating: 5, reviews: 0,
  availableDays: [0, 1, 2], slots: ['10:00 ص', '11:00 ص'], unavailableDates: [],
  gradient: ['#8296b5', '#4d6386'], available: true,
});

export default function Providers() {
  const [rows, setRows] = useState<Row[]>(seed.map((p) => ({ ...p, available: true })));
  const [svcs, setSvcs] = useState<Service[]>(seedServices);
  const [editing, setEditing] = useState<Row | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [assignFor, setAssignFor] = useState<Row | null>(null);

  const toggle = (id: string) => setRows((prev) => prev.map((p) => (p.id === id ? { ...p, available: !p.available } : p)));

  const save = () => {
    if (!editing || !editing.name.trim() || !editing.specialization.trim()) return;
    if (editing.availableDays.length === 0 || editing.slots.length === 0) return;
    if (isNew) setRows((prev) => [{ ...editing, id: `pr-${Date.now()}` }, ...prev]);
    else setRows((prev) => prev.map((r) => (r.id === editing.id ? editing : r)));
    setEditing(null);
  };

  return (
    <div className="flex flex-col gap-5">
      <SectionHead
        title={`مقدمو الخدمة (${rows.length})`}
        action={<button className="btn btn-sm" onClick={() => { setEditing(blank()); setIsNew(true); }}><Plus size={15} /> إضافة مقدم خدمة</button>}
      />

      <div className="grid md:grid-cols-2 gap-4">
        {rows.map((p) => {
          const assigned = svcs.filter((s) => s.providerId === p.id);
          return (
            <Card key={p.id} className="flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <div className="w-14 h-14 rounded-xl shrink-0" style={{ background: `linear-gradient(150deg, ${p.gradient[0]}, ${p.gradient[1]})` }} />
                <div className="flex-1 min-w-0">
                  <b className="text-[15px] text-navy-700 block">{p.name}</b>
                  <div className="text-[12.5px] text-slate">{p.specialization}</div>
                  <div className="flex items-center gap-3 mt-1 text-[12px]">
                    <span className="text-gold font-bold flex items-center gap-1"><Star size={12} fill="currentColor" /> {p.rating}</span>
                    <span className="text-muted">{p.reviews} تقييم</span>
                    <span className="text-muted">· {p.yearsExperience} سنة خبرة</span>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Toggle on={p.available} onChange={() => toggle(p.id)} />
                  <span className="text-[10px] text-muted">{p.available ? 'متاح' : 'موقوف'}</span>
                </div>
              </div>

              {/* Assigned services */}
              <div>
                <div className="text-[12px] text-muted mb-1.5">الخدمات المسندة</div>
                <div className="flex flex-wrap gap-1.5">
                  {assigned.map((s) => (
                    <span key={s.id} className="text-[11.5px] font-semibold px-2.5 py-1 rounded-full bg-paper-2 text-navy-700">
                      {s.name}
                    </span>
                  ))}
                  {assigned.length === 0 && <span className="text-[12px] text-muted">لا توجد خدمات مسندة</span>}
                </div>
              </div>

              {/* Schedule */}
              <div className="border-t border-line-2 pt-3 grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[12px] text-muted mb-1.5 flex items-center gap-1.5"><CalendarDays size={13} /> أيام العمل</div>
                  <div className="flex flex-wrap gap-1">
                    {p.availableDays.map((d) => (
                      <span key={d} className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-navy-700 text-white">{WEEK[d]}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[12px] text-muted mb-1.5 flex items-center gap-1.5"><Clock size={13} /> المواعيد المتاحة</div>
                  <div className="flex flex-wrap gap-1">
                    {p.slots.map((s) => (
                      <span key={s} className="num text-[11px] font-semibold px-2 py-0.5 rounded-md border border-line text-slate">{s}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 border-t border-line-2 pt-3">
                <button className="btn btn-outline btn-sm" onClick={() => { setEditing({ ...p, availableDays: [...p.availableDays], slots: [...p.slots] }); setIsNew(false); }}>تعديل البيانات والجدول</button>
                <button className="btn btn-outline btn-sm" onClick={() => setAssignFor(p)}>إسناد خدمة</button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Add / edit provider */}
      <Modal
        open={!!editing}
        title={isNew ? 'إضافة مقدم خدمة' : `تعديل «${editing?.name ?? ''}»`}
        onClose={() => setEditing(null)}
        footer={<><button className="btn" onClick={save}>حفظ</button><button className="btn btn-outline" onClick={() => setEditing(null)}>إلغاء</button></>}
      >
        {editing && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Labeled label="الاسم"><input className="field" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="د. ..." /></Labeled>
              <Labeled label="التخصص"><input className="field" value={editing.specialization} onChange={(e) => setEditing({ ...editing, specialization: e.target.value })} placeholder="استشاري ..." /></Labeled>
            </div>
            <Labeled label="نبذة (تظهر في التطبيق)"><textarea className="field min-h-[64px]" value={editing.bio} onChange={(e) => setEditing({ ...editing, bio: e.target.value })} /></Labeled>
            <Labeled label="سنوات الخبرة">
              <input className="field num" type="number" value={editing.yearsExperience} onChange={(e) => setEditing({ ...editing, yearsExperience: +e.target.value || 1 })} />
            </Labeled>
            <Labeled label="أيام العمل">
              <div className="flex flex-wrap gap-1.5">
                {WEEK.map((d, i) => {
                  const on = editing.availableDays.includes(i);
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setEditing({ ...editing, availableDays: on ? editing.availableDays.filter((x) => x !== i) : [...editing.availableDays, i].sort() })}
                      className={`text-[12px] font-bold px-3 py-1.5 rounded-full border transition-colors ${on ? 'bg-navy-700 text-white border-navy-700' : 'bg-white text-slate border-line'}`}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </Labeled>
            <Labeled label="المواعيد المتاحة">
              <div className="flex flex-wrap gap-1.5">
                {SLOT_CHOICES.map((s) => {
                  const on = editing.slots.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setEditing({ ...editing, slots: on ? editing.slots.filter((x) => x !== s) : [...editing.slots, s] })}
                      className={`num text-[12px] font-bold px-3 py-1.5 rounded-full border transition-colors ${on ? 'bg-navy-700 text-white border-navy-700' : 'bg-white text-slate border-line'}`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </Labeled>
            {(editing.availableDays.length === 0 || editing.slots.length === 0) && (
              <div className="text-[12px] text-danger text-right">اختر يوم عمل وموعداً واحداً على الأقل حتى يظهر المقدم في حجوزات التطبيق.</div>
            )}
          </div>
        )}
      </Modal>

      {/* Assign services */}
      <Modal
        open={!!assignFor}
        title={`إسناد خدمات إلى «${assignFor?.name ?? ''}»`}
        onClose={() => setAssignFor(null)}
        footer={<button className="btn" onClick={() => setAssignFor(null)}>تم</button>}
      >
        {assignFor && (
          <div className="flex flex-col gap-2">
            {svcs.map((s) => {
              const cat = serviceCategories.find((c) => c.id === s.categoryId);
              const mine = s.providerId === assignFor.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSvcs((prev) => prev.map((x) => (x.id === s.id ? { ...x, providerId: mine ? x.providerId : assignFor.id } : x)))}
                  className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-right transition-colors ${mine ? 'border-navy-700 bg-paper-2' : 'border-line bg-white hover:bg-paper-2/60'}`}
                >
                  <div className="flex-1 min-w-0">
                    <b className="text-[13.5px] text-navy-700 block truncate">{s.name}</b>
                    <span className="text-[11.5px] text-muted">{cat?.name}</span>
                  </div>
                  {mine ? <Badge tone="navy">مُسندة</Badge> : <span className="text-[12px] font-bold text-navy-500 shrink-0">إسناد ←</span>}
                  {mine && (
                    <span
                      role="button"
                      title="إلغاء الإسناد"
                      onClick={(e) => { e.stopPropagation(); setSvcs((prev) => prev.map((x) => (x.id === s.id ? { ...x, providerId: '' } : x))); }}
                      className="w-7 h-7 grid place-items-center rounded-lg border border-line text-danger hover:bg-danger-soft"
                    >
                      <X size={13} />
                    </span>
                  )}
                </button>
              );
            })}
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
