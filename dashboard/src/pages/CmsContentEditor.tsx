import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Save, Smartphone, CheckCircle2 } from 'lucide-react';
import type { ContentBlock } from '@ahla/shared';
import { Card, SectionHead, Empty } from '../components/ui';
import { RichContentEditor } from '../components/RichContentEditor';
import { MediaImg } from './CmsMedia';
import { useCms, pageContent } from '../store/cmsStore';

const HL: Record<string, string> = { green: 'bg-green-soft text-green-dark', navy: 'bg-paper-2 text-navy-700', gold: 'bg-gold-soft text-[#8A5B10]', danger: 'bg-danger-soft text-danger' };

/** Full-page rich content editor for a generic CMS page. */
export default function CmsContentEditor() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const { pages, media } = useCms();
  const page = pages.find((p) => p.id === id);

  const [blocks, setBlocks] = useState<ContentBlock[]>(page?.content ?? []);
  const [saved, setSaved] = useState(true);

  if (!page) return <Empty text="الصفحة غير موجودة" />;

  const update = (b: ContentBlock[]) => { setBlocks(b); setSaved(false); };
  const save = () => { pageContent.set(page.id, blocks, page.title); setSaved(true); };
  const srcOf = (mid?: string) => media.find((m) => m.id === mid)?.src;
  const sorted = [...blocks].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Link to="/cms/pages" className="w-9 h-9 grid place-items-center rounded-lg border border-line text-navy-700 hover:bg-paper-2"><ArrowRight size={16} /></Link>
          <div>
            <b className="text-[16px] text-navy-700 block">{page.title}</b>
            <span className="text-[12px] text-muted num" dir="ltr">/{page.slug}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {saved ? <span className="text-[12px] text-green-dark font-bold flex items-center gap-1"><CheckCircle2 size={14} /> محفوظ</span> : <span className="text-[12px] text-muted">تغييرات غير محفوظة</span>}
          <button className="btn btn-sm" onClick={save}><Save size={14} /> حفظ المحتوى</button>
        </div>
      </div>

      {page.builtin && (
        <div className="text-[12px] text-[#8A5B10] bg-gold-soft rounded-xl px-4 py-2.5 text-right">
          هذه شاشة أصلية — المحتوى المنسّق يظهر فقط في الصفحات المخصّصة داخل التطبيق.
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_300px] gap-5 items-start">
        {/* Editor */}
        <Card>
          <SectionHead title="محرّر المحتوى" />
          <RichContentEditor blocks={blocks} onChange={update} />
        </Card>

        {/* Live preview */}
        <Card className="lg:sticky lg:top-4">
          <SectionHead title="معاينة" action={<Smartphone size={16} className="text-navy-500" />} />
          <div className="mx-auto w-[252px] border-[6px] border-navy-900 rounded-[26px] overflow-hidden bg-paper">
            <div className="bg-navy-800 text-white text-center text-[10px] py-1.5">{page.navTitle}</div>
            <div className="p-2.5 flex flex-col gap-2 max-h-[460px] overflow-y-auto scroll-thin text-right" dir="rtl">
              {sorted.length === 0 && <div className="text-center text-muted text-[10px] py-6">لا محتوى</div>}
              {sorted.map((b) => <PreviewBlock key={b.id} b={b} src={srcOf(b.mediaId)} />)}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function PreviewBlock({ b, src }: { b: ContentBlock; src?: string }) {
  switch (b.type) {
    case 'heading':
      return <div className={`font-extrabold text-navy-700 ${b.level === 1 ? 'text-[14px]' : b.level === 3 ? 'text-[10px]' : 'text-[12px]'}`}>{b.text}</div>;
    case 'paragraph':
      return <div className="text-[9.5px] text-slate leading-relaxed">{b.text}</div>;
    case 'quote':
      return <div className="border-r-2 border-navy-500 pr-2 text-[9.5px] text-slate italic">“{b.text}”{b.author && <span className="block text-[8px] text-muted mt-0.5">— {b.author}</span>}</div>;
    case 'highlight':
      return <div className={`rounded-lg px-2 py-1.5 text-[9px] font-bold ${HL[b.tone ?? 'green']}`}>{b.text}</div>;
    case 'bulletList':
      return <ul className="list-disc pr-4 text-[9.5px] text-slate space-y-0.5">{(b.items ?? []).map((it, i) => <li key={i}>{it}</li>)}</ul>;
    case 'orderedList':
      return <ol className="list-decimal pr-4 text-[9.5px] text-slate space-y-0.5">{(b.items ?? []).map((it, i) => <li key={i}>{it}</li>)}</ol>;
    case 'image':
      return <div><MediaImg src={src} className="w-full h-20 object-cover rounded-lg" />{b.caption && <div className="text-[8px] text-muted text-center mt-0.5">{b.caption}</div>}</div>;
    case 'cta':
      return <div className="bg-navy-700 text-white text-center text-[9px] font-bold rounded-full py-1.5">{b.ctaLabel}</div>;
    case 'contact':
      return <div className="border border-line rounded-lg text-[9px] text-navy-700 font-bold text-center py-1.5">{b.contactLabel} · {b.contactValue}</div>;
    case 'divider':
      return <div className="h-px bg-line-2 my-0.5" />;
    default:
      return null;
  }
}
