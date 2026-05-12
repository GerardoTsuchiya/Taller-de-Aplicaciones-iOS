import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, MIN_TOUCH } from '@/constants/theme';
import { HabitWithStreak } from '@/api/habits';
import PixelText from './PixelText';
import WeekDots from './WeekDots';

interface Props {
  habit: HabitWithStreak;
  onPress: () => void;
}

export default function HabitRow({ habit, onPress }: Props) {
  const textColor = habit.completedToday ? Colors.green : Colors.textDisabled;
  const textGlow = habit.completedToday ? 'green' : 'none';

  return (
    <TouchableOpacity onPress={onPress} style={[styles.row, habit.completedToday && styles.rowDone]} activeOpacity={0.7}>
      <View style={styles.top}>
        <PixelText size={9} color={textColor} glow={textGlow as any}>► {habit.name.toUpperCase()}</PixelText>
        {habit.completedToday && <PixelText size={11} color={Colors.green} glow="green">✓</PixelText>}
      </View>
      <WeekDots streak={habit.streak} done={habit.completedToday} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: '#0a0a0f',
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 6,
    minHeight: MIN_TOUCH,
    justifyContent: 'center',
  },
  rowDone: { borderColor: '#1a3a1a' },
  top: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
});
