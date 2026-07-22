import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Screen } from '../components/Screen';
import { AppBar } from '../components/AppBar';
import { Card, Button, Segmented, ProgressBar } from '../components/ui';
import { Icon, IconName } from '../components/Icon';
import { colors, font, num, row, rowBetween } from '../theme';
import {
  cases,
  projects,
  paymentMethods,
  makeBookingRef,
  initialDonationStatus,
  isMethodUsable,
  isValidDonationAmount,
  pct,
  egp,
  type PaymentMethod,
} from '@ahla/shared';
import { appState } from '../store/appState';

/* Donation journey (demo): destination → case/project → amount & recurrence
   → payment method → summary → pending receipt. No real payment ever runs. */

const STEPS = ['الوجهة', 'الاختيار', 'المبلغ', 'الدفع', 'الملخص'] as const;

const DESTINATIONS: { id: string; label: string; hint: string; icon: IconName; pick?: 'cases' | 'projects' }[] = [
  { id: 'cases', label: 'حالة إنسانية', hint: 'ساهم لحالة موثقة بعينها', icon: 'users', pick: 'cases' },
  { id: 'projects', label: 'مشروع خيري', hint: 'ادعم مشروعاً مستداماً', icon: 'home', pick: 'projects' },
  { id: 'students', label: 'دعم الطلاب', hint: 'كفالة تعليمية للمتفوقين', icon: 'award' },
  { id: 'kitchens', label: 'إطعام', hint: 'وجبات للأسر الأولى بالرعاية', icon: 'coffee' },
  { id: 'water', label: 'المياه', hint: 'وصلات ومحطات مياه نقية', icon: 'droplet' },
];

const AMOUNTS = ['مبلغ آخر', '250', '500', '1000'];

/** Brand visuals per method — availability/behavior comes from shared paymentMethods. */
const BRAND: Record<PaymentMethod, { brand?: string; brandColor?: string; icon?: 'credit-card' | 'smartphone' | 'home' }> = {
  'بطاقة بنكية': { icon: 'credit-card' },
  فوري: { brand: 'fawry', brandColor: colors.fawryNavy },
  إنستاباي: { brand: 'instaPAY', brandColor: colors.instapay },
  'فودافون كاش': { brand: 'Vodafone', brandColor: colors.vodafone },
  'تحويل بنكي': { icon: 'home' },
};

export default function DonateScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();

  const [step, setStep] = useState(0);
  const [dest, setDest] = useState('cases');
  const [caseId, setCaseId] = useState<string | undefined>();
  const [projectId, setProjectId] = useState<string | undefined>();
  const [amount, setAmount] = useState('500');
  const [custom, setCustom] = useState('');
  const [recurring, setRecurring] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>('بطاقة بنكية');
  const [err, setErr] = useState<string | null>(null);

  // Deep entries: «تبرع للحالة» / «دعم المشروع» land here preselected, on the amount step.
  useEffect(() => {
    if (route.params?.caseId) {
      setDest('cases');
      setCaseId(route.params.caseId);
      if (route.params?.sponsor) setRecurring(true); // «اكفل أسرة» = monthly by default
      setStep(2);
    } else if (route.params?.projectId) {
      setDest('projects');
      setProjectId(route.params.projectId);
      setStep(2);
    }
  }, [route.params?.caseId, route.params?.projectId, route.params?.sponsor]);

  const destMeta = DESTINATIONS.find((d) => d.id === dest)!;
  const chosenCase = cases.find((c) => c.id === caseId);
  const chosenProject = projects.find((p) => p.id === projectId);
  const causeLabel =
    dest === 'cases' ? chosenCase?.code ?? 'حالة إنسانية' : dest === 'projects' ? chosenProject?.title ?? 'مشروع خيري' : destMeta.label;

  const effective = amount === 'مبلغ آخر' ? custom : amount;
  const total = effective ? `${effective} ج.م` : '—';
  const methodInfo = paymentMethods.find((m) => m.id === method);
  const needsPick = !!destMeta.pick;

  const validateStep = (): string | null => {
    if (step === 1) {
      if (dest === 'cases' && !chosenCase) return 'اختر الحالة التي تريد دعمها';
      if (dest === 'projects' && !chosenProject) return 'اختر المشروع الذي تريد دعمه';
    }
    if (step === 2 && !isValidDonationAmount(effective)) return 'أدخل مبلغاً صحيحاً (من 5 حتى 1,000,000 ج.م)';
    if (step === 3 && !isMethodUsable(method)) return 'اختر وسيلة دفع متاحة';
    return null;
  };

  const next = () => {
    const e = validateStep();
    setErr(e);
    if (e) return;
    if (step === 0) return setStep(needsPick ? 1 : 2);
    if (step < STEPS.length - 1) return setStep(step + 1);
    confirm();
  };

  const back = () => {
    setErr(null);
    if (step === 0) return;
    if (step === 2 && !needsPick) return setStep(0);
    setStep(step - 1);
  };

  const confirm = () => {
    if (!methodInfo) return;
    // Recorded PENDING only — «مكتمل» can come solely from the payment-gateway
    // server or admin approval. This demo never simulates a successful payment.
    const receipt = {
      reference: makeBookingRef(Math.floor(Date.now() / 1000)),
      date: new Date().toISOString().slice(0, 10),
      amount: total,
      cause: causeLabel,
      method,
      recurring,
      status: initialDonationStatus(method),
    };
    appState.addReceipt(receipt);
    setStep(0);
    setCaseId(undefined);
    setProjectId(undefined);
    nav.navigate('DonationSuccess', receipt);
  };

  return (
    <Screen
      header={<AppBar title="التبرع" onBack={() => nav.navigate('Home')} />}
      footer={
        <StickyFooter>
          {step > 0 && <Button label="السابق" variant="outline" style={{ width: 104 }} onPress={back} />}
          <Button
            label={step === STEPS.length - 1 ? 'تأكيد التبرع (عرض)' : 'التالي'}
            icon={step === STEPS.length - 1 ? 'check' : undefined}
            style={{ flex: 1 }}
            onPress={next}
          />
        </StickyFooter>
      }
    >
      {/* Progress */}
      <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', marginTop: 4, marginBottom: 12 }}>
        {STEPS.map((s, i) => (
          <View key={s} style={{ alignItems: 'center', flex: 1 }}>
            <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: i < step ? colors.green : i === step ? colors.navy700 : colors.paper2, alignItems: 'center', justifyContent: 'center' }}>
              {i < step ? <Icon name="check" size={13} color="#fff" /> : <Text style={[font('800'), num, { fontSize: 11, color: i === step ? '#fff' : colors.muted }]}>{i + 1}</Text>}
            </View>
            <Text style={[font(i === step ? '800' : '400'), { fontSize: 9, color: i === step ? colors.navy700 : colors.muted, marginTop: 4 }]}>{s}</Text>
          </View>
        ))}
      </View>

      {/* Step 0 — destination */}
      {step === 0 && (
        <>
          <Pressable
            onPress={() => nav.navigate('ZakatCalculator')}
            style={[row, { gap: 11, backgroundColor: '#EAF0F8', borderRadius: 14, padding: 12, marginBottom: 12 }]}
          >
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="percent" size={19} color={colors.navy700} />
            </View>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <Text style={[font('800'), { fontSize: 12.5, color: colors.navy700 }]}>لست متأكداً من زكاتك؟</Text>
              <Text style={[font('400'), { fontSize: 10, color: colors.slate, marginTop: 1 }]}>احسب مقدار زكاة مالك في ثوانٍ</Text>
            </View>
            <Icon name="chevron-left" size={18} color={colors.muted} />
          </Pressable>

          <Label text="إلى أين تحب أن يصل تبرعك؟" />
          <View style={{ gap: 8 }}>
            {DESTINATIONS.map((d) => {
              const on = dest === d.id;
              return (
                <Pressable
                  key={d.id}
                  onPress={() => { setDest(d.id); setCaseId(undefined); setProjectId(undefined); }}
                  style={[row, { gap: 11, borderWidth: 1.5, borderColor: on ? colors.navy700 : colors.line, backgroundColor: '#fff', borderRadius: 14, padding: 13 }]}
                >
                  <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: on ? colors.navy700 : colors.paper2, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={d.icon} size={19} color={on ? '#fff' : colors.navy700} />
                  </View>
                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <Text style={[font('800'), { fontSize: 13.5, color: colors.navy700 }]}>{d.label}</Text>
                    <Text style={[font('400'), { fontSize: 10.5, color: colors.slate, marginTop: 2 }]}>{d.hint}</Text>
                  </View>
                  <Icon name={on ? 'check-circle' : 'circle'} size={18} color={on ? colors.green : colors.line} />
                </Pressable>
              );
            })}
          </View>
        </>
      )}

      {/* Step 1 — pick the case / project */}
      {step === 1 && dest === 'cases' && (
        <>
          <Label text="اختر الحالة" />
          <View style={{ gap: 10 }}>
            {cases.map((c) => (
              <PickCard
                key={c.id}
                on={caseId === c.id}
                onPress={() => setCaseId(c.id)}
                title={c.code}
                subtitle={c.title}
                meta={`${c.location} · متبقي ${egp(c.targetAmount - c.raisedAmount)}`}
                percent={pct(c.raisedAmount, c.targetAmount)}
                color={colors.red}
              />
            ))}
          </View>
        </>
      )}
      {step === 1 && dest === 'projects' && (
        <>
          <Label text="اختر المشروع" />
          <View style={{ gap: 10 }}>
            {projects.map((p) => (
              <PickCard
                key={p.id}
                on={projectId === p.id}
                onPress={() => setProjectId(p.id)}
                title={p.title}
                subtitle={p.category ? `${p.category} · ${p.timeline ?? ''}` : p.description}
                meta={`${egp(p.raisedAmount)} من ${egp(p.targetAmount)}`}
                percent={pct(p.raisedAmount, p.targetAmount)}
                color={colors.green}
              />
            ))}
          </View>
        </>
      )}

      {/* Step 2 — amount + recurrence */}
      {step === 2 && (
        <>
          <SelectionBanner label={causeLabel} onChange={() => setStep(needsPick ? 1 : 0)} />
          <Label text="اختر مبلغ التبرع" />
          <Segmented options={AMOUNTS} value={amount} onChange={setAmount} />
          <View style={[rowBetween, { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: 12, paddingHorizontal: 14, marginTop: 9 }]}>
            {amount === 'مبلغ آخر' ? (
              <TextInput
                value={custom}
                onChangeText={(t) => setCustom(t.replace(/[^0-9]/g, '').slice(0, 7))}
                placeholder="اكتب المبلغ"
                placeholderTextColor={colors.muted}
                keyboardType="number-pad"
                style={[font('700'), num, { flex: 1, color: colors.navy700, fontSize: 15, paddingVertical: 12, textAlign: 'left' }]}
              />
            ) : (
              <Text style={[font('700'), num, { color: colors.navy700, paddingVertical: 12 }]}>{amount}</Text>
            )}
            <Text style={[font('400'), { color: colors.muted }]}>ج.م</Text>
          </View>

          <Label text="نوع التبرع" />
          <View style={[row, { gap: 8 }]}>
            {([
              { v: false, t: 'مرة واحدة', h: 'تبرع فوري لمرة واحدة' },
              { v: true, t: 'شهري مستمر', h: 'يتجدد تلقائياً كل شهر' },
            ] as const).map((o) => {
              const on = recurring === o.v;
              return (
                <Pressable
                  key={o.t}
                  onPress={() => setRecurring(o.v)}
                  style={{ flex: 1, borderWidth: 1.5, borderColor: on ? colors.navy700 : colors.line, backgroundColor: on ? colors.navy700 : '#fff', borderRadius: 14, paddingVertical: 12, alignItems: 'center' }}
                >
                  <Text style={[font('800'), { fontSize: 12.5, color: on ? '#fff' : colors.navy700 }]}>{o.t}</Text>
                  <Text style={[font('400'), { fontSize: 9.5, color: on ? '#dfe9f8' : colors.muted, marginTop: 2 }]}>{o.h}</Text>
                </Pressable>
              );
            })}
          </View>
        </>
      )}

      {/* Step 3 — payment method */}
      {step === 3 && (
        <>
          <Label text="اختر طريقة الدفع" />
          <View style={{ gap: 8 }}>
            {paymentMethods.map((m) => {
              const on = method === m.id;
              const available = m.availability === 'متاحة';
              const b = BRAND[m.id];
              return (
                <Pressable
                  key={m.id}
                  disabled={!available}
                  onPress={() => setMethod(m.id)}
                  style={[row, { gap: 10, borderWidth: 1, borderColor: on ? colors.navy700 : colors.line, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#fff', alignItems: 'flex-start', opacity: available ? 1 : 0.55 }]}
                >
                  <View style={[styles_rd, { marginTop: 3 }, on && { borderColor: colors.navy700 }]}>
                    {on && <View style={styles_rdDot} />}
                  </View>
                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <View style={[row, { gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }]}>
                      <Text style={[font('700'), { fontSize: 13, color: colors.ink }]}>{m.id}</Text>
                      <StatusChip
                        label={m.availability}
                        bg={available ? colors.greenSoft : m.availability === 'قيد التفعيل' ? colors.goldSoft : colors.paper2}
                        fg={available ? colors.greenDark : m.availability === 'قيد التفعيل' ? '#B9791A' : colors.muted}
                      />
                      {m.manual && <StatusChip label="بمراجعة الإدارة" bg="#EAF0F8" fg={colors.navy700} />}
                    </View>
                    <Text style={[font('400'), { fontSize: 10, color: colors.slate, marginTop: 3, textAlign: 'right', lineHeight: 14 }]}>{m.description}</Text>
                  </View>
                  {b.brand ? (
                    <Text style={[font('800'), { color: b.brandColor, fontSize: 11, marginTop: 4 }]}>{b.brand}</Text>
                  ) : (
                    <Icon name={b.icon ?? 'credit-card'} size={16} color={colors.navy700} />
                  )}
                </Pressable>
              );
            })}
          </View>

          <Pressable onPress={() => nav.navigate('PaymentInfo')} style={[row, { gap: 8, marginTop: 12, justifyContent: 'flex-end' }]}>
            <Text style={[font('700'), { fontSize: 11, color: colors.navy500 }]}>كيف يتم تأكيد الدفع؟ ‹</Text>
            <Icon name="info" size={13} color={colors.navy500} />
          </Pressable>
        </>
      )}

      {/* Step 4 — summary */}
      {step === 4 && (
        <>
          <Label text="ملخص التبرع" />
          <Card style={{ backgroundColor: '#F6F9FD' }}>
            <SummaryRow label="وجهة التبرع" value={destMeta.label} />
            {(chosenCase || chosenProject) && <SummaryRow label={dest === 'cases' ? 'الحالة' : 'المشروع'} value={causeLabel} />}
            <SummaryRow label="نوع التبرع" value={recurring ? 'شهري مستمر' : 'مرة واحدة'} />
            <SummaryRow label="طريقة الدفع" value={method} />
            <SummaryRow label="حالة التبرع بعد التأكيد" value={initialDonationStatus(method)} />
            <View style={{ height: 1, backgroundColor: colors.line2, marginVertical: 10 }} />
            <View style={rowBetween}>
              <Text style={[font('800'), num, { fontSize: 18, color: colors.navy700 }]}>{total}{recurring ? ' / شهرياً' : ''}</Text>
              <Text style={[font('800'), { fontSize: 13, color: colors.navy700 }]}>الإجمالي:</Text>
            </View>
          </Card>

          <Card style={[row, { gap: 10, marginTop: 12, backgroundColor: colors.goldSoft }]}>
            <Icon name="alert-triangle" size={16} color="#B9791A" />
            <Text style={[font('700'), { flex: 1, fontSize: 11, color: '#8A5B10', textAlign: 'right', lineHeight: 17 }]}>
              نسخة عرض — لا يتم تنفيذ أي عملية دفع فعلية.{'\n'}سيظهر تبرعك بحالة «{methodInfo ? initialDonationStatus(method) : 'قيد التأكيد'}» حتى يتم تأكيده في النسخة التشغيلية.
            </Text>
          </Card>

          <Card style={[row, { gap: 10, marginTop: 10, backgroundColor: colors.greenSoft }]}>
            <Icon name="lock" size={16} color={colors.greenDark} />
            <Text style={[font('600'), { flex: 1, fontSize: 10.5, color: colors.greenDark, textAlign: 'right', lineHeight: 16 }]}>
              في النسخة التشغيلية يكون الدفع آمناً ومشفّراً بالكامل، ولا يُعتمد التبرع إلا بعد تأكيد بوابة الدفع أو مراجعة الإدارة.
            </Text>
          </Card>
        </>
      )}

      {err ? (
        <Text style={[font('700'), { fontSize: 11.5, color: colors.red, textAlign: 'right', marginTop: 12, marginHorizontal: 2 }]}>{err}</Text>
      ) : null}
      <View style={{ height: 12 }} />
    </Screen>
  );
}

/* ---------- bits ---------- */
function Label({ text }: { text: string }) {
  return (
    <Text style={[font('800'), { fontSize: 12.5, color: colors.navy700, textAlign: 'right', marginTop: 14, marginBottom: 10, marginHorizontal: 2 }]}>
      {text}
    </Text>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={[rowBetween, { marginBottom: 6 }]}>
      <Text style={[font('700'), { fontSize: 11.5, color: colors.ink }]}>{value}</Text>
      <Text style={[font('400'), { fontSize: 11, color: colors.slate }]}>{label}:</Text>
    </View>
  );
}

function StatusChip({ label, bg, fg }: { label: string; bg: string; fg: string }) {
  return (
    <View style={{ backgroundColor: bg, borderRadius: 100, paddingVertical: 2, paddingHorizontal: 8 }}>
      <Text style={[font('700'), { fontSize: 9, color: fg }]}>{label}</Text>
    </View>
  );
}

function SelectionBanner({ label, onChange }: { label: string; onChange: () => void }) {
  return (
    <View style={[row, { gap: 10, backgroundColor: '#EAF0F8', borderRadius: 12, padding: 11 }]}>
      <Icon name="heart" size={16} color={colors.navy700} />
      <Text style={[font('800'), { flex: 1, fontSize: 12, color: colors.navy700, textAlign: 'right' }]}>{label}</Text>
      <Pressable onPress={onChange}>
        <Text style={[font('700'), { fontSize: 11, color: colors.navy500 }]}>تغيير ‹</Text>
      </Pressable>
    </View>
  );
}

function PickCard({
  on,
  onPress,
  title,
  subtitle,
  meta,
  percent,
  color,
}: {
  on: boolean;
  onPress: () => void;
  title: string;
  subtitle: string;
  meta: string;
  percent: number;
  color: string;
}) {
  return (
    <Pressable onPress={onPress} style={{ borderWidth: 1.5, borderColor: on ? colors.navy700 : colors.line, backgroundColor: '#fff', borderRadius: 14, padding: 13 }}>
      <View style={[rowBetween]}>
        <Icon name={on ? 'check-circle' : 'circle'} size={18} color={on ? colors.green : colors.line} />
        <View style={{ flex: 1, alignItems: 'flex-end', marginStart: 8 }}>
          <Text style={[font('800'), { fontSize: 13, color: colors.navy700 }]}>{title}</Text>
          <Text style={[font('400'), { fontSize: 10.5, color: colors.slate, marginTop: 2, textAlign: 'right' }]} numberOfLines={1}>{subtitle}</Text>
        </View>
      </View>
      <View style={{ marginTop: 9 }}>
        <ProgressBar percent={percent} color={color} />
        <View style={[rowBetween, { marginTop: 5 }]}>
          <Text style={[font('400'), num, { fontSize: 9.5, color: colors.slate }]}>{meta}</Text>
          <Text style={[font('800'), num, { fontSize: 11, color }]}>{percent}%</Text>
        </View>
      </View>
    </Pressable>
  );
}

export function StickyFooter({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row-reverse', gap: 10, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: colors.line, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 20 }}>
      {children}
    </View>
  );
}

const styles_rd = {
  width: 17,
  height: 17,
  borderRadius: 9,
  borderWidth: 2,
  borderColor: colors.muted,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};
const styles_rdDot = { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.navy700 };
