import { Check, Minus, ShieldCheck, Plus } from 'lucide-react';
import { adminRoles, permissionModules, activityLog } from '@ahla/shared';
import { Card, Badge, SectionHead, TableWrap } from '../components/ui';

export default function Roles() {
  return (
    <div className="flex flex-col gap-5">
      {/* Role summary cards */}
      <SectionHead title="الأدوار" action={<button className="btn btn-sm"><Plus size={15} /> دور جديد</button>} />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {adminRoles.map((r) => (
          <Card key={r.name} className="flex flex-col gap-2">
            <div className="w-10 h-10 rounded-xl bg-paper-2 grid place-items-center text-navy-700"><ShieldCheck size={18} /></div>
            <b className="text-[15px] text-navy-700">{r.name}</b>
            <p className="text-[12.5px] text-slate m-0 leading-relaxed">{r.description}</p>
            <Badge tone="navy"><span className="num">{r.members}</span> أعضاء</Badge>
          </Card>
        ))}
      </div>

      {/* Permission matrix */}
      <Card className="!p-1">
        <div className="p-4 pb-2"><h3 className="text-base font-extrabold text-ink m-0">مصفوفة الصلاحيات</h3></div>
        <TableWrap>
          <thead>
            <tr>
              <th className="th">الوحدة</th>
              {adminRoles.map((r) => <th key={r.name} className="th text-center">{r.name}</th>)}
            </tr>
          </thead>
          <tbody>
            {permissionModules.map((m) => (
              <tr key={m.key} className="hover:bg-paper-2">
                <td className="td font-semibold text-ink">{m.label}</td>
                {adminRoles.map((r) => (
                  <td key={r.name} className="td text-center">
                    {r.permissions[m.key] ? (
                      <span className="inline-grid place-items-center w-7 h-7 rounded-lg bg-green-soft text-green-dark mx-auto"><Check size={15} /></span>
                    ) : (
                      <span className="inline-grid place-items-center w-7 h-7 rounded-lg bg-paper-2 text-muted mx-auto"><Minus size={15} /></span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Card>

      {/* Activity log */}
      <Card>
        <SectionHead title="سجل النشاط" />
        <div className="flex flex-col">
          {activityLog.map((e, i) => (
            <div key={e.id} className={`flex items-center gap-3 py-3 ${i < activityLog.length - 1 ? 'border-b border-line-2' : ''}`}>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#c3d1e8] to-[#8ba0c2] shrink-0" />
              <div className="flex-1 text-[13.5px]">
                <b className="text-ink">{e.actor}</b> <span className="text-slate">{e.action}</span> <b className="text-navy-700">{e.target}</b>
              </div>
              <span className="num text-[12px] text-muted whitespace-nowrap">{e.at}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
