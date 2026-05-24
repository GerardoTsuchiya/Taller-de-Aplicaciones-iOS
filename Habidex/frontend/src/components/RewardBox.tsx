import React from 'react';
import { View, StyleSheet } from 'react-native';
import PixelText from './PixelText';
import { Colors } from '@/constants/theme';

interface Props {
  value: string;
  label: string;
  variant: 'gold' | 'red';
}

export default function RewardBox({ value, label, variant }: Props) {
  const borderColor = variant === 'gold' ? '#806000' : Colors.red;
  const valueColor = variant === 'gold' ? Colors.gold : Colors.redGlow;
  const glowColor = variant === 'gold' ? 'gold' : 'red';
  return (
    <View style={[styles.box, { borderColor, borderRightColor: variant === 'gold' ? '#403000' : '#600000', borderBottomColor: variant === 'gold' ? '#403000' : '#600000' }]}>
      <PixelText size={19} color={valueColor} glow={glowColor as any} style={styles.value}>{value}</PixelText>
      <PixelText size={9} color={variant === 'gold' ? '#806000' : '#600000'}>{label}</PixelText>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flex: 1,
    backgroundColor: '#0e0e00',
    borderWidth: 1,
    padding: 10,
    alignItems: 'center',
  },
  value: { marginBottom: 4 },
});
