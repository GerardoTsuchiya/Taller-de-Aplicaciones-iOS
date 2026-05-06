//Aqui defino las interfaces que el backend usara

interface AuthUser {
    sub: string;   // UUID del usuario en Supabase (campo estándar JWT)
    email: string;
}

interface Habit {
    id: string;
    user_id: string;
    name: string;
    description: string | null;
    reminder_time: string | null;
    reminder_enabled: boolean;
    created_at: string;
}

interface HabitCompletion {
    id: string;
    user_id: string;
    habit_id: string;
    completed_on: string;
}

interface Profile {
    id: string;
    username: string;
    created_at: string;
    coins: number;
}

interface PokemonSummary {
    id: number;
    name: string;
    sprite: string;
    caught: boolean;
}

export { AuthUser, Habit, HabitCompletion, Profile, PokemonSummary };

declare global {
    namespace Express {
        interface Request {
            user?: AuthUser;
        }
    }
}