import React, { useState } from 'react';
import { View, Text, Pressable, Modal, FlatList } from 'react-native';
import { colors, font, radius, row } from '../theme';
import { Icon } from './Icon';

/** Labeled dropdown backed by a bottom-sheet picker. RTL-aware. */
export function SelectField({
  label,
  value,
  options,
  placeholder = 'اختر...',
  required,
  error,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  placeholder?: string;
  required?: boolean;
  error?: boolean;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View>
      <Text style={[font('700'), { fontSize: 12, color: colors.navy700, textAlign: 'right', marginBottom: 6 }]}>
        {label}{' '}
        {required ? <Text style={{ color: colors.red }}>*</Text> : <Text style={{ color: colors.muted, fontSize: 10 }}>(اختياري)</Text>}
      </Text>
      <Pressable
        onPress={() => setOpen(true)}
        style={{
          flexDirection: 'row-reverse',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderWidth: 1,
          borderColor: error ? colors.red : colors.line,
          borderRadius: radius.sm,
          paddingVertical: 12,
          paddingHorizontal: 14,
          backgroundColor: '#fff',
        }}
      >
        <Text style={[font(value ? '700' : '400'), { fontSize: 13, color: value ? colors.navy700 : colors.muted }]}>
          {value || placeholder}
        </Text>
        <Icon name="chevron-down" size={16} color={colors.muted} />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(20,40,74,.35)' }} onPress={() => setOpen(false)} />
        <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '65%', paddingTop: 8 }}>
          <View style={{ alignItems: 'center', paddingVertical: 6 }}>
            <View style={{ width: 44, height: 5, borderRadius: 3, backgroundColor: colors.line }} />
          </View>
          <Text style={[font('800'), { fontSize: 15, color: colors.navy700, textAlign: 'center', marginVertical: 8 }]}>{label}</Text>
          <FlatList
            data={options}
            keyExtractor={(item) => item}
            renderItem={({ item }) => {
              const on = item === value;
              return (
                <Pressable
                  onPress={() => {
                    onChange(item);
                    setOpen(false);
                  }}
                  style={[row, { justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 22, borderBottomWidth: 1, borderBottomColor: colors.line2 }]}
                >
                  {on ? <Icon name="check" size={16} color={colors.navy700} /> : <View />}
                  <Text style={[font(on ? '800' : '600'), { fontSize: 14, color: on ? colors.navy700 : colors.ink, textAlign: 'right' }]}>{item}</Text>
                </Pressable>
              );
            }}
          />
        </View>
      </Modal>
    </View>
  );
}
