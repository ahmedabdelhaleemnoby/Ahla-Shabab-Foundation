import { useState } from 'react';
import { ChevronUp, ChevronDown, Trash2, Pencil, Plus, RotateCcw, Lock } from 'lucide-react';
import type { MenuGroup, MenuItem, NavTarget } from '@ahla/shared';
import { Card, Badge, Toggle, Modal } from '../components/ui';
import { useCms, cms, mutate } from '../store/cmsStore';

const sorted = <T extends { sortOrder: number }>(a: T[]) => [...a].sort((x, y) => x.sortOrder - y.sortOrder);

/** The one item that must always stay reachable + visible. */
const HOME_ITEM = 'm-home';

const TABS = ['Home', 'Discover', 'Donate', 'News', 'Profile'];
const ROUTES = ['UrgentCases', 'Sponsorship', 'Projects', 'Consultations', 'DonationHistory', 'Receipts', 'MyBookings', 'Favorites', 'Notifications', 'ZakatCalculator', 'About', 'Volunteer', 'ContactUs', 'Faq', 'PrivacyPolicy'];

function targetLabel(t: NavTarget): string {
  if (t.kind === 'tab') return `تبويب: ${t.tab}`;
  if (t.kind === 'route') return `شاشة: ${t.route}`;
  if (t.kind === 'cmsPage') return `صفحة: ${t.slug}`;
  return `رابط: ${t.url}`;
}

export default function CmsMenu() {
  const { menu } = useCms();
  const groups = sorted(menu);
  const [editing, setEditing] = useState<{ groupId: string; item: MenuItem } | null>(null);
  const [addingTo, setAddingTo] = useState<string | null>(null);

  const moveItem = (g: MenuGroup, id: string, dir: -1 | 1) => {
    const items = sorted(g.items);
    const idx = items.findIndex((i) => i.id === id);
    const swap = idx + dir;
    if (swap < 0 || swap >= items.length) return;
    mutate({ action: 'أعاد ترتيب عنصر قائمة', entityType: 'عنصر قائمة', entityName: items[idx].label }, (d) => {
      const grp = d.menu.find((x) => x.id === g.id)!;
      const a = grp.items.find((i) => i.id === items[idx].id)!;
      const b = grp.items.find((i) => i.id === items[swap].id)!;
      [a.sortOrder, b.sortOrder] = [b.sortOrder, a.sortOrder];
    });
  };

  const toggleItem = (g: MenuGroup, it: MenuItem) => {
    if (it.id === HOME_ITEM && it.visible) return; // safeguard: keep Home reachable
    mutate({ action: it.visible ? 'أخفى عنصراً' : 'أظهر عنصراً', entityType: 'عنصر قائمة', entityName: it.label }, (d) => {
      const x = d.menu.find((x) => x.id === g.id)?.items.find((i) => i.id === it.id);
      if (x) x.visible = !x.visible;
    });
  };

  const removeItem = (g: MenuGroup, it: MenuItem) => {
    if (it.id === HOME_ITEM) return;
    mutate({ action: 'حذف عنصراً', entityType: 'عنصر قائمة', entityName: it.label }, (d) => {
      const grp = d.menu.find((x) => x.id === g.id);
      if (grp) grp.items = grp.items.filter((i) => i.id !== it.id);
    });
  };

  const toggleGroup = (g: MenuGroup) =>
    mutate({ action: g.visible ? 'أخفى مجموعة' : 'أظهر مجموعة', entityType: 'مجموعة قائمة', entityName: g.title ?? 'الرئيسية' }, (d) => {
      const x = d.menu.find((x) => x.id === g.id);
      if (x) x.visible = !x.visible;
    });

  const addGroup = () =>
    mutate({ action: 'أضاف مجموعة', entityType: 'مجموعة قائمة', entityName: 'مجموعة جديدة' }, (d) => {
      d.menu.push({ id: cms.newId('grp'), title: 'مجموعة جديدة', visible: true, sortOrder: Math.max(0, ...d.menu.map((x) => x.sortOrder)) + 1, items: [] });
    });

  const startAdd = (groupId: string) => {
    setAddingTo(groupId);
    setEditing({ groupId, item: { id: cms.newId('m'), label: 'عنصر جديد', icon: 'circle', target: { kind: 'route', route: 'About' }, visible: true, loginRequired: false, sortOrder: 999 } });
  };

  const save = () => {
    if (!editing) return;
    const { groupId, item } = editing;
    if (addingTo) {
      mutate({ action: 'أضاف عنصراً', entityType: 'عنصر قائمة', entityName: item.label }, (d) => {
        const grp = d.menu.find((x) => x.id === groupId);
        if (grp) grp.items.push({ ...item, sortOrder: Math.max(0, ...grp.items.map((i) => i.sortOrder)) + 1 });
      });
    } else {
      mutate({ action: 'عدّل عنصراً', entityType: 'عنصر قائمة', entityName: item.label }, (d) => {
        const grp = d.menu.find((x) => x.id === groupId);
        const idx = grp?.items.findIndex((i) => i.id === item.id) ?? -1;
        if (grp && idx >= 0) grp.items[idx] = item;
      });
    }
    setEditing(null);
    setAddingTo(null);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <span className="text-[13px] text-slate">تتحكم هذه الوحدة في القائمة الجانبية (البرجر) داخل التطبيق. «الرئيسية» محمية ولا يمكن إخفاؤها.</span>
        <div className="flex gap-2">
          <button className="btn btn-outline btn-sm" onClick={() => cms.resetModule('menu')}><RotateCcw size={14} /> إعادة الضبط</button>
          <button className="btn btn-sm" onClick={addGroup}><Plus size={15} /> مجموعة</button>
        </div>
      </div>

      {groups.map((g) => (
        <Card key={g.id} className={`flex flex-col gap-2 ${g.visible ? '' : 'opacity-60'}`}>
          <div className="flex items-center justify-between border-b border-line-2 pb-2.5">
            <div className="flex items-center gap-2">
              <b className="text-[14px] text-navy-700">{g.title ?? 'المجموعة الرئيسية'}</b>
              <Badge tone="navy">{g.items.length} عنصر</Badge>
            </div>
            <div className="flex items-center gap-2">
              <button className="btn btn-outline btn-sm" onClick={() => startAdd(g.id)}><Plus size={14} /> عنصر</button>
              <Toggle on={g.visible} onChange={() => toggleGroup(g)} />
            </div>
          </div>

          {sorted(g.items).map((it, i, arr) => (
            <div key={it.id} className={`flex items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-paper-2 ${it.visible ? '' : 'opacity-50'}`}>
              <div className="flex flex-col">
                <button disabled={i === 0} onClick={() => moveItem(g, it.id, -1)} className="text-navy-500 disabled:opacity-30"><ChevronUp size={15} /></button>
                <button disabled={i === arr.length - 1} onClick={() => moveItem(g, it.id, 1)} className="text-navy-500 disabled:opacity-30"><ChevronDown size={15} /></button>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <b className="text-[13.5px] text-ink truncate">{it.label}</b>
                  {it.id === HOME_ITEM && <Lock size={11} className="text-muted" />}
                  {it.loginRequired && <Badge tone="gold">يتطلب دخول</Badge>}
                </div>
                <span className="text-[11px] text-muted">{targetLabel(it.target)}</span>
              </div>
              <Toggle on={it.visible} onChange={() => toggleItem(g, it)} />
              <button title="تعديل" onClick={() => { setAddingTo(null); setEditing({ groupId: g.id, item: { ...it, target: { ...it.target } } }); }} className="w-8 h-8 grid place-items-center rounded-lg border border-line text-navy-700 hover:bg-paper-2"><Pencil size={13} /></button>
              <button title="حذف" disabled={it.id === HOME_ITEM} onClick={() => removeItem(g, it)} className="w-8 h-8 grid place-items-center rounded-lg border border-line text-danger hover:bg-danger-soft disabled:opacity-30"><Trash2 size={13} /></button>
            </div>
          ))}
          {g.items.length === 0 && <div className="text-center text-muted text-[12px] py-3">لا عناصر في هذه المجموعة</div>}
        </Card>
      ))}

      <Modal
        open={!!editing}
        title={addingTo ? 'إضافة عنصر للقائمة' : 'تعديل عنصر القائمة'}
        onClose={() => { setEditing(null); setAddingTo(null); }}
        footer={<><button className="btn" onClick={save}>حفظ</button><button className="btn btn-outline" onClick={() => { setEditing(null); setAddingTo(null); }}>إلغاء</button></>}
      >
        {editing && (
          <div className="flex flex-col gap-4">
            <Labeled label="النص"><input className="field" value={editing.item.label} onChange={(e) => setEditing({ ...editing, item: { ...editing.item, label: e.target.value } })} /></Labeled>
            <div className="grid grid-cols-2 gap-4">
              <Labeled label="الأيقونة (Feather)"><input className="field num" dir="ltr" value={editing.item.icon} onChange={(e) => setEditing({ ...editing, item: { ...editing.item, icon: e.target.value } })} placeholder="home" /></Labeled>
              <Labeled label="نوع الوجهة">
                <select className="field" value={editing.item.target.kind} onChange={(e) => {
                  const kind = e.target.value as NavTarget['kind'];
                  const nt: NavTarget = kind === 'tab' ? { kind: 'tab', tab: 'Home' } : kind === 'route' ? { kind: 'route', route: 'About' } : kind === 'external' ? { kind: 'external', url: 'https://ahlashabab.com' } : { kind: 'cmsPage', slug: '' };
                  setEditing({ ...editing, item: { ...editing.item, target: nt } });
                }}>
                  <option value="tab">تبويب رئيسي</option>
                  <option value="route">شاشة داخلية</option>
                  <option value="external">رابط خارجي</option>
                </select>
              </Labeled>
            </div>
            {editing.item.target.kind === 'tab' && (
              <Labeled label="التبويب">
                <select className="field" value={editing.item.target.tab} onChange={(e) => setEditing({ ...editing, item: { ...editing.item, target: { kind: 'tab', tab: e.target.value as never } } })}>
                  {TABS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </Labeled>
            )}
            {editing.item.target.kind === 'route' && (
              <Labeled label="الشاشة">
                <select className="field" value={editing.item.target.route} onChange={(e) => setEditing({ ...editing, item: { ...editing.item, target: { kind: 'route', route: e.target.value } } })}>
                  {ROUTES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </Labeled>
            )}
            {editing.item.target.kind === 'external' && (
              <Labeled label="الرابط"><input className="field num" dir="ltr" value={editing.item.target.url} onChange={(e) => setEditing({ ...editing, item: { ...editing.item, target: { kind: 'external', url: e.target.value } } })} /></Labeled>
            )}
            <label className="flex items-center gap-2 justify-end">
              <span className="text-[13px] font-semibold text-navy-700">يتطلب تسجيل الدخول</span>
              <Toggle on={editing.item.loginRequired} onChange={(v) => setEditing({ ...editing, item: { ...editing.item, loginRequired: v } })} />
            </label>
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
