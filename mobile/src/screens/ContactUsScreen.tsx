import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../components/Screen';
import { AppBar } from '../components/AppBar';
import { Card, Button } from '../components/ui';
import { StickyFooter } from './DonateScreen';
import { Icon, IconName } from '../components/Icon';
import { colors, font, num, radius, row } from '../theme';
import { getSettings } from '../store/cms';

/* Contact details and socials are authored in the dashboard (إعدادات التطبيق).
   Both lists are built inside the component so an edit is picked up on the next
   render rather than snapshotted at module-import time. */
type SocialKey = 'facebook' | 'instagram' | 'youtube' | 'twitter';
const SOCIAL: { icon: IconName; label: string; key: SocialKey }[] = [
  { icon: 'facebook', label: 'فيسبوك', key: 'facebook' },
  { icon: 'instagram', label: 'إنستجرام', key: 'instagram' },
  { icon: 'youtube', label: 'يوتيوب', key: 'youtube' },
  { icon: 'twitter', label: 'إكس', key: 'twitter' },
];

export default function ContactUsScreen() {
  const nav = useNavigation<any>();
  const settings = getSettings();
  const socials = SOCIAL.map((s) => ({ ...s, url: (settings.socials[s.key] ?? '').trim() })).filter(
    (s) => s.url && s.url !== settings.website
  );
  const CONTACTS: { icon: IconName; label: string; value: string; ltr?: boolean }[] = [
    { icon: 'phone', label: 'الخط الساخن', value: settings.hotline, ltr: true },
    { icon: 'mail', label: 'البريد الإلكتروني', value: settings.email, ltr: true },
    { icon: 'map-pin', label: 'العنوان', value: settings.address },
    { icon: 'clock', label: 'مواعيد العمل', value: settings.workingHours },
  ];
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const valid = name.trim() && phone.trim() && message.trim();

  return (
    <Screen header={<AppBar title="تواصل معنا" onBack={() => nav.goBack()} onBell={undefined} />}>
      {/* Contact info */}
      {CONTACTS.map((c) => (
        <Card key={c.label} style={[row, { gap: 12, marginBottom: 10 }]}>
          <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: colors.paper2, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={c.icon} size={19} color={colors.navy700} />
          </View>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text style={[font('400'), { fontSize: 10.5, color: colors.muted }]}>{c.label}</Text>
            <Text style={[font('800'), c.ltr ? num : undefined, { fontSize: 13.5, color: colors.navy700, marginTop: 2 }]}>{c.value}</Text>
          </View>
        </Card>
      ))}

      {/* Social — only networks with a real, distinct URL configured in the
          dashboard. Every entry seeds to the foundation's website, and a button
          that just reopens the website is a dead button wearing a Facebook icon;
          fill the links in إعدادات التطبيق and they appear here. */}
      {socials.length > 0 && (
        <>
          <Text style={[font('800'), { fontSize: 13, color: colors.navy700, textAlign: 'right', marginTop: 6, marginBottom: 10, marginHorizontal: 2 }]}>
            تابعنا على
          </Text>
          <View style={[row, { gap: 10 }]}>
            {socials.map((s) => (
              <Pressable key={s.label} onPress={() => Linking.openURL(s.url).catch(() => {})} style={{ flex: 1, alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: 14, paddingVertical: 14 }}>
                <Icon name={s.icon} size={20} color={colors.navy700} />
                <Text style={[font('700'), { fontSize: 9.5, color: colors.slate, marginTop: 6 }]}>{s.label}</Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      {/* Message form */}
      <Text style={[font('800'), { fontSize: 13, color: colors.navy700, textAlign: 'right', marginTop: 20, marginBottom: 10, marginHorizontal: 2 }]}>
        أرسل لنا رسالة
      </Text>

      {sent ? (
        <Card style={[row, { gap: 11, backgroundColor: colors.greenSoft }]}>
          <Icon name="check-circle" size={20} color={colors.green} />
          <Text style={[font('700'), { flex: 1, fontSize: 12.5, color: colors.greenDark, textAlign: 'right' }]}>
            تم إرسال رسالتك بنجاح. سنرد عليك في أقرب وقت.
          </Text>
        </Card>
      ) : (
        <Card style={{ gap: 12 }}>
          <TextInput value={name} onChangeText={setName} placeholder="الاسم" placeholderTextColor={colors.muted} style={inputStyle} />
          <TextInput
            value={phone}
            onChangeText={(t) => setPhone(t.replace(/[^0-9]/g, '').slice(0, 11))}
            placeholder="رقم الهاتف"
            placeholderTextColor={colors.muted}
            keyboardType="phone-pad"
            style={inputStyle}
          />
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="اكتب رسالتك..."
            placeholderTextColor={colors.muted}
            multiline
            style={[inputStyle, { minHeight: 90, textAlignVertical: 'top' }]}
          />
          <Button label="إرسال الرسالة" icon="send" onPress={() => valid && setSent(true)} style={{ opacity: valid ? 1 : 0.6 }} />
        </Card>
      )}

      {/* Volunteer CTA */}
      <StickyFooterSpacer />
      <Card style={[row, { gap: 11, marginTop: 12, backgroundColor: '#EAF0F8' }]}>
        <Icon name="users" size={18} color={colors.navy700} />
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <Text style={[font('800'), { fontSize: 12, color: colors.navy700 }]}>هل ترغب في التطوع معنا؟</Text>
          <Pressable onPress={() => nav.navigate('Volunteer')}>
            <Text style={[font('700'), { fontSize: 11, color: colors.navy500, marginTop: 3 }]}>سجّل كمتطوع ‹</Text>
          </Pressable>
        </View>
      </Card>
      <View style={{ height: 12 }} />
    </Screen>
  );
}

function StickyFooterSpacer() {
  return <View style={{ height: 4 }} />;
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
