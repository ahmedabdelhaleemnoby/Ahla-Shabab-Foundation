import React from 'react';
import { View, Text, Share } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../components/Screen';
import { AppBar } from '../components/AppBar';
import { Card, Button, Pill } from '../components/ui';
import { StickyFooter } from './DonateScreen';
import { Icon, IconName } from '../components/Icon';
import { colors, font, num, row, rowBetween } from '../theme';
import type { RootProps } from '../navigation/types';

/**
 * Status-aware donation receipt. The app NEVER renders a final "success" on
 * its own: gateway payments stay «قيد التأكيد» until the server confirms,
 * and manual methods (bank transfer / InstaPay) stay «قيد المراجعة» until an
 * admin approves them in the dashboard.
 */
const STATUS_UI: Record<string, { icon: IconName; color: string; soft: string; title: string; note: string }> = {
  'قيد التأكيد': {
    icon: 'clock', color: colors.navy700, soft: '#EAF0F8',
    title: 'تم استلام طلب التبرع',
    note: 'جارٍ تأكيد عملية الدفع مع بوابة الدفع. سيصلك إشعار فور اعتماد التبرع.',
  },
  'قيد المراجعة': {
    icon: 'file-text', color: '#B9791A', soft: colors.goldSoft,
    title: 'تم استلام طلب التبرع',
    note: 'تبرعات التحويل البنكي/إنستاباي تُعتمد بعد مراجعة الإدارة. سيصلك إشعار فور الاعتماد.',
  },
  مكتمل: {
    icon: 'check', color: colors.green, soft: colors.greenSoft,
    title: 'تم اعتماد تبرعك — شكراً لعطائك!',
    note: 'تم تأكيد العملية بنجاح وسيصل تبرعك إلى مستحقيه بإذن الله.',
  },
  فشل: {
    icon: 'x', color: colors.red, soft: colors.redSoft,
    title: 'تعذّر إتمام العملية',
    note: 'لم تكتمل عملية الدفع. لم يُخصم أي مبلغ — يمكنك المحاولة مرة أخرى.',
  },
};

export default function DonationSuccessScreen({ route }: RootProps<'DonationSuccess'>) {
  const nav = useNavigation<any>();
  const { amount, cause, method, recurring, reference, date, status } = route.params;
  const ui = STATUS_UI[status] ?? STATUS_UI['قيد التأكيد'];

  const shareReceipt = () =>
    Share.share({
      message: `إيصال تبرع — جمعية خواطر أحلى شباب\nرقم العملية: ${reference}\nالتاريخ: ${date}\nالمبلغ: ${amount}\nوجهة التبرع: ${cause}\nطريقة الدفع: ${method}\nالحالة: ${status}`,
    }).catch(() => {});

  return (
    <Screen
      header={<AppBar title="إيصال التبرع" onBack={() => nav.navigate('Main', { screen: 'Home' })} onBell={undefined} />}
      footer={
        <StickyFooter>
          <Button label="مشاركة الإيصال" variant="outline" icon="share-2" style={{ width: 150 }} onPress={shareReceipt} />
          <Button label="تم" icon="check" style={{ flex: 1 }} onPress={() => nav.navigate('Main', { screen: 'Home' })} />
        </StickyFooter>
      }
    >
      {/* Status mark */}
      <View style={{ alignItems: 'center', marginTop: 22 }}>
        <View style={{ width: 92, height: 92, borderRadius: 46, backgroundColor: ui.soft, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 62, height: 62, borderRadius: 31, backgroundColor: ui.color, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={ui.icon} size={32} color="#fff" />
          </View>
        </View>
        <Text style={[font('800'), { fontSize: 19, color: colors.navy700, marginTop: 16, textAlign: 'center' }]}>{ui.title}</Text>
        <Text style={[font('400'), { fontSize: 12.5, color: colors.slate, marginTop: 8, textAlign: 'center', lineHeight: 20, paddingHorizontal: 8 }]}>
          {ui.note}
        </Text>
      </View>

      {/* Receipt */}
      <Card style={{ marginTop: 20 }}>
        <View style={{ alignItems: 'center', paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.line2 }}>
          <Text style={[font('400'), { fontSize: 11, color: colors.slate }]}>مبلغ التبرع</Text>
          <Text style={[font('800'), num, { fontSize: 28, color: colors.navy700, marginTop: 4 }]}>{amount}</Text>
        </View>
        <View style={{ paddingTop: 12, gap: 10 }}>
          <ReceiptRow label="رقم العملية" value={reference} mono />
          <ReceiptRow label="التاريخ" value={date} mono />
          <ReceiptRow label="وجهة التبرع" value={cause} />
          <ReceiptRow label="طريقة الدفع" value={method} />
          <ReceiptRow label="نوع التبرع" value={recurring ? 'شهري مستمر' : 'لمرة واحدة'} />
          <View style={rowBetween}>
            <Pill
              label={status}
              tone={status === 'مكتمل' ? 'green' : status === 'فشل' ? 'red' : 'gold'}
            />
            <Text style={[font('400'), { fontSize: 12, color: colors.slate }]}>حالة الدفع</Text>
          </View>
        </View>
      </Card>

      {recurring && status !== 'فشل' && (
        <Card style={[row, { gap: 11, marginTop: 12, backgroundColor: '#EAF0F8' }]}>
          <Icon name="calendar" size={18} color={colors.navy700} />
          <Text style={[font('400'), { flex: 1, fontSize: 10.5, color: colors.slate, textAlign: 'right', lineHeight: 16 }]}>
            بعد اعتماد العملية سيتم تجديد التبرع شهرياً بنفس القيمة. يمكنك إيقافه في أي وقت من حسابك.
          </Text>
        </Card>
      )}
      <View style={{ height: 12 }} />
    </Screen>
  );
}

function ReceiptRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <View style={rowBetween}>
      <Text style={[font('700'), mono ? num : undefined, { fontSize: 12.5, color: colors.navy700 }]}>{value}</Text>
      <Text style={[font('400'), { fontSize: 12, color: colors.slate }]}>{label}</Text>
    </View>
  );
}
