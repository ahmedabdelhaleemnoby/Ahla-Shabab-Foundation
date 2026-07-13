import { useState } from 'react';
import {
  ChevronUp, ChevronDown, Trash2, Plus, Heading, Pilcrow, List, ListOrdered,
  Quote, Lightbulb, Image as ImageIcon, MousePointerClick, Phone, Minus,
} from 'lucide-react';
import type { ContentBlock, ContentBlockType, NavTarget, ContactActionKind } from '@ahla/shared';
import { Badge } from './ui';
import { ImagePicker } from './ImagePicker';

/**
 * Reusable block-based content editor. Content is stored as a typed
 * ContentBlock[] — NOT raw HTML — so there is never any HTML to sanitize, and
 * the mobile app renders the same blocks natively.
 */

const PALETTE: { type: ContentBlockType; label: string; icon: typeof Heading }[] = [
  { type: 'heading', label: 'عنوان', icon: Heading },
  { type: 'paragraph', label: 'فقرة', icon: Pilcrow },
  { type: 'bulletList', label: 'قائمة نقطية', icon: List },
  { type: 'orderedList', label: 'قائمة مرقمة', icon: ListOrdered },
  { type: 'quote', label: 'اقتباس', icon: Quote },
  { type: 'highlight', label: 'صندوق تنبيه', icon: Lightbulb },
  { type: 'image', label: 'صورة', icon: ImageIcon },
  { type: 'cta', label: 'زر إجراء', icon: MousePointerClick },
  { type: 'contact', label: 'إجراء تواصل', icon: Phone },
  { type: 'divider', label: 'فاصل', icon: Minus },
];
const LABEL: Record<ContentBlockType, string> = Object.fromEntries(PALETTE.map((p) => [p.type, p.label])) as Record<ContentBlockType, string>;

let seq = 0;
const uid = () => `cb-${Date.now().toString(36)}-${(seq++).toString(36)}`;

const NAV_ROUTES = ['UrgentCases', 'Sponsorship', 'Projects', 'Consultations', 'Volunteer', 'ContactUs', 'Faq'];
const TABS = ['Home', 'Discover', 'Donate', 'News', 'Profile'];
const CONTACT_KINDS: ContactActionKind[] = ['phone', 'email', 'whatsapp', 'facebook', 'instagram', 'youtube', 'twitter', 'website'];

export function RichContentEditor({ blocks, onChange }: { blocks: ContentBlock[]; onChange: (b: ContentBlock[]) => void }) {
  const [adding, setAdding] = useState(false);
  const sorted = [...blocks].sort((a, b) => a.sortOrder - b.sortOrder);

  const commit = (next: ContentBlock[]) => onChange(next.map((b, i) => ({ ...b, sortOrder: i })));
  const patch = (id: string, fields: Partial<ContentBlock>) => commit(sorted.map((b) => (b.id === id ? { ...b, ...fields } : b)));
  const remove = (id: string) => commit(sorted.filter((b) => b.id !== id));
  const move = (id: string, dir: -1 | 1) => {
    const i = sorted.findIndex((b) => b.id === id);
    const j = i + dir;
    if (j < 0 || j >= sorted.length) return;
    const next = [...sorted];
    [next[i], next[j]] = [next[j], next[i]];
    commit(next);
  };
  const add = (type: ContentBlockType) => {
    const base: ContentBlock = { id: uid(), type, sortOrder: sorted.length };
    if (type === 'heading') Object.assign(base, { text: 'عنوان جديد', level: 2 });
    if (type === 'paragraph') Object.assign(base, { text: 'اكتب النص هنا…' });
    if (type === 'quote') Object.assign(base, { text: 'اقتباس', author: '' });
    if (type === 'highlight') Object.assign(base, { text: 'ملاحظة مهمة', tone: 'green' });
    if (type === 'bulletList' || type === 'orderedList') base.items = ['عنصر أول', 'عنصر ثانٍ'];
    if (type === 'cta') Object.assign(base, { ctaLabel: 'اضغط هنا', ctaTarget: { kind: 'tab', tab: 'Donate' } as NavTarget });
    if (type === 'contact') Object.assign(base, { contactKind: 'phone', contactValue: '16xxx', contactLabel: 'اتصل بنا' });
    commit([...sorted, base]);
    setAdding(false);
  };

  return (
    <div className="flex flex-col gap-3">
      {sorted.map((b, i) => (
        <div key={b.id} className="rounded-xl border border-line bg-card p-3 flex gap-3">
          <div className="flex flex-col shrink-0">
            <button disabled={i === 0} onClick={() => move(b.id, -1)} className="text-navy-500 disabled:opacity-30"><ChevronUp size={16} /></button>
            <button disabled={i === sorted.length - 1} onClick={() => move(b.id, 1)} className="text-navy-500 disabled:opacity-30"><ChevronDown size={16} /></button>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <Badge tone="navy">{LABEL[b.type]}</Badge>
              <button onClick={() => remove(b.id)} className="text-danger"><Trash2 size={14} /></button>
            </div>
            <BlockFields block={b} patch={(f) => patch(b.id, f)} />
          </div>
        </div>
      ))}

      {sorted.length === 0 && <div className="text-center text-muted text-[13px] py-6 border border-dashed border-line rounded-xl">لا يوجد محتوى — أضف كتلة للبدء</div>}

      {adding ? (
        <div className="rounded-xl border border-line p-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {PALETTE.map((p) => (
            <button key={p.type} onClick={() => add(p.type)} className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-[13px] font-bold text-navy-700 hover:bg-paper-2">
              <p.icon size={15} /> {p.label}
            </button>
          ))}
          <button onClick={() => setAdding(false)} className="text-[12px] text-muted col-span-full">إلغاء</button>
        </div>
      ) : (
        <button className="btn btn-outline btn-sm self-start" onClick={() => setAdding(true)}><Plus size={15} /> إضافة كتلة</button>
      )}
    </div>
  );
}

function BlockFields({ block: b, patch }: { block: ContentBlock; patch: (f: Partial<ContentBlock>) => void }) {
  switch (b.type) {
    case 'heading':
      return (
        <div className="flex gap-2">
          <select className="field !w-auto" value={b.level ?? 2} onChange={(e) => patch({ level: +e.target.value as 1 | 2 | 3 })}>
            <option value={1}>H1</option><option value={2}>H2</option><option value={3}>H3</option>
          </select>
          <input className="field" value={b.text ?? ''} onChange={(e) => patch({ text: e.target.value })} placeholder="نص العنوان" />
        </div>
      );
    case 'paragraph':
      return <textarea className="field min-h-[70px]" value={b.text ?? ''} onChange={(e) => patch({ text: e.target.value })} placeholder="نص الفقرة" />;
    case 'quote':
      return (
        <div className="flex flex-col gap-2">
          <textarea className="field min-h-[56px]" value={b.text ?? ''} onChange={(e) => patch({ text: e.target.value })} placeholder="نص الاقتباس" />
          <input className="field" value={b.author ?? ''} onChange={(e) => patch({ author: e.target.value })} placeholder="المصدر (اختياري)" />
        </div>
      );
    case 'highlight':
      return (
        <div className="flex gap-2">
          <select className="field !w-auto" value={b.tone ?? 'green'} onChange={(e) => patch({ tone: e.target.value as ContentBlock['tone'] })}>
            <option value="green">أخضر</option><option value="navy">أزرق</option><option value="gold">ذهبي</option><option value="danger">أحمر</option>
          </select>
          <input className="field" value={b.text ?? ''} onChange={(e) => patch({ text: e.target.value })} placeholder="نص التنبيه" />
        </div>
      );
    case 'bulletList':
    case 'orderedList':
      return <textarea className="field min-h-[80px]" value={(b.items ?? []).join('\n')} onChange={(e) => patch({ items: e.target.value.split('\n').map((s) => s.trimStart()).filter((s) => s !== '') })} placeholder="عنصر لكل سطر" />;
    case 'image':
      return (
        <div className="flex flex-col gap-2">
          <ImagePicker label="" value={b.mediaId} onChange={(id) => patch({ mediaId: id })} />
          <input className="field" value={b.caption ?? ''} onChange={(e) => patch({ caption: e.target.value })} placeholder="تعليق الصورة (اختياري)" />
        </div>
      );
    case 'cta':
      return (
        <div className="flex flex-col gap-2">
          <input className="field" value={b.ctaLabel ?? ''} onChange={(e) => patch({ ctaLabel: e.target.value })} placeholder="نص الزر" />
          <div className="flex gap-2">
            <select className="field !w-auto" value={b.ctaTarget?.kind ?? 'tab'} onChange={(e) => {
              const kind = e.target.value;
              patch({ ctaTarget: kind === 'tab' ? { kind: 'tab', tab: 'Donate' } : kind === 'route' ? { kind: 'route', route: 'ContactUs' } : { kind: 'external', url: 'https://ahlashabab.com' } });
            }}>
              <option value="tab">تبويب</option><option value="route">شاشة</option><option value="external">رابط</option>
            </select>
            {b.ctaTarget?.kind === 'tab' && (
              <select className="field" value={b.ctaTarget.tab} onChange={(e) => patch({ ctaTarget: { kind: 'tab', tab: e.target.value as never } })}>{TABS.map((t) => <option key={t} value={t}>{t}</option>)}</select>
            )}
            {b.ctaTarget?.kind === 'route' && (
              <select className="field" value={b.ctaTarget.route} onChange={(e) => patch({ ctaTarget: { kind: 'route', route: e.target.value } })}>{NAV_ROUTES.map((r) => <option key={r} value={r}>{r}</option>)}</select>
            )}
            {b.ctaTarget?.kind === 'external' && (
              <input className="field num" dir="ltr" value={b.ctaTarget.url} onChange={(e) => patch({ ctaTarget: { kind: 'external', url: e.target.value } })} />
            )}
          </div>
        </div>
      );
    case 'contact':
      return (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <select className="field !w-auto" value={b.contactKind ?? 'phone'} onChange={(e) => patch({ contactKind: e.target.value as ContactActionKind })}>
              {CONTACT_KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
            <input className="field num" dir="ltr" value={b.contactValue ?? ''} onChange={(e) => patch({ contactValue: e.target.value })} placeholder="القيمة (رقم / بريد / رابط)" />
          </div>
          <input className="field" value={b.contactLabel ?? ''} onChange={(e) => patch({ contactLabel: e.target.value })} placeholder="نص الإجراء" />
        </div>
      );
    case 'divider':
      return <div className="h-px bg-line-2 my-1" />;
    default:
      return null;
  }
}
