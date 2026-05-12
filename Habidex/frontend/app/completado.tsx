import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import GridBackground from '@/components/GridBackground';
import AppHeader from '@/components/AppHeader';
import PixelText from '@/components/PixelText';
import PixelButton from '@/components/PixelButton';
import RewardBox from '@/components/RewardBox';

export default function CompletadoModal() {
  const { habitName, coinsEarned, streak } = useLocalSearchParams<{
    habitName: string; coinsEarned: string; streak: string;
  }>();
  const router = useRouter();

  return (
    <View style={styles.screen}>
      <GridBackground />
      <AppHeader title="★ HABIDEX" />
      <View style={styles.content}>
        <View style={styles.ring}>
          <PixelText size={32} color={Colors.green} glow="green">✓</PixelText>
        </View>
        <PixelText size={15} color={Colors.green} glow="green" style={styles.title}>¡COMPLETADO!</PixelText>
        <PixelText size={9} color="#888888" style={styles.habitName}>► {habitName?.toUpperCase()}</PixelText>
        <View style={styles.rewards}>
          <RewardBox value={`+${coinsEarned}`} label="💰 MONEDAS" variant="gold" />
          <View style={{ width: 10 }} />
          <RewardBox value={`🔥 ${streak}`} label="DÍAS RACHA" variant="red" />
        </View>
        <PixelButton label="► CONTINUAR" onPress={() => router.back()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  content: { flex: 1, padding: 20, alignItems: 'center', justifyContent: 'center' },
  ring: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 2, borderColor: 'rgba(74,222,128,0.5)',
    backgroundColor: 'rgba(74,222,128,0.08)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  title: { marginBottom: 8 },
  habitName: { marginBottom: 24 },
  rewards: { flexDirection: 'row', width: '100%', marginBottom: 24 },
});
