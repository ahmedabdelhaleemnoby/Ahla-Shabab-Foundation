import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../components/Screen';
import { AppBar } from '../components/AppBar';
import { Card, Button } from '../components/ui';
import { Icon } from '../components/Icon';
import { StickyFooter } from './DonateScreen';
import { colors, font, row } from '../theme';
import { verifyOtp, requestOtp } from '@ahla/shared';
import { saveSession } from '../store/session';
import { registerForPush } from '../store/push';
import { appState } from '../store/appState';
import { loginDemoUserByEmail } from '../store/demoUsers';
import type { RootProps } from '../navigation/types';

const LEN = 6;
const RESEND_SECONDS = 30;

export default function OtpScreen({ route }: RootProps<'Otp'>) {
  const nav = useNavigation<any>();
  const { email } = route.params;
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  /** Server-side rejection (wrong/expired/used code, too many attempts). */
  const [serverError, setServerError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [seconds]);

  /**
   * Exchanges the code for a real token pair. The app cannot decide whether a
   * code is valid — only the server can — so a rejection keeps the user here
   * with the backend's reason (wrong code, expired, too many attempts).
   */
  const verify = async () => {
    if (code.length < LEN) {
      setError(true);
      return;
    }
    if (verifying) return;
    setServerError(null);
    setVerifying(true);
    try {
      const session = await verifyOtp(email, code);
      await saveSession(session);
      appState.login(session.user?.email ?? email);
      // Now, not at app start: `/me/device-tokens` is authenticated, and the
      // token is stored against whoever just signed in. Deliberately not
      // awaited — the permission prompt must not hold up the navigation, and
      // `registerForPush` never rejects.
      void registerForPush();
      // Keeps locally-stored consultations/bookings attached to this address
      // until the /me/* screens read them from the server (T-05).
      loginDemoUserByEmail(email);
      nav.navigate('Main', { screen: 'About' });
    } catch (e: unknown) {
      setCode('');
      setError(true);
      setServerError((e as Error)?.message ?? 'رمز التحقق غير صحيح أو منتهي الصلاحية.');
    } finally {
      setVerifying(false);
    }
  };

  /** Re-sends through the same endpoint; the cooldown is enforced client-side
   *  and again by the backend's rate limit. */
  const resend = async () => {
    if (seconds > 0) return;
    setServerError(null);
    setCode('');
    setError(false);
    try {
      await requestOtp(email);
      setSeconds(RESEND_SECONDS);
    } catch (e: unknown) {
      setServerError((e as Error)?.message ?? 'تعذّر إعادة إرسال الرمز.');
    }
  };

  return (
    <Screen
      header={<AppBar title="رمز التحقق" onBack={() => nav.goBack()} onBell={undefined} />}
      footer={
        <StickyFooter>
          <Button label={verifying ? 'جارٍ التحقق…' : 'تأكيد'} icon="check" style={{ flex: 1, opacity: verifying ? 0.6 : 1 }} onPress={() => void verify()} />
        </StickyFooter>
      }
    >
      <View style={{ alignItems: 'center', marginTop: 16 }}>
        <Text style={[font('800'), { fontSize: 20, color: colors.navy700 }]}>أدخل رمز التحقق</Text>
        <Text style={[font('400'), { fontSize: 12.5, color: colors.slate, marginTop: 6, textAlign: 'center', lineHeight: 19 }]}>
          تسجيل الدخول بالبريد{'\n'}
          <Text style={[font('700'), { color: colors.navy700, writingDirection: 'ltr' }]}>{email}</Text>
        </Text>
      </View>

      {/*
        The banner that used to sit here read «نسخة عرض — لم يُرسل أي بريد
        إلكتروني. أدخل أي رمز مكوّن من 6 أرقام للمتابعة» — "demo build, no email
        was sent, enter any six digits". That was true before T-04 and false
        afterwards: the code is verified against the server, a wrong one is
        rejected, and the rejection is shown below.

        Left in place it told every user to do the one thing guaranteed not to
        work, and then blamed them for it. Removed rather than reworded — the
        screen already names the address the code was sent to.
      */}

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

      {error || serverError ? (
        <Text style={[font('700'), { fontSize: 11.5, color: colors.red, textAlign: 'center', marginTop: 12, lineHeight: 17 }]}>
          {serverError ?? 'أدخل الرمز المكوّن من 6 أرقام'}
        </Text>
      ) : null}

      {/* Resend */}
      <View style={{ alignItems: 'center', marginTop: 22 }}>
        {seconds > 0 ? (
          <Text style={[font('400'), { fontSize: 12, color: colors.muted }]}>
            إعادة إرسال الرمز خلال <Text style={[font('700'), { color: colors.navy700 }]}>{seconds}</Text> ثانية
          </Text>
        ) : (
          <Pressable onPress={() => void resend()}>
            <Text style={[font('700'), { fontSize: 13, color: colors.navy700 }]}>إعادة إرسال الرمز</Text>
          </Pressable>
        )}
      </View>
      <View style={{ height: 12 }} />
    </Screen>
  );
}
