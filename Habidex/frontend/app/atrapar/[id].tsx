import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAvailable, catchPokemon, Pokemon } from '@/api/collection';
import { getProfile } from '@/api/profile';
import { isUnauthorizedError } from '@/api/client';
import { useCoinsStore } from '@/store/coinsStore';
import { Colors } from '@/constants/theme';
import GridBackground from '@/components/GridBackground';
import PixelText from '@/components/PixelText';
import PixelButton from '@/components/PixelButton';

export default function AtraparModal() {
  const { id, coins: coinsParam } = useLocalSearchParams<{ id: string; coins?: string }>();
  const [pokemon, setPokemon] = useState<Pokemon | null>(null);
  const { coins, setCoins } = useCoinsStore();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const initialCoins = Number(coinsParam);
    if (coinsParam !== undefined && !Number.isNaN(initialCoins)) {
      setCoins(initialCoins);
    }

    Promise.all([getAvailable(), getProfile()])
      .then(([list, profile]) => {
        setPokemon(list.find(p => p.id === Number(id)) ?? null);
        setCoins(profile.coins);
      })
      .catch(e => {
        if (isUnauthorizedError(e)) return;
        Alert.alert('Error', e.message);
      });
  }, [id, coinsParam, setCoins]);

  const handleCatch = async () => {
    if (!pokemon) return;
    setLoading(true);
    try {
      const result = await catchPokemon(pokemon.id);
      Alert.alert(
        '¡ATRAPADO!',
        `${pokemon.name.toUpperCase()} fue capturado.\nMonedas restantes: ${result.remaining_coins}`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
      setCoins(result.remaining_coins);
    } catch (e: any) {
      if (isUnauthorizedError(e)) return;
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!pokemon) {
    return <View style={styles.screen}><ActivityIndicator color={Colors.red} style={{ flex: 1 }} /></View>;
  }

  const numStr = `#${String(pokemon.id).padStart(3, '0')}`;
  const types = pokemon.types.length > 0 ? pokemon.types : ['desconocido'];

  return (
    <View style={styles.screen}>
      <GridBackground />
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <PixelText size={11} color={Colors.redGlow} glow="red" onPress={() => router.back()}>◄ VOLVER</PixelText>
        <PixelText size={11} color={Colors.gold} glow="gold">💰 {coins} PTS</PixelText>
      </View>
      <View style={styles.content}>
        <View style={styles.ring}>
          <View style={styles.innerRing} />
          <Image source={{ uri: pokemon.sprite_url }} style={styles.sprite} resizeMode="contain" />
        </View>
        <PixelText size={11} color={Colors.redGlow} glow="red" style={styles.num}>{numStr}</PixelText>
        <PixelText size={17} color="#ffffff" style={styles.name}>{pokemon.name.toUpperCase()}</PixelText>
        <View style={styles.types}>
          {types.map(t => (
            <View key={t} style={styles.badge}>
              <PixelText size={8} color={Colors.redGlow}>{t.toUpperCase()}</PixelText>
            </View>
          ))}
        </View>
        <PixelText size={11} color={Colors.gold} glow="gold" style={styles.cost}>💰 COSTO: 50 MONEDAS</PixelText>
        {coins < 50 && (
          <PixelText size={8} color={Colors.redGlow} glow="red" style={styles.warning}>
            MONEDAS INSUFICIENTES
          </PixelText>
        )}
        <PixelButton label="► ATRAPAR POKÉMON" onPress={handleCatch} disabled={loading} style={styles.btnPrimary} />
        <PixelButton label="CANCELAR" onPress={() => router.back()} variant="outline" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  header: {
    borderBottomWidth: 2, borderBottomColor: Colors.red,
    backgroundColor: Colors.headerBg,
    paddingHorizontal: 16, paddingBottom: 12,
    flexDirection: 'row', justifyContent: 'space-between',
  },
  content: { flex: 1, padding: 20, alignItems: 'center', justifyContent: 'center' },
  ring: {
    width: 120, height: 120, borderRadius: 60,
    borderWidth: 2, borderColor: 'rgba(204,0,0,0.4)',
    backgroundColor: 'rgba(204,0,0,0.05)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  innerRing: {
    position: 'absolute', width: 84, height: 84, borderRadius: 42,
    borderWidth: 1, borderColor: 'rgba(204,0,0,0.18)',
  },
  sprite: { width: 100, height: 100 },
  num: { marginBottom: 4 },
  name: { marginBottom: 8, letterSpacing: 2 },
  types: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  badge: {
    backgroundColor: 'rgba(204,0,0,0.2)', borderWidth: 1,
    borderColor: 'rgba(204,0,0,0.5)', paddingHorizontal: 10, paddingVertical: 4,
  },
  cost: { marginBottom: 16 },
  warning: { marginTop: -8, marginBottom: 12 },
  btnPrimary: { marginBottom: 8 },
});
