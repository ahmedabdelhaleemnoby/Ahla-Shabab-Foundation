import { useState } from 'react';
import { UserPlus, MessageSquareText, PhoneCall, Archive, CheckCircle2 } from 'lucide-react';
import {
  volunteerApplications as seedVolunteers,
  contactMessages as seedMessages,
  type VolunteerApplication,
  type VolunteerStatus,
  type ContactMessage,
  type MessageStatus,
} from '@ahla/shared';
import { Card, Badge, TableWrap, MobileRow, Empty } from '../components/ui';

/* Inbox — the forms users submit from the app (volunteer + contact us) land here.
   TODO(backend): GET /admin/volunteers, GET /admin/messages + status PATCH. */

type Tone = 'green' | 'danger' | 'gold' | 'navy' | 'muted';
const vTone = (s: VolunteerStatus): Tone => (s === 'جديد' ? 'gold' : s === 'مقبول' ? 'green' : s === 'تم التواصل' ? 'navy' : 'muted');
const mTone = (s: MessageStatus): Tone => (s === 'جديدة' ? 'gold' : s === 'تم الرد' ? 'green' : 'muted');

export default function Inbox() {
  const [tab, setTab] = useState<'volunteers' | 'messages'>('volunteers');
  const [volunteers, setVolunteers] = useState<VolunteerApplication[]>(seedVolunteers);
  const [messages, setMessages] = useState<ContactMessage[]>(seedMessages);

  const newV = volunteers.filter((v) => v.status === 'جديد').length;
  const newM = messages.filter((m) => m.status === 'جديدة').length;

  const setVStatus = (id: string, status: VolunteerStatus) =>
    setVolunteers((prev) => prev.map((v) => (v.id === id ? { ...v, status } : v)));
  const setMStatus = (id: string, status: MessageStatus) =>
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-2">
        <button className={`chip flex items-center gap-1.5 ${tab === 'volunteers' ? 'chip-on' : ''}`} onClick={() => setTab('volunteers')}>
          <UserPlus size={14} /> طلبات التطوع
          {newV > 0 && <span className="num text-[11px] font-extrabold bg-danger text-white rounded-full px-1.5">{newV}</span>}
        </button>
        <button className={`chip flex items-center gap-1.5 ${tab === 'messages' ? 'chip-on' : ''}`} onClick={() => setTab('messages')}>
          <MessageSquareText size={14} /> رسائل تواصل معنا
          {newM > 0 && <span className="num text-[11px] font-extrabold bg-danger text-white rounded-full px-1.5">{newM}</span>}
        </button>
      </div>

      {tab === 'volunteers' && (
        <Card className="!p-1">
          <div className="hidden md:block">
            <TableWrap>
              <thead>
                <tr>
                  <th className="th">المتقدم</th>
                  <th className="th">الهاتف</th>
                  <th className="th">المحافظة</th>
                  <th className="th">مجالات الاهتمام</th>
                  <th className="th">التوفر</th>
                  <th className="th">الحالة</th>
                  <th className="th">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {volunteers.map((v) => (
                  <tr key={v.id} className="hover:bg-paper-2">
                    <td className="td">
                      <b className="text-ink block">{v.name}</b>
                      <span className="text-[11.5px] text-muted num">{v.submittedAt}{v.age ? ` · ${v.age} سنة` : ''}</span>
                    </td>
                    <td className="td num text-slate">{v.phone}</td>
                    <td className="td text-slate">{v.governorate}</td>
                    <td className="td">
                      <div className="flex flex-wrap gap-1">
                        {v.interests.map((i) => <span key={i} className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-paper-2 text-navy-700">{i}</span>)}
                      </div>
                    </td>
                    <td className="td text-slate">{v.availability}</td>
                    <td className="td"><Badge tone={vTone(v.status)}>{v.status}</Badge></td>
                    <td className="td"><VolunteerActions v={v} onSet={setVStatus} /></td>
                  </tr>
                ))}
                {volunteers.length === 0 && <tr><td className="td text-center text-muted py-8" colSpan={7}>لا توجد طلبات</td></tr>}
              </tbody>
            </TableWrap>
          </div>
          <div className="md:hidden p-3 flex flex-col gap-2.5">
            {volunteers.map((v) => (
              <MobileRow
                key={v.id}
                title={v.name}
                subtitle={v.phone}
                status={<Badge tone={vTone(v.status)}>{v.status}</Badge>}
                rows={[
                  { label: 'المحافظة', value: v.governorate },
                  { label: 'الاهتمامات', value: v.interests.join('، ') },
                  { label: 'التوفر', value: v.availability },
                ]}
                actions={<VolunteerActions v={v} onSet={setVStatus} />}
              />
            ))}
            {volunteers.length === 0 && <Empty text="لا توجد طلبات" />}
          </div>
        </Card>
      )}

      {tab === 'messages' && (
        <div className="flex flex-col gap-3">
          {messages.map((m) => (
            <Card key={m.id} className="flex flex-col gap-2.5">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <b className="text-[14.5px] text-navy-700 block">{m.name}</b>
                  <span className="text-[12px] text-muted num">{m.phone} · {m.receivedAt}</span>
                </div>
                <Badge tone={mTone(m.status)}>{m.status}</Badge>
              </div>
              <p className="text-[13.5px] text-ink leading-relaxed m-0 text-right">{m.message}</p>
              <div className="flex flex-wrap gap-2 border-t border-line-2 pt-2.5">
                {m.status !== 'تم الرد' && (
                  <button className="btn btn-sm" onClick={() => setMStatus(m.id, 'تم الرد')}><CheckCircle2 size={14} /> تحديد كمردود عليها</button>
                )}
                <a className="btn btn-outline btn-sm" href={`tel:${m.phone}`}><PhoneCall size={14} /> اتصال</a>
                {m.status !== 'مؤرشفة' && (
                  <button className="btn btn-outline btn-sm" onClick={() => setMStatus(m.id, 'مؤرشفة')}><Archive size={14} /> أرشفة</button>
                )}
              </div>
            </Card>
          ))}
          {messages.length === 0 && <Empty text="لا توجد رسائل" />}
        </div>
      )}
    </div>
  );
}

function VolunteerActions({ v, onSet }: { v: VolunteerApplication; onSet: (id: string, s: VolunteerStatus) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {v.status === 'جديد' && (
        <button className="btn btn-sm" onClick={() => onSet(v.id, 'تم التواصل')}><PhoneCall size={13} /> تم التواصل</button>
      )}
      {(v.status === 'جديد' || v.status === 'تم التواصل') && (
        <button className="btn btn-outline btn-sm" onClick={() => onSet(v.id, 'مقبول')}><CheckCircle2 size={13} /> قبول</button>
      )}
      {v.status !== 'مؤرشف' && (
        <button className="btn btn-outline btn-sm" onClick={() => onSet(v.id, 'مؤرشف')}><Archive size={13} /> أرشفة</button>
      )}
    </div>
  );
}
