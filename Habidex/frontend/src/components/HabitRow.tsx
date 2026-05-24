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
  const textColor = habit.completedToday ? Colors.green : Colors.textMain;
  const textGlow = habit.completedToday ? 'green' : 'none';

  return (
    <View style={[styles.row, habit.completedToday && styles.rowDone]}>
      <View style={styles.top}>
        <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.titleButton}>
          <PixelText size={11} color={textColor} glow={textGlow as any}>► {habit.name.toUpperCase()}</PixelText>
        </TouchableOpacity>
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={onComplete}
            disabled={habit.completedToday}
            activeOpacity={0.7}
            style={[styles.iconButton, habit.completedToday && styles.completeDone]}
          >
            <PixelText size={10} color={habit.completedToday ? Colors.green : Colors.redGlow} glow={habit.completedToday ? 'green' : 'red'}>
              ✓
            </PixelText>
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete} activeOpacity={0.7} style={[styles.iconButton, styles.deleteButton]}>
            <PixelText size={10} color={Colors.redGlow} glow="red">×</PixelText>
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
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#3a3a58',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
    minHeight: MIN_TOUCH + 16,
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.22,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  rowDone: { borderColor: '#345f46', backgroundColor: '#18241f' },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  titleButton: { flex: 1, minHeight: 30, justifyContent: 'center', paddingRight: 10 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#444463',
    backgroundColor: '#202035',
    borderRadius: 8,
  },
  completeDone: {
    borderColor: '#285a3a',
    backgroundColor: 'rgba(74,222,128,0.08)',
  },
  deleteButton: {
    borderColor: '#5a1b1b',
  },
});
