import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../components/Screen';
import { AppBar } from '../components/AppBar';
import { Card, Button } from '../components/ui';
import { Icon } from '../components/Icon';
import { colors, font, row } from '../theme';

const FAQS: { q: string; a: string }[] = [
  { q: 'كيف يمكنني التبرع عبر التطبيق؟', a: 'اختر وجهة التبرع (حالة، مشروع، أو صندوق)، حدّد المبلغ وطريقة الدفع المناسبة (بطاقة، فوري، إنستاباي، فودافون كاش، أو تحويل بنكي)، ثم أكّد التبرع. ستصلك رسالة تأكيد فوراً.' },
  { q: 'هل تبرعاتي آمنة وتصل لمستحقيها؟', a: 'نعم. جميع المعاملات مشفّرة وآمنة، ونلتزم بأعلى معايير الشفافية. يمكنك متابعة نسبة إنجاز كل حالة أو مشروع بشكل مباشر داخل التطبيق.' },
  { q: 'ما هي الكفالة الشهرية وكيف أوقفها؟', a: 'الكفالة الشهرية تبرع متكرر يُخصم تلقائياً بنفس القيمة كل شهر. يمكنك تفعيلها عند التبرع، وإيقافها في أي وقت من إعدادات حسابك.' },
  { q: 'كيف أحجز موعد استشارة أو خدمة؟', a: 'من قسم «احجز خدمة»، اختر الفئة ثم المختص، حدّد اليوم والوقت المتاح، واملأ بيانات الحجز. يمكنك الحجز كزائر برقم هاتفك دون إنشاء حساب.' },
  { q: 'هل يمكنني حساب زكاة مالي؟', a: 'نعم، يوفّر التطبيق حاسبة زكاة تساعدك على حساب مقدار الزكاة الواجبة (2.5%) إذا بلغ مالك النصاب، مع إمكانية التبرع بها مباشرةً.' },
  { q: 'كيف أنضم كمتطوع؟', a: 'من صفحة «عن الجمعية»، اضغط «انضم متطوعاً»، واملأ بياناتك ومجالات اهتمامك، وسيتواصل معك فريقنا قريباً.' },
];

export default function FaqScreen() {
  const nav = useNavigation<any>();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <Screen header={<AppBar title="الأسئلة الشائعة" onBack={() => nav.goBack()} onBell={undefined} />}>
      {FAQS.map((f, i) => {
        const isOpen = open === i;
        return (
          <Card key={i} style={{ marginBottom: 10, padding: 0, overflow: 'hidden' }}>
            <Pressable onPress={() => setOpen(isOpen ? null : i)} style={[row, { gap: 10, padding: 14 }]}>
              <Icon name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.navy500} />
              <Text style={[font('800'), { flex: 1, fontSize: 13, color: colors.navy700, textAlign: 'right' }]}>{f.q}</Text>
            </Pressable>
            {isOpen && (
              <View style={{ paddingHorizontal: 14, paddingBottom: 14 }}>
                <View style={{ height: 1, backgroundColor: colors.line2, marginBottom: 10 }} />
                <Text style={[font('400'), { fontSize: 12, color: colors.slate, textAlign: 'right', lineHeight: 21 }]}>{f.a}</Text>
              </View>
            )}
          </Card>
        );
      })}

      <Card style={[row, { gap: 11, marginTop: 6, backgroundColor: '#EAF0F8' }]}>
        <Icon name="message-square" size={18} color={colors.navy700} />
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <Text style={[font('800'), { fontSize: 12, color: colors.navy700 }]}>لم تجد إجابتك؟</Text>
          <Pressable onPress={() => nav.navigate('ContactUs')}>
            <Text style={[font('700'), { fontSize: 11, color: colors.navy500, marginTop: 3 }]}>تواصل معنا ‹</Text>
          </Pressable>
        </View>
      </Card>
      <View style={{ height: 12 }} />
    </Screen>
  );
}
