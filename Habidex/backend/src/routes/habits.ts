import { Router, Request, Response } from 'express';
import { supabase } from '../services/supabase';
import { authenticate } from '../middleware/auth';
import { calculateStreak, calculateMaxStreak, calculateCoins } from '../services/streakService';

const habitsRouter = Router();

// GET /habits - lista todos los hábitos del usuario autenticado
habitsRouter.get('/', authenticate, async (req: Request, res: Response) => {
  const userId = req.user!.sub;

  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    res.status(500).json({ error: 'Error al obtener hábitos' });
    return;
  }

  res.json(data);
});

// POST /habits - crea un hábito
habitsRouter.post('/', authenticate, async (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const { name, description, reminder_time, reminder_enabled } = req.body;

  if (!name?.trim()) {
    res.status(400).json({ error: 'El nombre del hábito es requerido' });
    return;
  }

  const { data, error } = await supabase
    .from('habits')
    .insert({
      user_id: userId,
      name: name.trim(),
      description: description ?? null,
      reminder_time: reminder_time ?? null,
      reminder_enabled: reminder_enabled ?? false,
    })
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: 'Error al crear hábito' });
    return;
  }

  res.status(201).json(data);
});

// PUT /habits/:id - edita un hábito
habitsRouter.put('/:id', authenticate, async (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const { id } = req.params;
  const { name, description, reminder_time, reminder_enabled } = req.body;

  if (name !== undefined && !name?.trim()) {
    res.status(400).json({ error: 'El nombre del hábito no puede estar vacío' });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name.trim();
  if (description !== undefined) updates.description = description;
  if (reminder_time !== undefined) updates.reminder_time = reminder_time;
  if (reminder_enabled !== undefined) updates.reminder_enabled = reminder_enabled;

  const { data, error } = await supabase
    .from('habits')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error || !data) {
    res.status(404).json({ error: 'Hábito no encontrado' });
    return;
  }

  res.json(data);
});

// DELETE /habits/:id - elimina un hábito
habitsRouter.delete('/:id', authenticate, async (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const { id } = req.params;

  const { error } = await supabase
    .from('habits')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    res.status(500).json({ error: 'Error al eliminar hábito' });
    return;
  }

  res.status(204).send();
});

// POST /habits/:id/complete - marca un hábito como completado hoy
habitsRouter.post('/:id/complete', authenticate, async (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const { id } = req.params;
  const today = new Date().toISOString().slice(0, 10);

  // Verifica que el hábito pertenece al usuario
  const { data: habit, error: habitError } = await supabase
    .from('habits')
    .select('id')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (habitError || !habit) {
    res.status(404).json({ error: 'Hábito no encontrado' });
    return;
  }

  // Verifica que no fue completado hoy
  const { data: existing } = await supabase
    .from('habit_completions')
    .select('id')
    .eq('habit_id', id)
    .eq('completed_on', today)
    .single();

  if (existing) {
    res.status(409).json({ error: 'El hábito ya fue completado hoy' });
    return;
  }

  // Obtiene historial de completaciones
  const { data: history } = await supabase
    .from('habit_completions')
    .select('completed_on')
    .eq('habit_id', id);

  const completedDates = (history ?? []).map((c: { completed_on: string }) => c.completed_on);
  completedDates.push(today);

  // Calcula streak y coins
  const streak = calculateStreak(completedDates);
  const { base, bonus, total: coinsEarned } = calculateCoins(streak);

  // Inserta en habit_completions
  const { error: insertError } = await supabase
    .from('habit_completions')
    .insert({ habit_id: id, user_id: userId, completed_on: today });

  if (insertError) {
    res.status(500).json({ error: 'Error al registrar completación' });
    return;
  }

  // Actualiza coins en profiles
  const { data: profile } = await supabase
    .from('profiles')
    .select('coins')
    .eq('id', userId)
    .single();

  const newCoins = (profile?.coins ?? 0) + coinsEarned;

  await supabase
    .from('profiles')
    .update({ coins: newCoins })
    .eq('id', userId);

  res.json({
    streak,
    coins_earned: coinsEarned,
    coins_breakdown: { base, bonus },
    total_coins: newCoins,
  });
});

// GET /habits/:id/completions - retorna historial de completaciones
habitsRouter.get('/:id/completions', authenticate, async (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const { id } = req.params;

  // Verifica propiedad del hábito
  const { data: habit } = await supabase
    .from('habits')
    .select('id')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (!habit) {
    res.status(404).json({ error: 'Hábito no encontrado' });
    return;
  }

  // Obtiene completaciones
  const { data: completions, error } = await supabase
    .from('habit_completions')
    .select('completed_on')
    .eq('habit_id', id)
    .eq('user_id', userId)
    .order('completed_on', { ascending: false });

  if (error) {
    res.status(500).json({ error: 'Error al obtener historial' });
    return;
  }

  const dates = (completions ?? []).map((c: { completed_on: string }) => c.completed_on);

  res.json({
    completions: dates,
    current_streak: calculateStreak(dates),
    max_streak: calculateMaxStreak(dates),
  });
});

export default habitsRouter;
