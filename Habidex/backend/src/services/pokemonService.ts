import { PokemonSummary } from '../types';

let cache: PokemonSummary[] = [];

export async function initPokemonCache(): Promise<void> {
  const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=151');

  if (!response.ok) {
    throw new Error(`Error al cargar Pokémon: ${response.status}`);
  }

  const data = await response.json() as { results: Array<{ name: string }> };

  cache = data.results.map((pokemon, index) => ({
    id: index + 1,
    name: pokemon.name,
    sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${index + 1}.png`,
    caught: false,
  }));
}

export function getAllPokemon(): PokemonSummary[] {
  return cache;
}

export function getPokemonById(id: number): PokemonSummary | undefined {
  return cache.find(p => p.id === id);
}
