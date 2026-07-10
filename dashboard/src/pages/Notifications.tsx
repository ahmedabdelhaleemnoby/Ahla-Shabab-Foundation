import { useState, type ReactNode } from 'react';
import { Send, BellRing } from 'lucide-react';
import { notifications as seed, type AppNotification, type NotificationKind } from '@ahla/shared';
import { Card, Badge, SectionHead, TableWrap, MobileRow, Empty } from '../components/ui';

/* Broadcast center — composes the in-app/push notifications users see in the app.
   TODO(backend): POST /admin/notifications/broadcast (FCM + in-app feed). */

const KINDS: { key: NotificationKind; label: string }[] = [
  { key: 'system', label: 'عام' },
  { key: 'donation', label: 'تبرعات' },
  { key: 'case', label: 'حالات' },
  { key: 'project', label: 'مشروعات' },
  { key: 'booking', label: 'حجوزات' },
];
const AUDIENCES = ['كل المستخدمين', 'المتبرعون', 'أصحاب الحجوزات', 'المتطوعون'];

const kindLabel = (k: NotificationKind) => KINDS.find((x) => x.key === k)?.label ?? 'عام';
type Tone = 'green' | 'danger' | 'gold' | 'navy' | 'muted';
const kindTone = (k: NotificationKind): Tone => (k === 'donation' ? 'green' : k === 'case' ? 'danger' : k === 'booking' ? 'gold' : 'navy');

interface SentItem extends AppNotification {
  audience: string;
}

export default function Notifications() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [kind, setKind] = useState<NotificationKind>('system');
  const [audience, setAudience] = useState(AUDIENCES[0]);
  const [sent, setSent] = useState<SentItem[]>(seed.map((n) => ({ ...n, audience: 'كل المستخدمين' })));
  const [justSent, setJustSent] = useState(false);

  const canSend = title.trim().length >= 3 && body.trim().length >= 5;

  const send = () => {
    if (!canSend) return;
    setSent((prev) => [{ id: `n-${Date.now()}`, kind, title: title.trim(), body: body.trim(), time: 'الآن', read: false, audience }, ...prev]);
    setTitle('');
    setBody('');
    setJustSent(true);
    setTimeout(() => setJustSent(false), 2500);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Composer */}
      <Card>
        <SectionHead
          title="إرسال إشعار للتطبيق"
          action={justSent ? <Badge tone="green">تم الإرسال ✓</Badge> : undefined}
        />
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Labeled label="نوع الإشعار">
              <select className="field" value={kind} onChange={(e) => setKind(e.target.value as NotificationKind)}>
                {KINDS.map((k) => <option key={k.key} value={k.key}>{k.label}</option>)}
              </select>
            </Labeled>
            <Labeled label="الجمهور المستهدف">
              <select className="field" value={audience} onChange={(e) => setAudience(e.target.value)}>
                {AUDIENCES.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </Labeled>
          </div>
          <Labeled label="عنوان الإشعار">
            <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: انطلاق قافلة طبية جديدة" />
          </Labeled>
          <Labeled label="نص الإشعار">
            <textarea className="field min-h-[80px]" value={body} onChange={(e) => setBody(e.target.value)} placeholder="النص الذي سيظهر للمستخدمين في التطبيق..." />
          </Labeled>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <span className="text-[12px] text-muted">يصل الإشعار إلى شاشة «الإشعارات» في التطبيق وإشعار دفع على الهاتف.</span>
            <button className="btn" disabled={!canSend} onClick={send}><Send size={15} /> إرسال الآن</button>
          </div>
        </div>
      </Card>

      {/* History */}
      <Card className="!p-1">
        <div className="px-4 pt-4 pb-1 flex items-center gap-2 text-navy-700">
          <BellRing size={16} />
          <b className="text-[15px]">سجل الإشعارات ({sent.length})</b>
        </div>
        <div className="hidden md:block">
          <TableWrap>
            <thead>
              <tr>
                <th className="th">العنوان</th>
                <th className="th">النص</th>
                <th className="th">النوع</th>
                <th className="th">الجمهور</th>
                <th className="th">وقت الإرسال</th>
              </tr>
            </thead>
            <tbody>
              {sent.map((n) => (
                <tr key={n.id} className="hover:bg-paper-2">
                  <td className="td font-semibold text-ink">{n.title}</td>
                  <td className="td text-slate max-w-[320px] truncate">{n.body}</td>
                  <td className="td"><Badge tone={kindTone(n.kind)}>{kindLabel(n.kind)}</Badge></td>
                  <td className="td text-slate">{n.audience}</td>
                  <td className="td text-slate">{n.time}</td>
                </tr>
              ))}
              {sent.length === 0 && <tr><td className="td text-center text-muted py-8" colSpan={5}>لا توجد إشعارات</td></tr>}
            </tbody>
          </TableWrap>
        </div>
        <div className="md:hidden p-3 flex flex-col gap-2.5">
          {sent.map((n) => (
            <MobileRow
              key={n.id}
              title={n.title}
              status={<Badge tone={kindTone(n.kind)}>{kindLabel(n.kind)}</Badge>}
              rows={[
                { label: 'النص', value: n.body },
                { label: 'الجمهور', value: n.audience },
                { label: 'الوقت', value: n.time },
              ]}
            />
          ))}
          {sent.length === 0 && <Empty text="لا توجد إشعارات" />}
        </div>
      </Card>
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
