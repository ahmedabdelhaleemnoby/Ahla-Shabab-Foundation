import React, { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { governorates, isEgPhone } from '@ahla/shared';
import { Screen } from '../components/Screen';
import { AppBar } from '../components/AppBar';
import { Card, Button } from '../components/ui';
import { SelectField } from '../components/SelectField';
import { StickyFooter } from './DonateScreen';
import { Icon } from '../components/Icon';
import { colors, font, radius, row } from '../theme';

const INTERESTS = ['تعليم', 'إغاثة', 'طبي', 'إعلام', 'لوجستيات', 'مالية'];
const AVAILABILITY = ['أيام الأسبوع', 'العطلات', 'مرن'];

function Labeled({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={[font('700'), { fontSize: 12, color: colors.navy700, textAlign: 'right', marginBottom: 6 }]}>
        {label} {required ? <Text style={{ color: colors.red }}>*</Text> : null}
      </Text>
      {children}
    </View>
  );
}

function Input(props: React.ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      placeholderTextColor={colors.muted}
      {...props}
      style={[
        font('600'),
        { borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, paddingVertical: 12, paddingHorizontal: 14, fontSize: 13, color: colors.ink, textAlign: 'right', writingDirection: 'rtl', backgroundColor: '#fff' },
      ]}
    />
  );
}

function ChipGroup({ options, selected, onToggle, multi }: { options: string[]; selected: string[]; onToggle: (v: string) => void; multi?: boolean }) {
  return (
    <View style={[row, { flexWrap: 'wrap', gap: 8 }]}>
      {options.map((o) => {
        const on = selected.includes(o);
        return (
          <Pressable
            key={o}
            onPress={() => onToggle(o)}
            style={{ borderWidth: 1, borderColor: on ? colors.navy700 : colors.line, backgroundColor: on ? colors.navy700 : '#fff', borderRadius: 100, paddingVertical: 8, paddingHorizontal: 15 }}
          >
            <Text style={[font('700'), { fontSize: 12, color: on ? '#fff' : colors.slate }]}>{o}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function VolunteerScreen() {
  const nav = useNavigation<any>();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [gov, setGov] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [availability, setAvailability] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState(false);

  const valid = name.trim() && isEgPhone(phone) && gov && interests.length > 0;

  const toggle = (arr: string[], set: (v: string[]) => void, v: string, multi = true) =>
    set(multi ? (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]) : [v]);

  const submit = () => {
    setTouched(true);
    if (valid) setSubmitted(true);
  };

  if (submitted) {
    return (
      <Screen header={<AppBar title="التطوع" onBack={() => nav.goBack()} onBell={undefined} />}>
        <View style={{ alignItems: 'center', marginTop: 40 }}>
          <View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: colors.greenSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="check" size={40} color={colors.green} />
          </View>
          <Text style={[font('800'), { fontSize: 20, color: colors.navy700, marginTop: 18 }]}>تم استلام طلبك!</Text>
          <Text style={[font('400'), { fontSize: 13, color: colors.slate, marginTop: 8, textAlign: 'center', lineHeight: 20 }]}>
            شكراً لرغبتك في الانضمام لأسرة «أحلى شباب».{'\n'}سيتواصل معك فريقنا قريباً على رقم هاتفك.
          </Text>
          <Button label="العودة للرئيسية" style={{ marginTop: 24, alignSelf: 'stretch' }} onPress={() => nav.navigate('Main', { screen: 'Home' })} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      header={<AppBar title="انضم متطوعاً" onBack={() => nav.goBack()} onBell={undefined} />}
      footer={
        <StickyFooter>
          <Button label="إرسال الطلب" icon="user-plus" style={{ flex: 1 }} onPress={submit} />
        </StickyFooter>
      }
    >
      <Card style={[row, { gap: 11, backgroundColor: '#EAF0F8', marginBottom: 4 }]}>
        <Icon name="users" size={20} color={colors.navy700} />
        <Text style={[font('400'), { flex: 1, fontSize: 11, color: colors.slate, textAlign: 'right', lineHeight: 17 }]}>
          كن جزءاً من فريق التطوع وساهم في صناعة الأثر. املأ البيانات وسنتواصل معك.
        </Text>
      </Card>

      <View style={{ marginTop: 16 }}>
        <Labeled label="الاسم بالكامل" required>
          <Input value={name} onChangeText={setName} placeholder="اكتب اسمك الكامل" />
        </Labeled>
        <Labeled label="رقم الهاتف" required>
          <Input value={phone} onChangeText={(t) => setPhone(t.replace(/[^0-9]/g, '').slice(0, 11))} placeholder="01xxxxxxxxx" keyboardType="phone-pad" />
        </Labeled>
        <Labeled label="العمر">
          <Input value={age} onChangeText={(t) => setAge(t.replace(/[^0-9]/g, '').slice(0, 2))} placeholder="السن" keyboardType="number-pad" />
        </Labeled>
        <SelectField label="المحافظة" required value={gov} options={governorates} onChange={setGov} error={touched && !gov} />
        <View style={{ height: 14 }} />
        <Labeled label="مجالات الاهتمام" required>
          <ChipGroup options={INTERESTS} selected={interests} onToggle={(v) => toggle(interests, setInterests, v)} />
        </Labeled>
        <Labeled label="التوفر">
          <ChipGroup options={AVAILABILITY} selected={availability} onToggle={(v) => toggle(availability, setAvailability, v, false)} />
        </Labeled>
      </View>

      {touched && !valid ? (
        <Text style={[font('600'), { fontSize: 11, color: colors.red, textAlign: 'right', marginTop: 2 }]}>
          يرجى إكمال الحقول المطلوبة (الاسم، هاتف صحيح، المحافظة، مجال اهتمام واحد على الأقل)
        </Text>
      ) : null}
      <View style={{ height: 12 }} />
    </Screen>
  );
}
