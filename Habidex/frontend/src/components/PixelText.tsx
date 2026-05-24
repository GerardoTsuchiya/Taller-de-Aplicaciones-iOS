import React from 'react';
import { Text, TextStyle, StyleSheet } from 'react-native';
import { Colors, Fonts, Glow } from '@/constants/theme';

type GlowColor = 'red' | 'gold' | 'green' | 'none';

interface Props {
  children: React.ReactNode;
  size?: number;
  color?: string;
  glow?: GlowColor;
  style?: TextStyle;
  onPress?: () => void;
}

export default function PixelText({ children, size = 12, color = Colors.textMain, glow = 'none', style, onPress }: Props) {
  const glowStyle = glow !== 'none' ? Glow[glow] : {};
  return (
    <Text onPress={onPress} style={[styles.base, { fontSize: size, color }, glowStyle, style]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: Fonts.pixel,
    letterSpacing: 1,
  },
});
