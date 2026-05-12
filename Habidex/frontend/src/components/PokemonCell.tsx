import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, MIN_TOUCH } from '@/constants/theme';
import { Pokemon } from '@/api/collection';
import PixelText from './PixelText';

interface Props {
  pokemon: Pokemon;
  onPress: () => void;
}

export default function PokemonCell({ pokemon, onPress }: Props) {
  const numStr = `#${String(pokemon.id).padStart(3, '0')}`;
  return (
    <TouchableOpacity onPress={onPress} style={[styles.cell, pokemon.caught && styles.caught]} activeOpacity={0.7}>
      <Image
        source={{ uri: pokemon.sprite_url }}
        style={[styles.sprite, !pokemon.caught && styles.locked]}
        resizeMode="contain"
      />
      <PixelText size={7} color={pokemon.caught ? Colors.green : '#333333'} glow={pokemon.caught ? 'green' : 'none'}>
        {numStr}
      </PixelText>
      <PixelText size={7} color={pokemon.caught ? Colors.green : '#444444'}>
        {pokemon.caught ? pokemon.name.toUpperCase() : '???'}
      </PixelText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cell: {
    backgroundColor: '#0d0d18',
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 6,
    alignItems: 'center',
    minHeight: MIN_TOUCH,
  },
  caught: { borderColor: '#1a3a1a' },
  sprite: { width: 48, height: 48 },
  locked: { tintColor: '#111111', opacity: 0.15 },
});
