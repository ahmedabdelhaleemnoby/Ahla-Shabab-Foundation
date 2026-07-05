import { useState } from 'react';
import { ChevronDown, ChevronLeft, Plus, ListTree } from 'lucide-react';
import {
  serviceCategories,
  services as seedServices,
  providers,
  type ServiceCategory,
  type Service,
} from '@ahla/shared';
import { Card, Badge, Toggle, Modal, SectionHead } from '../components/ui';

export default function Services() {
  const [cats, setCats] = useState<ServiceCategory[]>(serviceCategories);
  const [svcs, setSvcs] = useState<Service[]>(seedServices);
  const [open, setOpen] = useState<Record<string, boolean>>({ clinics: true });
  const [addCatFor, setAddCatFor] = useState<ServiceCategory | null>(null);
  const [newName, setNewName] = useState('');

  const mains = cats.filter((c) => c.parentId === null);
  const childrenOf = (id: string) => cats.filter((c) => c.parentId === id);
  const servicesOf = (id: string) => svcs.filter((s) => s.categoryId === id);

  const toggle = (id: string) => setCats((prev) => prev.map((c) => (c.id === id ? { ...c, active: !c.active } : c)));

  const addSub = () => {
    if (!addCatFor || !newName.trim()) return;
    const id = `cat-${Date.now()}`;
    setCats((prev) => [...prev, { id, name: newName.trim(), icon: 'circle', parentId: addCatFor.id, active: true }]);
    setNewName('');
    setAddCatFor(null);
    setOpen((o) => ({ ...o, [addCatFor.id]: true }));
  };

  return (
    <div className="flex flex-col gap-5">
      <SectionHead
        title={`الفئات الرئيسية (${mains.length})`}
        action={<button className="btn btn-sm"><Plus size={15} /> فئة رئيسية</button>}
      />

      {mains.map((main) => {
        const subs = childrenOf(main.id);
        const isOpen = open[main.id];
        return (
          <Card key={main.id} className="!p-0 overflow-hidden">
            {/* Main category header */}
            <div className="flex items-center gap-3 p-4">
              <button onClick={() => setOpen((o) => ({ ...o, [main.id]: !o[main.id] }))} className="text-navy-700">
                {isOpen ? <ChevronDown size={18} /> : <ChevronLeft size={18} />}
              </button>
              <div className="w-10 h-10 rounded-xl bg-paper-2 grid place-items-center text-navy-700"><ListTree size={18} /></div>
              <div className="flex-1">
                <b className="text-[15px] text-navy-700">{main.name}</b>
                <div className="text-[12px] text-slate">{subs.length} فئة فرعية · {main.description}</div>
              </div>
              <Badge tone={main.active ? 'green' : 'muted'}>{main.active ? 'مُفعّلة' : 'موقوفة'}</Badge>
              <Toggle on={main.active} onChange={() => toggle(main.id)} />
            </div>

            {/* Subcategories */}
            {isOpen && (
              <div className="border-t border-line-2 bg-paper/40 px-4 py-3 flex flex-col gap-2">
                {subs.map((sub) => (
                  <div key={sub.id} className="bg-white rounded-xl border border-line p-3">
                    <div className="flex items-center gap-3">
                      <b className="text-[13.5px] text-ink flex-1">{sub.name}</b>
                      <span className="text-[12px] text-muted">{servicesOf(sub.id).length} خدمة</span>
                      <Toggle on={sub.active} onChange={() => toggle(sub.id)} />
                    </div>
                    {/* services */}
                    <div className="mt-2 flex flex-col gap-1.5">
                      {servicesOf(sub.id).map((s) => {
                        const p = providers.find((x) => x.id === s.providerId);
                        return (
                          <div key={s.id} className="flex items-center gap-2 text-[13px] px-2 py-1.5 rounded-lg hover:bg-paper-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-navy-300" />
                            <span className="font-semibold text-navy-700">{s.name}</span>
                            <span className="text-muted">· {p?.name}</span>
                            {s.free && <span className="mr-auto"><Badge tone="green">مجاناً</Badge></span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                <button onClick={() => setAddCatFor(main)} className="btn btn-outline btn-sm self-start mt-1">
                  <Plus size={15} /> إضافة فئة فرعية
                </button>
              </div>
            )}
          </Card>
        );
      })}

      <Modal
        open={!!addCatFor}
        title={`إضافة فئة فرعية إلى «${addCatFor?.name ?? ''}»`}
        onClose={() => setAddCatFor(null)}
        footer={
          <>
            <button className="btn" onClick={addSub}>حفظ</button>
            <button className="btn btn-outline" onClick={() => setAddCatFor(null)}>إلغاء</button>
          </>
        }
      >
        <label className="text-[13px] font-bold text-navy-700 block mb-2 text-right">اسم الفئة الفرعية</label>
        <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="مثال: علاج طبيعي" className="field" />
      </Modal>
    </div>
  );
}
