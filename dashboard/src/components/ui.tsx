import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { X } from 'lucide-react';
import type { ServiceBookingStatus } from '@ahla/shared';

/* ---------------- Card ---------------- */
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`card p-4 sm:p-5 ${className}`}>{children}</div>;
}

/* ---------------- KPI ---------------- */
export function Kpi({
  icon: Icon,
  value,
  label,
  delta,
  tone = 'navy',
}: {
  icon: LucideIcon;
  value: string;
  label: string;
  delta?: { text: string; up: boolean };
  tone?: 'navy' | 'green' | 'gold' | 'danger';
}) {
  const toneBg: Record<string, string> = {
    navy: 'bg-paper-2 text-navy-700',
    green: 'bg-green-soft text-green-dark',
    gold: 'bg-gold-soft text-[#B9791A]',
    danger: 'bg-danger-soft text-danger',
  };
  return (
    <div className="card p-5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-xl grid place-items-center ${toneBg[tone]}`}>
          <Icon size={19} />
        </div>
        {delta && (
          <span className={`text-xs font-bold ${delta.up ? 'text-green' : 'text-danger'}`}>
            {delta.up ? '▲' : '▼'} {delta.text}
          </span>
        )}
      </div>
      <div className="num text-[26px] font-extrabold text-navy-700 leading-none">{value}</div>
      <div className="text-[13px] text-slate">{label}</div>
    </div>
  );
}

/* ---------------- Section head ---------------- */
export function SectionHead({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
      <h3 className="text-base font-extrabold text-ink m-0">{title}</h3>
      {action}
    </div>
  );
}

/* ---------------- Badge ---------------- */
type Tone = 'green' | 'danger' | 'gold' | 'navy' | 'muted';
const toneMap: Record<Tone, string> = {
  green: 'bg-green-soft text-green-dark',
  danger: 'bg-danger-soft text-danger',
  gold: 'bg-gold-soft text-[#B9791A]',
  navy: 'bg-paper-2 text-navy-700',
  muted: 'bg-paper-2 text-muted',
};
export function Badge({ children, tone = 'navy' }: { children: ReactNode; tone?: Tone }) {
  return <span className={`badge ${toneMap[tone]}`}>{children}</span>;
}

/** Shared booking-status → tone mapping used across dashboard + reports. */
export const statusTone = (s: ServiceBookingStatus): Tone =>
  s === 'مؤكد' ? 'navy' : s === 'مكتمل' ? 'green' : s === 'قيد الانتظار' ? 'gold' : s === 'لم يحضر' ? 'muted' : 'danger';

/* ---------------- Toggle ---------------- */
export function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={`w-11 h-6 rounded-full relative transition-colors ${on ? 'bg-navy-700' : 'bg-[#CBD4E1]'}`}
      aria-pressed={on}
    >
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${on ? 'left-0.5' : 'left-[22px]'}`} />
    </button>
  );
}

/* ---------------- Progress ---------------- */
export function ProgressCell({ percent, color }: { percent: number; color: string }) {
  return (
    <div className="flex items-center gap-2 justify-end">
      <span className="num text-xs font-bold min-w-[34px]" style={{ color }}>{percent}%</span>
      <div className="h-[7px] rounded-md bg-paper-2 overflow-hidden min-w-[90px] flex-1 max-w-[160px]">
        <i className="block h-full rounded-md" style={{ width: `${percent}%`, background: color }} />
      </div>
    </div>
  );
}

/* ---------------- Modal ---------------- */
export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[rgba(20,40,74,.4)]" onClick={onClose} />
      <div className="relative bg-card rounded-card shadow-raised w-full max-w-lg max-h-[85vh] overflow-y-auto scroll-thin">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line-2 sticky top-0 bg-card">
          <h3 className="text-base font-extrabold text-ink m-0">{title}</h3>
          <button onClick={onClose} className="text-muted hover:text-ink"><X size={20} /></button>
        </div>
        <div className="p-5">{children}</div>
        {footer && <div className="flex justify-start gap-2 px-5 py-4 border-t border-line-2">{footer}</div>}
      </div>
    </div>
  );
}

/* ---------------- Table wrapper (desktop) ---------------- */
export function TableWrap({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto scroll-thin -mx-1">
      <table className="w-full border-collapse text-[14px] min-w-[560px]">{children}</table>
    </div>
  );
}

/* ---------------- Mobile row card ----------------
   Stacked card used on phones in place of a wide table row. */
export function MobileRow({
  title,
  subtitle,
  status,
  rows,
  actions,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  status?: ReactNode;
  rows: { label: string; value: ReactNode }[];
  actions?: ReactNode;
}) {
  return (
    <div className="border border-line rounded-xl p-3.5 flex flex-col gap-2.5 bg-card">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[14px] font-bold text-navy-700 truncate">{title}</div>
          {subtitle && <div className="text-[12px] text-muted mt-0.5 num">{subtitle}</div>}
        </div>
        {status}
      </div>
      <div className="flex flex-col gap-1.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-3 text-[12.5px]">
            <span className="text-muted shrink-0">{r.label}</span>
            <span className="text-ink font-semibold text-left truncate">{r.value}</span>
          </div>
        ))}
      </div>
      {actions && <div className="flex flex-wrap gap-1.5 pt-1">{actions}</div>}
    </div>
  );
}

/* ---------------- Empty state ---------------- */
export function Empty({ text }: { text: string }) {
  return <div className="text-center text-muted text-sm py-10">{text}</div>;
}
