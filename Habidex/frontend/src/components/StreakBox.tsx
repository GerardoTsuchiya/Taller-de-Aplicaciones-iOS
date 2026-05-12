import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';
import PixelText from './PixelText';

export default function StreakBox({ streak }: { streak: number }) {
  return (
    <View style={styles.box}>
      <PixelText size={9} color={Colors.redGlow} glow="red">🔥 RACHA</PixelText>
      <PixelText size={9} color={Colors.gold} glow="gold">{streak} DÍAS</PixelText>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: '#0e0000',
    borderWidth: 1,
    borderColor: Colors.red,
    borderRightColor: '#600000',
    borderBottomColor: '#600000',
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
});
