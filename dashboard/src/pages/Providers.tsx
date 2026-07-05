import { useState } from 'react';
import { Plus, Star, CalendarDays, Clock } from 'lucide-react';
import { providers as seed, services, serviceCategories, type Provider } from '@ahla/shared';
import { Card, Badge, Toggle, SectionHead } from '../components/ui';

const WEEK = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

const catNameOfService = (serviceId: string) => {
  const s = services.find((x) => x.id === serviceId);
  const cat = s ? serviceCategories.find((c) => c.id === s.categoryId) : undefined;
  return cat?.name ?? '';
};

export default function Providers() {
  const [rows, setRows] = useState<(Provider & { available: boolean })[]>(
    seed.map((p) => ({ ...p, available: true }))
  );

  const toggle = (id: string) => setRows((prev) => prev.map((p) => (p.id === id ? { ...p, available: !p.available } : p)));

  return (
    <div className="flex flex-col gap-5">
      <SectionHead
        title={`مقدمو الخدمة (${rows.length})`}
        action={<button className="btn btn-sm"><Plus size={15} /> إضافة مقدم خدمة</button>}
      />

      <div className="grid md:grid-cols-2 gap-4">
        {rows.map((p) => {
          const assigned = services.filter((s) => s.providerId === p.id);
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
                <div className="text-[12px] text-muted mb-1.5 flex items-center gap-1.5"><span>الخدمات المسندة</span></div>
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
                <button className="btn btn-outline btn-sm">تعديل الجدول</button>
                <button className="btn btn-outline btn-sm">إسناد خدمة</button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
