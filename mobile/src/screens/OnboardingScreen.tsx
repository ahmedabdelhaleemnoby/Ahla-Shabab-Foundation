import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '../components/ui';
import { Icon, IconName } from '../components/Icon';
import { colors, font } from '../theme';

const SLIDES: { icon: IconName; title: string; body: string; gradient: [string, string] }[] = [
  { icon: 'heart', title: 'معاً نصنع أثراً يدوم', body: 'تبرّع للحالات الإنسانية والمشروعات التنموية بسهولة وأمان، وتابع أثر عطائك خطوةً بخطوة.', gradient: [colors.navy700, colors.navy900] },
  { icon: 'calendar', title: 'خدمات مجانية بين يديك', body: 'احجز مواعيد العيادات والاستشارات النفسية والأسرية والدعم التعليمي في خطوات بسيطة.', gradient: ['#2E9E52', '#1B6b3a'] },
  { icon: 'shield', title: 'شفافية وأمان', body: 'كل تبرع يصل إلى مستحقيه، وبياناتك سرية ومحمية. نلتزم بأعلى معايير الشفافية والمصداقية.', gradient: ['#3E62A0', '#14284A'] },
];

export default function OnboardingScreen() {
  const nav = useNavigation<any>();
  const [i, setI] = useState(0);
  const slide = SLIDES[i];
  const last = i === SLIDES.length - 1;

  const finish = () => nav.reset({ index: 0, routes: [{ name: 'Main' }] });
  const next = () => (last ? finish() : setI((v) => v + 1));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }}>
      {/* Skip */}
      <View style={{ flexDirection: 'row-reverse', paddingHorizontal: 20, paddingTop: 6 }}>
        <Pressable onPress={finish}>
          <Text style={[font('700'), { fontSize: 13, color: colors.slate }]}>تخطي</Text>
        </Pressable>
      </View>

      {/* Illustration */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <LinearGradient colors={slide.gradient} style={{ width: 180, height: 180, borderRadius: 90, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={slide.icon} size={72} color="#fff" />
        </LinearGradient>
        <Text style={[font('800'), { fontSize: 24, color: colors.navy700, marginTop: 40, textAlign: 'center' }]}>{slide.title}</Text>
        <Text style={[font('400'), { fontSize: 14, color: colors.slate, marginTop: 14, textAlign: 'center', lineHeight: 24 }]}>{slide.body}</Text>
      </View>

      {/* Dots */}
      <View style={{ flexDirection: 'row-reverse', justifyContent: 'center', gap: 7, marginBottom: 24 }}>
        {SLIDES.map((_, idx) => (
          <View
            key={idx}
            style={{
              width: idx === i ? 22 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: idx === i ? colors.navy700 : colors.line,
            }}
          />
        ))}
      </View>

      {/* Actions */}
      <View style={{ paddingHorizontal: 24, paddingBottom: 24, gap: 10 }}>
        <Button label={last ? 'ابدأ الآن' : 'التالي'} icon={last ? 'check' : undefined} onPress={next} />
        {i > 0 && (
          <Pressable onPress={() => setI((v) => v - 1)} style={{ alignItems: 'center', paddingVertical: 6 }}>
            <Text style={[font('700'), { fontSize: 13, color: colors.slate }]}>السابق</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}
