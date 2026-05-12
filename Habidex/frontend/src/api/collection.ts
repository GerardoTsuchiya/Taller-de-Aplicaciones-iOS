import { apiFetch } from './client';

export interface Pokemon {
  id: number;
  name: string;
  caught: boolean;
  sprite_url: string;
  types: string[];
}

export const getAvailable = (): Promise<Pokemon[]> =>
  apiFetch('/collection/available');

export const catchPokemon = (pokemon_id: number): Promise<{ pokemon: Pokemon; remaining_coins: number }> =>
  apiFetch('/collection/catch', { method: 'POST', body: JSON.stringify({ pokemon_id }) });
