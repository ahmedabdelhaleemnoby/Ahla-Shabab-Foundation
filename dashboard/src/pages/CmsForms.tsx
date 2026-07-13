import { useState } from 'react';
import { ChevronUp, ChevronDown, Plus, Pencil, Trash2, Smartphone, Settings2, ListChecks } from 'lucide-react';
import type { ConsultationTypeConfig, FormField, FormFieldType } from '@ahla/shared';
import { Card, Badge, Toggle, Modal, SectionHead, Empty } from '../components/ui';
import { ImagePicker } from '../components/ImagePicker';
import { useCms, cms, forms } from '../store/cmsStore';

const TYPE_LABEL: Record<FormFieldType, string> = {
  text: 'نص', textarea: 'نص طويل', phone: 'هاتف', whatsapp: 'واتساب', email: 'بريد', number: 'رقم', age: 'عمر',
  governorate: 'محافظة', radio: 'اختيار واحد', checkbox: 'مربعات', multiselect: 'متعدد', date: 'تاريخ', time: 'وقت',
  file: 'ملف (عرض)', info: 'معلومة', consent: 'موافقة',
};
const ADDABLE: FormFieldType[] = ['text', 'textarea', 'phone', 'whatsapp', 'email', 'number', 'age', 'governorate', 'radio', 'checkbox', 'multiselect', 'date', 'time', 'file', 'info', 'consent'];
const NEEDS_OPTIONS = (t: FormFieldType) => t === 'radio' || t === 'checkbox' || t === 'multiselect';

const sortF = (f: FormField[]) => [...f].sort((a, b) => a.sortOrder - b.sortOrder);

export default function CmsForms() {
  const { consultations } = useCms();
  const list = [...consultations].sort((a, b) => a.sortOrder - b.sortOrder);
  const [activeId, setActiveId] = useState<string | null>(list[0]?.id ?? null);
  const active = list.find((c) => c.id === activeId) ?? list[0];

  const [editType, setEditType] = useState<ConsultationTypeConfig | null>(null);
  const [editField, setEditField] = useState<FormField | null>(null);
  const [addingField, setAddingField] = useState(false);

  const saveType = () => {
    if (!editType) return;
    forms.updateType(editType.id, editType, editType.name);
    setEditType(null);
  };

  const openAddField = () => {
    setAddingField(true);
    setEditField({ id: cms.newId('fld'), key: `field_${Math.floor(Math.random() * 900 + 100)}`, type: 'text', label: 'حقل جديد', required: false, hidden: false, sortOrder: 999 });
  };

  const saveField = () => {
    if (!editField || !active) return;
    if (addingField) forms.addField(active.id, editField);
    else forms.updateField(active.id, editField);
    setEditField(null);
    setAddingField(false);
  };

  return (
    <div className="grid lg:grid-cols-[220px_1fr_300px] gap-5 items-start">
      {/* Type list */}
      <Card className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between mb-1">
          <b className="text-[14px] text-navy-700">أنواع الاستشارات</b>
          <button className="w-7 h-7 grid place-items-center rounded-lg border border-line text-navy-700 hover:bg-paper-2" onClick={() => forms.addType()}><Plus size={14} /></button>
        </div>
        {list.map((c) => (
          <button key={c.id} onClick={() => setActiveId(c.id)} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-right ${activeId === c.id ? 'bg-navy-700 text-white' : 'text-navy-700 hover:bg-paper-2'}`}>
            <span className="flex-1 text-[13px] font-bold truncate">{c.name}</span>
            {!c.visible && <span className={`text-[9px] ${activeId === c.id ? 'text-white/70' : 'text-muted'}`}>مخفية</span>}
          </button>
        ))}
        {list.length === 0 && <Empty text="لا أنواع" />}
      </Card>

      {/* Field builder for the active type */}
      {active ? (
        <div className="flex flex-col gap-4">
          <Card className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <b className="text-[15px] text-navy-700">{active.name}</b>
                <Badge tone={active.status === 'published' ? 'green' : 'muted'}>{active.status === 'published' ? 'منشورة' : 'مسودة'}</Badge>
                {active.homeVisible && <Badge tone="navy">في الرئيسية</Badge>}
              </div>
              <div className="text-[12px] text-slate mt-0.5">{active.description || '—'}</div>
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => setEditType({ ...active })}><Settings2 size={14} /> إعدادات النوع</button>
            <button className="btn btn-outline btn-sm !text-danger !border-danger" onClick={() => { forms.removeType(active.id, active.name); setActiveId(null); }}><Trash2 size={14} /></button>
          </Card>

          <div className="flex items-center justify-between">
            <span className="text-[13px] font-bold text-navy-700 flex items-center gap-1.5"><ListChecks size={15} /> حقول النموذج ({active.fields.length})</span>
            <button className="btn btn-sm" onClick={openAddField}><Plus size={14} /> إضافة حقل</button>
          </div>

          {sortF(active.fields).map((f, i, arr) => (
            <Card key={f.id} className={`flex items-center gap-3 ${f.hidden ? 'opacity-50' : ''}`}>
              <div className="flex flex-col">
                <button disabled={i === 0} onClick={() => forms.moveField(active.id, f.id, -1)} className="text-navy-500 disabled:opacity-30"><ChevronUp size={16} /></button>
                <button disabled={i === arr.length - 1} onClick={() => forms.moveField(active.id, f.id, 1)} className="text-navy-500 disabled:opacity-30"><ChevronDown size={16} /></button>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <b className="text-[13.5px] text-ink truncate">{f.label}</b>
                  <Badge tone="navy">{TYPE_LABEL[f.type]}</Badge>
                  {f.required && <Badge tone="danger">مطلوب</Badge>}
                  {f.showIfKey && <Badge tone="gold">شرطي</Badge>}
                </div>
                <span className="text-[11px] text-muted num" dir="ltr">{f.key}{f.options?.length ? ` · ${f.options.length} خيارات` : ''}</span>
              </div>
              <button title="تعديل" onClick={() => { setAddingField(false); setEditField({ ...f, options: f.options ? [...f.options] : undefined }); }} className="w-8 h-8 grid place-items-center rounded-lg border border-line text-navy-700 hover:bg-paper-2"><Pencil size={14} /></button>
              <button title="حذف" onClick={() => forms.removeField(active.id, f.id, f.label)} className="w-8 h-8 grid place-items-center rounded-lg border border-line text-danger hover:bg-danger-soft"><Trash2 size={14} /></button>
            </Card>
          ))}
          {active.fields.length === 0 && <Empty text="لا حقول — أضف حقلاً للبدء" />}
        </div>
      ) : (
        <Empty text="اختر نوع استشارة" />
      )}

      {/* Live form preview */}
      {active && (
        <Card className="lg:sticky lg:top-4">
          <SectionHead title="معاينة النموذج" action={<Smartphone size={16} className="text-navy-500" />} />
          <div className="mx-auto w-[248px] border-[6px] border-navy-900 rounded-[26px] overflow-hidden bg-paper">
            <div className="bg-navy-800 text-white text-center text-[10px] py-1.5">استشارة {active.key}</div>
            <div className="p-2.5 flex flex-col gap-2 max-h-[440px] overflow-y-auto scroll-thin">
              {sortF(active.fields).filter((f) => !f.hidden).map((f) => <FieldPreview key={f.id} f={f} />)}
              {active.fields.filter((f) => !f.hidden).length === 0 && <div className="text-center text-muted text-[10px] py-6">لا حقول ظاهرة</div>}
              <div className="bg-navy-700 text-white text-center text-[10px] font-bold rounded-full py-2 mt-1">إرسال الطلب</div>
            </div>
          </div>
          <p className="text-[11px] text-muted text-center mt-3">هكذا يظهر النموذج داخل التطبيق.</p>
        </Card>
      )}

      {/* Type settings modal */}
      <Modal
        open={!!editType}
        title="إعدادات نوع الاستشارة"
        onClose={() => setEditType(null)}
        footer={<><button className="btn" onClick={saveType}>حفظ</button><button className="btn btn-outline" onClick={() => setEditType(null)}>إلغاء</button></>}
      >
        {editType && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Labeled label="الاسم"><input className="field" value={editType.name} onChange={(e) => setEditType({ ...editType, name: e.target.value })} /></Labeled>
              <Labeled label="المفتاح (يظهر في العنوان)"><input className="field" value={editType.key} onChange={(e) => setEditType({ ...editType, key: e.target.value })} /></Labeled>
            </div>
            <Labeled label="الأيقونة (Feather)"><input className="field num" dir="ltr" value={editType.icon} onChange={(e) => setEditType({ ...editType, icon: e.target.value })} /></Labeled>
            <ImagePicker label="صورة النوع (اختياري)" value={editType.imageId} onChange={(id) => setEditType({ ...editType, imageId: id })} />
            <Labeled label="الوصف"><textarea className="field min-h-[60px]" value={editType.description} onChange={(e) => setEditType({ ...editType, description: e.target.value })} /></Labeled>
            <Labeled label="إخلاء المسؤولية (Disclaimer)"><textarea className="field min-h-[60px]" value={editType.disclaimer} onChange={(e) => setEditType({ ...editType, disclaimer: e.target.value })} /></Labeled>
            <div className="grid grid-cols-2 gap-4">
              <Labeled label="الحالة">
                <select className="field" value={editType.status} onChange={(e) => setEditType({ ...editType, status: e.target.value as ConsultationTypeConfig['status'] })}>
                  <option value="published">منشورة</option>
                  <option value="draft">مسودة</option>
                </select>
              </Labeled>
              <div className="flex flex-col justify-end gap-2 pb-1">
                <label className="flex items-center gap-2 justify-end"><span className="text-[13px] font-semibold text-navy-700">ظاهرة</span><Toggle on={editType.visible} onChange={(v) => setEditType({ ...editType, visible: v })} /></label>
                <label className="flex items-center gap-2 justify-end"><span className="text-[13px] font-semibold text-navy-700">في الرئيسية</span><Toggle on={editType.homeVisible} onChange={(v) => setEditType({ ...editType, homeVisible: v })} /></label>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Field editor modal */}
      <Modal
        open={!!editField}
        title={addingField ? 'إضافة حقل' : 'تعديل الحقل'}
        onClose={() => { setEditField(null); setAddingField(false); }}
        footer={<><button className="btn" onClick={saveField}>حفظ</button><button className="btn btn-outline" onClick={() => { setEditField(null); setAddingField(false); }}>إلغاء</button></>}
      >
        {editField && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Labeled label="التسمية"><input className="field" value={editField.label} onChange={(e) => setEditField({ ...editField, label: e.target.value })} /></Labeled>
              <Labeled label="المفتاح (key)"><input className="field num" dir="ltr" value={editField.key} onChange={(e) => setEditField({ ...editField, key: e.target.value.replace(/\s/g, '_') })} /></Labeled>
            </div>
            <Labeled label="النوع">
              <select className="field" value={editField.type} onChange={(e) => setEditField({ ...editField, type: e.target.value as FormFieldType })}>
                {ADDABLE.map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
              </select>
            </Labeled>
            {editField.type !== 'info' && editField.type !== 'consent' && (
              <Labeled label="النص التلميحي (placeholder)"><input className="field" value={editField.placeholder ?? ''} onChange={(e) => setEditField({ ...editField, placeholder: e.target.value })} /></Labeled>
            )}
            <Labeled label="نص المساعدة (اختياري)"><input className="field" value={editField.help ?? ''} onChange={(e) => setEditField({ ...editField, help: e.target.value })} /></Labeled>
            {NEEDS_OPTIONS(editField.type) && (
              <Labeled label="الخيارات (سطر لكل خيار)">
                <textarea className="field min-h-[80px]" value={(editField.options ?? []).join('\n')} onChange={(e) => setEditField({ ...editField, options: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) })} />
              </Labeled>
            )}
            <Labeled label="رسالة التحقق عند الخطأ"><input className="field" value={editField.validationMessage ?? ''} onChange={(e) => setEditField({ ...editField, validationMessage: e.target.value })} /></Labeled>
            {/* Simple conditional */}
            <div className="grid grid-cols-2 gap-4">
              <Labeled label="يظهر إذا كان الحقل (key)"><input className="field num" dir="ltr" value={editField.showIfKey ?? ''} onChange={(e) => setEditField({ ...editField, showIfKey: e.target.value || undefined })} placeholder="اختياري" /></Labeled>
              <Labeled label="يساوي القيمة"><input className="field" value={editField.showIfValue ?? ''} onChange={(e) => setEditField({ ...editField, showIfValue: e.target.value || undefined })} placeholder="اختياري" /></Labeled>
            </div>
            <div className="flex items-center justify-end gap-6">
              <label className="flex items-center gap-2"><span className="text-[13px] font-semibold text-navy-700">مخفي</span><Toggle on={editField.hidden} onChange={(v) => setEditField({ ...editField, hidden: v })} /></label>
              <label className="flex items-center gap-2"><span className="text-[13px] font-semibold text-navy-700">مطلوب</span><Toggle on={editField.required} onChange={(v) => setEditField({ ...editField, required: v })} /></label>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function FieldPreview({ f }: { f: FormField }) {
  if (f.type === 'info') return <div className="rounded-lg bg-navy-700/10 text-navy-700 text-[9px] px-2 py-1.5">{f.label}</div>;
  if (f.type === 'consent') return <div className="flex items-center gap-1.5 text-[9px] text-slate"><span className="w-3 h-3 rounded border border-navy-500 inline-block" />{f.label}</div>;
  const label = <div className="text-[9px] font-bold text-navy-700 mb-0.5">{f.label}{f.required && <span className="text-danger"> *</span>}</div>;
  if (f.type === 'radio' || f.type === 'checkbox' || f.type === 'multiselect')
    return <div>{label}<div className="flex flex-wrap gap-1">{(f.options ?? []).map((o) => <span key={o} className="text-[8px] border border-line rounded-full px-1.5 py-0.5 text-slate">{o}</span>)}</div></div>;
  if (f.type === 'textarea') return <div>{label}<div className="h-8 rounded-md border border-line bg-white" /></div>;
  return <div>{label}<div className="h-5 rounded-md border border-line bg-white" /></div>;
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[13px] font-bold text-navy-700 block mb-2 text-right">{label}</label>
      {children}
    </div>
  );
}
