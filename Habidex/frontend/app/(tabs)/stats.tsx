import React, { useCallback, useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { getAnalytics, getProfile, Analytics } from '@/api/profile';
import { isUnauthorizedError } from '@/api/client';
import { getHabits, getHabitCompletions, Habit } from '@/api/habits';
import { useCoinsStore } from '@/store/coinsStore';
import { Colors } from '@/constants/theme';
import GridBackground from '@/components/GridBackground';
import AppHeader from '@/components/AppHeader';
import PixelText from '@/components/PixelText';
import DonutChart from '@/components/DonutChart';
import HabitBar from '@/components/HabitBar';
import MonthCalendar from '@/components/Calendar';

const monthName = (year: number, month: number) => {
  const date = new Date(Date.UTC(year, month - 1, 1));
  return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric', timeZone: 'UTC' }).toUpperCase();
};

const getMonthKey = (year: number, month: number) => `${year}-${String(month).padStart(2, '0')}`;
const todayIso = new Date().toISOString().slice(0, 10);

export default function StatsScreen() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [doneDates, setDoneDates] = useState<string[]>([]);
  const [displayYear, setDisplayYear] = useState(() => new Date().getFullYear());
  const [displayMonth, setDisplayMonth] = useState(() => new Date().getMonth() + 1);
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const { coins, setCoins } = useCoinsStore();

  const load = useCallback(async () => {
    try {
      const [analyticsData, profile] = await Promise.all([getAnalytics(), getProfile()]);
      setAnalytics(analyticsData);
      setCoins(profile.coins);
    } catch (e: any) {
      if (isUnauthorizedError(e)) {
        Alert.alert('Sesión expirada', 'Inicia sesión nuevamente para ver Analytics', [
          { text: 'OK', onPress: () => router.replace('/(auth)/login') },
        ]);
        return;
      }
      Alert.alert('Error', e.message);
    }
  }, [router, setCoins]);

  const loadCalendar = useCallback(async () => {
    setDoneDates([]);
    setLoadingCalendar(true);
    try {
      const habitList = await getHabits();
      setHabits(habitList);

      if (habitList.length === 0) {
        setDoneDates([]);
        return;
      }

      const completionsByHabit = await Promise.all(
        habitList.map(async (habit) => {
          const data = await getHabitCompletions(habit.id);
          return new Set((data.completions ?? []).map((date) => date.slice(0, 10)));
        })
      );

      const countsByDate = new Map<string, number>();
      completionsByHabit.forEach((dates) => {
        dates.forEach((date) => {
          countsByDate.set(date, (countsByDate.get(date) ?? 0) + 1);
        });
      });

      const allDone = [...countsByDate.entries()]
        .filter(([, count]) => count === habitList.length)
        .map(([date]) => date)
        .sort();

      setDoneDates(allDone);
    } catch (e: any) {
      if (isUnauthorizedError(e)) {
        Alert.alert('Sesión expirada', 'Inicia sesión nuevamente para ver Analytics', [
          { text: 'OK', onPress: () => router.replace('/(auth)/login') },
        ]);
        return;
      }
      setDoneDates([]);
      Alert.alert('Error', e.message ?? 'No se pudo cargar el calendario');
    } finally {
      setLoadingCalendar(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      load();
      loadCalendar();
    }, [load, loadCalendar])
  );

  const overall = analytics?.overall_rate ?? 0;
  const totalHabits = analytics?.total_habits ?? 0;
  const maxStreak = analytics?.habits.reduce((m, h) => Math.max(m, h.current_streak), 0) ?? 0;

  const completionsSet = useMemo(() => {
    const monthKey = getMonthKey(displayYear, displayMonth);
    return new Set(doneDates.filter((date) => date.startsWith(monthKey)));
  }, [doneDates, displayMonth, displayYear]);

  const moveMonth = (delta: number) => {
    const next = new Date(Date.UTC(displayYear, displayMonth - 1 + delta, 1));
    setDisplayYear(next.getUTCFullYear());
    setDisplayMonth(next.getUTCMonth() + 1);
  };

  return (
    <View style={styles.screen}>
      <GridBackground />
      <AppHeader title="★ ANALYTICS" coins={coins} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <PixelText size={10} color={Colors.textSecondary} style={styles.secLabel}>▸ CALENDARIO GENERAL</PixelText>

        <View style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <PixelText size={10} color={Colors.textSecondary}>
              {monthName(displayYear, displayMonth)}
            </PixelText>
            <PixelText size={9} color={Colors.textDisabled}>
              {doneDates.length} DÍAS COMPLETOS
            </PixelText>
          </View>

          <MonthCalendar
            year={displayYear}
            month={displayMonth}
            completionsSet={completionsSet}
            todayIso={todayIso}
            onPrev={() => moveMonth(-1)}
            onNext={() => moveMonth(1)}
            onDayPress={(isoDate) => Alert.alert('Día', isoDate)}
          />

          {loadingCalendar ? (
            <ActivityIndicator color={Colors.red} style={{ marginTop: 10 }} />
          ) : doneDates.length === 0 ? (
            <PixelText size={9} color={Colors.textDisabled} style={styles.emptyHistory}>
              NO HAY DÍAS EN LOS QUE COMPLETASTE TODAS LAS ACTIVIDADES.
            </PixelText>
          ) : null}
        </View>

        <PixelText size={9} color={Colors.textSecondary} style={styles.period}>ÚLT. 30 DÍAS</PixelText>

        <View style={styles.comboRow}>
          <DonutChart pct={overall} size={90} />
          <View style={styles.chips}>
            <View style={styles.chip}>
              <PixelText size={18} color={Colors.gold} glow="gold">{totalHabits}</PixelText>
              <PixelText size={8} color="#444444">HÁBITOS TOTAL</PixelText>
            </View>
            <View style={[styles.chip, { marginTop: 6 }]}>
              <PixelText size={18} color={Colors.redGlow} glow="red">🔥 {maxStreak}</PixelText>
              <PixelText size={8} color="#444444">RACHA ACTUAL</PixelText>
            </View>
          </View>
        </View>

        <PixelText size={10} color={Colors.textSecondary} style={styles.secLabel}>▸ POR HÁBITO</PixelText>

        {analytics?.habits.map(h => <HabitBar key={h.id} stat={h} />)}

        {analytics?.habits.length === 0 && (
          <PixelText size={10} color={Colors.textDisabled} style={styles.empty}>
            SIN DATOS AÚN.
          </PixelText>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: 14 },
  period: { textAlign: 'right', marginBottom: 8 },
  comboRow: {
    backgroundColor: '#0a0a0f', borderWidth: 1,
    borderColor: Colors.border, padding: 12,
    flexDirection: 'row', alignItems: 'center',
    gap: 12, marginBottom: 12,
  },
  chips: { flex: 1 },
  chip: {
    backgroundColor: '#0d0d18', borderWidth: 1,
    borderColor: '#1a1a2a', padding: 8,
  },
  secLabel: { marginBottom: 10, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: '#151525', letterSpacing: 2 },
  empty: { textAlign: 'center', marginTop: 20 },
  calendarCard: {
    backgroundColor: '#090910',
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 10,
    marginBottom: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  emptyHistory: { marginTop: 10, textAlign: 'center' },
});
