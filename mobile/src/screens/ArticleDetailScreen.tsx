import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { articles } from '@ahla/shared';
import { Screen } from '../components/Screen';
import { AppBar } from '../components/AppBar';
import { Card, Button, Pill } from '../components/ui';
import { StickyFooter } from './DonateScreen';
import { Icon } from '../components/Icon';
import { colors, font, num, row } from '../theme';
import type { RootProps } from '../navigation/types';

const catTone = (c: string) =>
  c === 'خبر' ? 'navy' : c === 'نشاط' ? 'green' : c === 'قافلة' ? 'gold' : 'red';

export default function ArticleDetailScreen({ route }: RootProps<'ArticleDetail'>) {
  const nav = useNavigation<any>();
  const article = articles.find((a) => a.id === route.params.id) ?? articles[0];

  return (
    <Screen
      header={<AppBar title="التفاصيل" onBack={() => nav.goBack()} onBell={undefined} />}
      footer={
        <StickyFooter>
          <Button label="مشاركة" variant="outline" icon="share-2" style={{ width: 120 }} />
          <Button label="تبرع الآن" icon="heart" style={{ flex: 1 }} onPress={() => nav.navigate('Main', { screen: 'Donate' })} />
        </StickyFooter>
      }
    >
      <LinearGradient colors={article.gradient} style={{ height: 180, borderRadius: 16, padding: 12, justifyContent: 'flex-start' }}>
        <View style={{ flexDirection: 'row-reverse' }}>
          <Pill label={article.category} tone={catTone(article.category) as any} />
        </View>
      </LinearGradient>

      <Text style={[font('800'), { fontSize: 20, color: colors.navy700, textAlign: 'right', marginTop: 14, lineHeight: 28 }]}>
        {article.title}
      </Text>

      <View style={[row, { gap: 12, marginTop: 8 }]}>
        <View style={[row, { gap: 4 }]}>
          <Icon name="calendar" size={13} color={colors.muted} />
          <Text style={[font('600'), num, { fontSize: 10.5, color: colors.muted }]}>{article.date}</Text>
        </View>
        <View style={[row, { gap: 4 }]}>
          <Icon name="clock" size={13} color={colors.muted} />
          <Text style={[font('600'), { fontSize: 10.5, color: colors.muted }]}>{article.readMinutes} دقائق قراءة</Text>
        </View>
        {article.location ? (
          <View style={[row, { gap: 4 }]}>
            <Icon name="map-pin" size={13} color={colors.muted} />
            <Text style={[font('600'), { fontSize: 10.5, color: colors.muted }]}>{article.location}</Text>
          </View>
        ) : null}
      </View>

      <View style={{ height: 1, backgroundColor: colors.line2, marginVertical: 14 }} />

      <Text style={[font('400'), { fontSize: 13.5, color: colors.slate, textAlign: 'right', lineHeight: 24 }]}>
        {article.body}
      </Text>

      <Card style={[row, { gap: 11, marginTop: 18, backgroundColor: '#EAF0F8' }]}>
        <Icon name="heart" size={18} color={colors.navy700} />
        <Text style={[font('400'), { flex: 1, fontSize: 11, color: colors.slate, textAlign: 'right', lineHeight: 17 }]}>
          كن جزءاً من هذا الأثر — تبرعك اليوم يصنع فرقاً في حياة الآلاف.
        </Text>
      </Card>
      <View style={{ height: 12 }} />
    </Screen>
  );
}
