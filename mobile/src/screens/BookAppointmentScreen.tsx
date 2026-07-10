import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { serviceById, providerById, categoryById, buildAvailableDays, makeBookingRef, isEgPhone, isEmail } from '@ahla/shared';
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
  const service = serviceById(route.params.serviceId);
  const provider = service ? providerById(service.providerId) : undefined;
  const category = service ? categoryById(service.categoryId) : undefined;

  const days = useMemo(() => (provider ? buildAvailableDays(provider, new Date(), 14) : []), [provider]);
  const firstAvailable = days.find((d) => d.available);
  // TODO(backend): GET /services/:id/availability — booked slots come from the server.
  const bookedSlots = useMemo(() => (provider ? provider.slots.filter((_, i) => i % 3 === 1) : []), [provider]);

  const [step, setStep] = useState(0);
  const [dateIso, setDateIso] = useState<string | undefined>(firstAvailable?.iso);
  const [time, setTime] = useState<string | undefined>();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [comm, setComm] = useState('');
  const [notes, setNotes] = useState('');
  const [err, setErr] = useState<string | null>(null);

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

  const next = () => {
    const e = validateStep();
    setErr(e);
    if (e) return;
    if (step < STEPS.length - 1) setStep(step + 1);
    else {
      // Booking is created PENDING — the admin team confirms it (dashboard).
      nav.navigate('BookingConfirmation', {
        reference: makeBookingRef(Math.floor(Date.now() / 1000)),
        serviceId: service.id,
        providerId: provider.id,
        date: dateIso!,
        time: time!,
        mode: comm,
      });
    }
  };

  const back = () => (step > 0 ? (setErr(null), setStep(step - 1)) : nav.goBack());

  return (
    <Screen
      header={<AppBar title="حجز موعد" onBack={back} onBell={undefined} />}
      footer={
        <StickyFooter>
          {step > 0 && <Button label="السابق" variant="outline" style={{ width: 104 }} onPress={back} />}
          <Button label={step === STEPS.length - 1 ? 'تأكيد الحجز' : 'التالي'} icon={step === STEPS.length - 1 ? 'check' : undefined} style={{ flex: 1 }} onPress={next} />
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

      {/* Step 2 — date & time */}
      {step === 2 && (
        <>
          <SectionTitle label="اختر اليوم" icon="calendar" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, flexDirection: 'row-reverse' }}>
            {days.map((d) => {
              const on = d.iso === dateIso;
              return (
                <Pressable key={d.iso} disabled={!d.available} onPress={() => setDateIso(d.iso)}
                  style={{ width: 60, alignItems: 'center', borderRadius: 12, paddingVertical: 10, borderWidth: on ? 0 : 1, borderColor: colors.line, backgroundColor: on ? colors.navy700 : d.available ? '#fff' : colors.paper2, opacity: d.available ? 1 : 0.5 }}>
                  <Text style={[font('400'), { fontSize: 9, color: on ? '#fff' : colors.slate }]}>{d.weekday}</Text>
                  <Text style={[font('800'), num, { fontSize: 17, color: on ? '#fff' : d.available ? colors.navy700 : colors.muted }]}>{d.day}</Text>
                  <Text style={[font('400'), { fontSize: 8, color: on ? '#fff' : colors.slate }]}>{d.available ? d.month : 'غير متاح'}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <SectionTitle label="اختر الوقت" icon="clock" />
          <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 }}>
            {provider.slots.map((s) => {
              const booked = bookedSlots.includes(s);
              const on = s === time;
              return (
                <Pressable key={s} disabled={booked} onPress={() => setTime(s)}
                  style={{ borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16, borderWidth: 1, borderColor: on ? colors.navy700 : colors.line, backgroundColor: booked ? colors.paper2 : on ? colors.navy700 : '#fff', opacity: booked ? 0.6 : 1 }}>
                  <Text style={[font('700'), { fontSize: 12.5, color: on ? '#fff' : booked ? colors.muted : colors.slate, textDecorationLine: booked ? 'line-through' : 'none' }]}>
                    {s}{booked ? ' · محجوز' : ''}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={[font('400'), { fontSize: 10, color: colors.muted, textAlign: 'right', marginTop: 8 }]}>
            المواعيد المشطوبة محجوزة بالفعل ولا يمكن اختيارها.
          </Text>
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
            <SumRow icon="clock" label="الوقت" value={time ?? '—'} />
            <SumRow icon="message-square" label="وسيلة التواصل" value={comm || '—'} />
            <SumRow icon="phone" label="الهاتف" value={phone} mono />
          </Card>
          <Card style={[row, { gap: 10, marginTop: 12, backgroundColor: '#EAF0F8' }]}>
            <Icon name="info" size={16} color={colors.navy700} />
            <Text style={[font('400'), { flex: 1, fontSize: 10.5, color: colors.slate, textAlign: 'right', lineHeight: 16 }]}>
              بعد التأكيد سيتواصل معك فريق الإدارة لتثبيت الموعد. جميع الجلسات أونلاين وسرية.{'\n'}هذه نسخة عرض تقديمي — لا يتم إرسال حجز فعلي.
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
