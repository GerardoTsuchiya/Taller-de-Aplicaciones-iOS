import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { getHabitsWithStreak, completeHabit, HabitWithStreak } from '@/api/habits';
import { getProfile } from '@/api/profile';
import { Colors } from '@/constants/theme';
import GridBackground from '@/components/GridBackground';
import AppHeader from '@/components/AppHeader';
import StreakBox from '@/components/StreakBox';
import HabitRow from '@/components/HabitRow';
import PixelText from '@/components/PixelText';

export default function HabitsScreen() {
  const [habits, setHabits] = useState<HabitWithStreak[]>([]);
  const [coins, setCoins] = useState(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const load = useCallback(async () => {
    try {
      const [habitsData, profile] = await Promise.all([getHabitsWithStreak(), getProfile()]);
      setHabits(habitsData);
      setCoins(profile.coins);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

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
      Alert.alert('Error', e.message);
    }
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
          </>
        }
        renderItem={({ item }) => (
          <HabitRow habit={item} onPress={() => handleComplete(item)} />
        )}
        ListEmptyComponent={
          <PixelText size={9} color={Colors.textDisabled} style={styles.empty}>
            SIN HÁBITOS.{'\n'}CREA UNO DESDE EL BACKEND.
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
  empty: { textAlign: 'center', marginTop: 40, lineHeight: 20 },
});
