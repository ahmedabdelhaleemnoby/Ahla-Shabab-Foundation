import React from 'react';
import { View, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../components/Screen';
import { AppBar } from '../components/AppBar';
import { Card } from '../components/ui';
import { Icon, IconName } from '../components/Icon';
import { colors, font, row } from '../theme';

const SECTIONS: { icon: IconName; title: string; body: string }[] = [
  {
    icon: 'shield',
    title: 'حماية بيانات المستفيدين',
    body: 'نلتزم بحماية كرامة وخصوصية المستفيدين: لا نعرض أرقام هواتفهم أو عناوينهم التفصيلية أو أي بيانات شخصية حساسة داخل التطبيق. تُعرض فقط معلومات عامة آمنة مثل المحافظة ونوع الاحتياج وحالة التوثيق.',
  },
  {
    icon: 'lock',
    title: 'بياناتك الشخصية',
    body: 'نجمع الحد الأدنى من البيانات اللازمة لإتمام التبرع أو الحجز (الاسم ورقم الهاتف). تُنقل بياناتك مشفّرة ولا تُشارك مع أي طرف ثالث لأغراض تسويقية.',
  },
  {
    icon: 'credit-card',
    title: 'بيانات الدفع',
    body: 'لا يخزّن التطبيق بيانات بطاقتك البنكية. تتم عمليات الدفع عبر بوابات دفع مرخّصة، ولا يُعتمد أي تبرع إلا بعد تأكيد بوابة الدفع أو مراجعة الإدارة.',
  },
  {
    icon: 'message-circle',
    title: 'سرية الاستشارات',
    body: 'جميع جلسات الاستشارة سرية تماماً. لا يطّلع على تفاصيلها إلا المختص المعني، ولا تُستخدم في أي غرض آخر.',
  },
  {
    icon: 'bell',
    title: 'الإشعارات',
    body: 'تتحكم بالكامل في أنواع الإشعارات التي تصلك من صفحة «الإشعارات» في حسابك، ويمكنك إيقافها في أي وقت.',
  },
  {
    icon: 'trash-2',
    title: 'حذف البيانات',
    body: 'يحق لك طلب حذف حسابك وبياناتك في أي وقت عبر التواصل معنا، وسنقوم بالحذف خلال مدة لا تتجاوز 30 يوماً.',
  },
];

export default function PrivacyPolicyScreen() {
  const nav = useNavigation<any>();
  return (
    <Screen header={<AppBar title="سياسة الخصوصية" onBack={() => nav.goBack()} onBell={undefined} />}>
      <Text style={[font('400'), { fontSize: 12, color: colors.slate, textAlign: 'right', lineHeight: 19, marginBottom: 12, marginHorizontal: 2 }]}>
        خصوصيتك وخصوصية المستفيدين أمانة. توضح هذه السياسة كيف نتعامل مع البيانات داخل تطبيق جمعية خواطر أحلى شباب.
      </Text>
      {SECTIONS.map((s) => (
        <Card key={s.title} style={{ marginBottom: 10 }}>
          <View style={[row, { gap: 8, justifyContent: 'flex-end' }]}>
            <Text style={[font('800'), { fontSize: 13.5, color: colors.navy700 }]}>{s.title}</Text>
            <Icon name={s.icon} size={16} color={colors.navy500} />
          </View>
          <Text style={[font('400'), { fontSize: 12, color: colors.slate, textAlign: 'right', lineHeight: 20, marginTop: 6 }]}>{s.body}</Text>
        </Card>
      ))}
      <View style={{ height: 12 }} />
    </Screen>
  );
}
