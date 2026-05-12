import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getAvailable, catchPokemon, Pokemon } from '@/api/collection';
import { Colors } from '@/constants/theme';
import GridBackground from '@/components/GridBackground';
import PixelText from '@/components/PixelText';
import PixelButton from '@/components/PixelButton';

export default function AtraparModal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [pokemon, setPokemon] = useState<Pokemon | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    getAvailable().then(list => {
      setPokemon(list.find(p => p.id === Number(id)) ?? null);
    });
  }, [id]);

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
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!pokemon) {
    return <View style={styles.screen}><ActivityIndicator color={Colors.red} style={{ flex: 1 }} /></View>;
  }

  const numStr = `#${String(pokemon.id).padStart(3, '0')}`;

  return (
    <View style={styles.screen}>
      <GridBackground />
      <View style={styles.header}>
        <PixelText size={11} color={Colors.redGlow} glow="red" onPress={() => router.back()}>◄ VOLVER</PixelText>
        <PixelText size={11} color={Colors.gold} glow="gold">💰 50 PTS</PixelText>
      </View>
      <View style={styles.content}>
        <View style={styles.ring}>
          <View style={styles.innerRing} />
          <Image source={{ uri: pokemon.sprite_url }} style={styles.sprite} resizeMode="contain" />
        </View>
        <PixelText size={11} color={Colors.redGlow} glow="red" style={styles.num}>{numStr}</PixelText>
        <PixelText size={17} color="#ffffff" style={styles.name}>{pokemon.name.toUpperCase()}</PixelText>
        <View style={styles.types}>
          {pokemon.types.map(t => (
            <View key={t} style={styles.badge}>
              <PixelText size={8} color={Colors.redGlow}>{t.toUpperCase()}</PixelText>
            </View>
          ))}
        </View>
        <PixelText size={11} color={Colors.gold} glow="gold" style={styles.cost}>💰 COSTO: 50 MONEDAS</PixelText>
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
    paddingHorizontal: 16, paddingVertical: 12,
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
  btnPrimary: { marginBottom: 8 },
});
