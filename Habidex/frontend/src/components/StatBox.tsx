import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, MIN_TOUCH } from '@/constants/theme';
import PixelText from './PixelText';

type GlowColor = 'red' | 'gold' | 'green';

interface Props {
  value: string | number;
  label: string;
  glowColor: GlowColor;
}

export default function StatBox({ value, label, glowColor }: Props) {
  const colorMap: Record<GlowColor, string> = {
    gold: Colors.gold, red: Colors.redGlow, green: Colors.green,
  };
  return (
    <View style={styles.box}>
      <PixelText size={19} color={colorMap[glowColor]} glow={glowColor} style={styles.value}>
        {String(value)}
      </PixelText>
      <PixelText size={9} color="#555555">{label}</PixelText>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flex: 1, backgroundColor: '#0a0a0f',
    borderWidth: 1, borderColor: Colors.border,
    padding: 12, minHeight: MIN_TOUCH,
    justifyContent: 'center',
  },
  value: { marginBottom: 4 },
});
