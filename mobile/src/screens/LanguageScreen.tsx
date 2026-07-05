import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../components/Screen';
import { AppBar } from '../components/AppBar';
import { Card } from '../components/ui';
import { Icon } from '../components/Icon';
import { colors, font, row } from '../theme';

const LANGS = [
  { code: 'ar', label: 'العربية', sub: 'Arabic', flag: '🇪🇬' },
  { code: 'en', label: 'English', sub: 'الإنجليزية', flag: '🇬🇧' },
];

export default function LanguageScreen() {
  const nav = useNavigation<any>();
  const [lang, setLang] = useState('ar');

  return (
    <Screen header={<AppBar title="اللغة" onBack={() => nav.goBack()} onBell={undefined} />}>
      <Text style={[font('400'), { fontSize: 12, color: colors.slate, textAlign: 'right', marginBottom: 12, marginHorizontal: 2 }]}>
        اختر لغة عرض التطبيق.
      </Text>
      <Card style={{ padding: 0 }}>
        {LANGS.map((l, i) => {
          const on = lang === l.code;
          return (
            <View key={l.code}>
              <Pressable onPress={() => setLang(l.code)} style={[row, { gap: 12, padding: 14 }]}>
                <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: on ? colors.navy700 : colors.muted, alignItems: 'center', justifyContent: 'center' }}>
                  {on && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.navy700 }} />}
                </View>
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  <Text style={[font('800'), { fontSize: 14, color: colors.navy700 }]}>{l.label}</Text>
                  <Text style={[font('400'), { fontSize: 10.5, color: colors.muted, marginTop: 1 }]}>{l.sub}</Text>
                </View>
                <Text style={{ fontSize: 24 }}>{l.flag}</Text>
              </Pressable>
              {i < LANGS.length - 1 && <View style={{ height: 1, backgroundColor: colors.line2, marginHorizontal: 14 }} />}
            </View>
          );
        })}
      </Card>
      <Card style={[row, { gap: 11, marginTop: 12, backgroundColor: '#EAF0F8' }]}>
        <Icon name="info" size={16} color={colors.navy700} />
        <Text style={[font('400'), { flex: 1, fontSize: 10.5, color: colors.slate, textAlign: 'right', lineHeight: 16 }]}>
          الدعم الكامل للإنجليزية قيد التطوير. التطبيق حالياً مُحسّن للغة العربية.
        </Text>
      </Card>
      <View style={{ height: 12 }} />
    </Screen>
  );
}
