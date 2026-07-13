import { useState } from 'react';
import { Download, Upload, RotateCcw, Undo2, Archive, Info, CheckCircle2, AlertTriangle } from 'lucide-react';
import { CMS_SCHEMA_VERSION } from '@ahla/shared';
import { Card, SectionHead, Modal } from '../components/ui';
import { useCms, cms } from '../store/cmsStore';

export default function CmsTools() {
  const state = useCms();
  const [importText, setImportText] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirm, setConfirm] = useState<null | 'resetAll' | 'restore'>(null);

  const download = () => {
    const blob = new Blob([cms.exportJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ahla-cms-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => setImportText(String(r.result ?? ''));
    r.readAsText(f);
  };

  const doImport = () => {
    const res = cms.importJson(importText);
    setMsg(res.ok ? { ok: true, text: 'تم الاستيراد بنجاح (بعد أخذ نسخة احتياطية).' } : { ok: false, text: res.error ?? 'فشل الاستيراد' });
    if (res.ok) setImportText('');
  };

  const sizeKb = (cms.sizeBytes() / 1024).toFixed(1);

  return (
    <div className="flex flex-col gap-5">
      {msg && (
        <div className={`flex items-center gap-2 rounded-xl px-4 py-3 text-[13px] font-bold ${msg.ok ? 'bg-green-soft text-green-dark' : 'bg-danger-soft text-danger'}`}>
          {msg.ok ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}{msg.text}
        </div>
      )}

      {/* Status */}
      <Card>
        <SectionHead title="حالة النظام" action={<Info size={16} className="text-navy-500" />} />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {[
            ['إصدار المخطط', `v${CMS_SCHEMA_VERSION}`],
            ['حجم البيانات', `${sizeKb} ك.ب`],
            ['عدد الصفحات', String(state.pages.length)],
            ['سجل النشاط', String(state.activity.length)],
          ].map(([l, v]) => (
            <div key={l} className="rounded-2xl border border-line bg-paper-2/50 py-4">
              <div className="num text-[20px] font-extrabold text-navy-700">{v}</div>
              <div className="text-[12px] text-slate mt-1">{l}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Export / Undo */}
      <Card className="flex flex-wrap items-center gap-3">
        <button className="btn btn-sm" onClick={download}><Download size={15} /> تصدير الإعدادات JSON</button>
        <button className="btn btn-outline btn-sm" disabled={!cms.canUndo()} onClick={() => cms.undo()}><Undo2 size={15} /> تراجع عن آخر تعديل</button>
        <button className="btn btn-outline btn-sm" onClick={() => setConfirm('restore')}><Archive size={15} /> استعادة النسخة الاحتياطية</button>
        <span className="text-[12px] text-muted mr-auto">التصدير يحفظ كل إعدادات CMS في ملف يمكن استيراده لاحقاً.</span>
      </Card>

      {/* Import */}
      <Card>
        <SectionHead title="استيراد الإعدادات" action={<Upload size={16} className="text-navy-500" />} />
        <p className="text-[12px] text-muted mb-3">يتم التحقق من صحة الملف قبل التطبيق، مع أخذ نسخة احتياطية تلقائية. أي بنية غير مطابقة تُرفض.</p>
        <input type="file" accept="application/json" onChange={onFile} className="mb-3 text-[12px]" />
        <textarea className="field min-h-[120px] num" dir="ltr" placeholder='{ "version": 1, ... }' value={importText} onChange={(e) => setImportText(e.target.value)} />
        <button className="btn btn-sm mt-3" disabled={!importText.trim()} onClick={doImport}><Upload size={15} /> استيراد وتطبيق</button>
      </Card>

      {/* Reset */}
      <Card>
        <SectionHead title="إعادة الضبط" action={<RotateCcw size={16} className="text-danger" />} />
        <div className="flex flex-wrap gap-2">
          {(['settings', 'menu', 'home', 'pages'] as const).map((m) => (
            <button key={m} className="btn btn-outline btn-sm" onClick={() => cms.resetModule(m)}>
              <RotateCcw size={13} /> إعادة ضبط {({ settings: 'الإعدادات', menu: 'القائمة', home: 'الرئيسية', pages: 'الصفحات' } as const)[m]}
            </button>
          ))}
          <button className="btn btn-sm !bg-danger hover:!bg-danger" onClick={() => setConfirm('resetAll')}><RotateCcw size={14} /> إعادة الضبط الكامل</button>
        </div>
      </Card>

      {/* Confirmations */}
      <Modal
        open={confirm === 'resetAll'}
        title="تأكيد إعادة الضبط الكامل"
        onClose={() => setConfirm(null)}
        footer={<><button className="btn !bg-danger" onClick={() => { cms.resetAll(); setConfirm(null); setMsg({ ok: true, text: 'تمت إعادة كل الوحدات إلى الإعدادات الافتراضية.' }); }}>نعم، إعادة الضبط</button><button className="btn btn-outline" onClick={() => setConfirm(null)}>إلغاء</button></>}
      >
        <p className="text-[13px] text-slate text-right leading-relaxed">سيتم استبدال كل تعديلاتك بالإعدادات الافتراضية. تُؤخذ نسخة احتياطية يمكن استعادتها. هل تريد المتابعة؟</p>
      </Modal>
      <Modal
        open={confirm === 'restore'}
        title="استعادة النسخة الاحتياطية"
        onClose={() => setConfirm(null)}
        footer={<><button className="btn" onClick={() => { const ok = cms.restoreBackup(); setConfirm(null); setMsg({ ok, text: ok ? 'تمت استعادة آخر نسخة احتياطية.' : 'لا توجد نسخة احتياطية.' }); }}>استعادة</button><button className="btn btn-outline" onClick={() => setConfirm(null)}>إلغاء</button></>}
      >
        <p className="text-[13px] text-slate text-right leading-relaxed">تُستعاد آخر نسخة تم حفظها تلقائياً قبل عملية استيراد أو إعادة ضبط.</p>
      </Modal>
    </div>
  );
}
