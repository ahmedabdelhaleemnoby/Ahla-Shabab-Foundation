import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, Modal, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  serviceById,
  providerById,
  buildAvailableDays,
  bookingFormSchema,
  makeBookingRef,
  type FormFieldConfig,
} from '@ahla/shared';
import { Screen } from '../components/Screen';
import { AppBar } from '../components/AppBar';
import { Card, Button } from '../components/ui';
import { StickyFooter } from './DonateScreen';
import { Icon, IconName } from '../components/Icon';
import { colors, font, radius, row } from '../theme';
import type { RootProps } from '../navigation/types';

function StepTitle({ label, icon }: { label: string; icon: IconName }) {
  return (
    <View style={[row, { gap: 7, marginTop: 18, marginBottom: 8, marginHorizontal: 2 }]}>
      <Icon name={icon} size={16} color={colors.navy700} />
      <Text style={[font('800'), { fontSize: 13.5, color: colors.navy700 }]}>{label}</Text>
    </View>
  );
}

export default function BookAppointmentScreen({ route }: RootProps<'BookAppointment'>) {
  const nav = useNavigation<any>();
  const service = serviceById(route.params.serviceId);
  const provider = service ? providerById(service.providerId) : undefined;

  const days = useMemo(() => (provider ? buildAvailableDays(provider, new Date(), 14) : []), [provider]);
  const firstAvailable = days.find((d) => d.available);

  const [dateIso, setDateIso] = useState<string | undefined>(firstAvailable?.iso);
  const [time, setTime] = useState<string | undefined>(provider?.slots[0]);
  const [form, setForm] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [picker, setPicker] = useState<FormFieldConfig | null>(null);

  if (!service || !provider) {
    return (
      <Screen header={<AppBar onBack={() => nav.goBack()} onBell={() => {}} />}>
        <Text style={[font('700'), { color: colors.slate, textAlign: 'center', marginTop: 40 }]}>الخدمة غير متاحة</Text>
      </Screen>
    );
  }

  // National ID becomes required for services that ask for it.
  const schema: FormFieldConfig[] = bookingFormSchema.map((f) =>
    f.key === 'nationalId' && service.requireNationalId ? { ...f, required: true } : f
  );

  const setField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: false }));
  };

  const submit = () => {
    const nextErrors: Record<string, boolean> = {};
    schema.forEach((f) => {
      if (f.required && !form[f.key]?.trim()) nextErrors[f.key] = true;
    });
    if (!dateIso) nextErrors._date = true;
    if (!time) nextErrors._time = true;
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const reference = makeBookingRef(Math.floor(Date.now() / 1000));
    nav.navigate('BookingConfirmation', {
      reference,
      serviceId: service.id,
      providerId: provider.id,
      date: dateIso!,
      time: time!,
    });
  };

  return (
    <Screen
      scroll
      header={<AppBar title="حجز موعد" onBack={() => nav.goBack()} onBell={() => {}} />}
      footer={
        <StickyFooter>
          <Button label="تأكيد الحجز" icon="check" style={{ flex: 1 }} onPress={submit} />
        </StickyFooter>
      }
    >
      {/* Summary */}
      <Card style={{ marginTop: 4 }}>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[font('800'), { fontSize: 15, color: colors.navy700 }]}>{service.name}</Text>
          <Text style={[font('400'), { fontSize: 12, color: colors.slate, marginTop: 2 }]}>
            مع {provider.name} · {provider.specialization}
          </Text>
        </View>
      </Card>

      {/* Date */}
      <StepTitle label="اختر التاريخ" icon="calendar" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, flexDirection: 'row-reverse' }}>
        {days.map((d) => {
          const on = d.iso === dateIso;
          return (
            <Pressable
              key={d.iso}
              disabled={!d.available}
              onPress={() => setDateIso(d.iso)}
              style={{
                width: 60,
                alignItems: 'center',
                borderRadius: 12,
                paddingVertical: 10,
                borderWidth: on ? 0 : 1,
                borderColor: colors.line,
                backgroundColor: on ? colors.navy700 : d.available ? '#fff' : colors.paper2,
                opacity: d.available ? 1 : 0.5,
              }}
            >
              <Text style={[font('400'), { fontSize: 9, color: on ? '#fff' : colors.slate }]}>{d.weekday}</Text>
              <Text style={[font('800'), { fontSize: 17, color: on ? '#fff' : d.available ? colors.navy700 : colors.muted }]}>{d.day}</Text>
              <Text style={[font('400'), { fontSize: 8, color: on ? '#fff' : colors.slate }]}>{d.month}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      {errors._date ? <ErrorText text="اختر تاريخاً متاحاً" /> : null}

      {/* Time */}
      <StepTitle label="اختر الوقت المتاح" icon="clock" />
      <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 }}>
        {provider.slots.map((s) => {
          const on = s === time;
          return (
            <Pressable
              key={s}
              onPress={() => setTime(s)}
              style={{
                borderRadius: 12,
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderWidth: 1,
                borderColor: on ? colors.navy700 : colors.line,
                backgroundColor: on ? colors.navy700 : '#fff',
              }}
            >
              <Text style={[font('700'), { fontSize: 12.5, color: on ? '#fff' : colors.slate }]}>{s}</Text>
            </Pressable>
          );
        })}
      </View>
      {errors._time ? <ErrorText text="اختر وقتاً" /> : null}

      {/* Form */}
      <StepTitle label="بيانات الحجز" icon="edit-3" />
      <Card style={{ gap: 12 }}>
        {schema.map((f) => (
          <Field
            key={f.key}
            field={f}
            value={form[f.key] ?? ''}
            error={!!errors[f.key]}
            onChange={(v) => setField(f.key, v)}
            onOpenPicker={() => setPicker(f)}
          />
        ))}
      </Card>

      {/* Guest note */}
      <Card style={[row, { gap: 10, marginTop: 12, backgroundColor: '#EAF0F8' }]}>
        <Icon name="info" size={16} color={colors.navy700} />
        <Text style={[font('400'), { flex: 1, fontSize: 10.5, color: colors.slate, textAlign: 'right', lineHeight: 16 }]}>
          يمكنك الحجز كزائر برقم هاتفك دون إنشاء حساب. ستصلك رسالة تأكيد بموعدك.
        </Text>
      </Card>
      <View style={{ height: 12 }} />

      {/* Select picker modal */}
      <SelectModal
        field={picker}
        onClose={() => setPicker(null)}
        onSelect={(v) => {
          if (picker) setField(picker.key, v);
          setPicker(null);
        }}
      />
    </Screen>
  );
}

/* ---------------- Field renderer ---------------- */
function Field({
  field,
  value,
  error,
  onChange,
  onOpenPicker,
}: {
  field: FormFieldConfig;
  value: string;
  error: boolean;
  onChange: (v: string) => void;
  onOpenPicker: () => void;
}) {
  const borderColor = error ? colors.red : colors.line;
  const label = (
    <Text style={[font('700'), { fontSize: 12, color: colors.navy700, textAlign: 'right', marginBottom: 6 }]}>
      {field.label} {field.required ? <Text style={{ color: colors.red }}>*</Text> : <Text style={{ color: colors.muted, fontSize: 10 }}>(اختياري)</Text>}
    </Text>
  );

  if (field.type === 'select') {
    return (
      <View>
        {label}
        <Pressable
          onPress={onOpenPicker}
          style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor, borderRadius: radius.sm, paddingVertical: 12, paddingHorizontal: 14, backgroundColor: '#fff' }}
        >
          <Text style={[font(value ? '700' : '400'), { fontSize: 13, color: value ? colors.navy700 : colors.muted }]}>
            {value || field.placeholder || 'اختر...'}
          </Text>
          <Icon name="chevron-down" size={16} color={colors.muted} />
        </Pressable>
      </View>
    );
  }

  const multiline = field.type === 'textarea';
  const keyboardType =
    field.type === 'phone' ? 'phone-pad' : field.type === 'number' ? 'number-pad' : 'default';

  return (
    <View>
      {label}
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={field.placeholder}
        placeholderTextColor={colors.muted}
        keyboardType={keyboardType as any}
        multiline={multiline}
        style={[
          font('600'),
          {
            borderWidth: 1,
            borderColor,
            borderRadius: radius.sm,
            paddingVertical: multiline ? 12 : 12,
            paddingHorizontal: 14,
            fontSize: 13,
            color: colors.ink,
            textAlign: 'right',
            writingDirection: 'rtl',
            minHeight: multiline ? 76 : undefined,
            textAlignVertical: multiline ? 'top' : 'center',
            backgroundColor: '#fff',
          },
        ]}
      />
    </View>
  );
}

function ErrorText({ text }: { text: string }) {
  return <Text style={[font('600'), { fontSize: 10.5, color: colors.red, textAlign: 'right', marginTop: 6 }]}>{text}</Text>;
}

/* ---------------- Select modal ---------------- */
function SelectModal({
  field,
  onClose,
  onSelect,
}: {
  field: FormFieldConfig | null;
  onClose: () => void;
  onSelect: (v: string) => void;
}) {
  return (
    <Modal visible={!!field} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(20,40,74,.35)' }} onPress={onClose} />
      <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '65%', paddingTop: 8 }}>
        <View style={{ alignItems: 'center', paddingVertical: 6 }}>
          <View style={{ width: 44, height: 5, borderRadius: 3, backgroundColor: colors.line }} />
        </View>
        <Text style={[font('800'), { fontSize: 15, color: colors.navy700, textAlign: 'center', marginVertical: 8 }]}>
          {field?.label}
        </Text>
        <FlatList
          data={field?.options ?? []}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => onSelect(item)}
              style={{ paddingVertical: 14, paddingHorizontal: 22, borderBottomWidth: 1, borderBottomColor: colors.line2 }}
            >
              <Text style={[font('600'), { fontSize: 14, color: colors.ink, textAlign: 'right' }]}>{item}</Text>
            </Pressable>
          )}
        />
      </View>
    </Modal>
  );
}
