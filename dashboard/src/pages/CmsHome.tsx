import { useState } from 'react';
import { ChevronUp, ChevronDown, Copy, Trash2, Pencil, Plus, Eye, EyeOff, RotateCcw, Smartphone } from 'lucide-react';
import type { HomeSection, HomeSectionType } from '@ahla/shared';
import { Card, Badge, Toggle, Modal, SectionHead, Empty } from '../components/ui';
import { ImagePicker } from '../components/ImagePicker';
import { useCms, cms, mutate } from '../store/cmsStore';

const TYPE_LABEL: Record<HomeSectionType, string> = {
  hero: 'بانر رئيسي',
  impactStats: 'أرقام الأثر',
  workAreas: 'مناطق العمل',
  quickServices: 'خدمات سريعة',
  urgentCases: 'حالات عاجلة',
  sponsorship: 'اكفل أسرة',
  featuredProjects: 'مشروعات مميزة',
  latestNews: 'أحدث الأخبار',
  consultations: 'الاستشارات',
  donationCta: 'دعوة للتبرع',
  volunteerCta: 'دعوة للتطوع',
  contactCta: 'دعوة للتواصل',
  imageBanner: 'بانر صورة',
  textBlock: 'كتلة نص',
  faqPreview: 'أسئلة شائعة',
  spacer: 'فاصل',
};
const ADDABLE: HomeSectionType[] = ['imageBanner', 'textBlock', 'donationCta', 'volunteerCta', 'contactCta', 'faqPreview', 'spacer'];

const sorted = (home: HomeSection[]) => [...home].sort((a, b) => a.sortOrder - b.sortOrder);

export default function CmsHome() {
  const { home } = useCms();
  const list = sorted(home);
  const [editing, setEditing] = useState<HomeSection | null>(null);
  const [adding, setAdding] = useState(false);

  const move = (id: string, dir: -1 | 1) => {
    const idx = list.findIndex((s) => s.id === id);
    const swap = idx + dir;
    if (swap < 0 || swap >= list.length) return;
    mutate({ action: 'أعاد ترتيب قسماً', entityType: 'قسم رئيسية', entityName: TYPE_LABEL[list[idx].type] }, (d) => {
      const a = d.home.find((s) => s.id === list[idx].id)!;
      const b = d.home.find((s) => s.id === list[swap].id)!;
      const t = a.sortOrder;
      a.sortOrder = b.sortOrder;
      b.sortOrder = t;
    });
  };

  const toggle = (s: HomeSection) =>
    mutate({ action: s.visible ? 'أخفى قسماً' : 'أظهر قسماً', entityType: 'قسم رئيسية', entityName: TYPE_LABEL[s.type] }, (d) => {
      const x = d.home.find((h) => h.id === s.id);
      if (x) x.visible = !x.visible;
    });

  const duplicate = (s: HomeSection) =>
    mutate({ action: 'كرّر قسماً', entityType: 'قسم رئيسية', entityName: TYPE_LABEL[s.type] }, (d) => {
      const copy: HomeSection = { ...s, id: cms.newId('h'), sortOrder: Math.max(...d.home.map((h) => h.sortOrder)) + 1, config: { ...s.config } };
      d.home.push(copy);
    });

  const remove = (s: HomeSection) =>
    mutate({ action: 'حذف قسماً', entityType: 'قسم رئيسية', entityName: TYPE_LABEL[s.type] }, (d) => {
      d.home = d.home.filter((h) => h.id !== s.id);
    });

  const addSection = (type: HomeSectionType) => {
    mutate({ action: 'أضاف قسماً', entityType: 'قسم رئيسية', entityName: TYPE_LABEL[type] }, (d) => {
      d.home.push({ id: cms.newId('h'), type, title: TYPE_LABEL[type], visible: true, audience: 'all', sortOrder: Math.max(0, ...d.home.map((h) => h.sortOrder)) + 1, config: {} });
    });
    setAdding(false);
  };

  const save = () => {
    if (!editing) return;
    mutate({ action: 'عدّل قسماً', entityType: 'قسم رئيسية', entityName: TYPE_LABEL[editing.type] }, (d) => {
      const x = d.home.findIndex((h) => h.id === editing.id);
      if (x >= 0) d.home[x] = editing;
    });
    setEditing(null);
  };

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-5 items-start">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <span className="text-[13px] text-slate">اسحب الأقسام (بالأسهم) لإعادة ترتيب الصفحة الرئيسية للتطبيق.</span>
          <div className="flex gap-2">
            <button className="btn btn-outline btn-sm" onClick={() => cms.resetModule('home')}><RotateCcw size={14} /> إعادة الضبط</button>
            <button className="btn btn-sm" onClick={() => setAdding(true)}><Plus size={15} /> إضافة قسم</button>
          </div>
        </div>

        {list.map((s, i) => (
          <Card key={s.id} className={`flex items-center gap-3 ${s.visible ? '' : 'opacity-60'}`}>
            <div className="flex flex-col">
              <button disabled={i === 0} onClick={() => move(s.id, -1)} className="text-navy-500 disabled:opacity-30"><ChevronUp size={18} /></button>
              <button disabled={i === list.length - 1} onClick={() => move(s.id, 1)} className="text-navy-500 disabled:opacity-30"><ChevronDown size={18} /></button>
            </div>
            <div className="w-9 h-9 rounded-xl bg-paper-2 grid place-items-center num text-[13px] font-extrabold text-navy-700">{i + 1}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <b className="text-[14px] text-navy-700 truncate">{s.title || TYPE_LABEL[s.type]}</b>
                <Badge tone="navy">{TYPE_LABEL[s.type]}</Badge>
                {s.audience !== 'all' && <Badge tone="gold">{s.audience === 'guest' ? 'زائر' : 'مسجّل'}</Badge>}
              </div>
              {s.subtitle && <div className="text-[12px] text-muted mt-0.5 truncate">{s.subtitle}</div>}
            </div>
            <div className="flex items-center gap-1.5">
              <Toggle on={s.visible} onChange={() => toggle(s)} />
              <button title="تعديل" onClick={() => setEditing({ ...s, config: { ...s.config } })} className="w-8 h-8 grid place-items-center rounded-lg border border-line text-navy-700 hover:bg-paper-2"><Pencil size={14} /></button>
              <button title="تكرار" onClick={() => duplicate(s)} className="w-8 h-8 grid place-items-center rounded-lg border border-line text-navy-700 hover:bg-paper-2"><Copy size={14} /></button>
              <button title="حذف" onClick={() => remove(s)} className="w-8 h-8 grid place-items-center rounded-lg border border-line text-danger hover:bg-danger-soft"><Trash2 size={14} /></button>
            </div>
          </Card>
        ))}
        {list.length === 0 && <Empty text="لا توجد أقسام — أضف قسماً للبدء" />}
      </div>

      {/* Live mobile-width preview */}
      <Card className="lg:sticky lg:top-4">
        <SectionHead title="معاينة الرئيسية" action={<Smartphone size={16} className="text-navy-500" />} />
        <div className="mx-auto w-[240px] border-[6px] border-navy-900 rounded-[26px] overflow-hidden bg-paper">
          <div className="bg-navy-800 text-white text-center text-[10px] py-1">خواطر أحلى شباب</div>
          <div className="p-2 flex flex-col gap-1.5 max-h-[440px] overflow-y-auto scroll-thin">
            {list.filter((s) => s.visible).map((s) => (
              <div key={s.id} className={`rounded-lg px-2.5 py-2 text-[10px] font-bold ${previewTone(s.type)}`}>
                {s.title || TYPE_LABEL[s.type]}
                <span className="block text-[8px] font-normal opacity-70">{TYPE_LABEL[s.type]}</span>
              </div>
            ))}
            {list.filter((s) => s.visible).length === 0 && <div className="text-center text-muted text-[10px] py-6">لا أقسام ظاهرة</div>}
          </div>
        </div>
        <p className="text-[11px] text-muted text-center mt-3">الأقسام المخفية لا تظهر في التطبيق.</p>
      </Card>

      {/* Add-section picker */}
      <Modal open={adding} title="إضافة قسم للرئيسية" onClose={() => setAdding(false)}>
        <div className="grid grid-cols-2 gap-2">
          {ADDABLE.map((t) => (
            <button key={t} onClick={() => addSection(t)} className="rounded-xl border border-line px-3 py-3 text-[13px] font-bold text-navy-700 hover:bg-paper-2 flex items-center gap-2">
              <Plus size={14} /> {TYPE_LABEL[t]}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-muted mt-3">أقسام الكيانات (حالات/مشروعات/أخبار) موجودة افتراضياً — يمكنك إظهارها أو إخفاؤها من القائمة.</p>
      </Modal>

      {/* Edit section */}
      <Modal
        open={!!editing}
        title="تعديل القسم"
        onClose={() => setEditing(null)}
        footer={<><button className="btn" onClick={save}>حفظ</button><button className="btn btn-outline" onClick={() => setEditing(null)}>إلغاء</button></>}
      >
        {editing && (
          <div className="flex flex-col gap-4">
            <Labeled label="العنوان"><input className="field" value={editing.title ?? ''} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></Labeled>
            <Labeled label="العنوان الفرعي"><input className="field" value={editing.subtitle ?? ''} onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })} /></Labeled>
            <div className="grid grid-cols-2 gap-4">
              <Labeled label="خلفية">
                <select className="field" value={editing.config.background ?? 'default'} onChange={(e) => setEditing({ ...editing, config: { ...editing.config, background: e.target.value as HomeSection['config']['background'] } })}>
                  {['default', 'navy', 'green', 'gold', 'paper'].map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </Labeled>
              <Labeled label="عدد العناصر"><input className="field num" type="number" value={editing.config.itemCount ?? 0} onChange={(e) => setEditing({ ...editing, config: { ...editing.config, itemCount: +e.target.value || undefined } })} /></Labeled>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Labeled label="التخطيط">
                <select className="field" value={editing.config.layout ?? 'oneColumn'} onChange={(e) => setEditing({ ...editing, config: { ...editing.config, layout: e.target.value as HomeSection['config']['layout'] } })}>
                  <option value="oneColumn">عمود واحد</option>
                  <option value="twoColumn">عمودان</option>
                  <option value="horizontalScroll">تمرير أفقي</option>
                </select>
              </Labeled>
              <Labeled label="الجمهور">
                <select className="field" value={editing.audience} onChange={(e) => setEditing({ ...editing, audience: e.target.value as HomeSection['audience'] })}>
                  <option value="all">الكل</option>
                  <option value="guest">الزوار فقط</option>
                  <option value="registered">المسجّلون فقط</option>
                </select>
              </Labeled>
            </div>
            {(editing.type === 'textBlock' || editing.type === 'imageBanner') && (
              <Labeled label="النص"><textarea className="field min-h-[80px]" value={editing.config.body ?? ''} onChange={(e) => setEditing({ ...editing, config: { ...editing.config, body: e.target.value } })} /></Labeled>
            )}
            <ImagePicker label="صورة القسم (اختياري)" value={editing.config.imageId} onChange={(id) => setEditing({ ...editing, config: { ...editing.config, imageId: id } })} />
          </div>
        )}
      </Modal>
    </div>
  );
}

function previewTone(t: HomeSectionType) {
  if (t === 'hero' || t === 'consultations') return 'bg-navy-800 text-white';
  if (t === 'urgentCases') return 'bg-danger-soft text-danger';
  if (t === 'sponsorship') return 'bg-green-soft text-green-dark';
  if (t === 'spacer') return 'bg-paper-2 text-muted';
  return 'bg-paper-2 text-navy-700';
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[13px] font-bold text-navy-700 block mb-2 text-right">{label}</label>
      {children}
    </div>
  );
}
