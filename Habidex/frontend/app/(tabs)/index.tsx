import React, { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { getHabitsWithStreak, completeHabit, deleteHabit, HabitWithStreak } from '@/api/habits';
import { getProfile } from '@/api/profile';
import { isUnauthorizedError } from '@/api/client';
import { cancelHabitReminder } from '@/services/reminders';
import { useCoinsStore } from '@/store/coinsStore';
import { Colors } from '@/constants/theme';
import GridBackground from '@/components/GridBackground';
import AppHeader from '@/components/AppHeader';
import StreakBox from '@/components/StreakBox';
import HabitRow from '@/components/HabitRow';
import PixelText from '@/components/PixelText';
import PixelButton from '@/components/PixelButton';

export default function HabitsScreen() {
  const [habits, setHabits] = useState<HabitWithStreak[]>([]);
  const [loading, setLoading] = useState(true);
  const { coins, setCoins } = useCoinsStore();
  const router = useRouter();

  const load = useCallback(async () => {
    try {
      const [habitsData, profile] = await Promise.all([getHabitsWithStreak(), getProfile()]);
      setHabits(habitsData);
      setCoins(profile.coins);
    } catch (e: any) {
      if (isUnauthorizedError(e)) return;
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }, [setCoins]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleComplete = async (habit: HabitWithStreak) => {
    if (habit.completedToday) return;
    try {
      const result = await completeHabit(habit.id);
      setCoins(result.total_coins);
      router.push({
        pathname: '/completado',
        params: {
          habitName: habit.name,
          coinsEarned: result.coins_earned,
          streak: result.streak,
        },
      });
      load();
    } catch (e: any) {
      if (isUnauthorizedError(e)) return;
      Alert.alert('Error', e.message);
    }
  };

  const handleEdit = (habit: HabitWithStreak) => {
    router.push({
      pathname: '/habito',
      params: {
        id: habit.id,
        name: habit.name,
        description: habit.description ?? '',
        reminder_enabled: habit.reminder_enabled ? '1' : '0',
        reminder_time: habit.reminder_time ?? '',
      },
    });
  };

  const handleDelete = (habit: HabitWithStreak) => {
    Alert.alert(
      'Eliminar hábito',
      `¿Eliminar "${habit.name}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteHabit(habit.id);
              await cancelHabitReminder(habit.id);
              await load();
            } catch (e: any) {
              if (isUnauthorizedError(e)) return;
              Alert.alert('Error', e.message);
            }
          },
        },
      ]
    );
  };

  const today = new Date();
  const dayNames = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
  const monthNames = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
  const dateStr = `${dayNames[today.getDay()]}   ${today.getDate()}   ${monthNames[today.getMonth()]}   ${today.getFullYear()}`;
  const maxStreak = habits.length > 0 ? Math.max(...habits.map(h => h.streak)) : 0;

  if (loading) {
    return (
      <View style={styles.screen}>
        <ActivityIndicator color={Colors.red} style={{ flex: 1 }} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <GridBackground />
      <AppHeader title="★ HABIDEX" coins={coins} />
      <FlatList
        data={habits}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            <PixelText size={10} color={Colors.textMain} style={styles.date}>{dateStr}</PixelText>
            <StreakBox streak={maxStreak} />
            <PixelButton
              label="► NUEVO HÁBITO"
              onPress={() => router.push('/habito')}
              style={styles.addButton}
            />
          </>
        }
        renderItem={({ item }) => (
          <HabitRow
            habit={item}
            onPress={() => handleEdit(item)}
            onComplete={() => handleComplete(item)}
            onDelete={() => handleDelete(item)}
          />
        )}
        ListEmptyComponent={
          <PixelText size={9} color={Colors.textDisabled} style={styles.empty}>
            SIN HÁBITOS.{'\n'}TOCA NUEVO HÁBITO.
          </PixelText>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  list: { padding: 14 },
  date: { marginBottom: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#151525', letterSpacing: 2 },
  addButton: { marginBottom: 10 },
  empty: { textAlign: 'center', marginTop: 40, lineHeight: 20 },
});
