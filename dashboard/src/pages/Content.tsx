import { useState, type ReactNode } from 'react';
import { Plus, Pencil, Trash2, FolderKanban, HeartHandshake, Newspaper } from 'lucide-react';
import {
  projects as seedProjects,
  cases as seedCases,
  articles as seedArticles,
  governorates,
  colors,
  egp,
  pct,
  type Project,
  type ProjectStatus,
  type HumanitarianCase,
  type CaseTag,
  type Article,
  type ArticleCategory,
} from '@ahla/shared';
import { Card, Badge, Toggle, Modal, TableWrap, MobileRow, ProgressCell, Empty } from '../components/ui';

/* Content manager v3 — edits the SAME entities the mobile app renders:
   Projects (المشروعات), Humanitarian cases (الحالات), Articles (الأخبار والمقالات).
   TODO(backend): CRUD endpoints /admin/projects, /admin/cases, /admin/articles. */

const TABS = [
  { key: 'projects', label: 'المشروعات', icon: FolderKanban },
  { key: 'cases', label: 'الحالات الإنسانية', icon: HeartHandshake },
  { key: 'articles', label: 'الأخبار والمقالات', icon: Newspaper },
] as const;
type TabKey = (typeof TABS)[number]['key'];

const PROJECT_STATUSES: ProjectStatus[] = ['جارٍ', 'مستدام', 'مكتمل'];
const CASE_TAGS: CaseTag[] = ['عاجل', 'علاج', 'تعليم', 'سكن'];
const ARTICLE_CATS: ArticleCategory[] = ['خبر', 'نشاط', 'مقال', 'قافلة'];

const DEFAULT_GRADIENT: [string, string] = ['#7396D6', '#123877'];

const blankProject = (): Project => ({
  id: '', title: '', description: '', status: 'جارٍ',
  targetAmount: 100000, raisedAmount: 0, supporters: 0,
  stages: [], updates: [], gradient: DEFAULT_GRADIENT,
});
const blankCase = (): HumanitarianCase => ({
  id: '', code: '', title: '', location: 'القاهرة، مصر', summary: '', need: '',
  tag: 'عاجل', verified: false, targetAmount: 10000, raisedAmount: 0, supporters: 0,
  sponsorable: false, lastUpdate: 'تم تسجيل الحالة اليوم', gradient: DEFAULT_GRADIENT,
});
const blankArticle = (): Article => ({
  id: '', category: 'خبر', title: '', excerpt: '', body: '',
  date: new Date().toISOString().slice(0, 10), readMinutes: 3, gradient: DEFAULT_GRADIENT,
});

type Tone = 'green' | 'danger' | 'gold' | 'navy' | 'muted';
const tagTone = (t: CaseTag): Tone => (t === 'عاجل' ? 'danger' : t === 'علاج' ? 'gold' : t === 'تعليم' ? 'navy' : 'green');
const statusToneP = (s: ProjectStatus): Tone => (s === 'مكتمل' ? 'green' : s === 'مستدام' ? 'navy' : 'gold');

export default function Content() {
  const [tab, setTab] = useState<TabKey>('projects');
  const [projects, setProjects] = useState<Project[]>(seedProjects);
  const [cases, setCases] = useState<HumanitarianCase[]>(seedCases);
  const [articles, setArticles] = useState<Article[]>(seedArticles);

  return (
    <div className="flex flex-col gap-5">
      {/* Tabs — one editor per app entity */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t.key} className={`chip flex items-center gap-1.5 ${tab === t.key ? 'chip-on' : ''}`} onClick={() => setTab(t.key)}>
            <t.icon size={14} />
            {t.label}
            <span className="num text-[11px] opacity-75">
              ({t.key === 'projects' ? projects.length : t.key === 'cases' ? cases.length : articles.length})
            </span>
          </button>
        ))}
      </div>

      {tab === 'projects' && <ProjectsEditor rows={projects} setRows={setProjects} />}
      {tab === 'cases' && <CasesEditor rows={cases} setRows={setCases} />}
      {tab === 'articles' && <ArticlesEditor rows={articles} setRows={setArticles} />}
    </div>
  );
}

/* =========================== Projects =========================== */
function ProjectsEditor({ rows, setRows }: { rows: Project[]; setRows: (fn: (p: Project[]) => Project[]) => void }) {
  const [editing, setEditing] = useState<Project | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [newUpdate, setNewUpdate] = useState('');

  const save = () => {
    if (!editing || !editing.title.trim()) return;
    if (isNew) setRows((prev) => [{ ...editing, id: `p-${Date.now()}` }, ...prev]);
    else setRows((prev) => prev.map((r) => (r.id === editing.id ? editing : r)));
    setEditing(null);
  };
  const addUpdate = () => {
    if (!editing || !newUpdate.trim()) return;
    setEditing({ ...editing, updates: [{ date: new Date().toISOString().slice(0, 10), text: newUpdate.trim() }, ...(editing.updates ?? [])] });
    setNewUpdate('');
  };

  return (
    <>
      <div className="flex justify-end">
        <button className="btn btn-sm" onClick={() => { setEditing(blankProject()); setIsNew(true); }}><Plus size={15} /> مشروع جديد</button>
      </div>
      <Card className="!p-1">
        <div className="hidden md:block">
          <TableWrap>
            <thead>
              <tr>
                <th className="th">المشروع</th>
                <th className="th">الحالة</th>
                <th className="th">نسبة التمويل</th>
                <th className="th">المستهدف / المحصَّل</th>
                <th className="th">الداعمون</th>
                <th className="th">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-paper-2">
                  <td className="td font-semibold text-ink max-w-[260px] truncate">{r.title}</td>
                  <td className="td"><Badge tone={statusToneP(r.status)}>{r.status}</Badge></td>
                  <td className="td"><ProgressCell percent={pct(r.raisedAmount, r.targetAmount)} color={colors.green} /></td>
                  <td className="td num text-slate">{egp(r.raisedAmount)} / {egp(r.targetAmount)}</td>
                  <td className="td num text-slate">{r.supporters}</td>
                  <td className="td"><RowActions onEdit={() => { setEditing({ ...r, updates: [...(r.updates ?? [])] }); setIsNew(false); }} onDelete={() => setRows((prev) => prev.filter((x) => x.id !== r.id))} /></td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td className="td text-center text-muted py-8" colSpan={6}>لا توجد مشروعات</td></tr>}
            </tbody>
          </TableWrap>
        </div>
        <div className="md:hidden p-3 flex flex-col gap-2.5">
          {rows.map((r) => (
            <MobileRow
              key={r.id}
              title={r.title}
              status={<Badge tone={statusToneP(r.status)}>{r.status}</Badge>}
              rows={[
                { label: 'التمويل', value: <span className="num">{pct(r.raisedAmount, r.targetAmount)}%</span> },
                { label: 'المحصَّل', value: <span className="num">{egp(r.raisedAmount)} / {egp(r.targetAmount)}</span> },
              ]}
              actions={<RowActions onEdit={() => { setEditing({ ...r, updates: [...(r.updates ?? [])] }); setIsNew(false); }} onDelete={() => setRows((prev) => prev.filter((x) => x.id !== r.id))} />}
            />
          ))}
          {rows.length === 0 && <Empty text="لا توجد مشروعات" />}
        </div>
      </Card>

      <Modal
        open={!!editing}
        title={isNew ? 'إضافة مشروع جديد' : 'تعديل المشروع'}
        onClose={() => setEditing(null)}
        footer={<><button className="btn" onClick={save}>حفظ</button><button className="btn btn-outline" onClick={() => setEditing(null)}>إلغاء</button></>}
      >
        {editing && (
          <div className="flex flex-col gap-4">
            <Labeled label="اسم المشروع"><input className="field" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} placeholder="مثال: محطة تحلية مياه" /></Labeled>
            <Labeled label="الوصف (يظهر في التطبيق)"><textarea className="field min-h-[84px]" value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></Labeled>
            <div className="grid grid-cols-2 gap-4">
              <Labeled label="حالة المشروع">
                <select className="field" value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value as ProjectStatus })}>
                  {PROJECT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Labeled>
              <Labeled label="المبلغ المستهدف (ج.م)"><input className="field num" type="number" value={editing.targetAmount} onChange={(e) => setEditing({ ...editing, targetAmount: +e.target.value || 0 })} /></Labeled>
            </div>
            {/* raisedAmount comes from confirmed donations — read-only here. */}
            <div className="text-[12.5px] text-muted bg-paper-2 rounded-xl px-3.5 py-2.5 text-right">
              المبلغ المحصَّل <b className="num text-navy-700">{egp(editing.raisedAmount)}</b> يُحدَّث تلقائياً من التبرعات المعتمدة ولا يُعدَّل يدوياً.
            </div>
            <Labeled label="تحديثات المشروع (تظهر في صفحة المشروع بالتطبيق)">
              <div className="flex gap-2">
                <input className="field" value={newUpdate} onChange={(e) => setNewUpdate(e.target.value)} placeholder="مثال: تم تركيب خط الطرد الرئيسي" />
                <button className="btn btn-sm shrink-0" onClick={addUpdate}><Plus size={14} /> إضافة</button>
              </div>
              <div className="flex flex-col gap-1.5 mt-2">
                {(editing.updates ?? []).map((u, i) => (
                  <div key={`${u.date}-${i}`} className="flex items-center gap-2 text-[12.5px] bg-paper-2/60 rounded-lg px-3 py-2">
                    <span className="num text-muted shrink-0">{u.date}</span>
                    <span className="flex-1 text-right text-ink">{u.text}</span>
                    <button className="text-danger" onClick={() => setEditing({ ...editing, updates: (editing.updates ?? []).filter((_, x) => x !== i) })}><Trash2 size={13} /></button>
                  </div>
                ))}
              </div>
            </Labeled>
          </div>
        )}
      </Modal>
    </>
  );
}

/* =========================== Cases =========================== */
function CasesEditor({ rows, setRows }: { rows: HumanitarianCase[]; setRows: (fn: (p: HumanitarianCase[]) => HumanitarianCase[]) => void }) {
  const [editing, setEditing] = useState<HumanitarianCase | null>(null);
  const [isNew, setIsNew] = useState(false);

  const save = () => {
    if (!editing || !editing.title.trim() || !editing.code.trim()) return;
    if (isNew) setRows((prev) => [{ ...editing, id: `c-${Date.now()}` }, ...prev]);
    else setRows((prev) => prev.map((r) => (r.id === editing.id ? editing : r)));
    setEditing(null);
  };

  return (
    <>
      <div className="flex items-center justify-between flex-wrap gap-3">
        {/* Beneficiary privacy contract — mirrored in the app. */}
        <span className="text-[12px] text-muted">تُعرض بيانات الحالة على مستوى المحافظة فقط — بدون أرقام هواتف أو عناوين تفصيلية.</span>
        <button className="btn btn-sm" onClick={() => { setEditing(blankCase()); setIsNew(true); }}><Plus size={15} /> حالة جديدة</button>
      </div>
      <Card className="!p-1">
        <div className="hidden md:block">
          <TableWrap>
            <thead>
              <tr>
                <th className="th">الحالة</th>
                <th className="th">التصنيف</th>
                <th className="th">المحافظة</th>
                <th className="th">نسبة التمويل</th>
                <th className="th">كفالة شهرية</th>
                <th className="th">موثَّقة</th>
                <th className="th">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-paper-2">
                  <td className="td">
                    <b className="text-ink block">{r.code}</b>
                    <span className="text-[12px] text-slate">{r.title}</span>
                  </td>
                  <td className="td"><Badge tone={tagTone(r.tag)}>{r.tag}</Badge></td>
                  <td className="td text-slate">{r.location}</td>
                  <td className="td"><ProgressCell percent={pct(r.raisedAmount, r.targetAmount)} color={colors.red} /></td>
                  <td className="td">{r.sponsorable ? <Badge tone="green">متاحة</Badge> : <Badge tone="muted">—</Badge>}</td>
                  <td className="td"><Toggle on={r.verified} onChange={() => setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, verified: !x.verified } : x)))} /></td>
                  <td className="td"><RowActions onEdit={() => { setEditing({ ...r }); setIsNew(false); }} onDelete={() => setRows((prev) => prev.filter((x) => x.id !== r.id))} /></td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td className="td text-center text-muted py-8" colSpan={7}>لا توجد حالات</td></tr>}
            </tbody>
          </TableWrap>
        </div>
        <div className="md:hidden p-3 flex flex-col gap-2.5">
          {rows.map((r) => (
            <MobileRow
              key={r.id}
              title={r.code}
              subtitle={r.title}
              status={<Badge tone={tagTone(r.tag)}>{r.tag}</Badge>}
              rows={[
                { label: 'المحافظة', value: r.location },
                { label: 'التمويل', value: <span className="num">{pct(r.raisedAmount, r.targetAmount)}%</span> },
                { label: 'موثَّقة', value: r.verified ? 'نعم' : 'لا' },
              ]}
              actions={<RowActions onEdit={() => { setEditing({ ...r }); setIsNew(false); }} onDelete={() => setRows((prev) => prev.filter((x) => x.id !== r.id))} />}
            />
          ))}
          {rows.length === 0 && <Empty text="لا توجد حالات" />}
        </div>
      </Card>

      <Modal
        open={!!editing}
        title={isNew ? 'إضافة حالة جديدة' : 'تعديل الحالة'}
        onClose={() => setEditing(null)}
        footer={<><button className="btn" onClick={save}>حفظ</button><button className="btn btn-outline" onClick={() => setEditing(null)}>إلغاء</button></>}
      >
        {editing && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Labeled label="كود الحالة"><input className="field" value={editing.code} onChange={(e) => setEditing({ ...editing, code: e.target.value })} placeholder="أسرة رقم 1427" /></Labeled>
              <Labeled label="التصنيف">
                <select className="field" value={editing.tag} onChange={(e) => setEditing({ ...editing, tag: e.target.value as CaseTag })}>
                  {CASE_TAGS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </Labeled>
            </div>
            <Labeled label="عنوان الحالة"><input className="field" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></Labeled>
            <Labeled label="المحافظة (بدون عنوان تفصيلي — خصوصية المستفيد)">
              <select className="field" value={editing.location.split('،')[0]} onChange={(e) => setEditing({ ...editing, location: `${e.target.value}، مصر` })}>
                {governorates.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </Labeled>
            <Labeled label="ملخص الحالة (يظهر في التطبيق)"><textarea className="field min-h-[72px]" value={editing.summary} onChange={(e) => setEditing({ ...editing, summary: e.target.value })} /></Labeled>
            <Labeled label="الاحتياج"><input className="field" value={editing.need} onChange={(e) => setEditing({ ...editing, need: e.target.value })} /></Labeled>
            <div className="grid grid-cols-2 gap-4">
              <Labeled label="المبلغ المستهدف (ج.م)"><input className="field num" type="number" value={editing.targetAmount} onChange={(e) => setEditing({ ...editing, targetAmount: +e.target.value || 0 })} /></Labeled>
              <Labeled label="آخر تحديث معلَن"><input className="field" value={editing.lastUpdate ?? ''} onChange={(e) => setEditing({ ...editing, lastUpdate: e.target.value })} /></Labeled>
            </div>
            <div className="flex items-center justify-end gap-6">
              <label className="flex items-center gap-2">
                <span className="text-[13px] font-semibold text-navy-700">متاحة للكفالة الشهرية</span>
                <Toggle on={!!editing.sponsorable} onChange={(v) => setEditing({ ...editing, sponsorable: v })} />
              </label>
              <label className="flex items-center gap-2">
                <span className="text-[13px] font-semibold text-navy-700">حالة موثَّقة</span>
                <Toggle on={editing.verified} onChange={(v) => setEditing({ ...editing, verified: v })} />
              </label>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

/* =========================== Articles =========================== */
function ArticlesEditor({ rows, setRows }: { rows: Article[]; setRows: (fn: (p: Article[]) => Article[]) => void }) {
  const [editing, setEditing] = useState<Article | null>(null);
  const [isNew, setIsNew] = useState(false);

  const save = () => {
    if (!editing || !editing.title.trim()) return;
    if (isNew) setRows((prev) => [{ ...editing, id: `ar-${Date.now()}` }, ...prev]);
    else setRows((prev) => prev.map((r) => (r.id === editing.id ? editing : r)));
    setEditing(null);
  };

  return (
    <>
      <div className="flex justify-end">
        <button className="btn btn-sm" onClick={() => { setEditing(blankArticle()); setIsNew(true); }}><Plus size={15} /> مقال / خبر جديد</button>
      </div>
      <Card className="!p-1">
        <div className="hidden md:block">
          <TableWrap>
            <thead>
              <tr>
                <th className="th">العنوان</th>
                <th className="th">التصنيف</th>
                <th className="th">التاريخ</th>
                <th className="th">المكان</th>
                <th className="th">دقائق القراءة</th>
                <th className="th">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-paper-2">
                  <td className="td font-semibold text-ink max-w-[280px] truncate">{r.title}</td>
                  <td className="td"><Badge tone={r.category === 'خبر' ? 'navy' : r.category === 'قافلة' ? 'green' : 'gold'}>{r.category}</Badge></td>
                  <td className="td num text-slate">{r.date}</td>
                  <td className="td text-slate">{r.location ?? '—'}</td>
                  <td className="td num text-slate">{r.readMinutes}</td>
                  <td className="td"><RowActions onEdit={() => { setEditing({ ...r }); setIsNew(false); }} onDelete={() => setRows((prev) => prev.filter((x) => x.id !== r.id))} /></td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td className="td text-center text-muted py-8" colSpan={6}>لا توجد مقالات</td></tr>}
            </tbody>
          </TableWrap>
        </div>
        <div className="md:hidden p-3 flex flex-col gap-2.5">
          {rows.map((r) => (
            <MobileRow
              key={r.id}
              title={r.title}
              status={<Badge tone={r.category === 'خبر' ? 'navy' : r.category === 'قافلة' ? 'green' : 'gold'}>{r.category}</Badge>}
              rows={[
                { label: 'التاريخ', value: <span className="num">{r.date}</span> },
                { label: 'المكان', value: r.location ?? '—' },
              ]}
              actions={<RowActions onEdit={() => { setEditing({ ...r }); setIsNew(false); }} onDelete={() => setRows((prev) => prev.filter((x) => x.id !== r.id))} />}
            />
          ))}
          {rows.length === 0 && <Empty text="لا توجد مقالات" />}
        </div>
      </Card>

      <Modal
        open={!!editing}
        title={isNew ? 'إضافة مقال / خبر' : 'تعديل المقال'}
        onClose={() => setEditing(null)}
        footer={<><button className="btn" onClick={save}>حفظ</button><button className="btn btn-outline" onClick={() => setEditing(null)}>إلغاء</button></>}
      >
        {editing && (
          <div className="flex flex-col gap-4">
            <Labeled label="العنوان"><input className="field" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></Labeled>
            <div className="grid grid-cols-2 gap-4">
              <Labeled label="التصنيف">
                <select className="field" value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value as ArticleCategory })}>
                  {ARTICLE_CATS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Labeled>
              <Labeled label="التاريخ"><input className="field" type="date" value={editing.date} onChange={(e) => setEditing({ ...editing, date: e.target.value })} /></Labeled>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Labeled label="المكان (اختياري)"><input className="field" value={editing.location ?? ''} onChange={(e) => setEditing({ ...editing, location: e.target.value || undefined })} /></Labeled>
              <Labeled label="دقائق القراءة"><input className="field num" type="number" value={editing.readMinutes} onChange={(e) => setEditing({ ...editing, readMinutes: +e.target.value || 1 })} /></Labeled>
            </div>
            <Labeled label="مقدمة قصيرة (تظهر في قائمة الأخبار)"><textarea className="field min-h-[60px]" value={editing.excerpt} onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })} /></Labeled>
            <Labeled label="نص المقال"><textarea className="field min-h-[140px]" value={editing.body} onChange={(e) => setEditing({ ...editing, body: e.target.value })} /></Labeled>
          </div>
        )}
      </Modal>
    </>
  );
}

/* =========================== bits =========================== */
function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex gap-1.5">
      <button title="تعديل" onClick={onEdit} className="w-8 h-8 grid place-items-center rounded-lg border border-line text-navy-700 hover:bg-paper-2"><Pencil size={14} /></button>
      <button title="حذف" onClick={onDelete} className="w-8 h-8 grid place-items-center rounded-lg border border-line text-danger hover:bg-danger-soft"><Trash2 size={14} /></button>
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
