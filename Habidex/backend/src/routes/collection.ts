import { Router, Request, Response } from 'express';
import { supabase } from '../services/supabase';
import { authenticate } from '../middleware/auth';
import { getAllPokemon } from '../services/pokemonService';

const collectionRouter = Router();

// GET /collection/available
collectionRouter.get('/available', authenticate, async (req: Request, res: Response) => {
  const userId = req.user!.sub;

  const allPokemon = getAllPokemon();

  if (allPokemon.length === 0) {
    res.status(503).json({ error: 'Caché de Pokémon no disponible' });
    return;
  }

  const { data: caught, error } = await supabase
    .from('pokemon_collection')
    .select('pokemon_id')
    .eq('user_id', userId);

  if (error) {
    res.status(500).json({ error: 'Error al obtener colección' });
    return;
  }

  const caughtIds = new Set((caught ?? []).map((c: { pokemon_id: number }) => c.pokemon_id));

  const result = allPokemon.map(p => ({
    ...p,
    caught: caughtIds.has(p.id),
  }));

  res.json(result);
});

// POST /collection/catch
collectionRouter.post('/catch', authenticate, async (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const { pokemon_id } = req.body;

  if (!pokemon_id || typeof pokemon_id !== 'number' || pokemon_id < 1 || pokemon_id > 151) {
    res.status(400).json({ error: 'Pokémon inválido. Debe ser un número entre 1 y 151' });
    return;
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('coins')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    res.status(500).json({ error: 'Error al verificar perfil' });
    return;
  }

  if (profile.coins < 50) {
    res.status(400).json({ error: 'Monedas insuficientes. Necesitas al menos 50 monedas' });
    return;
  }

  const { data: existing } = await supabase
    .from('pokemon_collection')
    .select('id')
    .eq('user_id', userId)
    .eq('pokemon_id', pokemon_id)
    .single();

  if (existing) {
    res.status(409).json({ error: 'Este Pokémon ya fue capturado' });
    return;
  }

  const { error: catchError } = await supabase
    .from('pokemon_collection')
    .insert({ user_id: userId, pokemon_id });

  if (catchError) {
    const status = catchError.code === '23505' ? 409 : 500;
    const message = status === 409 ? 'Este Pokémon ya fue capturado' : 'Error al capturar Pokémon';
    res.status(status).json({ error: message });
    return;
  }

  const newCoins = profile.coins - 50;

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ coins: newCoins })
    .eq('id', userId);

  if (updateError) {
    res.status(500).json({ error: 'Error al actualizar monedas' });
    return;
  }

  res.json({ pokemon_id, coins_remaining: newCoins });
});

export default collectionRouter;
