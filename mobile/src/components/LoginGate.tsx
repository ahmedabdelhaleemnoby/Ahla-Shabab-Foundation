import React from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { Icon, IconName } from './Icon';
import { Button, EmptyState } from './ui';
import { Screen } from './Screen';
import { AppBar } from './AppBar';
import { colors, font } from '../theme';
import { useAppState } from '../store/appState';

/* Guest gate (§4) — restricted screens render their content for logged-in
   users; guests get a friendly dialog explaining WHY logging in helps,
   never a hard block. */

export function LoginGate({
  icon = 'lock',
  title,
  benefits,
  children,
}: {
  icon?: IconName;
  title: string;
  /** What the user gains by logging in — sells the value, doesn't scold. */
  benefits: string[];
  children: React.ReactNode;
}) {
  const { loggedIn } = useAppState();
  const nav = useNavigation<any>();
  // RN Modals float above the whole navigator — only show while this screen
  // is focused, or it would cover pushed screens like the login flow.
  const focused = useIsFocused();

  if (loggedIn) return <>{children}</>;

  return (
    <>
      {/* Placeholder behind the sheet — content stays private until login. */}
      <Screen header={<AppBar title={title} onBack={() => nav.goBack()} onBell={undefined} />} scroll={false}>
        <EmptyState icon={icon} title="هذه الصفحة لحسابك الشخصي" hint="سجّل دخولك لعرض محتواها" />
      </Screen>
      <Modal visible={focused} transparent animationType="fade" onRequestClose={() => nav.goBack()}>
      <View style={{ flex: 1, backgroundColor: 'rgba(13,43,102,0.5)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: colors.paper, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 22, paddingBottom: 30 }}>
          <View style={{ alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: colors.line, marginBottom: 18 }} />
          <View style={{ alignSelf: 'center', width: 64, height: 64, borderRadius: 20, backgroundColor: '#EAF0F8', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={icon} size={28} color={colors.navy700} />
          </View>
          <Text style={[font('800'), { fontSize: 17, color: colors.navy700, textAlign: 'center', marginTop: 14 }]}>{title}</Text>
          <Text style={[font('400'), { fontSize: 12, color: colors.slate, textAlign: 'center', marginTop: 6, lineHeight: 18 }]}>
            سجّل دخولك برقم هاتفك في خطوة واحدة لتستفيد بكل المزايا:
          </Text>

          <View style={{ marginTop: 14, gap: 9 }}>
            {benefits.map((b) => (
              <View key={b} style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 9 }}>
                <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: colors.greenSoft, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="check" size={12} color={colors.greenDark} />
                </View>
                <Text style={[font('600'), { flex: 1, fontSize: 12, color: colors.ink, textAlign: 'right' }]}>{b}</Text>
              </View>
            ))}
          </View>

          <Button label="تسجيل الدخول" icon="log-in" style={{ marginTop: 20 }} onPress={() => nav.navigate('PhoneAuth')} />
          <Pressable onPress={() => nav.goBack()} style={{ alignItems: 'center', marginTop: 14 }}>
            <Text style={[font('700'), { fontSize: 12.5, color: colors.slate }]}>لاحقاً — متابعة التصفح</Text>
          </Pressable>
        </View>
      </View>
      </Modal>
    </>
  );
}
