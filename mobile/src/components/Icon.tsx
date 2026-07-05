import React from 'react';
import { Feather } from '@expo/vector-icons';
import { colors } from '../theme';

export type IconName = keyof typeof Feather.glyphMap;

interface Props {
  name: IconName;
  size?: number;
  color?: string;
}

/** Outline icon set (Feather) — matches the ~1.75px stroke spec from the design system. */
export function Icon({ name, size = 20, color = colors.navy700 }: Props) {
  return <Feather name={name} size={size} color={color} />;
}
