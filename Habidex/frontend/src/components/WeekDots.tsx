import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';

interface Props {
  streak: number;
  done: boolean;
}

export default function WeekDots({ streak, done }: Props) {
  const filled = Math.min(streak, 7);
  const dotColor = done ? Colors.green : Colors.red;
  const glowColor = done ? 'rgba(74,222,128,0.7)' : 'rgba(204,0,0,0.7)';
  return (
    <View style={styles.row}>
      {Array.from({ length: 7 }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i < filled
              ? { backgroundColor: dotColor, shadowColor: glowColor, shadowRadius: 4, shadowOpacity: 1, shadowOffset: { width: 0, height: 0 } }
              : { backgroundColor: '#3a3a55', borderWidth: 1, borderColor: '#585874' },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 4 },
  dot: { width: 8, height: 8 },
});
