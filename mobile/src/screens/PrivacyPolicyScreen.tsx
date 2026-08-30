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
    body: 'نجمع ما يلزم لتنفيذ طلبك فقط: الاسم والهاتف والبريد والمحافظة، والعمر والنوع عند الحجز، ورقم واتساب ووصفك لحالتك عند طلب الاستشارة. الرقم القومي حقل اختياري في الحجز ويمكن تركه فارغًا. تُنقل بياناتك مشفّرة ولا تُشارك مع أي طرف ثالث لأغراض تسويقية أو إعلانية.',
  },
  {
    icon: 'credit-card',
    title: 'بيانات الدفع',
    body: 'لا يخزّن التطبيق بيانات بطاقتك البنكية، ولا توجد بوابة دفع داخل التطبيق أصلًا. يتم التحويل خارجه عبر البنك أو فوري أو فودافون كاش، ويبقى التبرع «قيد المراجعة» حتى تؤكده إدارة الجمعية يدويًا.',
  },
  {
    icon: 'message-circle',
    title: 'سرية الاستشارات',
    body: 'تُعامَل تفاصيل الاستشارة بسرية، ولا تُستخدم لأي غرض غير خدمتك. يطّلع عليها حاليًا فريق الجمعية المخوّل لمتابعة الطلبات وتحديد المواعيد؛ ولا تُعرض في أي واجهة عامة.',
  },
  {
    icon: 'bell',
    title: 'الإشعارات',
    body: 'تتحكم بالكامل في أنواع الإشعارات التي تصلك من صفحة «الإشعارات» في حسابك، ويمكنك إيقافها في أي وقت.',
  },
  {
    icon: 'trash-2',
    title: 'حذف البيانات',
    body: 'يحق لك طلب حذف حسابك وبياناتك في أي وقت عبر التواصل معنا، وسنقوم بالحذف خلال مدة لا تتجاوز 30 يوماً. السياسة الكاملة منشورة على: portfolio.27lashabab.com/api/v1/privacy',
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
