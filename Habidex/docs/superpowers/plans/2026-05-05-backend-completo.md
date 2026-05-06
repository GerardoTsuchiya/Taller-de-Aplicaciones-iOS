# Backend Completo Habidex — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar todos los endpoints del backend de Habidex necesarios para ejecutar el plan de pruebas CP-01 a CP-07 (excepto CP-05 notificaciones, que es iOS nativo).

**Architecture:** Express + TypeScript + Supabase (service role key). La lógica de negocio crítica (streaks, monedas) vive en servicios con unit tests. Las rutas son thin controllers que delegan a los servicios y a Supabase.

**Tech Stack:** Node.js, Express 5, TypeScript, Supabase JS v2, JWT (jsonwebtoken), Jest + ts-jest

---

## File Map

| Acción | Archivo |
|--------|---------|
| Modificar | `backend/package.json` — corregir script test |
| Modificar | `backend/src/types/index.ts` — agregar `sub` a AuthUser |
| **Crear** | `backend/tests/services/streakService.test.ts` |
| **Crear** | `backend/src/services/streakService.ts` |
| **Crear** | `backend/src/services/pokemonService.ts` |
| **Crear** | `backend/src/routes/habits.ts` |
| **Crear** | `backend/src/routes/collection.ts` |
| **Crear** | `backend/src/routes/profile.ts` |
| Modificar | `backend/src/app.ts` — registrar todas las rutas + errorHandler |
| Modificar | `backend/src/server.ts` — inicializar caché de Pokémon |

---

## Task 1: Corregir script de tests en package.json

**Files:**
- Modify: `backend/package.json`

- [ ] **Step 1: Cambiar el script test**

Abrir `backend/package.json` y reemplazar la línea:

```json
"test": "echo \"Error: no test specified\" && exit 1"
```

por:

```json
"test": "jest"
```

El bloque `scripts` completo queda:

```json
"scripts": {
  "dev": "ts-node-dev --respawn src/server.ts",
  "build": "tsc",
  "start": "node dist/server.js",
  "test": "jest"
}
```

- [ ] **Step 2: Verificar que Jest está configurado**

Confirmar que `package.json` tiene este bloque `jest` (ya existe, solo verificar):

```json
"jest": {
  "preset": "ts-jest",
  "testEnvironment": "node",
  "testMatch": ["**/tests/**/*.test.ts"]
}
```

- [ ] **Step 3: Commit**

```bash
cd backend
git add package.json
git commit -m "fix: habilitar jest como test runner"
```

---

## Task 2: Crear esquema de base de datos en Supabase

**Acción manual:** ir al dashboard de Supabase → SQL Editor → ejecutar el SQL de abajo.

- [ ] **Step 1: Ejecutar SQL en el editor de Supabase**

```sql
-- Tabla de perfiles (extiende auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL DEFAULT '',
  coins INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla de hábitos
CREATE TABLE IF NOT EXISTS public.habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  reminder_time TEXT,
  reminder_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla de completaciones (una por hábito por día)
CREATE TABLE IF NOT EXISTS public.habit_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  completed_on DATE NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE(habit_id, completed_on)
);

-- Tabla de colección de Pokémon capturados
CREATE TABLE IF NOT EXISTS public.pokemon_collection (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pokemon_id INTEGER NOT NULL CHECK (pokemon_id >= 1 AND pokemon_id <= 151),
  caught_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, pokemon_id)
);

-- Función: crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: ejecutar función al insertar nuevo usuario
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

- [ ] **Step 2: Verificar tablas creadas**

En Supabase → Table Editor, confirmar que existen las 4 tablas:
- `profiles`
- `habits`
- `habit_completions`
- `pokemon_collection`

---

## Task 3: Corregir tipo AuthUser para incluir `sub`

El JWT de Supabase usa `sub` (no `id`) para el UUID del usuario. Sin este fix, `req.user.sub` sería `undefined` en todas las rutas.

**Files:**
- Modify: `backend/src/types/index.ts`

- [ ] **Step 1: Agregar `sub` a AuthUser**

Reemplazar la interfaz `AuthUser`:

```typescript
interface AuthUser {
    sub: string;   // UUID del usuario en Supabase (campo estándar JWT)
    email: string;
}
```

El archivo completo queda:

```typescript
interface AuthUser {
    sub: string;
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
```

- [ ] **Step 2: Commit**

```bash
git add src/types/index.ts
git commit -m "fix: usar campo sub del JWT de Supabase en AuthUser"
```

---

## Task 4: streakService con TDD

El servicio de streaks es la lógica de negocio más crítica del backend. Se implementa con TDD: primero los tests, luego la implementación.

**Files:**
- Create: `backend/tests/services/streakService.test.ts`
- Create: `backend/src/services/streakService.ts`

- [ ] **Step 1: Crear directorio de tests**

```bash
mkdir -p tests/services
```

- [ ] **Step 2: Escribir los tests (failing)**

Crear `backend/tests/services/streakService.test.ts`:

```typescript
import { calculateStreak, calculateMaxStreak, calculateCoins } from '../../src/services/streakService';

// Helper: fecha relativa a hoy en formato YYYY-MM-DD
const d = (daysAgo: number): string => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date.toISOString().slice(0, 10);
};

const today = d(0);

describe('calculateStreak', () => {
  it('retorna 0 con arreglo vacío', () => {
    expect(calculateStreak([])).toBe(0);
  });

  it('retorna 1 si solo se completó hoy', () => {
    expect(calculateStreak([today])).toBe(1);
  });

  it('retorna 1 si solo se completó ayer', () => {
    expect(calculateStreak([d(1)])).toBe(1);
  });

  it('retorna 0 si la última completación fue hace 2 o más días', () => {
    expect(calculateStreak([d(2)])).toBe(0);
  });

  it('retorna la racha correcta con días consecutivos incluyendo hoy', () => {
    expect(calculateStreak([today, d(1), d(2)])).toBe(3);
  });

  it('corta la racha al encontrar un hueco', () => {
    // Completado hoy, ayer, y hace 3 días (hueco en hace 2 días)
    expect(calculateStreak([today, d(1), d(3)])).toBe(2);
  });

  it('calcula racha desde ayer cuando hoy no está completado', () => {
    expect(calculateStreak([d(1), d(2), d(3)])).toBe(3);
  });

  it('maneja fechas duplicadas sin contar doble', () => {
    expect(calculateStreak([today, today, d(1)])).toBe(2);
  });
});

describe('calculateMaxStreak', () => {
  it('retorna 0 con arreglo vacío', () => {
    expect(calculateMaxStreak([])).toBe(0);
  });

  it('retorna 1 con una sola completación', () => {
    expect(calculateMaxStreak(['2026-05-01'])).toBe(1);
  });

  it('retorna la racha más larga entre varias rachas', () => {
    // Racha de 3, hueco, racha de 2
    const dates = ['2026-05-01', '2026-05-02', '2026-05-03', '2026-05-05', '2026-05-06'];
    expect(calculateMaxStreak(dates)).toBe(3);
  });

  it('retorna el total cuando todos los días son consecutivos', () => {
    const dates = ['2026-05-01', '2026-05-02', '2026-05-03', '2026-05-04'];
    expect(calculateMaxStreak(dates)).toBe(4);
  });
});

describe('calculateCoins', () => {
  it('retorna 10 base sin bonus para racha no múltiplo de 7', () => {
    expect(calculateCoins(1)).toEqual({ base: 10, bonus: 0, total: 10 });
  });

  it('retorna 10 base + 25 bonus para racha 7', () => {
    expect(calculateCoins(7)).toEqual({ base: 10, bonus: 25, total: 35 });
  });

  it('retorna bonus también para racha 14', () => {
    expect(calculateCoins(14)).toEqual({ base: 10, bonus: 25, total: 35 });
  });

  it('no da bonus para racha 0', () => {
    expect(calculateCoins(0)).toEqual({ base: 10, bonus: 0, total: 10 });
  });

  it('no da bonus para racha 6', () => {
    expect(calculateCoins(6)).toEqual({ base: 10, bonus: 0, total: 10 });
  });
});
```

- [ ] **Step 3: Ejecutar tests para confirmar que fallan**

```bash
cd backend && npm test -- --testPathPatterns=streakService
```

Resultado esperado: **FAIL** con error `Cannot find module '../../src/services/streakService'`

- [ ] **Step 4: Implementar streakService**

Crear `backend/src/services/streakService.ts`:

```typescript
export function calculateStreak(completions: string[]): number {
  if (completions.length === 0) return 0;

  const unique = [...new Set(completions)].sort().reverse();

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = (() => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - 1);
    return d.toISOString().slice(0, 10);
  })();

  if (unique[0] !== today && unique[0] !== yesterday) return 0;

  let streak = 0;
  let expected = unique[0];

  for (const date of unique) {
    if (date === expected) {
      streak++;
      const d = new Date(expected + 'T00:00:00Z');
      d.setUTCDate(d.getUTCDate() - 1);
      expected = d.toISOString().slice(0, 10);
    } else {
      break;
    }
  }

  return streak;
}

export function calculateMaxStreak(completions: string[]): number {
  if (completions.length === 0) return 0;

  const sorted = [...new Set(completions)].sort();

  let maxStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1] + 'T00:00:00Z');
    const curr = new Date(sorted[i] + 'T00:00:00Z');
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000);

    if (diffDays === 1) {
      currentStreak++;
      if (currentStreak > maxStreak) maxStreak = currentStreak;
    } else {
      currentStreak = 1;
    }
  }

  return maxStreak;
}

export function calculateCoins(streak: number): { base: number; bonus: number; total: number } {
  const base = 10;
  const bonus = streak > 0 && streak % 7 === 0 ? 25 : 0;
  return { base, bonus, total: base + bonus };
}
```

- [ ] **Step 5: Ejecutar tests y confirmar que pasan**

```bash
npm test -- --testPathPatterns=streakService
```

Resultado esperado: **PASS** — todos los tests en verde.

- [ ] **Step 6: Commit**

```bash
git add tests/services/streakService.test.ts src/services/streakService.ts
git commit -m "feat: implementar streakService con unit tests (TDD)"
```

---

## Task 5: pokemonService

Carga los 151 Pokémon de Gen 1 al inicio del servidor usando un solo request a la PokéAPI. Los sprites se construyen con la URL estática de PokéAPI para evitar 151 requests adicionales.

**Files:**
- Create: `backend/src/services/pokemonService.ts`

- [ ] **Step 1: Crear pokemonService.ts**

```typescript
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
```

- [ ] **Step 2: Verificar que TypeScript no reporta errores**

```bash
npx tsc --noEmit
```

Resultado esperado: sin errores. Si aparece `fetch is not defined`, agregar `"lib": ["ES2020", "DOM"]` en `tsconfig.json` dentro de `compilerOptions`.

- [ ] **Step 3: Commit**

```bash
git add src/services/pokemonService.ts
git commit -m "feat: implementar pokemonService con caché en memoria"
```

---

## Task 6: routes/habits.ts

CRUD de hábitos + endpoint de completación + historial de completaciones.

**Files:**
- Create: `backend/src/routes/habits.ts`

- [ ] **Step 1: Crear routes/habits.ts**

```typescript
import { Router, Request, Response } from 'express';
import { supabase } from '../services/supabase';
import { authenticate } from '../middleware/auth';
import { calculateStreak, calculateMaxStreak, calculateCoins } from '../services/streakService';

const habitsRouter = Router();

// GET /habits — listar hábitos del usuario autenticado
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

// POST /habits — crear hábito
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

// PUT /habits/:id — editar hábito (solo el dueño)
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

// DELETE /habits/:id — eliminar hábito (solo el dueño)
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

// POST /habits/:id/complete — marcar hábito como completado hoy
habitsRouter.post('/:id/complete', authenticate, async (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const { id } = req.params;
  const today = new Date().toISOString().slice(0, 10);

  // Verificar que el hábito pertenece al usuario
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

  // Verificar que no fue completado hoy
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

  // Obtener historial para calcular racha
  const { data: history } = await supabase
    .from('habit_completions')
    .select('completed_on')
    .eq('habit_id', id)
    .eq('user_id', userId);

  const completedDates = (history ?? []).map((c: { completed_on: string }) => c.completed_on);
  completedDates.push(today);

  const streak = calculateStreak(completedDates);
  const { base, bonus, total: coinsEarned } = calculateCoins(streak);

  // Insertar completación
  const { error: insertError } = await supabase
    .from('habit_completions')
    .insert({ habit_id: id, user_id: userId, completed_on: today });

  if (insertError) {
    res.status(500).json({ error: 'Error al registrar completación' });
    return;
  }

  // Actualizar monedas del perfil
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

// GET /habits/:id/completions — historial de completaciones (para calendario y analíticas)
habitsRouter.get('/:id/completions', authenticate, async (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const { id } = req.params;

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
```

- [ ] **Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Resultado esperado: sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/routes/habits.ts
git commit -m "feat: implementar rutas de hábitos (CRUD + completación + historial)"
```

---

## Task 7: routes/collection.ts

Pokédex (lista de 151 Pokémon con estado capturado) y captura atómica con descuento de monedas.

**Files:**
- Create: `backend/src/routes/collection.ts`

- [ ] **Step 1: Crear routes/collection.ts**

```typescript
import { Router, Request, Response } from 'express';
import { supabase } from '../services/supabase';
import { authenticate } from '../middleware/auth';
import { getAllPokemon } from '../services/pokemonService';

const collectionRouter = Router();

// GET /collection/available — lista los 151 Pokémon con estado capturado del usuario
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

// POST /collection/catch — capturar un Pokémon (cuesta 50 monedas)
collectionRouter.post('/catch', authenticate, async (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const { pokemon_id } = req.body;

  if (!pokemon_id || typeof pokemon_id !== 'number' || pokemon_id < 1 || pokemon_id > 151) {
    res.status(400).json({ error: 'Pokémon inválido. Debe ser un número entre 1 y 151' });
    return;
  }

  // Verificar saldo suficiente
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

  // Verificar que no fue capturado antes
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

  // Insertar en colección
  const { error: catchError } = await supabase
    .from('pokemon_collection')
    .insert({ user_id: userId, pokemon_id });

  if (catchError) {
    res.status(500).json({ error: 'Error al capturar Pokémon' });
    return;
  }

  // Descontar 50 monedas
  const newCoins = profile.coins - 50;

  await supabase
    .from('profiles')
    .update({ coins: newCoins })
    .eq('id', userId);

  res.json({ pokemon_id, coins_remaining: newCoins });
});

export default collectionRouter;
```

- [ ] **Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Resultado esperado: sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/routes/collection.ts
git commit -m "feat: implementar rutas de colección Pokémon (pokédex + captura)"
```

---

## Task 8: routes/profile.ts

Perfil del usuario con monedas y estadísticas, y endpoint de analíticas por hábito.

**Files:**
- Create: `backend/src/routes/profile.ts`

- [ ] **Step 1: Crear routes/profile.ts**

```typescript
import { Router, Request, Response } from 'express';
import { supabase } from '../services/supabase';
import { authenticate } from '../middleware/auth';
import { calculateStreak, calculateMaxStreak } from '../services/streakService';

const profileRouter = Router();

// GET /profile — datos del perfil con conteos
profileRouter.get('/', authenticate, async (req: Request, res: Response) => {
  const userId = req.user!.sub;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !profile) {
    res.status(404).json({ error: 'Perfil no encontrado' });
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

// GET /analytics — estadísticas por hábito para la pantalla de analíticas
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
```

- [ ] **Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Resultado esperado: sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/routes/profile.ts
git commit -m "feat: implementar rutas de perfil y analíticas"
```

---

## Task 9: Conectar todo en app.ts y server.ts

**Files:**
- Modify: `backend/src/app.ts`
- Modify: `backend/src/server.ts`

- [ ] **Step 1: Actualizar app.ts para registrar todas las rutas y el error handler**

```typescript
import 'dotenv/config';
import express from 'express';
import authRouter from './routes/auth';
import habitsRouter from './routes/habits';
import collectionRouter from './routes/collection';
import profileRouter from './routes/profile';
import errorHandler from './middleware/errorHandler';

const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

app.use('/auth', authRouter);
app.use('/habits', habitsRouter);
app.use('/collection', collectionRouter);
app.use('/profile', profileRouter);

// El error handler siempre va último
app.use(errorHandler);

export default app;
```

- [ ] **Step 2: Actualizar server.ts para inicializar caché de Pokémon antes de escuchar**

```typescript
import 'dotenv/config';
import app from './app';
import { initPokemonCache } from './services/pokemonService';

const PORT = process.env.PORT || 3000;

initPokemonCache()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en el puerto ${PORT}`);
    });
  })
  .catch((err: Error) => {
    console.error('Error al inicializar caché de Pokémon:', err.message);
    process.exit(1);
  });
```

- [ ] **Step 3: Verificar TypeScript final**

```bash
npx tsc --noEmit
```

Resultado esperado: sin errores.

- [ ] **Step 4: Instalar dotenv si no está instalado**

Verificar si `dotenv` está en las dependencias. Si no aparece en `package.json`:

```bash
npm install dotenv
```

- [ ] **Step 5: Arrancar el servidor y verificar health check**

```bash
npm run dev
```

En otra terminal:

```bash
curl http://localhost:3000/health
```

Resultado esperado: `{"status":"OK"}`

- [ ] **Step 6: Ejecutar todos los tests**

```bash
npm test
```

Resultado esperado: **PASS** — todos los tests de streakService en verde.

- [ ] **Step 7: Commit final**

```bash
git add src/app.ts src/server.ts
git commit -m "feat: conectar todas las rutas y completar backend MVP"
```

---

## Resumen de endpoints disponibles al terminar

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/auth/register` | No | Registrar usuario |
| POST | `/auth/login` | No | Iniciar sesión |
| GET | `/habits` | Sí | Listar hábitos |
| POST | `/habits` | Sí | Crear hábito |
| PUT | `/habits/:id` | Sí | Editar hábito |
| DELETE | `/habits/:id` | Sí | Eliminar hábito |
| POST | `/habits/:id/complete` | Sí | Completar hábito (streak + monedas) |
| GET | `/habits/:id/completions` | Sí | Historial de completaciones |
| GET | `/collection/available` | Sí | Pokédex con estado capturado |
| POST | `/collection/catch` | Sí | Capturar Pokémon (-50 monedas) |
| GET | `/profile` | Sí | Perfil y conteos |
| GET | `/analytics` | Sí | Estadísticas por hábito |
| GET | `/health` | No | Health check |

## Casos de prueba cubiertos

| CP | Estado con backend completo |
|----|----------------------------|
| CP-01, CP-01.1, CP-01.2 | ✅ `POST /auth/register` |
| CP-02, CP-02.1, CP-02.2 | ✅ `POST /auth/login` + token en rutas protegidas |
| CP-03, CP-03.1, CP-03.2 | ✅ CRUD `/habits` |
| CP-04, CP-04.1, CP-04.2 | ✅ `POST /habits/:id/complete` |
| CP-05, CP-05.1, CP-05.2 | ❌ Notificaciones locales (requiere iOS) |
| CP-06, CP-06.1, CP-06.2 | ✅ `GET /analytics` + `/habits/:id/completions` |
| CP-07, CP-07.1, CP-07.2 | ✅ `GET /collection/available` + `POST /collection/catch` |
