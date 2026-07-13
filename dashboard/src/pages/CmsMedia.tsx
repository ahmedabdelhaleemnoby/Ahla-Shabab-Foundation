import { useMemo, useRef, useState } from 'react';
import { Upload, Grid3x3, List, Search, Trash2, RefreshCw, ImageOff, AlertTriangle } from 'lucide-react';
import type { MediaItem } from '@ahla/shared';
import { Card, Badge, Modal, Empty } from '../components/ui';
import { useCms, cms } from '../store/cmsStore';
import { processImageFile, humanSize, MAX_STORED_BYTES } from '../lib/image';

/** Image element with a branded fallback when the source is broken. */
export function MediaImg({ src, alt, className }: { src?: string; alt?: string; className?: string }) {
  const [broken, setBroken] = useState(false);
  if (!src || broken) {
    return (
      <div className={`grid place-items-center bg-paper-2 text-muted ${className ?? ''}`}>
        <ImageOff size={22} />
      </div>
    );
  }
  return <img src={src} alt={alt ?? ''} onError={() => setBroken(true)} className={className} loading="lazy" />;
}

export default function CmsMedia() {
  const { media } = useCms();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [q, setQ] = useState('');
  const [folder, setFolder] = useState('الكل');
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);

  const folders = useMemo(() => ['الكل', ...Array.from(new Set(media.map((m) => m.folder)))], [media]);
  const list = useMemo(
    () =>
      media.filter(
        (m) =>
          (folder === 'الكل' || m.folder === folder) &&
          (q.trim() === '' || m.title.includes(q) || m.alt.includes(q) || (m.caption ?? '').includes(q))
      ),
    [media, folder, q]
  );

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setErr(null);
    setBusy(true);
    try {
      const p = await processImageFile(file);
      cms.addMedia({ title: file.name.replace(/\.[^.]+$/, ''), alt: '', folder: folder === 'الكل' ? 'عام' : folder, src: p.src, type: p.type, width: p.width, height: p.height, sizeBytes: p.sizeBytes });
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'تعذّر رفع الصورة.');
    } finally {
      setBusy(false);
    }
  };

  const onReplace = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !selected) return;
    setErr(null);
    try {
      const p = await processImageFile(file);
      cms.replaceMedia(selected.id, p.src, p.sizeBytes, p.type, p.width, p.height);
      setSelected({ ...selected, src: p.src, sizeBytes: p.sizeBytes, type: p.type, width: p.width, height: p.height });
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'تعذّر الاستبدال.');
    }
  };

  const saveMeta = () => {
    if (!selected) return;
    cms.updateMedia(selected.id, { title: selected.title, alt: selected.alt, caption: selected.caption, folder: selected.folder });
    setSelected(null);
  };

  return (
    <div className="flex flex-col gap-5">
      {err && (
        <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-[13px] font-bold bg-danger-soft text-danger">
          <AlertTriangle size={16} /> {err}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-white border border-line rounded-full px-4 py-2 text-muted flex-1 min-w-[180px]">
          <Search size={16} className="shrink-0" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث في الوسائط..." className="border-0 outline-none bg-transparent text-[13.5px] text-ink text-right w-full" />
        </div>
        <select className="field !w-auto" value={folder} onChange={(e) => setFolder(e.target.value)}>
          {folders.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
        <div className="flex rounded-lg border border-line overflow-hidden">
          <button onClick={() => setView('grid')} className={`w-9 h-9 grid place-items-center ${view === 'grid' ? 'bg-navy-700 text-white' : 'text-navy-700'}`}><Grid3x3 size={16} /></button>
          <button onClick={() => setView('list')} className={`w-9 h-9 grid place-items-center ${view === 'list' ? 'bg-navy-700 text-white' : 'text-navy-700'}`}><List size={16} /></button>
        </div>
        <button className="btn btn-sm" disabled={busy} onClick={() => fileRef.current?.click()}><Upload size={15} /> {busy ? 'جارٍ الرفع…' : 'رفع صورة'}</button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onUpload} />
      </div>

      <div className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-[11.5px] bg-paper-2 text-slate">
        <ImageOff size={14} className="text-navy-500 shrink-0" />
        الوسائط المرفوعة تُحفظ على هذا المتصفح فقط، وتُضغط تلقائياً (حد أقصى {Math.round(MAX_STORED_BYTES / 1024)} ك.ب للصورة). للمزامنة على جهاز آخر استخدم تصدير/استيراد JSON.
      </div>

      {list.length === 0 ? (
        <Empty text="لا توجد وسائط مطابقة — ارفع صورة للبدء" />
      ) : view === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {list.map((m) => (
            <button key={m.id} onClick={() => { setErr(null); setSelected({ ...m }); }} className="text-right rounded-xl border border-line overflow-hidden bg-card hover:shadow-card transition-shadow">
              <MediaImg src={m.src} alt={m.alt} className="w-full h-28 object-cover" />
              <div className="p-2.5">
                <b className="text-[12.5px] text-navy-700 block truncate">{m.title}</b>
                <div className="flex items-center justify-between mt-1">
                  <Badge tone="navy">{m.folder}</Badge>
                  <span className="text-[10px] text-muted num">{humanSize(m.sizeBytes)}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <Card className="!p-1">
          <div className="flex flex-col">
            {list.map((m) => (
              <button key={m.id} onClick={() => { setErr(null); setSelected({ ...m }); }} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-paper-2 text-right border-b border-line-2 last:border-0">
                <MediaImg src={m.src} alt={m.alt} className="w-14 h-14 rounded-lg object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <b className="text-[13px] text-navy-700 block truncate">{m.title}</b>
                  <span className="text-[11.5px] text-muted">{m.alt || 'بدون وصف بديل'}</span>
                </div>
                <Badge tone="navy">{m.folder}</Badge>
                <span className="text-[11px] text-muted num w-20 text-left">{m.width && m.height ? `${m.width}×${m.height}` : '—'}</span>
                <span className="text-[11px] text-muted num w-16 text-left">{humanSize(m.sizeBytes)}</span>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Detail */}
      <Modal
        open={!!selected}
        title="تفاصيل الوسائط"
        onClose={() => setSelected(null)}
        footer={
          selected ? (
            <>
              <button className="btn" onClick={saveMeta}>حفظ</button>
              <button className="btn btn-outline" onClick={() => replaceRef.current?.click()}><RefreshCw size={14} /> استبدال</button>
              <button className="btn btn-outline !text-danger !border-danger mr-auto" onClick={() => { cms.removeMedia(selected.id, selected.title); setSelected(null); }}><Trash2 size={14} /> حذف</button>
              <input ref={replaceRef} type="file" accept="image/*" hidden onChange={onReplace} />
            </>
          ) : null
        }
      >
        {selected && (
          <div className="flex flex-col gap-4">
            <MediaImg src={selected.src} alt={selected.alt} className="w-full h-44 object-contain rounded-xl bg-paper-2" />
            <div className="grid grid-cols-3 gap-2 text-center text-[11px] text-muted">
              <div className="rounded-lg bg-paper-2 py-2"><b className="block text-navy-700 num">{selected.width && selected.height ? `${selected.width}×${selected.height}` : '—'}</b>الأبعاد</div>
              <div className="rounded-lg bg-paper-2 py-2"><b className="block text-navy-700 num">{humanSize(selected.sizeBytes)}</b>الحجم</div>
              <div className="rounded-lg bg-paper-2 py-2"><b className="block text-navy-700 uppercase">{selected.type}</b>النوع</div>
            </div>
            <Labeled label="العنوان"><input className="field" value={selected.title} onChange={(e) => setSelected({ ...selected, title: e.target.value })} /></Labeled>
            <Labeled label="النص البديل (Alt)"><input className="field" value={selected.alt} onChange={(e) => setSelected({ ...selected, alt: e.target.value })} /></Labeled>
            <Labeled label="التعليق"><input className="field" value={selected.caption ?? ''} onChange={(e) => setSelected({ ...selected, caption: e.target.value })} /></Labeled>
            <Labeled label="المجلد"><input className="field" list="media-folders" value={selected.folder} onChange={(e) => setSelected({ ...selected, folder: e.target.value })} /></Labeled>
            <datalist id="media-folders">{folders.filter((f) => f !== 'الكل').map((f) => <option key={f} value={f} />)}</datalist>
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
