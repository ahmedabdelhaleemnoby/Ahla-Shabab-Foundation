import React, { useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { donorProfile, governorates } from '@ahla/shared';
import { Screen } from '../components/Screen';
import { AppBar } from '../components/AppBar';
import { Card, Button } from '../components/ui';
import { SelectField } from '../components/SelectField';
import { StickyFooter } from './DonateScreen';
import { Icon } from '../components/Icon';
import { colors, font, radius } from '../theme';

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={[font('700'), { fontSize: 12, color: colors.navy700, textAlign: 'right', marginBottom: 6 }]}>{label}</Text>
      {children}
    </View>
  );
}

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

export default function AccountSettingsScreen() {
  const nav = useNavigation<any>();
  const [name, setName] = useState(donorProfile.name);
  const [phone, setPhone] = useState('01012345678');
  const [email, setEmail] = useState('');
  const [gov, setGov] = useState('القاهرة');
  const [bio, setBio] = useState(donorProfile.bio);
  const [saved, setSaved] = useState(false);

  return (
    <Screen
      header={<AppBar title="إعدادات الحساب" onBack={() => nav.goBack()} onBell={undefined} />}
      footer={
        <StickyFooter>
          <Button label="حفظ التغييرات" icon="check" style={{ flex: 1 }} onPress={() => setSaved(true)} />
        </StickyFooter>
      }
    >
      {/* Avatar */}
      <View style={{ alignItems: 'center', marginTop: 6, marginBottom: 16 }}>
        <View style={{ position: 'relative' }}>
          <LinearGradient colors={['#c3d1e8', '#8ba0c2']} style={{ width: 84, height: 84, borderRadius: 42 }} />
          <View style={{ position: 'absolute', bottom: -2, left: -2, width: 30, height: 30, borderRadius: 15, backgroundColor: colors.navy700, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.paper }}>
            <Icon name="edit-2" size={13} color="#fff" />
          </View>
        </View>
      </View>

      {saved && (
        <Card style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 11, backgroundColor: colors.greenSoft, marginBottom: 14 }}>
          <Icon name="check-circle" size={18} color={colors.green} />
          <Text style={[font('700'), { flex: 1, fontSize: 12.5, color: colors.greenDark, textAlign: 'right' }]}>تم حفظ التغييرات بنجاح</Text>
        </Card>
      )}

      <Labeled label="الاسم بالكامل">
        <TextInput value={name} onChangeText={setName} style={inputStyle} placeholderTextColor={colors.muted} />
      </Labeled>
      <Labeled label="رقم الهاتف">
        <TextInput value={phone} onChangeText={(t) => setPhone(t.replace(/[^0-9]/g, '').slice(0, 11))} keyboardType="phone-pad" style={inputStyle} placeholderTextColor={colors.muted} />
      </Labeled>
      <Labeled label="البريد الإلكتروني">
        <TextInput value={email} onChangeText={setEmail} placeholder="example@email.com" keyboardType="email-address" autoCapitalize="none" style={[inputStyle, { textAlign: 'left', writingDirection: 'ltr' }]} placeholderTextColor={colors.muted} />
      </Labeled>
      <SelectField label="المحافظة" value={gov} options={governorates} onChange={setGov} />
      <View style={{ height: 14 }} />
      <Labeled label="نبذة عنك">
        <TextInput value={bio} onChangeText={setBio} multiline style={[inputStyle, { minHeight: 80, textAlignVertical: 'top' }]} placeholderTextColor={colors.muted} />
      </Labeled>
      <View style={{ height: 12 }} />
    </Screen>
  );
}
