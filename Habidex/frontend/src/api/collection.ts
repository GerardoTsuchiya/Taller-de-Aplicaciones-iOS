import { apiFetch } from './client';

export interface Pokemon {
  id: number;
  name: string;
  caught: boolean;
  sprite_url: string;
  types: string[];
}

interface PokemonResponse {
  id: number;
  name: string;
  caught: boolean;
  sprite?: string;
  sprite_url?: string;
  types?: string[];
}

const normalizePokemon = (pokemon: PokemonResponse): Pokemon => ({
  id: pokemon.id,
  name: pokemon.name,
  caught: pokemon.caught,
  sprite_url: pokemon.sprite_url ?? pokemon.sprite ?? '',
  types: pokemon.types ?? [],
});

export const getAvailable = async (): Promise<Pokemon[]> => {
  const pokemon: PokemonResponse[] = await apiFetch('/collection/available');
  return pokemon.map(normalizePokemon);
};

export const catchPokemon = async (pokemon_id: number): Promise<{ pokemon_id: number; remaining_coins: number }> => {
  const data: { pokemon_id: number; remaining_coins?: number; coins_remaining?: number } = await apiFetch('/collection/catch', {
    method: 'POST',
    body: JSON.stringify({ pokemon_id }),
  });

  return {
    pokemon_id: data.pokemon_id,
    remaining_coins: data.remaining_coins ?? data.coins_remaining ?? 0,
  };
};
