import { useState } from 'react';
import { Plus, Pencil, Copy, Trash2 } from 'lucide-react';
import type { CmsPage, PageTemplate } from '@ahla/shared';
import { Card, Badge, Toggle, Modal, TableWrap, MobileRow, Empty } from '../components/ui';
import { ImagePicker } from '../components/ImagePicker';
import { useCms, cms, mutate } from '../store/cmsStore';

const TEMPLATES: { key: PageTemplate; label: string }[] = [
  { key: 'standard', label: 'صفحة محتوى' },
  { key: 'cards', label: 'بطاقات' },
  { key: 'articles', label: 'قائمة مقالات' },
  { key: 'details', label: 'تفاصيل' },
  { key: 'form', label: 'نموذج' },
  { key: 'faq', label: 'أسئلة شائعة' },
  { key: 'gallery', label: 'معرض صور' },
  { key: 'stats', label: 'إحصاءات' },
  { key: 'custom', label: 'أقسام مخصّصة' },
];
const tplLabel = (t: PageTemplate) => (t === 'native' ? 'شاشة أصلية' : TEMPLATES.find((x) => x.key === t)?.label ?? t);

const sorted = (p: CmsPage[]) => [...p].sort((a, b) => a.sortOrder - b.sortOrder);

export default function CmsPages() {
  const { pages } = useCms();
  const list = sorted(pages);
  const [editing, setEditing] = useState<CmsPage | null>(null);
  const [creating, setCreating] = useState(false);

  const patch = (p: CmsPage, fields: Partial<CmsPage>, action: string) =>
    mutate({ action, entityType: 'صفحة', entityName: p.title }, (d) => {
      const i = d.pages.findIndex((x) => x.id === p.id);
      if (i >= 0) d.pages[i] = { ...d.pages[i], ...fields, updatedAt: new Date().toISOString() };
    });

  const duplicate = (p: CmsPage) =>
    mutate({ action: 'كرّر صفحة', entityType: 'صفحة', entityName: p.title }, (d) => {
      const copy: CmsPage = { ...p, id: cms.newId('pg'), slug: `${p.slug}-copy-${Math.floor(Math.random() * 900 + 100)}`, title: `${p.title} (نسخة)`, builtin: false, template: p.template === 'native' ? 'standard' : p.template, status: 'draft', inSidebar: false, sortOrder: Math.max(...d.pages.map((x) => x.sortOrder)) + 1, sections: p.sections.map((s) => ({ ...s })) };
      d.pages.push(copy);
    });

  const remove = (p: CmsPage) =>
    mutate({ action: 'حذف صفحة', entityType: 'صفحة', entityName: p.title }, (d) => {
      d.pages = d.pages.filter((x) => x.id !== p.id);
    });

  const save = () => {
    if (!editing) return;
    if (creating) {
      mutate({ action: 'أنشأ صفحة', entityType: 'صفحة', entityName: editing.title }, (d) => {
        d.pages.push({ ...editing, id: cms.newId('pg'), builtin: false, sortOrder: Math.max(0, ...d.pages.map((x) => x.sortOrder)) + 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
      });
    } else {
      patch(editing, editing, 'عدّل صفحة');
    }
    setEditing(null);
    setCreating(false);
  };

  const startCreate = () => {
    setCreating(true);
    setEditing({ id: '', slug: '', title: 'صفحة جديدة', navTitle: 'صفحة جديدة', icon: 'file', status: 'draft', visible: true, inSidebar: false, loginRequired: false, template: 'standard', builtin: false, sections: [], sortOrder: 999, createdAt: '', updatedAt: '', description: '', emptyStateText: 'لا يوجد محتوى بعد' });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <span className="text-[13px] text-slate">كل شاشات التطبيق. الشاشات الأصلية تُدار محتواها من الوحدات الأخرى؛ الصفحات المخصّصة تُبنى بأقسام عامة.</span>
        <button className="btn btn-sm" onClick={startCreate}><Plus size={15} /> صفحة جديدة</button>
      </div>

      <Card className="!p-1">
        <div className="hidden md:block">
          <TableWrap>
            <thead>
              <tr>
                <th className="th">الصفحة</th>
                <th className="th">القالب</th>
                <th className="th">الحالة</th>
                <th className="th">في القائمة</th>
                <th className="th">يتطلب دخول</th>
                <th className="th">ظاهرة</th>
                <th className="th">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id} className="hover:bg-paper-2">
                  <td className="td">
                    <b className="text-ink block">{p.title}</b>
                    <span className="text-[11.5px] text-muted num" dir="ltr">/{p.slug}</span>
                  </td>
                  <td className="td"><Badge tone={p.builtin ? 'navy' : 'gold'}>{tplLabel(p.template)}</Badge></td>
                  <td className="td"><Badge tone={p.status === 'published' ? 'green' : 'muted'}>{p.status === 'published' ? 'منشورة' : 'مسودة'}</Badge></td>
                  <td className="td"><Toggle on={p.inSidebar} onChange={() => patch(p, { inSidebar: !p.inSidebar }, p.inSidebar ? 'أزال من القائمة' : 'أضاف للقائمة')} /></td>
                  <td className="td"><Toggle on={p.loginRequired} onChange={() => patch(p, { loginRequired: !p.loginRequired }, 'غيّر شرط الدخول')} /></td>
                  <td className="td"><Toggle on={p.visible} onChange={() => patch(p, { visible: !p.visible }, p.visible ? 'أخفى صفحة' : 'أظهر صفحة')} /></td>
                  <td className="td">
                    <div className="flex gap-1.5">
                      <button title="تعديل" onClick={() => { setCreating(false); setEditing({ ...p }); }} className="w-8 h-8 grid place-items-center rounded-lg border border-line text-navy-700 hover:bg-paper-2"><Pencil size={14} /></button>
                      <button title="تكرار" onClick={() => duplicate(p)} className="w-8 h-8 grid place-items-center rounded-lg border border-line text-navy-700 hover:bg-paper-2"><Copy size={14} /></button>
                      <button title="حذف" disabled={p.builtin} onClick={() => remove(p)} className="w-8 h-8 grid place-items-center rounded-lg border border-line text-danger hover:bg-danger-soft disabled:opacity-30"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </div>
        <div className="md:hidden p-3 flex flex-col gap-2.5">
          {list.map((p) => (
            <MobileRow
              key={p.id}
              title={p.title}
              subtitle={`/${p.slug}`}
              status={<Badge tone={p.status === 'published' ? 'green' : 'muted'}>{p.status === 'published' ? 'منشورة' : 'مسودة'}</Badge>}
              rows={[{ label: 'القالب', value: tplLabel(p.template) }, { label: 'في القائمة', value: p.inSidebar ? 'نعم' : 'لا' }, { label: 'ظاهرة', value: p.visible ? 'نعم' : 'لا' }]}
              actions={<>
                <button title="تعديل" onClick={() => { setCreating(false); setEditing({ ...p }); }} className="w-8 h-8 grid place-items-center rounded-lg border border-line text-navy-700"><Pencil size={14} /></button>
                <button title="تكرار" onClick={() => duplicate(p)} className="w-8 h-8 grid place-items-center rounded-lg border border-line text-navy-700"><Copy size={14} /></button>
                <button title="حذف" disabled={p.builtin} onClick={() => remove(p)} className="w-8 h-8 grid place-items-center rounded-lg border border-line text-danger disabled:opacity-30"><Trash2 size={14} /></button>
              </>}
            />
          ))}
          {list.length === 0 && <Empty text="لا صفحات" />}
        </div>
      </Card>

      <Modal
        open={!!editing}
        title={creating ? 'إنشاء صفحة جديدة' : 'تعديل الصفحة'}
        onClose={() => { setEditing(null); setCreating(false); }}
        footer={<><button className="btn" onClick={save}>حفظ</button><button className="btn btn-outline" onClick={() => { setEditing(null); setCreating(false); }}>إلغاء</button></>}
      >
        {editing && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Labeled label="عنوان الصفحة"><input className="field" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></Labeled>
              <Labeled label="عنوان القائمة"><input className="field" value={editing.navTitle} onChange={(e) => setEditing({ ...editing, navTitle: e.target.value })} /></Labeled>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Labeled label="المعرّف (slug)"><input className="field num" dir="ltr" value={editing.slug} disabled={editing.builtin} onChange={(e) => setEditing({ ...editing, slug: e.target.value.replace(/\s/g, '-') })} /></Labeled>
              <Labeled label="الأيقونة"><input className="field num" dir="ltr" value={editing.icon} onChange={(e) => setEditing({ ...editing, icon: e.target.value })} /></Labeled>
            </div>
            <Labeled label="وصف قصير"><input className="field" value={editing.description ?? ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></Labeled>
            <ImagePicker label="صورة رأس الصفحة (اختياري)" value={editing.headerImageId} onChange={(id) => setEditing({ ...editing, headerImageId: id })} />
            <div className="grid grid-cols-2 gap-4">
              <Labeled label="القالب">
                <select className="field" value={editing.template} disabled={editing.builtin} onChange={(e) => setEditing({ ...editing, template: e.target.value as PageTemplate })}>
                  {editing.builtin && <option value="native">شاشة أصلية</option>}
                  {TEMPLATES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
                </select>
              </Labeled>
              <Labeled label="الحالة">
                <select className="field" value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value as CmsPage['status'] })}>
                  <option value="published">منشورة</option>
                  <option value="draft">مسودة</option>
                </select>
              </Labeled>
            </div>
            <Labeled label="نص الحالة الفارغة"><input className="field" value={editing.emptyStateText ?? ''} onChange={(e) => setEditing({ ...editing, emptyStateText: e.target.value })} /></Labeled>
            <div className="flex items-center justify-end gap-6">
              <label className="flex items-center gap-2"><span className="text-[13px] font-semibold text-navy-700">في القائمة الجانبية</span><Toggle on={editing.inSidebar} onChange={(v) => setEditing({ ...editing, inSidebar: v })} /></label>
              <label className="flex items-center gap-2"><span className="text-[13px] font-semibold text-navy-700">يتطلب دخول</span><Toggle on={editing.loginRequired} onChange={(v) => setEditing({ ...editing, loginRequired: v })} /></label>
            </div>
            {editing.builtin && <div className="text-[12px] text-muted bg-paper-2 rounded-xl px-3.5 py-2.5 text-right">هذه شاشة أصلية — يُدار محتواها من الوحدات المخصّصة (الحالات، المشروعات، الإعدادات…). يمكنك تعديل عنوانها وحالتها وظهورها في القائمة فقط.</div>}
          </div>
        )}
      </Modal>
    </div>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[13px] font-bold text-navy-700 block mb-2 text-right">{label}</label>
      {children}
    </div>
  );
}
