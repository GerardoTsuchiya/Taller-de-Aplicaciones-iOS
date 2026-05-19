import { apiFetch } from './client';

export interface Habit {
  id: string;
  name: string;
  description?: string | null;
  reminder_enabled: boolean;
  reminder_time?: string | null;
}

export interface HabitWithStreak extends Habit {
  streak: number;
  completedToday: boolean;
}

export interface CompletionResult {
  coins_earned: number;
  streak: number;
  total_coins: number;
}

export const getHabits = (): Promise<Habit[]> =>
  apiFetch('/habits');

// Enriquece cada hábito con streak y completedToday consultando su historial
export const getHabitsWithStreak = async (): Promise<HabitWithStreak[]> => {
  const habits: Habit[] = await apiFetch('/habits');
  const today = new Date().toISOString().slice(0, 10);
  return Promise.all(
    habits.map(async (habit) => {
      const data = await apiFetch(`/habits/${habit.id}/completions`);
      return {
        ...habit,
        streak: data.current_streak as number,
        completedToday: (data.completions as string[]).includes(today),
      };
    })
  );
};

export const createHabit = (body: { name: string; description?: string | null; reminder_enabled: boolean; reminder_time?: string | null }): Promise<Habit> =>
  apiFetch('/habits', { method: 'POST', body: JSON.stringify(body) });

export const updateHabit = (id: string, body: Partial<Habit>): Promise<Habit> =>
  apiFetch(`/habits/${id}`, { method: 'PUT', body: JSON.stringify(body) });

export const deleteHabit = (id: string): Promise<void> =>
  apiFetch(`/habits/${id}`, { method: 'DELETE' });

export const completeHabit = (id: string): Promise<CompletionResult> =>
  apiFetch(`/habits/${id}/complete`, { method: 'POST' });
