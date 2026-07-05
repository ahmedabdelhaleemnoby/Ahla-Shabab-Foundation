import React, { useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../components/Screen';
import { AppBar } from '../components/AppBar';
import { Card, Button } from '../components/ui';
import { StickyFooter } from './DonateScreen';
import { Icon } from '../components/Icon';
import { colors, font, radius, row } from '../theme';

/** Egyptian mobile: 11 digits starting 010/011/012/015. */
const isValidEgPhone = (v: string) => /^01[0125][0-9]{8}$/.test(v);

export default function PhoneAuthScreen() {
  const nav = useNavigation<any>();
  const [phone, setPhone] = useState('');
  const [touched, setTouched] = useState(false);
  const valid = isValidEgPhone(phone);

  const submit = () => {
    setTouched(true);
    if (valid) nav.navigate('Otp', { phone });
  };

  return (
    <Screen
      header={<AppBar title="تسجيل الدخول" onBack={() => nav.goBack()} onBell={undefined} />}
      footer={
        <StickyFooter>
          <Button label="إرسال رمز التحقق" icon="send" style={{ flex: 1 }} onPress={submit} />
        </StickyFooter>
      }
    >
      <View style={{ alignItems: 'center', marginTop: 12, marginBottom: 8 }}>
        <View style={{ width: 72, height: 72, borderRadius: 22, backgroundColor: '#EAF0F8', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
          <Icon name="smartphone" size={30} color={colors.navy700} />
        </View>
        <Text style={[font('800'), { fontSize: 20, color: colors.navy700 }]}>أدخل رقم هاتفك</Text>
        <Text style={[font('400'), { fontSize: 12.5, color: colors.slate, marginTop: 6, textAlign: 'center', lineHeight: 19 }]}>
          سنرسل لك رمز تحقق مكوّن من 6 أرقام عبر رسالة نصية لتأكيد رقمك.
        </Text>
      </View>

      <Text style={[font('700'), { fontSize: 12.5, color: colors.navy700, textAlign: 'right', marginTop: 12, marginBottom: 8, marginHorizontal: 2 }]}>
        رقم الهاتف
      </Text>
      <View
        style={[
          row,
          {
            backgroundColor: '#fff',
            borderWidth: 1,
            borderColor: touched && !valid ? colors.red : colors.line,
            borderRadius: radius.md,
            paddingHorizontal: 14,
            gap: 10,
          },
        ]}
      >
        <TextInput
          value={phone}
          onChangeText={(t) => setPhone(t.replace(/[^0-9]/g, '').slice(0, 11))}
          placeholder="01xxxxxxxxx"
          placeholderTextColor={colors.muted}
          keyboardType="phone-pad"
          style={[font('700'), { flex: 1, fontSize: 16, color: colors.ink, paddingVertical: 14, textAlign: 'left', writingDirection: 'ltr' }]}
        />
        <View style={{ paddingVertical: 12, paddingHorizontal: 10, borderRightWidth: 1, borderRightColor: colors.line }}>
          <Text style={[font('700'), { fontSize: 14, color: colors.slate }]}>🇪🇬 20+</Text>
        </View>
      </View>
      {touched && !valid ? (
        <Text style={[font('600'), { fontSize: 11, color: colors.red, textAlign: 'right', marginTop: 6 }]}>
          أدخل رقم هاتف مصري صحيح (11 رقماً يبدأ بـ 01)
        </Text>
      ) : null}

      <Card style={[row, { gap: 11, marginTop: 16, backgroundColor: '#EAF0F8' }]}>
        <Icon name="shield" size={18} color={colors.navy700} />
        <Text style={[font('400'), { flex: 1, fontSize: 10.5, color: colors.slate, textAlign: 'right', lineHeight: 16 }]}>
          يمكنك أيضاً الحجز كزائر دون تسجيل. تسجيل الدخول يتيح لك متابعة حجوزاتك وتلقّي التذكيرات.
        </Text>
      </Card>
      <View style={{ height: 12 }} />
    </Screen>
  );
}
