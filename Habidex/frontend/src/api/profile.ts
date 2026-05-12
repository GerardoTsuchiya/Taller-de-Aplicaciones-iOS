import { apiFetch } from './client';

// Respuesta real de GET /profile
export interface Profile {
  id: string;
  username: string;
  coins: number;
  created_at: string;
  habits_count: number;
  pokemon_caught: number;
}

// Respuesta real de GET /profile/analytics
export interface HabitStat {
  id: string;
  name: string;
  completions: number;
  rate: number;
  current_streak: number;
  max_streak: number;
}

export interface Analytics {
  total_habits: number;
  overall_rate: number;
  habits: HabitStat[];
}

export const getProfile = (): Promise<Profile> =>
  apiFetch('/profile');

export const getAnalytics = (): Promise<Analytics> =>
  apiFetch('/profile/analytics');
