import React from 'react';
import { View, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../components/Screen';
import { AppBar } from '../components/AppBar';
import { Card, Button } from '../components/ui';
import { Icon, IconName } from '../components/Icon';
import { colors, font, row } from '../theme';

/* §13 — visual placeholder only: explains how payment confirmation will work
   in the production build. No server logic exists in this demo. */

const STEPS: { icon: IconName; title: string; body: string }[] = [
  { icon: 'smartphone', title: 'تدفع من التطبيق', body: 'تختار المبلغ ووسيلة الدفع، وتُسجَّل عمليتك فوراً بحالة «قيد التأكيد» أو «قيد المراجعة».' },
  { icon: 'server', title: 'الخادم يتحقق', body: 'بوابة الدفع تُخطر خادم الجمعية مباشرة بنتيجة العملية عبر اتصال آمن ومشفّر.' },
  { icon: 'check-circle', title: 'يُعتمد التبرع', body: 'بعد تأكيد الخادم — أو مراجعة الإدارة للتحويلات اليدوية — تتحول حالة الإيصال إلى «مكتمل» ويصلك إشعار.' },
];

export default function PaymentInfoScreen() {
  const nav = useNavigation<any>();
  return (
    <Screen header={<AppBar title="تأكيد الدفع" onBack={() => nav.goBack()} onBell={undefined} />}>
      <Card style={[row, { gap: 11, backgroundColor: '#EAF0F8', marginTop: 4 }]}>
        <Icon name="shield" size={20} color={colors.navy700} />
        <Text style={[font('700'), { flex: 1, fontSize: 12, color: colors.navy700, textAlign: 'right', lineHeight: 18 }]}>
          سيتم تأكيد عملية الدفع من الخادم في النسخة التشغيلية.
        </Text>
      </Card>

      <Text style={[font('800'), { fontSize: 13, color: colors.navy700, textAlign: 'right', marginTop: 18, marginBottom: 10, marginHorizontal: 2 }]}>
        كيف تتم رحلة تأكيد التبرع؟
      </Text>

      {STEPS.map((s, i) => (
        <Card key={s.title} style={[row, { gap: 12, marginBottom: 10, alignItems: 'flex-start' }]}>
          <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: colors.paper2, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={s.icon} size={19} color={colors.navy700} />
          </View>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text style={[font('800'), { fontSize: 13, color: colors.navy700 }]}>{i + 1}. {s.title}</Text>
            <Text style={[font('400'), { fontSize: 11.5, color: colors.slate, marginTop: 3, textAlign: 'right', lineHeight: 17 }]}>{s.body}</Text>
          </View>
        </Card>
      ))}

      <Card style={[row, { gap: 10, backgroundColor: colors.goldSoft }]}>
        <Icon name="alert-triangle" size={16} color="#B9791A" />
        <Text style={[font('700'), { flex: 1, fontSize: 11, color: '#8A5B10', textAlign: 'right', lineHeight: 17 }]}>
          هذه نسخة عرض تقديمي — لا يوجد اتصال بخادم أو بوابة دفع، ولا يظهر أي تبرع بحالة «مكتمل» تلقائياً.
        </Text>
      </Card>

      <Button label="العودة للتبرع" style={{ marginTop: 16 }} onPress={() => nav.goBack()} />
      <View style={{ height: 12 }} />
    </Screen>
  );
}
