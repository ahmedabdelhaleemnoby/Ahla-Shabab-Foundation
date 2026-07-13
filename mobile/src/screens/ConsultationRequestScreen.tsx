import React, { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { governorates, isEgPhone, isEmail, makeBookingRef, type ConsultationStatus } from '@ahla/shared';
import { Screen } from '../components/Screen';
import { AppBar } from '../components/AppBar';
import { Card, Button } from '../components/ui';
import { SelectField } from '../components/SelectField';
import { StickyFooter } from './DonateScreen';
import { Icon, IconName } from '../components/Icon';
import { colors, font, num, radius, row } from '../theme';
import { appState } from '../store/appState';
import type { RootProps } from '../navigation/types';

/* Per-type consultation request forms (§7). Demo: the request is saved
   locally on the device only — nothing is sent to any server. */

export type ConsultationFormType = 'نفسية' | 'دينية' | 'طبية' | 'أسرية' | 'أعمال';

const TYPE_META: Record<ConsultationFormType, { icon: IconName; blurb: string }> = {
  نفسية: { icon: 'heart', blurb: 'جلسة سرية مع أخصائي نفسي معتمد.' },
  دينية: { icon: 'book-open', blurb: 'إجابة موثوقة من مختص شرعي.' },
  طبية: { icon: 'activity', blurb: 'رأي طبي مبدئي وتوجيه للتخصص المناسب.' },
  أسرية: { icon: 'users', blurb: 'إرشاد أسري لحل الخلافات وتحسين العلاقات.' },
  أعمال: { icon: 'briefcase', blurb: 'توجيه مهني لمشروعك أو مسارك الوظيفي.' },
};

/** Extra fields per consultation type (from the review document). */
const EXTRA_FIELDS: Record<ConsultationFormType, { key: string; label: string; options: string[] }[]> = {
  نفسية: [
    { key: 'topic', label: 'طبيعة الحالة', options: ['قلق وتوتر', 'اكتئاب', 'ضغوط حياتية', 'علاقات', 'أخرى'] },
    { key: 'previous', label: 'هل سبق تلقي جلسات نفسية؟', options: ['نعم', 'لا'] },
  ],
  دينية: [
    { key: 'topic', label: 'موضوع الاستشارة', options: ['عبادات', 'معاملات مالية', 'أسرة وزواج', 'أخرى'] },
  ],
  طبية: [
    { key: 'specialty', label: 'التخصص المطلوب', options: ['طب عام', 'أطفال', 'أسنان', 'رمد وعيون', 'غير متأكد'] },
    { key: 'chronic', label: 'هل توجد أمراض مزمنة؟', options: ['نعم', 'لا'] },
  ],
  أسرية: [
    { key: 'topic', label: 'أطراف المشكلة', options: ['علاقة زوجية', 'الأبناء', 'الوالدين', 'أخرى'] },
    { key: 'familySize', label: 'عدد أفراد الأسرة', options: ['2-3', '4-6', 'أكثر من 6'] },
  ],
  أعمال: [
    { key: 'field', label: 'مجال العمل', options: ['تجارة', 'حرف ومهن', 'خدمات', 'زراعة', 'أخرى'] },
    { key: 'stage', label: 'مرحلة المشروع', options: ['فكرة', 'بدء التشغيل', 'قائم بالفعل', 'توسع'] },
  ],
};

const COMM = ['واتساب', 'مكالمة هاتفية', 'مكالمة فيديو', 'بريد إلكتروني'];
const TIMES = ['صباحاً (9-12)', 'ظهراً (12-3)', 'مساءً (3-6)', 'أي وقت'];
const STATUSES: ConsultationStatus[] = ['جديد', 'قيد المراجعة', 'تم تحديد موعد', 'مكتمل', 'ملغي'];

const inputStyle = {
  fontFamily: font('600').fontFamily,
  borderWidth: 1,
  borderColor: colors.line,
  borderRadius: radius.sm,
  paddingVertical: 12,
  paddingHorizontal: 14,
  fontSize: 13,
  color: colors.ink,
  textAlign: 'right' as const,
  writingDirection: 'rtl' as const,
  backgroundColor: '#fff',
};

function Labeled({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 13 }}>
      <Text style={[font('700'), { fontSize: 12, color: colors.navy700, textAlign: 'right', marginBottom: 6 }]}>
        {label} {required ? <Text style={{ color: colors.red }}>*</Text> : <Text style={{ color: colors.muted, fontSize: 10 }}>(اختياري)</Text>}
      </Text>
      {children}
    </View>
  );
}

export default function ConsultationRequestScreen({ route }: RootProps<'ConsultationRequest'>) {
  const nav = useNavigation<any>();
  const type = (route.params?.type ?? 'نفسية') as ConsultationFormType;
  const meta = TYPE_META[type];
  const extras = EXTRA_FIELDS[type];

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [gov, setGov] = useState('');
  const [comm, setComm] = useState('');
  const [time, setTime] = useState('');
  const [summary, setSummary] = useState('');
  const [extraVals, setExtraVals] = useState<Record<string, string>>({});
  const [err, setErr] = useState<string | null>(null);
  const [doneRef, setDoneRef] = useState<string | null>(null);

  const submit = () => {
    if (name.trim().length < 3) return setErr('اكتب اسمك بالكامل (3 أحرف على الأقل)');
    if (!isEgPhone(phone)) return setErr('أدخل رقم هاتف مصري صحيح (11 رقماً يبدأ بـ 01)');
    if (whatsapp && !isEgPhone(whatsapp)) return setErr('رقم الواتساب غير صحيح');
    if (email && !isEmail(email)) return setErr('البريد الإلكتروني غير صحيح');
    if (!gov) return setErr('اختر المحافظة');
    if (!comm) return setErr('اختر وسيلة التواصل المفضلة');
    if (!time) return setErr('اختر الوقت المفضل');
    if (summary.trim().length < 10) return setErr('اكتب ملخصاً موجزاً للمشكلة (10 أحرف على الأقل)');
    for (const f of extras) if (!extraVals[f.key]) return setErr(`اختر: ${f.label}`);
    setErr(null);
    const reference = makeBookingRef(Math.floor(Date.now() / 1000));
    // Demo only — stored on this device, never sent to a server.
    appState.addConsultation({ reference, type: `استشارة ${type}`, name: name.trim(), date: new Date().toISOString().slice(0, 10), status: 'جديد' });
    setDoneRef(reference);
  };

  /* -------- submitted state -------- */
  if (doneRef) {
    return (
      <Screen header={<AppBar title={`استشارة ${type}`} onBack={() => nav.goBack()} onBell={undefined} />}>
        <View style={{ alignItems: 'center', marginTop: 26 }}>
          <View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: colors.greenSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="check" size={40} color={colors.green} />
          </View>
          <Text style={[font('800'), { fontSize: 19, color: colors.navy700, marginTop: 16 }]}>تم استلام الطلب (نسخة عرض)</Text>
          <Text style={[font('400'), { fontSize: 12, color: colors.slate, marginTop: 6, textAlign: 'center', lineHeight: 19 }]}>
            رقم الطلب <Text style={[font('800'), num, { color: colors.navy700 }]}>{doneRef}</Text>{'\n'}
            في النسخة التشغيلية سيتواصل معك فريق الاستشارات لتحديد الموعد.
          </Text>
        </View>

        {/* Status timeline */}
        <Card style={{ marginTop: 20 }}>
          <Text style={[font('800'), { fontSize: 12.5, color: colors.navy700, textAlign: 'right', marginBottom: 10 }]}>مراحل متابعة الطلب</Text>
          {STATUSES.filter((s) => s !== 'ملغي').map((s, i) => {
            const current = i === 0;
            return (
              <View key={s} style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10, marginBottom: 9 }}>
                <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: current ? colors.navy700 : colors.paper2, alignItems: 'center', justifyContent: 'center' }}>
                  {current ? <Icon name="check" size={12} color="#fff" /> : <Text style={[font('700'), num, { fontSize: 10, color: colors.muted }]}>{i + 1}</Text>}
                </View>
                <Text style={[font(current ? '800' : '400'), { fontSize: 12, color: current ? colors.navy700 : colors.muted }]}>{s}</Text>
                {current && <Text style={[font('700'), { fontSize: 9.5, color: colors.green }]}>— حالة طلبك الآن</Text>}
              </View>
            );
          })}
        </Card>

        <Card style={[row, { gap: 10, marginTop: 12, backgroundColor: colors.goldSoft }]}>
          <Icon name="alert-triangle" size={15} color="#B9791A" />
          <Text style={[font('700'), { flex: 1, fontSize: 10.5, color: '#8A5B10', textAlign: 'right', lineHeight: 16 }]}>
            نسخة عرض — حُفظ الطلب على جهازك فقط ولم يُرسل لأي جهة.
          </Text>
        </Card>

        <Button label="العودة للاستشارات" style={{ marginTop: 16 }} onPress={() => nav.goBack()} />
        <View style={{ height: 12 }} />
      </Screen>
    );
  }

  /* -------- form -------- */
  return (
    <Screen
      header={<AppBar title={`استشارة ${type}`} onBack={() => nav.goBack()} onBell={undefined} />}
      footer={
        <StickyFooter>
          <Button label="إرسال الطلب" icon="send" style={{ flex: 1 }} onPress={submit} />
        </StickyFooter>
      }
    >
      <Card style={[row, { gap: 11, backgroundColor: '#EAF0F8', marginBottom: 14 }]}>
        <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={meta.icon} size={20} color={colors.navy700} />
        </View>
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <Text style={[font('800'), { fontSize: 13, color: colors.navy700 }]}>استشارة {type} مجانية</Text>
          <Text style={[font('400'), { fontSize: 10.5, color: colors.slate, marginTop: 2, textAlign: 'right' }]}>{meta.blurb} جميع البيانات سرية تماماً.</Text>
        </View>
      </Card>

      <Labeled label="الاسم بالكامل" required>
        <TextInput value={name} onChangeText={setName} placeholder="اكتب اسمك" placeholderTextColor={colors.muted} style={inputStyle} />
      </Labeled>
      <View style={[row, { gap: 10 }]}>
        <View style={{ flex: 1 }}>
          <Labeled label="رقم الهاتف" required>
            <TextInput value={phone} onChangeText={(t) => setPhone(t.replace(/[^0-9]/g, '').slice(0, 11))} placeholder="01xxxxxxxxx" placeholderTextColor={colors.muted} keyboardType="phone-pad" style={inputStyle} />
          </Labeled>
        </View>
        <View style={{ flex: 1 }}>
          <Labeled label="واتساب">
            <TextInput value={whatsapp} onChangeText={(t) => setWhatsapp(t.replace(/[^0-9]/g, '').slice(0, 11))} placeholder="إن وجد" placeholderTextColor={colors.muted} keyboardType="phone-pad" style={inputStyle} />
          </Labeled>
        </View>
      </View>
      <View style={[row, { gap: 10 }]}>
        <View style={{ flex: 1 }}>
          <Labeled label="السن">
            <TextInput value={age} onChangeText={(t) => setAge(t.replace(/[^0-9]/g, '').slice(0, 2))} placeholder="العمر" placeholderTextColor={colors.muted} keyboardType="number-pad" style={inputStyle} />
          </Labeled>
        </View>
        <View style={{ flex: 2 }}>
          <Labeled label="البريد الإلكتروني">
            <TextInput value={email} onChangeText={setEmail} placeholder="example@mail.com" placeholderTextColor={colors.muted} keyboardType="email-address" autoCapitalize="none" style={inputStyle} />
          </Labeled>
        </View>
      </View>

      <SelectField label="المحافظة" required value={gov} options={governorates} onChange={setGov} />
      <View style={{ height: 13 }} />
      <SelectField label="وسيلة التواصل المفضلة" required value={comm} options={COMM} onChange={setComm} />
      <View style={{ height: 13 }} />
      <SelectField label="الوقت المفضل للتواصل" required value={time} options={TIMES} onChange={setTime} />
      <View style={{ height: 13 }} />

      {/* Type-specific fields */}
      {extras.map((f) => (
        <View key={f.key}>
          <SelectField label={f.label} required value={extraVals[f.key] ?? ''} options={f.options} onChange={(v) => setExtraVals((prev) => ({ ...prev, [f.key]: v }))} />
          <View style={{ height: 13 }} />
        </View>
      ))}

      <Labeled label="ملخص المشكلة" required>
        <TextInput
          value={summary}
          onChangeText={setSummary}
          placeholder="اشرح باختصار ما تريد الاستشارة بشأنه..."
          placeholderTextColor={colors.muted}
          multiline
          style={[inputStyle, { minHeight: 96, textAlignVertical: 'top' }]}
        />
      </Labeled>

      {err ? <Text style={[font('700'), { fontSize: 11.5, color: colors.red, textAlign: 'right', marginBottom: 8 }]}>{err}</Text> : null}

      <Card style={[row, { gap: 10, backgroundColor: colors.greenSoft }]}>
        <Icon name="lock" size={15} color={colors.greenDark} />
        <Text style={[font('600'), { flex: 1, fontSize: 10.5, color: colors.greenDark, textAlign: 'right', lineHeight: 16 }]}>
          بياناتك سرية ولا تُشارك مع أي جهة. نسخة العرض تحفظ الطلب على جهازك فقط.
        </Text>
      </Card>
      <View style={{ height: 12 }} />
    </Screen>
  );
}
