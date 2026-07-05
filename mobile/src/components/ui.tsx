import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import {
  colors,
  radius,
  spacing,
  cardShadow,
  font,
  rtlText,
  num,
  row,
  text,
} from '../theme';
import { Icon, IconName } from './Icon';

/* ---------------- Card ---------------- */
export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.card, cardShadow, style]}>{children}</View>;
}

/* ---------------- Button ---------------- */
type BtnVariant = 'primary' | 'outline' | 'green' | 'red';
export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  small,
  style,
}: {
  label: string;
  onPress?: () => void;
  variant?: BtnVariant;
  icon?: IconName;
  small?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const bg =
    variant === 'primary'
      ? colors.navy700
      : variant === 'green'
      ? colors.green
      : variant === 'red'
      ? colors.red
      : colors.white;
  const fg = variant === 'outline' ? colors.navy700 : colors.white;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        row,
        { backgroundColor: bg, opacity: pressed ? 0.85 : 1 },
        variant === 'outline' && styles.btnOutline,
        small && styles.btnSmall,
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={small ? 15 : 18} color={fg} /> : null}
      <Text style={[font('700'), { color: fg, fontSize: small ? 13 : 16 }]}>{label}</Text>
    </Pressable>
  );
}

/* ---------------- Pill / Badge ---------------- */
type PillTone = 'red' | 'green' | 'navy' | 'gold';
export function Pill({ label, tone = 'navy' }: { label: string; tone?: PillTone }) {
  const map: Record<PillTone, { bg: string; fg: string }> = {
    red: { bg: colors.red, fg: '#fff' },
    green: { bg: colors.green, fg: '#fff' },
    navy: { bg: '#EAF0F8', fg: colors.navy700 },
    gold: { bg: colors.goldSoft, fg: '#B9791A' },
  };
  const c = map[tone];
  return (
    <View style={[styles.pill, { backgroundColor: c.bg }]}>
      <Text style={[font('700'), { color: c.fg, fontSize: 10.5 }]}>{label}</Text>
    </View>
  );
}

/* ---------------- Progress Bar ---------------- */
export function ProgressBar({
  percent,
  color = colors.green,
}: {
  percent: number;
  color?: string;
}) {
  return (
    <View style={styles.progTrack}>
      <View style={[styles.progFill, { width: `${Math.min(100, percent)}%`, backgroundColor: color }]} />
    </View>
  );
}

/* ---------------- Section Header ---------------- */
export function SectionHeader({
  title,
  icon,
  more,
  onMore,
}: {
  title: string;
  icon?: IconName;
  more?: string;
  onMore?: () => void;
}) {
  return (
    <View style={[styles.sectionRow]}>
      <View style={row}>
        {icon ? <Icon name={icon} size={16} color={colors.navy700} /> : null}
        <Text style={[font('800'), { color: colors.navy700, fontSize: 15, marginStart: icon ? 7 : 0 }]}>
          {title}
        </Text>
      </View>
      {more ? (
        <Pressable onPress={onMore}>
          <Text style={[font('700'), { color: colors.navy500, fontSize: 11.5 }]}>{more}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/* ---------------- Category Tile ---------------- */
export function Tile({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: IconName;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.tile, cardShadow, active && { backgroundColor: colors.navy700 }]}>
      <Icon name={icon} size={18} color={active ? '#fff' : colors.navy700} />
      <Text
        style={[font('700'), { fontSize: 10.5, color: active ? '#fff' : colors.slate, textAlign: 'center', marginTop: 6 }]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/* ---------------- Stat Card ---------------- */
export function Stat({
  value,
  label,
  icon,
}: {
  value: string;
  label: string;
  icon?: IconName;
}) {
  return (
    <Card style={styles.stat}>
      {icon ? <Icon name={icon} size={18} color={colors.navy500} /> : null}
      <Text style={[font('800'), num, { fontSize: 20, color: colors.navy700, marginTop: icon ? 5 : 0 }]}>
        {value}
      </Text>
      <Text style={[font('600'), { fontSize: 10, color: colors.slate, textAlign: 'center', marginTop: 3 }]}>
        {label}
      </Text>
    </Card>
  );
}

/* ---------------- Segmented control ---------------- */
export function Segmented({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.seg}>
      {options.map((o) => {
        const on = o === value;
        return (
          <Pressable
            key={o}
            onPress={() => onChange(o)}
            style={[styles.segItem, on && { backgroundColor: colors.navy700, borderColor: colors.navy700 }]}
          >
            <Text style={[font('700'), { fontSize: 12.5, color: on ? '#fff' : colors.slate }]}>{o}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ---------------- Filter chip ---------------- */
export function Chip({
  label,
  active,
  onPress,
  tone,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  tone?: 'red';
}) {
  const borderColor = tone === 'red' ? colors.red : active ? colors.navy700 : colors.line;
  const bg = active ? colors.navy700 : '#fff';
  const fg = active ? '#fff' : tone === 'red' ? colors.red : colors.slate;
  return (
    <Pressable onPress={onPress} style={[styles.chip, { backgroundColor: bg, borderColor }]}>
      <Text style={[font('700'), { fontSize: 11, color: fg }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.s4 },
  btn: {
    borderRadius: radius.md,
    paddingVertical: 13,
    paddingHorizontal: 16,
    justifyContent: 'center',
    gap: 7,
  },
  btnOutline: { borderWidth: 1.5, borderColor: colors.navy700 },
  btnSmall: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 11 },
  pill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  progTrack: { height: 7, borderRadius: 6, backgroundColor: colors.paper2, overflow: 'hidden' },
  progFill: { height: '100%', borderRadius: 6 },
  sectionRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 12,
    marginHorizontal: 2,
  },
  tile: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 15,
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 13, paddingHorizontal: 6, borderRadius: 16 },
  seg: { flexDirection: 'row-reverse', gap: 8 },
  segItem: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingVertical: 11,
    backgroundColor: '#fff',
  },
  chip: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
});
