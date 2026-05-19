import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, MIN_TOUCH } from '@/constants/theme';
import { HabitWithStreak } from '@/api/habits';
import PixelText from './PixelText';
import WeekDots from './WeekDots';

interface Props {
  habit: HabitWithStreak;
  onPress: () => void;
  onComplete: () => void;
  onDelete: () => void;
}

export default function HabitRow({ habit, onPress, onComplete, onDelete }: Props) {
  const textColor = habit.completedToday ? Colors.green : Colors.textDisabled;
  const textGlow = habit.completedToday ? 'green' : 'none';

  return (
    <View style={[styles.row, habit.completedToday && styles.rowDone]}>
      <View style={styles.top}>
        <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.titleButton}>
          <PixelText size={9} color={textColor} glow={textGlow as any}>► {habit.name.toUpperCase()}</PixelText>
        </TouchableOpacity>
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={onComplete}
            disabled={habit.completedToday}
            activeOpacity={0.7}
            style={[styles.iconButton, habit.completedToday && styles.completeDone]}
          >
            <PixelText size={9} color={habit.completedToday ? Colors.green : Colors.redGlow} glow={habit.completedToday ? 'green' : 'red'}>
              ✓
            </PixelText>
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete} activeOpacity={0.7} style={[styles.iconButton, styles.deleteButton]}>
            <PixelText size={9} color={Colors.redGlow} glow="red">×</PixelText>
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <WeekDots streak={habit.streak} done={habit.completedToday} />
      </TouchableOpacity>
    </View>
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
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  titleButton: { flex: 1, minHeight: 24, justifyContent: 'center', paddingRight: 8 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1e1e30',
    backgroundColor: '#06060d',
  },
  completeDone: {
    borderColor: '#1a3a1a',
    backgroundColor: 'rgba(74,222,128,0.08)',
  },
  deleteButton: {
    borderColor: '#3a0a0a',
  },
});
