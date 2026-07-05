import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../components/Screen';
import { AppBar } from '../components/AppBar';
import { Button } from '../components/ui';
import { StickyFooter } from './DonateScreen';
import { colors, font, row } from '../theme';
import type { RootProps } from '../navigation/types';

const LEN = 6;
const RESEND_SECONDS = 30;

export default function OtpScreen({ route }: RootProps<'Otp'>) {
  const nav = useNavigation<any>();
  const { phone } = route.params;
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [seconds]);

  const verify = () => {
    if (code.length < LEN) {
      setError(true);
      return;
    }
    // Mock: any 6-digit code is accepted.
    nav.navigate('Main', { screen: 'Profile' });
  };

  const resend = () => {
    if (seconds > 0) return;
    setSeconds(RESEND_SECONDS);
    setCode('');
    setError(false);
  };

  return (
    <Screen
      header={<AppBar title="رمز التحقق" onBack={() => nav.goBack()} onBell={undefined} />}
      footer={
        <StickyFooter>
          <Button label="تأكيد" icon="check" style={{ flex: 1 }} onPress={verify} />
        </StickyFooter>
      }
    >
      <View style={{ alignItems: 'center', marginTop: 16 }}>
        <Text style={[font('800'), { fontSize: 20, color: colors.navy700 }]}>أدخل رمز التحقق</Text>
        <Text style={[font('400'), { fontSize: 12.5, color: colors.slate, marginTop: 6, textAlign: 'center', lineHeight: 19 }]}>
          أرسلنا رمزاً مكوّناً من 6 أرقام إلى الرقم{'\n'}
          <Text style={[font('700'), { color: colors.navy700, writingDirection: 'ltr' }]}>{phone}</Text>
        </Text>
      </View>

      {/* OTP boxes (tap anywhere focuses the hidden input) */}
      <Pressable onPress={() => inputRef.current?.focus()} style={{ marginTop: 26 }}>
        <View style={[row, { justifyContent: 'center', gap: 8, direction: 'ltr' }]}>
          {Array.from({ length: LEN }).map((_, i) => {
            const filled = i < code.length;
            const active = i === code.length;
            return (
              <View
                key={i}
                style={{
                  width: 46,
                  height: 56,
                  borderRadius: 12,
                  borderWidth: 1.5,
                  borderColor: error ? colors.red : active ? colors.navy700 : filled ? colors.navy500 : colors.line,
                  backgroundColor: '#fff',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={[font('800'), { fontSize: 22, color: colors.navy700 }]}>{code[i] ?? ''}</Text>
              </View>
            );
          })}
        </View>
        {/* Hidden input capturing the digits */}
        <TextInput
          ref={inputRef}
          value={code}
          onChangeText={(t) => {
            setCode(t.replace(/[^0-9]/g, '').slice(0, LEN));
            setError(false);
          }}
          keyboardType="number-pad"
          maxLength={LEN}
          autoFocus
          style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }}
        />
      </Pressable>

      {error ? (
        <Text style={[font('600'), { fontSize: 11, color: colors.red, textAlign: 'center', marginTop: 12 }]}>
          أدخل الرمز المكوّن من 6 أرقام
        </Text>
      ) : null}

      {/* Resend */}
      <View style={{ alignItems: 'center', marginTop: 22 }}>
        {seconds > 0 ? (
          <Text style={[font('400'), { fontSize: 12, color: colors.muted }]}>
            إعادة إرسال الرمز خلال <Text style={[font('700'), { color: colors.navy700 }]}>{seconds}</Text> ثانية
          </Text>
        ) : (
          <Pressable onPress={resend}>
            <Text style={[font('700'), { fontSize: 13, color: colors.navy700 }]}>إعادة إرسال الرمز</Text>
          </Pressable>
        )}
      </View>
      <View style={{ height: 12 }} />
    </Screen>
  );
}
