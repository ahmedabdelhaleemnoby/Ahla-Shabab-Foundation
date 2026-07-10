import { useState, type ReactNode } from 'react';
import { ChevronDown, ChevronLeft, Plus, Pencil, Trash2, ListTree } from 'lucide-react';
import {
  serviceCategories,
  services as seedServices,
  providers,
  type ServiceCategory,
  type Service,
} from '@ahla/shared';
import { Card, Badge, Toggle, Modal, SectionHead } from '../components/ui';

/* Full CRUD over the services catalog the app books from.
   TODO(backend): /admin/categories + /admin/services endpoints. */

const blankService = (categoryId: string): Service => ({
  id: '', name: '', description: '', categoryId, providerId: providers[0].id, free: true,
});

export default function Services() {
  const [cats, setCats] = useState<ServiceCategory[]>(serviceCategories);
  const [svcs, setSvcs] = useState<Service[]>(seedServices);
  const [open, setOpen] = useState<Record<string, boolean>>({ clinics: true });

  // modals
  const [addCatFor, setAddCatFor] = useState<ServiceCategory | 'main' | null>(null);
  const [newName, setNewName] = useState('');
  const [editingSvc, setEditingSvc] = useState<Service | null>(null);
  const [isNewSvc, setIsNewSvc] = useState(false);

  const mains = cats.filter((c) => c.parentId === null);
  const childrenOf = (id: string) => cats.filter((c) => c.parentId === id);
  const servicesOf = (id: string) => svcs.filter((s) => s.categoryId === id);
  const subCats = cats.filter((c) => c.parentId !== null);

  const toggle = (id: string) => setCats((prev) => prev.map((c) => (c.id === id ? { ...c, active: !c.active } : c)));

  const addCat = () => {
    if (!addCatFor || !newName.trim()) return;
    const parentId = addCatFor === 'main' ? null : addCatFor.id;
    setCats((prev) => [...prev, { id: `cat-${Date.now()}`, name: newName.trim(), icon: 'circle', parentId, active: true }]);
    if (parentId) setOpen((o) => ({ ...o, [parentId]: true }));
    setNewName('');
    setAddCatFor(null);
  };

  const saveSvc = () => {
    if (!editingSvc || !editingSvc.name.trim()) return;
    if (isNewSvc) setSvcs((prev) => [...prev, { ...editingSvc, id: `sv-${Date.now()}` }]);
    else setSvcs((prev) => prev.map((s) => (s.id === editingSvc.id ? editingSvc : s)));
    setEditingSvc(null);
  };

  return (
    <div className="flex flex-col gap-5">
      <SectionHead
        title={`الفئات الرئيسية (${mains.length})`}
        action={
          <div className="flex gap-2">
            <button className="btn btn-outline btn-sm" onClick={() => { setEditingSvc(blankService(subCats[0]?.id ?? '')); setIsNewSvc(true); }}>
              <Plus size={15} /> خدمة جديدة
            </button>
            <button className="btn btn-sm" onClick={() => { setAddCatFor('main'); setNewName(''); }}><Plus size={15} /> فئة رئيسية</button>
          </div>
        }
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
                <div className="text-[12px] text-slate">{subs.length} فئة فرعية{main.description ? ` · ${main.description}` : ''}</div>
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
                            <span className="text-muted flex-1 truncate">· {p?.name}</span>
                            {s.free && <Badge tone="green">مجاناً</Badge>}
                            <button title="تعديل" onClick={() => { setEditingSvc({ ...s }); setIsNewSvc(false); }} className="w-7 h-7 grid place-items-center rounded-lg border border-line text-navy-700 hover:bg-paper-2"><Pencil size={13} /></button>
                            <button title="حذف" onClick={() => setSvcs((prev) => prev.filter((x) => x.id !== s.id))} className="w-7 h-7 grid place-items-center rounded-lg border border-line text-danger hover:bg-danger-soft"><Trash2 size={13} /></button>
                          </div>
                        );
                      })}
                      {servicesOf(sub.id).length === 0 && <span className="text-[12px] text-muted px-2">لا توجد خدمات بعد</span>}
                    </div>
                    <button
                      onClick={() => { setEditingSvc(blankService(sub.id)); setIsNewSvc(true); }}
                      className="text-[12px] font-bold text-navy-500 mt-1.5 inline-flex items-center gap-1"
                    >
                      <Plus size={13} /> خدمة في «{sub.name}»
                    </button>
                  </div>
                ))}
                <button onClick={() => { setAddCatFor(main); setNewName(''); }} className="btn btn-outline btn-sm self-start mt-1">
                  <Plus size={15} /> إضافة فئة فرعية
                </button>
              </div>
            )}
          </Card>
        );
      })}

      {/* Add category */}
      <Modal
        open={!!addCatFor}
        title={addCatFor === 'main' ? 'إضافة فئة رئيسية' : `إضافة فئة فرعية إلى «${addCatFor?.name ?? ''}»`}
        onClose={() => setAddCatFor(null)}
        footer={<><button className="btn" onClick={addCat}>حفظ</button><button className="btn btn-outline" onClick={() => setAddCatFor(null)}>إلغاء</button></>}
      >
        <label className="text-[13px] font-bold text-navy-700 block mb-2 text-right">اسم الفئة</label>
        <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="مثال: علاج طبيعي" className="field" />
      </Modal>

      {/* Add / edit service */}
      <Modal
        open={!!editingSvc}
        title={isNewSvc ? 'إضافة خدمة جديدة' : 'تعديل الخدمة'}
        onClose={() => setEditingSvc(null)}
        footer={<><button className="btn" onClick={saveSvc}>حفظ</button><button className="btn btn-outline" onClick={() => setEditingSvc(null)}>إلغاء</button></>}
      >
        {editingSvc && (
          <div className="flex flex-col gap-4">
            <Labeled label="اسم الخدمة"><input className="field" value={editingSvc.name} onChange={(e) => setEditingSvc({ ...editingSvc, name: e.target.value })} placeholder="مثال: كشف باطنة عام" /></Labeled>
            <Labeled label="الوصف (يظهر في التطبيق)"><textarea className="field min-h-[70px]" value={editingSvc.description} onChange={(e) => setEditingSvc({ ...editingSvc, description: e.target.value })} /></Labeled>
            <div className="grid grid-cols-2 gap-4">
              <Labeled label="الفئة الفرعية">
                <select className="field" value={editingSvc.categoryId} onChange={(e) => setEditingSvc({ ...editingSvc, categoryId: e.target.value })}>
                  {subCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Labeled>
              <Labeled label="مقدم الخدمة">
                <select className="field" value={editingSvc.providerId} onChange={(e) => setEditingSvc({ ...editingSvc, providerId: e.target.value })}>
                  {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </Labeled>
            </div>
            <div className="flex items-center justify-end gap-6">
              <label className="flex items-center gap-2">
                <span className="text-[13px] font-semibold text-navy-700">تتطلب رقماً قومياً</span>
                <Toggle on={!!editingSvc.requireNationalId} onChange={(v) => setEditingSvc({ ...editingSvc, requireNationalId: v || undefined })} />
              </label>
              <label className="flex items-center gap-2">
                <span className="text-[13px] font-semibold text-navy-700">مجانية</span>
                <Toggle on={editingSvc.free} onChange={(v) => setEditingSvc({ ...editingSvc, free: v })} />
              </label>
            </div>
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
