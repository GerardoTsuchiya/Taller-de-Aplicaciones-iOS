import React, { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { getProfile, Profile } from '@/api/profile';
import { isUnauthorizedError } from '@/api/client';
import { useAuthStore } from '@/store/authStore';
import { useCoinsStore } from '@/store/coinsStore';
import { useFocusEffect, useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import GridBackground from '@/components/GridBackground';
import AppHeader from '@/components/AppHeader';
import PixelText from '@/components/PixelText';
import PixelButton from '@/components/PixelButton';
import StatBox from '@/components/StatBox';

export default function ProfileScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const { user, logout } = useAuthStore();
  const { coins, setCoins } = useCoinsStore();
  const router = useRouter();

  const load = useCallback(async () => {
    try {
      const profileData = await getProfile();
      setProfile(profileData);
      setCoins(profileData.coins);
    } catch (e: any) {
      if (isUnauthorizedError(e)) return;
      Alert.alert('Error', e.message);
    }
  }, [setCoins]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleLogout = async () => {
    await logout();
    setCoins(0);
    router.replace('/(auth)/login');
  };

  // Usa pokemon_caught del backend (no total_caught)
  const caught = profile?.pokemon_caught ?? 0;
  const pctFill = (caught / 151) * 100;

  return (
    <View style={styles.screen}>
      <GridBackground />
      <AppHeader title="★ HABIDEX" coins={coins} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.avatarRow}>
          <View style={styles.avatar}><PixelText size={28}>🎮</PixelText></View>
          <View>
            <PixelText size={10} color={Colors.textDisabled}>ENTRENADOR</PixelText>
            <PixelText size={18} color="#ffffff" style={{ marginTop: 4 }}>
              {(profile?.username ?? user?.username ?? '---').toUpperCase()}
            </PixelText>
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatBox value={coins} label="💰 MONEDAS" glowColor="gold" />
          <View style={{ width: 6 }} />
          <StatBox value={profile?.habits_count ?? 0} label="📋 HÁBITOS" glowColor="red" />
        </View>
        <View style={[styles.statsRow, { marginTop: 6 }]}>
          <StatBox value={caught} label="✓ ATRAPADOS" glowColor="green" />
          <View style={{ width: 6 }} />
          <StatBox value={`${caught}/151`} label="POKÉDEX" glowColor="gold" />
        </View>

        <PixelText size={10} color={Colors.textSecondary} style={styles.progLabel}>
          POKÉDEX: {caught} / 151
        </PixelText>
        <View style={styles.progTrack}>
          <View style={[styles.progFill, { width: `${pctFill}%` }]} />
        </View>

        <PixelButton label="► CERRAR SESIÓN" onPress={handleLogout} variant="outline" style={styles.logout} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: 14 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    borderWidth: 2, borderColor: Colors.red,
    backgroundColor: 'rgba(204,0,0,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  statsRow: { flexDirection: 'row' },
  progLabel: { marginTop: 14, marginBottom: 6, letterSpacing: 1 },
  progTrack: {
    backgroundColor: '#0d0d18', borderWidth: 1,
    borderColor: Colors.border, height: 10, marginBottom: 16,
  },
  progFill: { height: '100%', backgroundColor: Colors.red },
  logout: { borderColor: '#250000' },
});
