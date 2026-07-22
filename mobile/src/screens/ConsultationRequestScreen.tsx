import React, { useMemo, useState, type ReactNode } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  governorates,
  isEgPhone,
  isEmail,
  makeBookingRef,
  makeDefaultCmsState,
  type ConsultationStatus,
  type ConsultationTypeConfig,
  type FormField,
} from '@ahla/shared';
import { Screen } from '../components/Screen';
import { AppBar } from '../components/AppBar';
import { Card, Button } from '../components/ui';
import { SelectField } from '../components/SelectField';
import { StickyFooter } from './DonateScreen';
import { Icon, IconName } from '../components/Icon';
import { colors, font, num, radius, row } from '../theme';
import { appState } from '../store/appState';
import { attachConsultationToDemoUser } from '../store/demoUsers';
import { getConsultationType } from '../store/cms';
import type { RootProps } from '../navigation/types';

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

function Labeled({ label, required, help, children }: { label: string; required?: boolean; help?: string; children: ReactNode }) {
  return (
    <View style={{ marginBottom: 13 }}>
      <Text style={[font('700'), { fontSize: 12, color: colors.navy700, textAlign: 'right', marginBottom: 6 }]}>
        {label} {required ? <Text style={{ color: colors.red }}>*</Text> : <Text style={{ color: colors.muted, fontSize: 10 }}>(اختياري)</Text>}
      </Text>
      {children}
      {help ? <Text style={[font('400'), { fontSize: 9.5, color: colors.muted, textAlign: 'right', marginTop: 4 }]}>{help}</Text> : null}
    </View>
  );
}

const sortF = (f: FormField[]) => [...f].sort((a, b) => a.sortOrder - b.sortOrder);
type Val = string | string[];

export default function ConsultationRequestScreen({ route }: RootProps<'ConsultationRequest'>) {
  const nav = useNavigation<any>();
  const key = route.params?.type ?? 'نفسية';

  // CMS-authored schema with a safe fallback to the built-in defaults.
  const config: ConsultationTypeConfig = useMemo(
    () => getConsultationType(key) ?? makeDefaultCmsState().consultations.find((c) => c.key === key) ?? makeDefaultCmsState().consultations[0],
    [key]
  );

  const fields = useMemo(() => sortF(config.fields).filter((f) => !f.hidden), [config]);
  const [values, setValues] = useState<Record<string, Val>>({});
  const [err, setErr] = useState<string | null>(null);
  const [doneRef, setDoneRef] = useState<string | null>(null);

  const set = (k: string, v: Val) => setValues((prev) => ({ ...prev, [k]: v }));
  const visible = (f: FormField) => !f.showIfKey || values[f.showIfKey] === f.showIfValue;

  const validate = (): string | null => {
    for (const f of fields) {
      if (!visible(f)) continue;
      if (f.type === 'info') continue;
      const v = values[f.key];
      const empty = v === undefined || v === '' || (Array.isArray(v) && v.length === 0);
      if (f.type === 'consent') {
        if (v !== 'yes') return f.validationMessage ?? 'يجب الموافقة للمتابعة';
        continue;
      }
      if (f.required && empty) return f.validationMessage ?? `أدخل: ${f.label}`;
      if (empty) continue;
      const s = String(v);
      if (f.key === 'name' && s.trim().length < 3) return f.validationMessage ?? 'اكتب اسمك بالكامل';
      if ((f.type === 'phone' || f.type === 'whatsapp') && !isEgPhone(s)) return f.validationMessage ?? 'رقم هاتف غير صحيح';
      if (f.type === 'email' && !isEmail(s)) return f.validationMessage ?? 'البريد الإلكتروني غير صحيح';
      if (f.type === 'textarea' && f.required && s.trim().length < 10) return f.validationMessage ?? 'اكتب ملخصاً موجزاً';
    }
    return null;
  };

  const submit = () => {
    const e = validate();
    setErr(e);
    if (e) return;
    const reference = makeBookingRef(Math.floor(Date.now() / 1000));
    const name = String(values['name'] ?? '').trim() || 'مستخدم';
    const emailVal = String(values['email'] ?? appState.get().email ?? 'guest@ahlashabab.com');
    
    // Attach consultation to local demo user identity using normalized email
    const reqData = { reference, type: `استشارة ${config.key}`, name, date: new Date().toISOString().slice(0, 10), status: 'جديد' as const };
    attachConsultationToDemoUser(emailVal, reqData);
    setDoneRef(reference);
  };

  /* -------- submitted state -------- */
  if (doneRef) {
    return (
      <Screen header={<AppBar title={`استشارة ${config.key}`} onBack={() => nav.goBack()} onBell={undefined} />}>
        <View style={{ alignItems: 'center', marginTop: 26 }}>
          <View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: colors.greenSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="check" size={40} color={colors.green} />
          </View>
          <Text style={[font('800'), { fontSize: 19, color: colors.navy700, marginTop: 16 }]}>تم استلام الطلب بنجاح</Text>
          <Text style={[font('400'), { fontSize: 12, color: colors.slate, marginTop: 6, textAlign: 'center', lineHeight: 19 }]}>
            رقم الطلب <Text style={[font('800'), num, { color: colors.navy700 }]}>{doneRef}</Text>{'\n'}
            تم حفظ طلبك في النسخة التجريبية، ويمكنك تسجيل الدخول بنفس البريد لمتابعته.
          </Text>
        </View>

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

  /* -------- dynamic form -------- */
  return (
    <Screen
      header={<AppBar title={`استشارة ${config.key}`} onBack={() => nav.goBack()} onBell={undefined} />}
      footer={
        <StickyFooter>
          <Button label="إرسال الطلب" icon="send" style={{ flex: 1 }} onPress={submit} />
        </StickyFooter>
      }
    >
      <Card style={[row, { gap: 11, backgroundColor: '#EAF0F8', marginBottom: 14 }]}>
        <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={config.icon as IconName} size={20} color={colors.navy700} />
        </View>
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <Text style={[font('800'), { fontSize: 13, color: colors.navy700 }]}>{config.name} مجانية</Text>
          <Text style={[font('400'), { fontSize: 10.5, color: colors.slate, marginTop: 2, textAlign: 'right' }]}>{config.description} جميع البيانات سرية تماماً.</Text>
        </View>
      </Card>

      {fields.map((f) => (visible(f) ? <FieldView key={f.id} f={f} value={values[f.key]} onChange={(v) => set(f.key, v)} /> : null))}

      {err ? <Text style={[font('700'), { fontSize: 11.5, color: colors.red, textAlign: 'right', marginBottom: 8 }]}>{err}</Text> : null}

      {config.disclaimer ? (
        <Card style={[row, { gap: 10, backgroundColor: colors.greenSoft }]}>
          <Icon name="lock" size={15} color={colors.greenDark} />
          <Text style={[font('600'), { flex: 1, fontSize: 10.5, color: colors.greenDark, textAlign: 'right', lineHeight: 16 }]}>{config.disclaimer}</Text>
        </Card>
      ) : null}
      <View style={{ height: 12 }} />
    </Screen>
  );
}

/* ---------------- Field renderers ---------------- */
function FieldView({ f, value, onChange }: { f: FormField; value: string | string[] | undefined; onChange: (v: string | string[]) => void }) {
  const v = value;

  switch (f.type) {
    case 'info':
      return (
        <Card style={[row, { gap: 10, marginBottom: 13, backgroundColor: '#EAF0F8' }]}>
          <Icon name="info" size={15} color={colors.navy700} />
          <Text style={[font('600'), { flex: 1, fontSize: 10.5, color: colors.navy700, textAlign: 'right', lineHeight: 16 }]}>{f.label}</Text>
        </Card>
      );
    case 'consent':
      return (
        <Pressable onPress={() => onChange(v === 'yes' ? '' : 'yes')} style={[row, { gap: 10, marginBottom: 13, alignItems: 'flex-start' }]}>
          <View style={{ width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: v === 'yes' ? colors.navy700 : colors.line, backgroundColor: v === 'yes' ? colors.navy700 : '#fff', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
            {v === 'yes' ? <Icon name="check" size={13} color="#fff" /> : null}
          </View>
          <Text style={[font('600'), { flex: 1, fontSize: 11, color: colors.slate, textAlign: 'right', lineHeight: 17 }]}>{f.label}{f.required ? <Text style={{ color: colors.red }}> *</Text> : null}</Text>
        </Pressable>
      );
    case 'textarea':
      return (
        <Labeled label={f.label} required={f.required} help={f.help}>
          <TextInput value={typeof v === 'string' ? v : ''} onChangeText={onChange} placeholder={f.placeholder} placeholderTextColor={colors.muted} multiline style={[inputStyle, { minHeight: 96, textAlignVertical: 'top' }]} />
        </Labeled>
      );
    case 'governorate':
      return (
        <View style={{ marginBottom: 13 }}>
          <SelectField label={f.label} required={f.required} value={typeof v === 'string' ? v : ''} options={governorates} onChange={onChange} />
        </View>
      );
    case 'radio':
      return (
        <View style={{ marginBottom: 13 }}>
          <SelectField label={f.label} required={f.required} value={typeof v === 'string' ? v : ''} options={f.options ?? []} onChange={onChange} />
        </View>
      );
    case 'checkbox':
    case 'multiselect': {
      const arr = Array.isArray(v) ? v : [];
      return (
        <Labeled label={f.label} required={f.required} help={f.help}>
          <View style={[row, { flexWrap: 'wrap', gap: 7 }]}>
            {(f.options ?? []).map((o) => {
              const on = arr.includes(o);
              return (
                <Pressable key={o} onPress={() => onChange(on ? arr.filter((x) => x !== o) : [...arr, o])} style={{ borderWidth: 1, borderColor: on ? colors.navy700 : colors.line, backgroundColor: on ? colors.navy700 : '#fff', borderRadius: 100, paddingVertical: 7, paddingHorizontal: 13 }}>
                  <Text style={[font('700'), { fontSize: 11.5, color: on ? '#fff' : colors.slate }]}>{o}</Text>
                </Pressable>
              );
            })}
          </View>
        </Labeled>
      );
    }
    case 'file':
      return (
        <Labeled label={f.label} required={f.required} help={f.help}>
          <Pressable style={[row, { gap: 8, justifyContent: 'center', borderWidth: 1, borderColor: colors.line, borderStyle: 'dashed', borderRadius: radius.sm, paddingVertical: 14, backgroundColor: '#fff' }]}>
            <Icon name="upload" size={16} color={colors.muted} />
            <Text style={[font('600'), { fontSize: 11.5, color: colors.muted }]}>إرفاق ملف (غير مفعّل في نسخة العرض)</Text>
          </Pressable>
        </Labeled>
      );
    default: {
      // text / phone / whatsapp / email / number / age / date / time
      const kb = f.type === 'phone' || f.type === 'whatsapp' ? 'phone-pad' : f.type === 'number' || f.type === 'age' ? 'number-pad' : f.type === 'email' ? 'email-address' : 'default';
      const onText = (t: string) => {
        if (f.type === 'phone' || f.type === 'whatsapp') return onChange(t.replace(/[^0-9]/g, '').slice(0, 11));
        if (f.type === 'age') return onChange(t.replace(/[^0-9]/g, '').slice(0, 2));
        if (f.type === 'number') return onChange(t.replace(/[^0-9]/g, ''));
        return onChange(t);
      };
      return (
        <Labeled label={f.label} required={f.required} help={f.help}>
          <TextInput value={typeof v === 'string' ? v : ''} onChangeText={onText} placeholder={f.placeholder} placeholderTextColor={colors.muted} keyboardType={kb as any} autoCapitalize={f.type === 'email' ? 'none' : 'sentences'} style={inputStyle} />
        </Labeled>
      );
    }
  }
}
