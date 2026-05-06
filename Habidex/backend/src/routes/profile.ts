import { Router, Request, Response } from 'express';
import { supabase } from '../services/supabase';
import { authenticate } from '../middleware/auth';
import { calculateStreak, calculateMaxStreak } from '../services/streakService';

const profileRouter = Router();

// GET /profile
profileRouter.get('/', authenticate, async (req: Request, res: Response) => {
  const userId = req.user!.sub;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    const status = error.code === 'PGRST116' ? 404 : 500;
    const message = status === 404 ? 'Perfil no encontrado' : 'Error al obtener perfil';
    res.status(status).json({ error: message });
    return;
  }

  const [{ count: habitsCount }, { count: pokemonCount }] = await Promise.all([
    supabase
      .from('habits')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabase
      .from('pokemon_collection')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId),
  ]);

  res.json({
    ...profile,
    habits_count: habitsCount ?? 0,
    pokemon_caught: pokemonCount ?? 0,
  });
});

// GET /analytics
profileRouter.get('/analytics', authenticate, async (req: Request, res: Response) => {
  const userId = req.user!.sub;

  const { data: habits, error: habitsError } = await supabase
    .from('habits')
    .select('id, name, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (habitsError) {
    res.status(500).json({ error: 'Error al obtener analíticas' });
    return;
  }

  if (!habits || habits.length === 0) {
    res.json({ total_habits: 0, overall_rate: 0, habits: [] });
    return;
  }

  const { data: allCompletions } = await supabase
    .from('habit_completions')
    .select('habit_id, completed_on')
    .eq('user_id', userId);

  const completionsByHabit = new Map<string, string[]>();
  for (const c of allCompletions ?? []) {
    const list = completionsByHabit.get(c.habit_id) ?? [];
    list.push(c.completed_on);
    completionsByHabit.set(c.habit_id, list);
  }

  const habitStats = habits.map((habit: { id: string; name: string; created_at: string }) => {
    const dates = completionsByHabit.get(habit.id) ?? [];
    const daysSinceCreation = Math.max(
      1,
      Math.floor((Date.now() - new Date(habit.created_at).getTime()) / 86400000) + 1
    );
    const rate = Math.min(100, Math.round((dates.length / daysSinceCreation) * 100));

    return {
      id: habit.id,
      name: habit.name,
      completions: dates.length,
      rate,
      current_streak: calculateStreak(dates),
      max_streak: calculateMaxStreak(dates),
    };
  });

  const overallRate = Math.round(
    habitStats.reduce((sum: number, h: { rate: number }) => sum + h.rate, 0) / habitStats.length
  );

  res.json({
    total_habits: habits.length,
    overall_rate: overallRate,
    habits: habitStats,
  });
});

export default profileRouter;
