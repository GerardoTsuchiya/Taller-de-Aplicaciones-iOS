import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { getAnalytics, Analytics } from '@/api/profile';
import { Colors } from '@/constants/theme';
import GridBackground from '@/components/GridBackground';
import AppHeader from '@/components/AppHeader';
import PixelText from '@/components/PixelText';
import DonutChart from '@/components/DonutChart';
import HabitBar from '@/components/HabitBar';

export default function StatsScreen() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  useEffect(() => {
    getAnalytics()
      .then(setAnalytics)
      .catch(e => Alert.alert('Error', e.message));
  }, []);

  const overall = analytics?.overall_rate ?? 0;
  const totalHabits = analytics?.total_habits ?? 0;
  const maxStreak = analytics?.habits.reduce((m, h) => Math.max(m, h.current_streak), 0) ?? 0;

  return (
    <View style={styles.screen}>
      <GridBackground />
      <AppHeader title="★ ANALYTICS" right={<PixelText size={9} color={Colors.textSecondary}>ÚLT. 30 DÍAS</PixelText>} />
      <ScrollView contentContainerStyle={styles.scroll}>

        <View style={styles.comboRow}>
          <DonutChart pct={overall} size={90} />
          <View style={styles.chips}>
            <View style={styles.chip}>
              <PixelText size={15} color={Colors.gold} glow="gold">{totalHabits}</PixelText>
              <PixelText size={7} color="#444444">HÁBITOS TOTAL</PixelText>
            </View>
            <View style={[styles.chip, { marginTop: 6 }]}>
              <PixelText size={15} color={Colors.redGlow} glow="red">🔥 {maxStreak}</PixelText>
              <PixelText size={7} color="#444444">RACHA ACTUAL</PixelText>
            </View>
          </View>
        </View>

        <PixelText size={9} color={Colors.textSecondary} style={styles.secLabel}>▸ POR HÁBITO</PixelText>

        {analytics?.habits.map(h => <HabitBar key={h.id} stat={h} />)}

        {analytics?.habits.length === 0 && (
          <PixelText size={9} color={Colors.textDisabled} style={styles.empty}>
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
});
