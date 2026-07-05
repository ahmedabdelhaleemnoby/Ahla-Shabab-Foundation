import React from 'react';
import { View, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../components/Screen';
import { AppBar } from '../components/AppBar';
import { Card, Button } from '../components/ui';
import { StickyFooter } from './DonateScreen';
import { Icon } from '../components/Icon';
import { colors, font, num, row, rowBetween } from '../theme';
import type { RootProps } from '../navigation/types';

export default function DonationSuccessScreen({ route }: RootProps<'DonationSuccess'>) {
  const nav = useNavigation<any>();
  const { amount, cause, method, recurring, reference } = route.params;

  return (
    <Screen
      header={<AppBar title="تم التبرع" onBack={() => nav.navigate('Main', { screen: 'Home' })} onBell={undefined} />}
      footer={
        <StickyFooter>
          <Button label="مشاركة" variant="outline" icon="share-2" style={{ width: 120 }} />
          <Button label="تم" icon="check" style={{ flex: 1 }} onPress={() => nav.navigate('Main', { screen: 'Home' })} />
        </StickyFooter>
      }
    >
      {/* Success mark */}
      <View style={{ alignItems: 'center', marginTop: 24 }}>
        <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: colors.greenSoft, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 66, height: 66, borderRadius: 33, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="check" size={36} color="#fff" />
          </View>
        </View>
        <Text style={[font('800'), { fontSize: 22, color: colors.navy700, marginTop: 18 }]}>شكراً لتبرعك!</Text>
        <Text style={[font('400'), { fontSize: 13, color: colors.slate, marginTop: 8, textAlign: 'center', lineHeight: 20 }]}>
          تم استلام تبرعك بنجاح وسيصل إلى مستحقيه بإذن الله.{'\n'}جزاك الله خيراً على عطائك.
        </Text>
      </View>

      {/* Receipt */}
      <Card style={{ marginTop: 24 }}>
        <View style={{ alignItems: 'center', paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.line2 }}>
          <Text style={[font('400'), { fontSize: 11, color: colors.slate }]}>مبلغ التبرع</Text>
          <Text style={[font('800'), num, { fontSize: 30, color: colors.green, marginTop: 4 }]}>{amount}</Text>
        </View>
        <View style={{ paddingTop: 12, gap: 10 }}>
          <ReceiptRow label="رقم العملية" value={reference} mono />
          <ReceiptRow label="وجهة التبرع" value={cause} />
          <ReceiptRow label="طريقة الدفع" value={method} />
          <ReceiptRow label="نوع التبرع" value={recurring ? 'شهري مستمر' : 'لمرة واحدة'} />
          <ReceiptRow label="الحالة" value="مكتمل ✓" tone={colors.green} />
        </View>
      </Card>

      {recurring && (
        <Card style={[row, { gap: 11, marginTop: 12, backgroundColor: '#EAF0F8' }]}>
          <Icon name="calendar" size={18} color={colors.navy700} />
          <Text style={[font('400'), { flex: 1, fontSize: 10.5, color: colors.slate, textAlign: 'right', lineHeight: 16 }]}>
            سيتم خصم المبلغ تلقائياً كل شهر. يمكنك إيقاف التبرع الشهري في أي وقت من حسابك.
          </Text>
        </Card>
      )}
      <View style={{ height: 12 }} />
    </Screen>
  );
}

function ReceiptRow({ label, value, mono, tone }: { label: string; value: string; mono?: boolean; tone?: string }) {
  return (
    <View style={rowBetween}>
      <Text style={[font(mono ? '700' : '700'), mono ? num : undefined, { fontSize: 12.5, color: tone ?? colors.navy700 }]}>{value}</Text>
      <Text style={[font('400'), { fontSize: 12, color: colors.slate }]}>{label}</Text>
    </View>
  );
}
