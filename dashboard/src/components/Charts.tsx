import { colors } from '@ahla/shared';

/** Dependency-free SVG charts, themed with shared tokens. */

export function BarChart({
  data,
  height = 200,
  color = colors.navy700,
}: {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const barW = 32;
  const gap = 26;
  const chartH = height - 32;
  const width = data.length * (barW + gap);

  return (
    <div className="overflow-x-auto scroll-thin">
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ minWidth: width, direction: 'ltr' }}>
        {data.map((d, i) => {
          const h = (d.value / max) * chartH;
          const x = i * (barW + gap) + gap / 2;
          const y = chartH - h;
          return (
            <g key={d.label}>
              <rect x={x} y={y} width={barW} height={h} rx={6} fill={color} opacity={0.9} />
              <text x={x + barW / 2} y={y - 6} textAnchor="middle" fontSize="11" fontWeight="700" fill={colors.navy700} fontFamily="Cairo">
                {d.value}
              </text>
              <text x={x + barW / 2} y={chartH + 18} textAnchor="middle" fontSize="11" fill={colors.slate} fontFamily="Cairo">
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function Donut({
  segments,
  size = 168,
}: {
  segments: { label: string; value: number; color: string }[];
  size?: number;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = size / 2 - 16;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex items-center gap-5 flex-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          {segments.map((s) => {
            const frac = s.value / total;
            const dash = frac * c;
            const el = (
              <circle
                key={s.label}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={20}
                strokeDasharray={`${dash} ${c - dash}`}
                strokeDashoffset={-offset}
              />
            );
            offset += dash;
            return el;
          })}
        </g>
        <text x="50%" y="47%" textAnchor="middle" fontSize="22" fontWeight="800" fill={colors.navy700} fontFamily="Cairo">
          {total.toLocaleString('en-US')}
        </text>
        <text x="50%" y="60%" textAnchor="middle" fontSize="11" fill={colors.slate} fontFamily="Cairo">
          إجمالي
        </text>
      </svg>
      <div className="flex flex-col gap-2">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-[13px]">
            <span className="w-3 h-3 rounded" style={{ background: s.color }} />
            <span className="text-slate font-semibold">{s.label}</span>
            <span className="num text-ink font-bold">{s.value.toLocaleString('en-US')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Horizontal ranked bars (reports). */
export function RankedBars({ data }: { data: { label: string; value: number; color?: string }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex flex-col gap-3">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="text-[13px] text-slate font-semibold w-28 shrink-0 text-right truncate">{d.label}</span>
          <div className="flex-1 h-5 rounded-md bg-paper-2 overflow-hidden">
            <div className="h-full rounded-md flex items-center" style={{ width: `${(d.value / max) * 100}%`, background: d.color ?? colors.navy700 }} />
          </div>
          <span className="num text-[13px] font-bold text-navy-700 w-8">{d.value}</span>
        </div>
      ))}
    </div>
  );
}
