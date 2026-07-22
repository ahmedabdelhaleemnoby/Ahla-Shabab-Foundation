import React, { useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../components/Screen';
import { AppBar } from '../components/AppBar';
import { Card, Button } from '../components/ui';
import { StickyFooter } from './DonateScreen';
import { Icon } from '../components/Icon';
import { colors, font, radius, row } from '../theme';
import { isEmail } from '@ahla/shared';

export default function EmailAuthScreen() {
  const nav = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const valid = isEmail(email.trim());

  const submit = () => {
    setTouched(true);
    // TODO(production): send and verify OTP through backend email service
    if (valid) nav.navigate('Otp', { email: email.trim().toLowerCase() });
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
          <Icon name="mail" size={30} color={colors.navy700} />
        </View>
        <Text style={[font('800'), { fontSize: 20, color: colors.navy700 }]}>أدخل بريدك الإلكتروني</Text>
        <Text style={[font('400'), { fontSize: 12.5, color: colors.slate, marginTop: 6, textAlign: 'center', lineHeight: 19 }]}>
          سنرسل لك رمز تحقق مكوّن من 6 أرقام إلى بريدك الإلكتروني لتأكيد هويتك.
        </Text>
      </View>

      <Text style={[font('700'), { fontSize: 12.5, color: colors.navy700, textAlign: 'right', marginTop: 12, marginBottom: 8, marginHorizontal: 2 }]}>
        البريد الإلكتروني
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
          value={email}
          onChangeText={(t) => setEmail(t.replace(/\s/g, ''))}
          placeholder="example@mail.com"
          placeholderTextColor={colors.muted}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="emailAddress"
          style={[font('700'), { flex: 1, fontSize: 16, color: colors.ink, paddingVertical: 14, textAlign: 'left', writingDirection: 'ltr' }]}
        />
        <View style={{ paddingVertical: 12 }}>
          <Icon name="at-sign" size={18} color={colors.muted} />
        </View>
      </View>
      {touched && !valid ? (
        <Text style={[font('600'), { fontSize: 11, color: colors.red, textAlign: 'right', marginTop: 6 }]}>
          أدخل بريداً إلكترونياً صحيحاً
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
