import React from 'react';
import { View, StyleSheet } from 'react-native';
import { HabitStat } from '@/api/profile';
import { Colors, MIN_TOUCH } from '@/constants/theme';
import PixelText from './PixelText';

export default function HabitBar({ stat }: { stat: HabitStat }) {
  const isGood = stat.rate >= 90;
  const barColor = isGood ? Colors.green : Colors.red;
  const pctColor = isGood ? Colors.green : Colors.redGlow;
  const pctGlow = isGood ? 'green' : 'red';

  return (
    <View style={styles.row}>
      <View style={styles.top}>
        <PixelText size={10} color={Colors.textMain}>► {stat.name.toUpperCase()}</PixelText>
        <PixelText size={10} color={pctColor} glow={pctGlow as any}>{stat.rate}%</PixelText>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.min(stat.rate, 100)}%`, backgroundColor: barColor }]} />
      </View>
      <View style={styles.streaks}>
        <PixelText size={9} color="#444444">ACTUAL <PixelText size={9} color={Colors.gold}>{stat.current_streak}D</PixelText></PixelText>
        <PixelText size={9} color="#444444">  MÁX <PixelText size={9} color={Colors.gold}>{stat.max_streak}D</PixelText></PixelText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: '#0a0a0f', borderWidth: 1,
    borderColor: Colors.border, padding: 12,
    marginBottom: 6, minHeight: MIN_TOUCH,
  },
  top: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  track: { height: 8, backgroundColor: '#181828', borderWidth: 1, borderColor: Colors.border, marginBottom: 6, overflow: 'hidden' },
  fill: { height: '100%' },
  streaks: { flexDirection: 'row' },
});
