import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import {
  fetchAvailability,
  submitBooking,
  isEgPhone,
  isEmail,
  type ApiError,
  type DayAvailability,
} from '@ahla/shared';
import { getCategoryById, getProviderById, getServiceById } from '../store/content';
import { Screen } from '../components/Screen';
import { AppBar } from '../components/AppBar';
import { Card, Button, Pill } from '../components/ui';
import { StickyFooter } from './DonateScreen';
import { Icon, IconName } from '../components/Icon';
import { colors, font, num, radius, row, rowBetween } from '../theme';
import type { RootProps } from '../navigation/types';

/* Multi-step booking wizard (UX v2): specialty → consultant → date/time → contact → confirm. */
const STEPS = ['التخصص', 'المختص', 'الموعد', 'بياناتك', 'التأكيد'] as const;
const COMM_TYPES = ['واتساب', 'مكالمة هاتفية', 'بريد إلكتروني'] as const;

const WEEKDAYS_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

/** Local YYYY-MM-DD. `toISOString()` is UTC and shifts the day in Cairo (UTC+2/3). */
const isoOf = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Split a server date for the day chip. Parsed as local, to match `isoOf`. */
function dayLabel(iso: string): { weekday: string; day: number; month: string } {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return { weekday: WEEKDAYS_AR[date.getDay()], day: d, month: MONTHS_AR[m - 1] };
}

/**
 * "14:15" -> "2:15 م" for display only.
 *
 * The 24-hour value is what gets sent: it is what availability returned, and
 * `CreateBookingSchema` matches `timeSlot` against /^\d{2}:\d{2}$/. Formatting
 * it into the booking payload would fail validation.
 */
function timeLabel(slot: string): string {
  const [h, m] = slot.split(':').map(Number);
  const suffix = h < 12 ? 'ص' : 'م';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${suffix}`;
}

const inputStyle = (error?: boolean) => ({
  fontFamily: font('600').fontFamily,
  borderWidth: 1,
  borderColor: error ? colors.red : colors.line,
  borderRadius: radius.sm,
  paddingVertical: 12,
  paddingHorizontal: 14,
  fontSize: 13,
  color: colors.ink,
  textAlign: 'right' as const,
  writingDirection: 'rtl' as const,
  backgroundColor: '#fff',
});

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <Text style={[font('700'), { fontSize: 12, color: colors.navy700, textAlign: 'right', marginBottom: 6 }]}>
      {label} {required ? <Text style={{ color: colors.red }}>*</Text> : <Text style={{ color: colors.muted, fontSize: 10 }}>(اختياري)</Text>}
    </Text>
  );
}

export default function BookAppointmentScreen({ route }: RootProps<'BookAppointment'>) {
  const nav = useNavigation<any>();
  const serviceId = route.params.serviceId;
  const service = getServiceById(serviceId);
  const provider = service ? getProviderById(service.providerId) : undefined;
  const category = service ? getCategoryById(service.categoryId) : undefined;

  /*
   * Availability comes from the server, for two reasons.
   *
   * `buildAvailableDays(provider, …)` used to derive the days from the
   * provider's weekly pattern, and the booked slots were literally invented:
   *
   *     provider.slots.filter((_, i) => i % 3 === 1)
   *
   * — every third slot was struck through as «محجوز» regardless of whether
   * anyone had booked it, and every slot that WAS booked looked free. Only
   * `GET /services/:id/availability` knows which slots are actually left, and
   * its values are the only ones `POST /bookings` accepts.
   */
  const [days, setDays] = useState<DayAvailability[] | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const loadAvailability = useCallback(async () => {
    setLoadErr(null);
    try {
      const today = new Date();
      const to = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 21);
      setDays(await fetchAvailability(serviceId, isoOf(today), isoOf(to)));
    } catch (e) {
      setDays([]);
      setLoadErr((e as Error)?.message ?? 'تعذّر تحميل المواعيد المتاحة. تحقق من الاتصال.');
    }
  }, [serviceId]);

  useEffect(() => {
    void loadAvailability();
  }, [loadAvailability]);

  const [step, setStep] = useState(0);
  const [dateIso, setDateIso] = useState<string | undefined>();
  const [time, setTime] = useState<string | undefined>();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [comm, setComm] = useState('');
  const [notes, setNotes] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const bookable = useMemo(() => (days ?? []).filter((d) => d.slots.length > 0), [days]);
  const selectedDay = bookable.find((d) => d.date === dateIso);

  /* Pick the first bookable day once availability arrives, and drop a selection
     that a refresh has invalidated (someone else took the last slot). */
  useEffect(() => {
    if (!bookable.length) return;
    if (!dateIso || !bookable.some((d) => d.date === dateIso)) setDateIso(bookable[0].date);
  }, [bookable, dateIso]);

  useEffect(() => {
    if (time && selectedDay && !selectedDay.slots.includes(time)) setTime(undefined);
  }, [selectedDay, time]);

  if (!service || !provider) {
    return (
      <Screen header={<AppBar onBack={() => nav.goBack()} />}>
        <Text style={[font('700'), { color: colors.slate, textAlign: 'center', marginTop: 40 }]}>الخدمة غير متاحة</Text>
      </Screen>
    );
  }

  const validateStep = (): string | null => {
    if (step === 2) {
      if (!dateIso) return 'اختر يوماً متاحاً';
      if (!time) return 'اختر وقتاً متاحاً';
    }
    if (step === 3) {
      if (name.trim().length < 3) return 'اكتب اسمك بالكامل (3 أحرف على الأقل)';
      if (!isEgPhone(phone)) return 'أدخل رقم هاتف مصري صحيح (11 رقماً يبدأ بـ 01)';
      if (whatsapp && !isEgPhone(whatsapp)) return 'رقم الواتساب غير صحيح';
      if (email && !isEmail(email)) return 'البريد الإلكتروني غير صحيح';
      if (!comm) return 'اختر وسيلة التواصل المفضلة';
    }
    return null;
  };

  /*
   * Create the booking ON THE SERVER.
   *
   * This step used to be `makeBookingRef(Math.floor(Date.now() / 1000))` and a
   * navigate — a reference invented on the phone, for a booking that existed
   * nowhere. The applicant was told the team would call them; nothing had been
   * recorded, so nobody could. The comment above it even claimed the admin team
   * would confirm it in the dashboard.
   *
   * The reference now comes from the server, so it is one the foundation can
   * look up. There is no local fallback: an offline booking must fail visibly.
   */
  const confirm = async () => {
    if (submitting) return;
    setSubmitting(true);
    setErr(null);
    try {
      const created = await submitBooking({
        serviceId: service.id,
        applicantName: name.trim(),
        phone,
        date: dateIso!,
        // The server takes 24-hour HH:MM — exactly what availability returned.
        timeSlot: time!,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
        // The base booking row has no column for these; the service's form
        // definition carries them through instead of losing them.
        extraFields: {
          preferredContact: comm,
          ...(whatsapp ? { whatsapp } : {}),
          ...(email.trim() ? { email: email.trim() } : {}),
        },
      });

      nav.navigate('BookingConfirmation', {
        reference: created.reference,
        serviceId: service.id,
        providerId: provider.id,
        date: dateIso!,
        time: time!,
        mode: comm,
      });
    } catch (e) {
      const api = e as ApiError;
      setErr(api?.message ?? 'تعذّر تسجيل الحجز. تحقق من الاتصال وحاول مرة أخرى.');
      /* SLOT_TAKEN means someone booked it between loading the screen and
         confirming. Reload so the gone slot disappears, and send them back to
         the picker rather than leaving them staring at a dead confirm button. */
      if (api?.code === 'SLOT_TAKEN') {
        void loadAvailability();
        setTime(undefined);
        setStep(2);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const next = () => {
    const e = validateStep();
    setErr(e);
    if (e) return;
    if (step < STEPS.length - 1) setStep(step + 1);
    else void confirm();
  };

  const back = () => (step > 0 ? (setErr(null), setStep(step - 1)) : nav.goBack());

  return (
    <Screen
      header={<AppBar title="حجز موعد" onBack={back} onBell={undefined} />}
      footer={
        <StickyFooter>
          {step > 0 && <Button label="السابق" variant="outline" style={{ width: 104 }} onPress={back} />}
          <Button
            label={step === STEPS.length - 1 ? (submitting ? 'جارٍ الحجز…' : 'تأكيد الحجز') : 'التالي'}
            icon={step === STEPS.length - 1 && !submitting ? 'check' : undefined}
            style={{ flex: 1 }}
            disabled={submitting}
            onPress={next}
          />
        </StickyFooter>
      }
    >
      {/* Progress */}
      <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', marginTop: 4, marginBottom: 14 }}>
        {STEPS.map((s, i) => (
          <View key={s} style={{ alignItems: 'center', flex: 1 }}>
            <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: i < step ? colors.green : i === step ? colors.navy700 : colors.paper2, alignItems: 'center', justifyContent: 'center' }}>
              {i < step ? <Icon name="check" size={13} color="#fff" /> : <Text style={[font('800'), num, { fontSize: 11, color: i === step ? '#fff' : colors.muted }]}>{i + 1}</Text>}
            </View>
            <Text style={[font(i === step ? '800' : '400'), { fontSize: 9, color: i === step ? colors.navy700 : colors.muted, marginTop: 4 }]}>{s}</Text>
          </View>
        ))}
      </View>

      {/* Step 0 — specialty/service */}
      {step === 0 && (
        <Card>
          <View style={[row, { gap: 7, justifyContent: 'flex-end' }]}>
            <Text style={[font('800'), { fontSize: 14, color: colors.navy700 }]}>التخصص المختار</Text>
            <Icon name="grid" size={16} color={colors.navy700} />
          </View>
          <Text style={[font('800'), { fontSize: 16, color: colors.navy700, textAlign: 'right', marginTop: 10 }]}>{service.name}</Text>
          {category ? <Text style={[font('400'), { fontSize: 12, color: colors.slate, textAlign: 'right', marginTop: 3 }]}>{category.name}</Text> : null}
          <Text style={[font('400'), { fontSize: 12, color: colors.slate, textAlign: 'right', lineHeight: 18, marginTop: 8 }]}>{service.description}</Text>
          <Pressable onPress={() => nav.goBack()} style={{ marginTop: 10, alignSelf: 'flex-end' }}>
            <Text style={[font('700'), { fontSize: 12, color: colors.navy500 }]}>تغيير الخدمة ‹</Text>
          </Pressable>
        </Card>
      )}

      {/* Step 1 — consultant */}
      {step === 1 && (
        <Card>
          <View style={[row, { gap: 12, alignItems: 'flex-start' }]}>
            <LinearGradient colors={provider.gradient} style={{ width: 72, height: 88, borderRadius: 13 }} />
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <Text style={[font('800'), { fontSize: 15, color: colors.navy700 }]}>{provider.name}</Text>
              <Text style={[font('400'), { fontSize: 11.5, color: colors.slate, marginTop: 2 }]}>{provider.specialization}</Text>
              <View style={[row, { gap: 8, marginTop: 6 }]}>
                <Text style={[font('700'), { fontSize: 11, color: colors.gold }]}>★ {provider.rating}</Text>
                <Text style={[font('400'), { fontSize: 10.5, color: colors.slate }]}>خبرة {provider.yearsExperience} سنة · {provider.reviews} تقييم</Text>
              </View>
              <Pill label="جلسة أونلاين" tone="navy" />
            </View>
          </View>
          <Text style={[font('400'), { fontSize: 11.5, color: colors.slate, marginTop: 10, textAlign: 'right', lineHeight: 18 }]}>{provider.bio}</Text>
          <View style={{ height: 1, backgroundColor: colors.line2, marginVertical: 10 }} />
          <Text style={[font('600'), { fontSize: 11, color: colors.slate, textAlign: 'right' }]}>
            المواعيد المتاحة: {provider.slots.join(' · ')}
          </Text>
        </Card>
      )}

      {/* Step 2 — date & time, entirely from GET /services/:id/availability */}
      {step === 2 && (
        <>
          {days === null ? (
            <View style={{ alignItems: 'center', paddingVertical: 40, gap: 10 }}>
              <ActivityIndicator color={colors.navy700} />
              <Text style={[font('600'), { fontSize: 12, color: colors.slate }]}>جارٍ تحميل المواعيد المتاحة…</Text>
            </View>
          ) : bookable.length === 0 ? (
            <Card style={{ gap: 10, alignItems: 'center', paddingVertical: 24 }}>
              <Icon name="calendar" size={26} color={colors.muted} />
              <Text style={[font('700'), { fontSize: 13, color: colors.navy700, textAlign: 'center' }]}>
                {loadErr ? 'تعذّر تحميل المواعيد' : 'لا توجد مواعيد متاحة حالياً'}
              </Text>
              <Text style={[font('400'), { fontSize: 11, color: colors.slate, textAlign: 'center', lineHeight: 17 }]}>
                {loadErr ?? 'كل مواعيد الأسابيع القادمة محجوزة. جرّب لاحقاً أو اختر خدمة أخرى.'}
              </Text>
              <Button label="إعادة المحاولة" variant="outline" small onPress={() => void loadAvailability()} />
            </Card>
          ) : (
            <>
              <SectionTitle label="اختر اليوم" icon="calendar" />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, flexDirection: 'row-reverse' }}>
                {bookable.map((d) => {
                  const on = d.date === dateIso;
                  const label = dayLabel(d.date);
                  return (
                    <Pressable key={d.date} onPress={() => setDateIso(d.date)}
                      style={{ width: 60, alignItems: 'center', borderRadius: 12, paddingVertical: 10, borderWidth: on ? 0 : 1, borderColor: colors.line, backgroundColor: on ? colors.navy700 : '#fff' }}>
                      <Text style={[font('400'), { fontSize: 9, color: on ? '#fff' : colors.slate }]}>{label.weekday}</Text>
                      <Text style={[font('800'), num, { fontSize: 17, color: on ? '#fff' : colors.navy700 }]}>{label.day}</Text>
                      <Text style={[font('400'), { fontSize: 8, color: on ? '#fff' : colors.slate }]}>{label.month}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <SectionTitle label="اختر الوقت" icon="clock" />
              <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 }}>
                {(selectedDay?.slots ?? []).map((slot) => {
                  const on = slot === time;
                  return (
                    <Pressable key={slot} onPress={() => setTime(slot)}
                      style={{ borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16, borderWidth: 1, borderColor: on ? colors.navy700 : colors.line, backgroundColor: on ? colors.navy700 : '#fff' }}>
                      <Text style={[font('700'), num, { fontSize: 12.5, color: on ? '#fff' : colors.slate }]}>
                        {timeLabel(slot)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text style={[font('400'), { fontSize: 10, color: colors.muted, textAlign: 'right', marginTop: 8 }]}>
                المعروض هنا هو المتاح فعلياً — المواعيد المحجوزة لا تظهر أصلاً.
              </Text>
            </>
          )}
        </>
      )}

      {/* Step 3 — contact info */}
      {step === 3 && (
        <Card style={{ gap: 12 }}>
          <View>
            <FieldLabel label="الاسم بالكامل" required />
            <TextInput value={name} onChangeText={setName} placeholder="اكتب اسمك الكامل" placeholderTextColor={colors.muted} style={inputStyle()} />
          </View>
          <View>
            <FieldLabel label="رقم الهاتف" required />
            <TextInput value={phone} onChangeText={(t) => setPhone(t.replace(/[^0-9]/g, '').slice(0, 11))} placeholder="01xxxxxxxxx" placeholderTextColor={colors.muted} keyboardType="phone-pad" style={inputStyle()} />
          </View>
          <View>
            <FieldLabel label="رقم الواتساب" />
            <TextInput value={whatsapp} onChangeText={(t) => setWhatsapp(t.replace(/[^0-9]/g, '').slice(0, 11))} placeholder="إن كان مختلفاً عن الهاتف" placeholderTextColor={colors.muted} keyboardType="phone-pad" style={inputStyle()} />
          </View>
          <View>
            <FieldLabel label="البريد الإلكتروني" />
            <TextInput value={email} onChangeText={setEmail} placeholder="example@email.com" placeholderTextColor={colors.muted} keyboardType="email-address" autoCapitalize="none" style={[inputStyle(), { textAlign: 'left' as const }]} />
          </View>
          <View>
            <FieldLabel label="وسيلة التواصل المفضلة" required />
            <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 }}>
              {COMM_TYPES.map((c) => {
                const on = comm === c;
                return (
                  <Pressable key={c} onPress={() => setComm(c)} style={{ borderWidth: 1, borderColor: on ? colors.navy700 : colors.line, backgroundColor: on ? colors.navy700 : '#fff', borderRadius: 100, paddingVertical: 8, paddingHorizontal: 15 }}>
                    <Text style={[font('700'), { fontSize: 12, color: on ? '#fff' : colors.slate }]}>{c}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <View>
            <FieldLabel label="سبب الحجز / ملاحظات" />
            <TextInput value={notes} onChangeText={setNotes} placeholder="أضف أي تفاصيل تساعد المختص" placeholderTextColor={colors.muted} multiline style={[inputStyle(), { minHeight: 76, textAlignVertical: 'top' as const }]} />
          </View>
        </Card>
      )}

      {/* Step 4 — confirm */}
      {step === 4 && (
        <>
          <Card style={{ gap: 10 }}>
            <SumRow icon="grid" label="الخدمة" value={service.name} />
            <SumRow icon="user" label="المختص" value={provider.name} />
            <SumRow icon="calendar" label="اليوم" value={dateIso ?? '—'} mono />
            <SumRow icon="clock" label="الوقت" value={time ? timeLabel(time) : '—'} />
            <SumRow icon="message-square" label="وسيلة التواصل" value={comm || '—'} />
            <SumRow icon="phone" label="الهاتف" value={phone} mono />
          </Card>
          <Card style={[row, { gap: 10, marginTop: 12, backgroundColor: '#EAF0F8' }]}>
            <Icon name="info" size={16} color={colors.navy700} />
            <Text style={[font('400'), { flex: 1, fontSize: 10.5, color: colors.slate, textAlign: 'right', lineHeight: 16 }]}>
              يُسجَّل حجزك بحالة «قيد الانتظار» ويصلك رقم مرجعي، ثم يتواصل معك فريق الإدارة لتثبيت الموعد. جميع الجلسات أونلاين وسرية.
            </Text>
          </Card>
        </>
      )}

      {err ? (
        <View style={[row, { gap: 7, backgroundColor: colors.redSoft, borderRadius: 12, padding: 11, marginTop: 12 }]}>
          <Icon name="alert-circle" size={15} color={colors.red} />
          <Text style={[font('700'), { flex: 1, fontSize: 11.5, color: colors.red, textAlign: 'right' }]}>{err}</Text>
        </View>
      ) : null}
      <View style={{ height: 12 }} />
    </Screen>
  );
}

function SectionTitle({ label, icon }: { label: string; icon: IconName }) {
  return (
    <View style={[row, { gap: 7, marginTop: 14, marginBottom: 8, marginHorizontal: 2 }]}>
      <Icon name={icon} size={16} color={colors.navy700} />
      <Text style={[font('800'), { fontSize: 13.5, color: colors.navy700 }]}>{label}</Text>
    </View>
  );
}

function SumRow({ icon, label, value, mono }: { icon: IconName; label: string; value: string; mono?: boolean }) {
  return (
    <View style={rowBetween}>
      <Text style={[font('700'), mono ? num : undefined, { fontSize: 12.5, color: colors.navy700 }]}>{value}</Text>
      <View style={[row, { gap: 7 }]}>
        <Text style={[font('400'), { fontSize: 12, color: colors.slate }]}>{label}</Text>
        <Icon name={icon} size={14} color={colors.navy500} />
      </View>
    </View>
  );
}
