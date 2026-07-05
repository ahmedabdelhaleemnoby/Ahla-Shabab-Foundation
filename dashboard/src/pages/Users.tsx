import { useMemo, useState } from 'react';
import { Ban, Check, Download } from 'lucide-react';
import { adminUsers as seed, governorates, type AdminUser } from '@ahla/shared';
import { Card, Badge, TableWrap, Kpi, MobileRow } from '../components/ui';
import { Users as UsersIcon, UserCheck, UserX } from 'lucide-react';
import { exportCsv } from '../lib/csv';

export default function UsersPage() {
  const [rows, setRows] = useState<AdminUser[]>(seed);
  const [q, setQ] = useState('');
  const [gov, setGov] = useState('الكل');
  const [reg, setReg] = useState<'الكل' | 'مسجل' | 'زائر'>('الكل');

  const filtered = useMemo(
    () =>
      rows.filter(
        (u) =>
          (q === '' || u.name.includes(q) || u.phone.includes(q)) &&
          (gov === 'الكل' || u.governorate === gov) &&
          (reg === 'الكل' || (reg === 'مسجل' ? u.registered : !u.registered))
      ),
    [rows, q, gov, reg]
  );

  const toggleBlock = (id: string) => setRows((prev) => prev.map((u) => (u.id === id ? { ...u, blocked: !u.blocked } : u)));

  const registered = rows.filter((u) => u.registered).length;
  const blocked = rows.filter((u) => u.blocked).length;

  const doExport = () =>
    exportCsv(
      'users.csv',
      ['الاسم', 'الهاتف', 'المحافظة', 'عدد الحجوزات', 'آخر حجز', 'النوع', 'الحالة'],
      filtered.map((u) => [u.name, u.phone, u.governorate, u.bookings, u.lastBooking, u.registered ? 'مسجل' : 'زائر', u.blocked ? 'محظور' : 'نشط'])
    );

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Kpi icon={UsersIcon} value={String(rows.length)} label="إجمالي المستخدمين" />
        <Kpi icon={UserCheck} tone="green" value={String(registered)} label="حسابات مسجّلة" />
        <Kpi icon={UserX} tone="danger" value={String(blocked)} label="محظورون" />
      </div>

      <Card className="!p-0">
        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-line-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث بالاسم أو الهاتف..." className="field !w-auto flex-1 min-w-[200px]" />
          <select value={reg} onChange={(e) => setReg(e.target.value as any)} className="field !w-auto">
            <option value="الكل">الكل</option>
            <option value="مسجل">مسجّل</option>
            <option value="زائر">زائر</option>
          </select>
          <select value={gov} onChange={(e) => setGov(e.target.value)} className="field !w-auto">
            <option value="الكل">كل المحافظات</option>
            {governorates.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          <button className="btn btn-sm" onClick={doExport}><Download size={15} /> تصدير CSV</button>
        </div>

        <div className="p-1 hidden md:block">
          <TableWrap>
            <thead>
              <tr>
                <th className="th">الاسم</th>
                <th className="th">الهاتف</th>
                <th className="th">المحافظة</th>
                <th className="th">الحجوزات</th>
                <th className="th">آخر حجز</th>
                <th className="th">النوع</th>
                <th className="th">الحالة</th>
                <th className="th">إجراء</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-paper-2">
                  <td className="td font-semibold">{u.name}</td>
                  <td className="td num text-slate">{u.phone}</td>
                  <td className="td text-slate">{u.governorate}</td>
                  <td className="td num font-bold text-navy-700">{u.bookings}</td>
                  <td className="td num text-slate">{u.lastBooking}</td>
                  <td className="td"><Badge tone={u.registered ? 'navy' : 'muted'}>{u.registered ? 'مسجّل' : 'زائر'}</Badge></td>
                  <td className="td"><Badge tone={u.blocked ? 'danger' : 'green'}>{u.blocked ? 'محظور' : 'نشط'}</Badge></td>
                  <td className="td">
                    {u.blocked ? (
                      <button onClick={() => toggleBlock(u.id)} className="btn btn-outline btn-sm !text-green !border-green"><Check size={14} /> رفع الحظر</button>
                    ) : (
                      <button onClick={() => toggleBlock(u.id)} className="btn btn-outline btn-sm !text-danger !border-danger"><Ban size={14} /> حظر</button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td className="td text-center text-muted py-8" colSpan={8}>لا يوجد مستخدمون</td></tr>}
            </tbody>
          </TableWrap>
        </div>

        {/* Cards (mobile) */}
        <div className="md:hidden p-3 flex flex-col gap-2.5">
          {filtered.map((u) => (
            <MobileRow
              key={u.id}
              title={u.name}
              subtitle={u.phone}
              status={<Badge tone={u.blocked ? 'danger' : 'green'}>{u.blocked ? 'محظور' : 'نشط'}</Badge>}
              rows={[
                { label: 'المحافظة', value: u.governorate },
                { label: 'عدد الحجوزات', value: <span className="num">{u.bookings}</span> },
                { label: 'آخر حجز', value: <span className="num">{u.lastBooking}</span> },
                { label: 'النوع', value: u.registered ? 'مسجّل' : 'زائر' },
              ]}
              actions={
                u.blocked ? (
                  <button onClick={() => toggleBlock(u.id)} className="btn btn-outline btn-sm !text-green !border-green"><Check size={14} /> رفع الحظر</button>
                ) : (
                  <button onClick={() => toggleBlock(u.id)} className="btn btn-outline btn-sm !text-danger !border-danger"><Ban size={14} /> حظر</button>
                )
              }
            />
          ))}
          {filtered.length === 0 && <div className="text-center text-muted py-8">لا يوجد مستخدمون</div>}
        </div>
      </Card>
    </div>
  );
}
