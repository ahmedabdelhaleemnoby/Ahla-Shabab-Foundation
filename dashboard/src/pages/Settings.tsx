import { useState, type ReactNode } from 'react';
import { Save, Phone, Share2, Wallet, Home, Calculator, BarChart3 } from 'lucide-react';
import {
  appConfig,
  foundationStats,
  paymentMethods as seedMethods,
  type PaymentMethodInfo,
  type PaymentAvailability,
} from '@ahla/shared';
import { Card, Badge, SectionHead } from '../components/ui';

/* App settings — everything the mobile app displays that isn't content:
   impact numbers, home hero texts, contact info, socials, payment methods, zakat.
   TODO(backend): GET/PUT /admin/config + PATCH /admin/payment-methods/:id. */

const AVAILABILITIES: PaymentAvailability[] = ['متاحة', 'قيد التفعيل', 'غير متاحة حالياً'];
type Tone = 'green' | 'danger' | 'gold' | 'navy' | 'muted';
const availTone = (a: PaymentAvailability): Tone => (a === 'متاحة' ? 'green' : a === 'قيد التفعيل' ? 'gold' : 'muted');

export default function Settings() {
  const [impact, setImpact] = useState({ ...foundationStats });
  const [cfg, setCfg] = useState({ ...appConfig, socials: { ...appConfig.socials } });
  const [methods, setMethods] = useState<PaymentMethodInfo[]>(seedMethods.map((m) => ({ ...m })));
  const [saved, setSaved] = useState<Record<string, boolean>>({ impact: true, hero: true, contact: true, socials: true, methods: true, zakat: true });

  const touch = (key: string) => setSaved((s) => ({ ...s, [key]: false }));
  const save = (key: string) => setSaved((s) => ({ ...s, [key]: true }));

  const SaveAction = ({ k }: { k: string }) =>
    saved[k] ? <Badge tone="green">تم الحفظ</Badge> : <button className="btn btn-sm" onClick={() => save(k)}><Save size={14} /> حفظ</button>;

  return (
    <div className="flex flex-col gap-5">
      {/* Impact numbers */}
      <Card>
        <SectionHead title="أرقام الأثر (الرئيسية + عن الجمعية في التطبيق)" action={<div className="flex items-center gap-2"><BarChart3 size={16} className="text-navy-500" /><SaveAction k="impact" /></div>} />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {([['governorates', 'عدد المحافظات'], ['beneficiaries', 'عدد المستفيدين'], ['yearsOfService', 'سنوات العطاء']] as const).map(([k, label]) => (
            <Labeled key={k} label={label}>
              <input className="field num" value={String(impact[k])} onChange={(e) => { setImpact({ ...impact, [k]: e.target.value }); touch('impact'); }} />
            </Labeled>
          ))}
        </div>
      </Card>

      {/* Home hero texts */}
      <Card>
        <SectionHead title="نصوص الشاشة الرئيسية" action={<div className="flex items-center gap-2"><Home size={16} className="text-navy-500" /><SaveAction k="hero" /></div>} />
        <div className="flex flex-col gap-4">
          <Labeled label="العنوان الرئيسي">
            <input className="field" value={cfg.heroTitle} onChange={(e) => { setCfg({ ...cfg, heroTitle: e.target.value }); touch('hero'); }} />
          </Labeled>
          <Labeled label="النص التعريفي (يظهر أسفل الشعار)">
            <textarea className="field min-h-[64px]" value={cfg.heroSubtitle} onChange={(e) => { setCfg({ ...cfg, heroSubtitle: e.target.value }); touch('hero'); }} />
          </Labeled>
        </div>
      </Card>

      {/* Contact info */}
      <Card>
        <SectionHead title="بيانات التواصل (شاشة تواصل معنا)" action={<div className="flex items-center gap-2"><Phone size={16} className="text-navy-500" /><SaveAction k="contact" /></div>} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Labeled label="الخط الساخن"><input className="field num" value={cfg.hotline} onChange={(e) => { setCfg({ ...cfg, hotline: e.target.value }); touch('contact'); }} /></Labeled>
          <Labeled label="البريد الإلكتروني"><input className="field num" dir="ltr" value={cfg.email} onChange={(e) => { setCfg({ ...cfg, email: e.target.value }); touch('contact'); }} /></Labeled>
          <Labeled label="العنوان"><input className="field" value={cfg.address} onChange={(e) => { setCfg({ ...cfg, address: e.target.value }); touch('contact'); }} /></Labeled>
          <Labeled label="مواعيد العمل"><input className="field" value={cfg.workingHours} onChange={(e) => { setCfg({ ...cfg, workingHours: e.target.value }); touch('contact'); }} /></Labeled>
        </div>
      </Card>

      {/* Socials */}
      <Card>
        <SectionHead title="روابط التواصل الاجتماعي" action={<div className="flex items-center gap-2"><Share2 size={16} className="text-navy-500" /><SaveAction k="socials" /></div>} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {([['facebook', 'فيسبوك'], ['instagram', 'إنستجرام'], ['youtube', 'يوتيوب'], ['twitter', 'إكس (تويتر)']] as const).map(([k, label]) => (
            <Labeled key={k} label={label}>
              <input className="field num" dir="ltr" value={cfg.socials[k]} onChange={(e) => { setCfg({ ...cfg, socials: { ...cfg.socials, [k]: e.target.value } }); touch('socials'); }} />
            </Labeled>
          ))}
        </div>
      </Card>

      {/* Payment methods */}
      <Card>
        <SectionHead title="وسائل الدفع (شاشة التبرع في التطبيق)" action={<div className="flex items-center gap-2"><Wallet size={16} className="text-navy-500" /><SaveAction k="methods" /></div>} />
        <div className="flex flex-col gap-3">
          {methods.map((m) => (
            <div key={m.id} className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-line p-3.5">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <b className="text-[14px] text-navy-700">{m.id}</b>
                  <Badge tone={availTone(m.availability)}>{m.availability}</Badge>
                  {m.manual && <Badge tone="gold">اعتماد يدوي</Badge>}
                </div>
                <div className="text-[12px] text-slate mt-1">{m.description}</div>
                <div className="text-[11.5px] text-muted mt-0.5">
                  {m.manual
                    ? 'تبرعات هذه الوسيلة تبقى «قيد المراجعة» حتى يعتمدها فريق التبرعات.'
                    : 'تُؤكَّد تبرعات هذه الوسيلة تلقائياً من بوابة الدفع (السيرفر) فقط.'}
                </div>
              </div>
              <select
                className="field !w-auto min-w-[170px]"
                value={m.availability}
                onChange={(e) => {
                  setMethods((prev) => prev.map((x) => (x.id === m.id ? { ...x, availability: e.target.value as PaymentAvailability } : x)));
                  touch('methods');
                }}
              >
                {AVAILABILITIES.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          ))}
        </div>
      </Card>

      {/* Zakat calculator */}
      <Card>
        <SectionHead title="حاسبة الزكاة" action={<div className="flex items-center gap-2"><Calculator size={16} className="text-navy-500" /><SaveAction k="zakat" /></div>} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
          <Labeled label="قيمة النصاب (ج.م) — تعادل 85 جرام ذهب عيار 21">
            <input className="field num" type="number" value={cfg.zakatNisabEgp} onChange={(e) => { setCfg({ ...cfg, zakatNisabEgp: +e.target.value || 0 }); touch('zakat'); }} />
          </Labeled>
          <div className="text-[12.5px] text-muted bg-paper-2 rounded-xl px-3.5 py-2.5 text-right">
            يُحدَّث النصاب دورياً مع سعر الذهب حتى تكون نتيجة الحاسبة في التطبيق دقيقة.
          </div>
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
