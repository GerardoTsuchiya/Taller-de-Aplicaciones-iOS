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

  const [habitsResult, pokemonResult] = await Promise.all([
    supabase
      .from('habits')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabase
      .from('pokemon_collection')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId),
  ]);

  if (habitsResult.error || pokemonResult.error) {
    res.status(500).json({ error: 'Error al obtener conteos del perfil' });
    return;
  }

  res.json({
    ...profile,
    habits_count: habitsResult.count ?? 0,
    pokemon_caught: pokemonResult.count ?? 0,
  });
});

// GET /analytics
profileRouter.get('/analytics', authenticate, async (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const today = new Date().toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

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

  const { data: allCompletions, error: completionsError } = await supabase
    .from('habit_completions')
    .select('habit_id, completed_on')
    .eq('user_id', userId);

  if (completionsError) {
    res.status(500).json({ error: 'Error al obtener completaciones' });
    return;
  }

  const completionsByHabit = new Map<string, string[]>();
  for (const c of allCompletions ?? []) {
    const list = completionsByHabit.get(c.habit_id) ?? [];
    list.push(c.completed_on);
    completionsByHabit.set(c.habit_id, list);
  }

  const habitStats = habits.map((habit: { id: string; name: string; created_at: string }) => {
    const dates = completionsByHabit.get(habit.id) ?? [];
    const recentDates = dates.filter((date) => date >= thirtyDaysAgo && date <= today);
    const rate = Math.round((recentDates.length / 30) * 100);

    return {
      id: habit.id,
      name: habit.name,
      completions: recentDates.length,
      rate,
      current_streak: calculateStreak(dates),
      max_streak: calculateMaxStreak(dates),
    };
  });

  const overallRate = habitStats.length > 0
    ? Math.round(habitStats.reduce((sum: number, h: { rate: number }) => sum + h.rate, 0) / habitStats.length)
    : 0;

  res.json({
    total_habits: habits.length,
    overall_rate: overallRate,
    habits: habitStats,
  });
});

export default profileRouter;
