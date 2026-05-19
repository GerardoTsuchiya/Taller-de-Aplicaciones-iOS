import React, { useCallback, useState } from 'react';
import { View, FlatList, StyleSheet, Alert, Dimensions } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { getAvailable, Pokemon } from '@/api/collection';
import { getProfile } from '@/api/profile';
import { isUnauthorizedError } from '@/api/client';
import { useCoinsStore } from '@/store/coinsStore';
import { Colors } from '@/constants/theme';
import GridBackground from '@/components/GridBackground';
import AppHeader from '@/components/AppHeader';
import PokemonCell from '@/components/PokemonCell';
import PixelText from '@/components/PixelText';

const NUM_COLS = 3;
const CELL_GAP = 4;
const PADDING = 12;
const cellWidth = (Dimensions.get('window').width - PADDING * 2 - CELL_GAP * (NUM_COLS - 1)) / NUM_COLS;

export default function PokedexScreen() {
  const [pokemon, setPokemon] = useState<Pokemon[]>([]);
  const { coins, setCoins } = useCoinsStore();
  const router = useRouter();

  const load = useCallback(async () => {
    try {
      const [pokes, profile] = await Promise.all([getAvailable(), getProfile()]);
      setPokemon(pokes);
      setCoins(profile.coins);
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

  const caught = pokemon.filter(p => p.caught).length;

  return (
    <View style={styles.screen}>
      <GridBackground />
      <AppHeader title="★ POKÉDEX" coins={coins} />
      <FlatList
        data={pokemon}
        keyExtractor={item => String(item.id)}
        numColumns={NUM_COLS}
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.row}
        ListHeaderComponent={
          <View style={styles.header}>
            <PixelText size={13} color="#ffffff" glow="red">GEN I</PixelText>
            <PixelText size={9} color={Colors.green} glow="green">✓ {caught}/151</PixelText>
          </View>
        }
        renderItem={({ item }) => (
          <View style={{ width: cellWidth }}>
            <PokemonCell
              pokemon={item}
              onPress={() => !item.caught && router.push({ pathname: '/atrapar/[id]', params: { id: item.id, coins } })}
            />
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: CELL_GAP }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  list: { padding: PADDING },
  row: { gap: CELL_GAP, marginBottom: CELL_GAP },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
});
