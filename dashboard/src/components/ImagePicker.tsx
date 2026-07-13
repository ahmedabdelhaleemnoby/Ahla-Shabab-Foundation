import { useMemo, useRef, useState } from 'react';
import { ImagePlus, Upload, X, Search } from 'lucide-react';
import { Modal, Badge } from './ui';
import { MediaImg } from '../pages/CmsMedia';
import { useCms, cms } from '../store/cmsStore';
import { processImageFile } from '../lib/image';

/**
 * Reusable image field used across every editor (Home sections, pages, cases,
 * projects, articles…). It stores a media *id* and can pick from the library or
 * upload a new (compressed) image on the spot.
 *
 * Two value modes:
 *  - `value`/`onChange`  → stores a media id (preferred; CMS-native)
 *  - `urlValue`/`onUrlChange` → stores the resolved src string (for entities
 *    that keep a plain `imageUrl` field like cases/projects/articles)
 */
export function ImagePicker({
  label = 'الصورة',
  value,
  onChange,
  urlValue,
  onUrlChange,
}: {
  label?: string;
  value?: string;
  onChange?: (mediaId: string | undefined) => void;
  urlValue?: string;
  onUrlChange?: (src: string | undefined) => void;
}) {
  const { media } = useCms();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const current = value ? media.find((m) => m.id === value) : undefined;
  const previewSrc = current?.src ?? urlValue;

  const list = useMemo(
    () => media.filter((m) => q.trim() === '' || m.title.includes(q) || m.folder.includes(q)),
    [media, q]
  );

  const pick = (id: string, src: string) => {
    onChange?.(id);
    onUrlChange?.(src);
    setOpen(false);
  };

  const clear = () => {
    onChange?.(undefined);
    onUrlChange?.(undefined);
  };

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setErr(null);
    try {
      const p = await processImageFile(file);
      const item = cms.addMedia({ title: file.name.replace(/\.[^.]+$/, ''), alt: '', folder: 'عام', src: p.src, type: p.type, width: p.width, height: p.height, sizeBytes: p.sizeBytes });
      pick(item.id, item.src);
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'تعذّر الرفع.');
    }
  };

  return (
    <div>
      <label className="text-[13px] font-bold text-navy-700 block mb-2 text-right">{label}</label>
      <div className="flex items-center gap-3">
        <div className="w-16 h-16 rounded-xl overflow-hidden border border-line shrink-0">
          <MediaImg src={previewSrc} className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col gap-1.5">
          <button type="button" className="btn btn-outline btn-sm" onClick={() => { setErr(null); setOpen(true); }}><ImagePlus size={14} /> اختيار صورة</button>
          {previewSrc && <button type="button" className="text-[12px] text-danger font-bold flex items-center gap-1" onClick={clear}><X size={12} /> إزالة</button>}
        </div>
      </div>

      <Modal open={open} title="اختر صورة من المكتبة" onClose={() => setOpen(false)}>
        {err && <div className="mb-3 text-[12px] text-danger font-bold">{err}</div>}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-2 bg-white border border-line rounded-full px-3 py-1.5 text-muted flex-1">
            <Search size={15} className="shrink-0" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث..." className="border-0 outline-none bg-transparent text-[13px] text-ink text-right w-full" />
          </div>
          <button type="button" className="btn btn-sm" onClick={() => fileRef.current?.click()}><Upload size={14} /> رفع</button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={upload} />
        </div>
        <div className="grid grid-cols-3 gap-2 max-h-[320px] overflow-y-auto scroll-thin">
          {list.map((m) => (
            <button key={m.id} type="button" onClick={() => pick(m.id, m.src)} className={`rounded-xl overflow-hidden border-2 text-right ${value === m.id ? 'border-navy-700' : 'border-line'} hover:border-navy-500`}>
              <MediaImg src={m.src} alt={m.alt} className="w-full h-20 object-cover" />
              <div className="px-2 py-1.5">
                <b className="text-[11px] text-navy-700 block truncate">{m.title}</b>
                <Badge tone="navy">{m.folder}</Badge>
              </div>
            </button>
          ))}
          {list.length === 0 && <div className="col-span-3 text-center text-muted text-[12px] py-8">لا توجد وسائط — ارفع صورة</div>}
        </div>
      </Modal>
    </div>
  );
}
