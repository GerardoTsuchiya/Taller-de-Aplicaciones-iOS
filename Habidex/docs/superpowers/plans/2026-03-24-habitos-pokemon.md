# Habitos + Pokémon — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir una app móvil de seguimiento de hábitos con gamificación Pokémon, con backend Node.js/Express/Supabase y frontend Expo/React Native/TypeScript.

**Architecture:** Monorepo con carpetas `backend/` y `frontend/`. El backend es una API REST con Express que verifica JWTs de Supabase Auth. El frontend usa Expo Router (file-based routing) con Zustand para estado global. Las notificaciones son locales via `expo-notifications`.

**Tech Stack:** Node.js 20 · Express 4 · TypeScript · Supabase (Postgres + Auth) · Expo SDK 51 · React Native · Expo Router · Zustand · expo-notifications · expo-secure-store · react-native-calendars · Jest (backend tests)

---

## Estructura de archivos

```
habitos/                          ← raíz del proyecto
├── backend/
│   ├── src/
│   │   ├── app.ts                ← Express app (sin listen, testeable)
│   │   ├── server.ts             ← Entry point (listen)
│   │   ├── middleware/
│   │   │   ├── auth.ts           ← JWT verification middleware
│   │   │   └── errorHandler.ts   ← Global error handler
│   │   ├── routes/
│   │   │   ├── auth.ts           ← POST /auth/register, /auth/login
│   │   │   ├── habits.ts         ← CRUD /habits + POST /habits/:id/complete
│   │   │   ├── collection.ts     ← GET /collection/available, POST /collection/catch
│   │   │   └── profile.ts        ← GET /profile
│   │   ├── services/
│   │   │   ├── supabase.ts       ← Supabase client singleton
│   │   │   ├── streakService.ts  ← Cálculo de rachas y bonus de monedas
│   │   │   └── pokemonService.ts ← PokéAPI calls + caché en memoria
│   │   └── types/
│   │       └── index.ts          ← Interfaces TypeScript compartidas
│   ├── tests/
│   │   ├── streakService.test.ts
│   │   └── pokemonService.test.ts
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/
    ├── app/
    │   ├── _layout.tsx           ← Root layout + auth guard
    │   ├── (auth)/
    │   │   ├── _layout.tsx
    │   │   ├── login.tsx
    │   │   └── register.tsx
    │   └── (tabs)/
    │       ├── _layout.tsx       ← Tab navigator (5 tabs)
    │       ├── index.tsx         ← Tab: Hoy
    │       ├── habits.tsx        ← Tab: Hábitos (lista)
    │       ├── analytics.tsx     ← Tab: Analytics
    │       ├── pokedex.tsx       ← Tab: Pokédex
    │       └── profile.tsx       ← Tab: Perfil
    ├── src/
    │   ├── api/
    │   │   ├── client.ts         ← fetch base con Authorization header
    │   │   ├── auth.ts           ← register(), login()
    │   │   ├── habits.ts         ← getHabits(), createHabit(), completeHabit(), etc.
    │   │   ├── collection.ts     ← getAvailable(), catchPokemon()
    │   │   └── profile.ts        ← getProfile()
    │   ├── store/
    │   │   └── authStore.ts      ← Zustand: token, user, login(), logout()
    │   ├── hooks/
    │   │   ├── useHabits.ts      ← fetch + estado de hábitos
    │   │   └── useCollection.ts  ← fetch + estado de colección
    │   ├── components/
    │   │   ├── WeeklyCalendar.tsx   ← Calendario semanal (Hoy)
    │   │   ├── MonthlyCalendar.tsx  ← Calendario mensual (detalle hábito)
    │   │   ├── HabitCard.tsx        ← Card de hábito en lista
    │   │   └── PokemonGrid.tsx      ← Grid de Pokédex
    │   └── utils/
    │       └── notifications.ts  ← scheduleHabitNotification(), cancelNotification(), rescheduleAll()
    ├── constants/
    │   └── api.ts                ← API_BASE_URL
    ├── app.json
    ├── package.json
    └── tsconfig.json
```

---

## Task 1: Setup del Backend

**Files:**
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `backend/.env.example`
- Create: `backend/src/app.ts`
- Create: `backend/src/server.ts`
- Create: `backend/src/types/index.ts`

- [ ] **Step 1: Crear carpeta backend e inicializar proyecto**

```bash
mkdir -p backend/src/middleware backend/src/routes backend/src/services backend/src/types backend/tests
cd backend
npm init -y
```

- [ ] **Step 2: Instalar dependencias**

```bash
npm install express @supabase/supabase-js jsonwebtoken node-fetch
npm install -D typescript ts-node-dev @types/express @types/jsonwebtoken @types/node jest ts-jest @types/jest
```

- [ ] **Step 3: Crear `backend/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "rootDir": "src",
    "outDir": "dist",
    "strict": true,
    "esModuleInterop": true,
    "resolveJsonModule": true
  },
  "include": ["src", "tests"]
}
```

- [ ] **Step 4: Crear `backend/.env.example`**

```env
PORT=3000
SUPABASE_URL=https://<tu-proyecto>.supabase.co
SUPABASE_JWT_SECRET=<obtenido en Supabase → Settings → API → JWT Secret>
SUPABASE_SERVICE_ROLE_KEY=<obtenido en Supabase → Settings → API → service_role key>
```

Copiar a `.env` y rellenar con los valores reales del proyecto de Supabase.

- [ ] **Step 5: Crear `backend/src/types/index.ts`**

```typescript
export interface AuthUser {
  id: string;
  email: string;
}

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  reminder_enabled: boolean;
  reminder_time: string | null;
  created_at: string;
}

export interface HabitCompletion {
  id: string;
  habit_id: string;
  user_id: string;
  completed_on: string; // ISO date string "YYYY-MM-DD"
}

export interface Profile {
  id: string;
  username: string;
  coins: number;
  created_at: string;
}

export interface PokemonSummary {
  id: number;
  name: string;
  sprite: string;
  caught: boolean;
}

// Extends Express Request with authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
```

- [ ] **Step 6: Crear `backend/src/app.ts`**

```typescript
import express from 'express';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth';
import habitsRoutes from './routes/habits';
import collectionRoutes from './routes/collection';
import profileRoutes from './routes/profile';

const app = express();
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/habits', habitsRoutes);
app.use('/collection', collectionRoutes);
app.use('/profile', profileRoutes);

app.use(errorHandler);

export default app;
```

- [ ] **Step 7: Crear `backend/src/server.ts`**

```typescript
import app from './app';

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

- [ ] **Step 8: Agregar scripts a `backend/package.json`**

```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "jest"
  },
  "jest": {
    "preset": "ts-jest",
    "testEnvironment": "node",
    "testMatch": ["**/tests/**/*.test.ts"]
  }
}
```

- [ ] **Step 9: Crear `backend/src/middleware/errorHandler.ts`**

```typescript
import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
}
```

- [ ] **Step 10: Verificar que el servidor arranca**

```bash
cd backend
cp .env.example .env  # completar con valores reales de Supabase
npm run dev
```

Expected: `Server running on port 3000`

- [ ] **Step 11: Commit**

```bash
cd ..
git add backend/
git commit -m "feat: backend project setup with Express + TypeScript"
```

---

## Task 2: Setup del Frontend

**Files:**
- Create: `frontend/` (proyecto Expo)
- Create: `frontend/constants/api.ts`
- Create: `frontend/src/store/authStore.ts`

- [ ] **Step 1: Crear proyecto Expo con TypeScript**

```bash
npx create-expo-app frontend --template blank-typescript
cd frontend
```

- [ ] **Step 2: Instalar dependencias**

```bash
npx expo install expo-router expo-secure-store expo-notifications expo-constants
npm install zustand react-native-calendars
npx expo install react-native-safe-area-context react-native-screens
```

- [ ] **Step 3: Configurar Expo Router en `frontend/app.json`**

Asegurarse de que `app.json` tenga el scheme configurado:

```json
{
  "expo": {
    "name": "Habitos",
    "slug": "habitos",
    "scheme": "habitos",
    "version": "1.0.0",
    "plugins": [
      "expo-router",
      [
        "expo-notifications",
        {
          "icon": "./assets/icon.png",
          "color": "#ffffff"
        }
      ]
    ],
    "android": { "adaptiveIcon": { "backgroundColor": "#ffffff" } }
  }
}
```

- [ ] **Step 4: Crear `frontend/constants/api.ts`**

```typescript
import Constants from 'expo-constants';

// En desarrollo: usar IP local de tu máquina (NO localhost)
// Ejemplo: "http://192.168.1.100:3000"
// En producción: URL de Railway/Render
export const API_BASE_URL =
  Constants.expoConfig?.extra?.apiUrl ?? 'http://192.168.1.100:3000';
```

**Nota:** Cambiar la IP a la dirección local real de tu máquina. Ejecutar `ipconfig` (Windows) para obtenerla.

- [ ] **Step 5: Crear `frontend/src/store/authStore.ts`**

```typescript
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface AuthUser {
  id: string;
  email: string;
  username: string;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isLoading: boolean;
  setAuth: (token: string, user: AuthUser) => Promise<void>;
  logout: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isLoading: true,

  setAuth: async (token, user) => {
    await SecureStore.setItemAsync('token', token);
    await SecureStore.setItemAsync('user', JSON.stringify(user));
    set({ token, user });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('user');
    set({ token: null, user: null });
  },

  loadFromStorage: async () => {
    const token = await SecureStore.getItemAsync('token');
    const userStr = await SecureStore.getItemAsync('user');
    const user = userStr ? JSON.parse(userStr) : null;
    set({ token, user, isLoading: false });
  },
}));
```

- [ ] **Step 6: Crear `frontend/src/api/client.ts`**

```typescript
import { API_BASE_URL } from '../../constants/api';
import { useAuthStore } from '../store/authStore';

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

export async function apiRequest<T>(
  path: string,
  method: Method = 'GET',
  body?: object
): Promise<T> {
  const token = useAuthStore.getState().token;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? 'Error desconocido');
  }

  return data as T;
}
```

- [ ] **Step 7: Commit**

```bash
cd ..
git add frontend/
git commit -m "feat: frontend Expo project setup with Zustand + API client"
```

---

## Task 3: Supabase — Cliente y Auth Middleware

**Files:**
- Create: `backend/src/services/supabase.ts`
- Create: `backend/src/middleware/auth.ts`

- [ ] **Step 1: Crear `backend/src/services/supabase.ts`**

```typescript
import { createClient } from '@supabase/supabase-js';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
```

- [ ] **Step 2: Crear `backend/src/middleware/auth.ts`**

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No autenticado' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET!) as {
      sub: string;
      email: string;
    };
    req.user = { id: decoded.sub, email: decoded.email };
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
}
```

- [ ] **Step 3: Configurar la base de datos en Supabase**

En el dashboard de Supabase, ir a **SQL Editor** y ejecutar:

```sql
-- Perfil de usuario
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL,
  coins integer NOT NULL DEFAULT 0,
  created_at timestamp DEFAULT now()
);

-- Hábitos
CREATE TABLE habits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  reminder_enabled boolean NOT NULL DEFAULT false,
  reminder_time time,
  created_at timestamp DEFAULT now()
);

-- Completaciones diarias
CREATE TABLE habit_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id uuid NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  completed_on date NOT NULL,
  UNIQUE (habit_id, completed_on)
);

-- Colección Pokémon
CREATE TABLE pokemon_collection (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pokemon_id integer NOT NULL,
  caught_at timestamp DEFAULT now(),
  UNIQUE (user_id, pokemon_id)
);

-- RLS: habilitar Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pokemon_collection ENABLE ROW LEVEL SECURITY;
```

**Nota:** Dado que el backend usa el `service_role_key`, las políticas RLS no bloquean al backend. Igualmente se habilitan como buena práctica.

- [ ] **Step 4: Commit**

```bash
git add backend/src/services/supabase.ts backend/src/middleware/auth.ts
git commit -m "feat: Supabase client + JWT auth middleware"
```

---

## Task 4: Auth Backend (Register + Login)

**Files:**
- Create: `backend/src/routes/auth.ts`

- [ ] **Step 1: Crear `backend/src/routes/auth.ts`**

```typescript
import { Router, Request, Response } from 'express';
import { supabase } from '../services/supabase';

const router = Router();

// POST /auth/register
router.post('/register', async (req: Request, res: Response) => {
  const { email, password, username } = req.body;

  if (!email || !password || !username) {
    res.status(400).json({ error: 'Email, contraseña y username son requeridos' });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    return;
  }

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError || !authData.user) {
    if (authError?.message.includes('already registered')) {
      res.status(400).json({ error: 'El correo ya está en uso' });
    } else {
      res.status(400).json({ error: authError?.message ?? 'Error al registrar' });
    }
    return;
  }

  // Crear perfil
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({ id: authData.user.id, username });

  if (profileError) {
    // Revertir usuario si falla el perfil
    await supabase.auth.admin.deleteUser(authData.user.id);
    res.status(500).json({ error: 'Error al crear perfil' });
    return;
  }

  // Generar JWT con signInWithPassword para devolver token válido
  const { data: signIn, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError || !signIn.session) {
    res.status(500).json({ error: 'Error al generar sesión' });
    return;
  }

  res.status(201).json({
    token: signIn.session.access_token,
    user: { id: authData.user.id, email, username },
  });
});

// POST /auth/login
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email y contraseña son requeridos' });
    return;
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.session) {
    res.status(401).json({ error: 'Credenciales inválidas' });
    return;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', data.user.id)
    .single();

  res.json({
    token: data.session.access_token,
    user: {
      id: data.user.id,
      email: data.user.email!,
      username: profile?.username ?? '',
    },
  });
});

export default router;
```

- [ ] **Step 2: Probar manualmente con curl**

```bash
# Register
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456","username":"trainer1"}'

# Expected: { token: "...", user: { id, email, username } }

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'

# Expected: { token: "...", user: { ... } }
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/routes/auth.ts
git commit -m "feat: auth endpoints register and login"
```

---

## Task 5: Streak Service (con TDD)

**Files:**
- Create: `backend/src/services/streakService.ts`
- Create: `backend/tests/streakService.test.ts`

- [ ] **Step 1: Escribir los tests primero**

Crear `backend/tests/streakService.test.ts`:

```typescript
import { calculateStreak, calculateCoinsEarned } from '../src/services/streakService';

describe('calculateStreak', () => {
  const today = '2026-03-24';

  it('returns 0 if no completions', () => {
    expect(calculateStreak([], today)).toBe(0);
  });

  it('returns 1 if only today is completed', () => {
    expect(calculateStreak(['2026-03-24'], today)).toBe(1);
  });

  it('returns 3 for 3 consecutive days ending today', () => {
    expect(calculateStreak(['2026-03-22', '2026-03-23', '2026-03-24'], today)).toBe(3);
  });

  it('returns 2 for consecutive days ending yesterday (today not yet done)', () => {
    expect(calculateStreak(['2026-03-22', '2026-03-23'], today)).toBe(2);
  });

  it('resets streak if there is a gap', () => {
    expect(calculateStreak(['2026-03-20', '2026-03-22', '2026-03-23', '2026-03-24'], today)).toBe(3);
  });

  it('returns 0 if last completion was 2+ days ago', () => {
    expect(calculateStreak(['2026-03-20', '2026-03-21'], today)).toBe(0);
  });
});

describe('calculateCoinsEarned', () => {
  it('returns 10 for a normal completion', () => {
    expect(calculateCoinsEarned(3)).toBe(10);
  });

  it('returns 35 when new streak is a multiple of 7', () => {
    expect(calculateCoinsEarned(7)).toBe(35);
    expect(calculateCoinsEarned(14)).toBe(35);
    expect(calculateCoinsEarned(21)).toBe(35);
  });

  it('returns 10 the day after a multiple of 7', () => {
    expect(calculateCoinsEarned(8)).toBe(10);
  });
});
```

- [ ] **Step 2: Agregar tests de `calculateMaxStreak` al mismo archivo**

```typescript
describe('calculateMaxStreak', () => {
  it('returns 0 for empty array', () => {
    expect(calculateMaxStreak([])).toBe(0);
  });

  it('returns 1 for a single date', () => {
    expect(calculateMaxStreak(['2026-03-24'])).toBe(1);
  });

  it('returns the longest consecutive run', () => {
    expect(calculateMaxStreak(['2026-03-01', '2026-03-02', '2026-03-03', '2026-03-10', '2026-03-11'])).toBe(3);
  });
});
```

- [ ] **Step 3: Correr los tests para verificar que fallan**

```bash
cd backend
npm test
```

Expected: Tests FAIL — `Cannot find module '../src/services/streakService'`

- [ ] **Step 4: Implementar `backend/src/services/streakService.ts`**

```typescript
/**
 * Calculates the current consecutive streak from an array of ISO date strings.
 * @param completions - Array of dates "YYYY-MM-DD" (unsorted is ok)
 * @param today - Reference date "YYYY-MM-DD"
 */
export function calculateStreak(completions: string[], today: string): number {
  if (completions.length === 0) return 0;

  const dateSet = new Set(completions);
  const todayDate = new Date(today);
  let streak = 0;

  // Start counting from today; if today not done, start from yesterday
  const startFrom = dateSet.has(today)
    ? todayDate
    : new Date(todayDate.getTime() - 86_400_000);

  let current = new Date(startFrom);

  while (true) {
    const dateStr = current.toISOString().split('T')[0];
    if (!dateSet.has(dateStr)) break;
    streak++;
    current = new Date(current.getTime() - 86_400_000);
  }

  return streak;
}

/**
 * Calculates coins earned for a completion given the resulting streak.
 * Base: 10 coins. Bonus: +25 if streak is a multiple of 7.
 */
export function calculateCoinsEarned(newStreak: number): number {
  const bonus = newStreak % 7 === 0 ? 25 : 0;
  return 10 + bonus;
}

/**
 * Returns the longest consecutive streak ever achieved in the given dates.
 */
export function calculateMaxStreak(dates: string[]): number {
  if (!dates.length) return 0;
  const sorted = [...dates].sort();
  let max = 1, current = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diff = (curr.getTime() - prev.getTime()) / 86_400_000;
    current = diff === 1 ? current + 1 : 1;
    max = Math.max(max, current);
  }
  return max;
}
```

- [ ] **Step 5: Correr los tests para verificar que pasan**

```bash
npm test
```

Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
git add src/services/streakService.ts tests/streakService.test.ts
git commit -m "feat: streak calculation service with TDD"
```

---

## Task 6: Habits Backend (CRUD + Complete)

**Files:**
- Create: `backend/src/routes/habits.ts`

- [ ] **Step 1: Crear `backend/src/routes/habits.ts`**

```typescript
import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { supabase } from '../services/supabase';
import { calculateStreak, calculateCoinsEarned } from '../services/streakService';

const router = Router();
router.use(requireAuth);

// GET /habits
router.get('/', async (req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', req.user!.id)
    .order('created_at', { ascending: true });

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
});

// POST /habits
router.post('/', async (req: Request, res: Response) => {
  const { name, description, reminder_enabled, reminder_time } = req.body;

  if (!name?.trim()) {
    res.status(400).json({ error: 'El nombre del hábito es requerido' });
    return;
  }
  if (reminder_enabled && !reminder_time) {
    res.status(400).json({ error: 'reminder_time es requerido cuando reminder_enabled es true' });
    return;
  }

  const { data, error } = await supabase
    .from('habits')
    .insert({ user_id: req.user!.id, name: name.trim(), description, reminder_enabled: !!reminder_enabled, reminder_time: reminder_enabled ? reminder_time : null })
    .select()
    .single();

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(201).json(data);
});

// PUT /habits/:id
router.put('/:id', async (req: Request, res: Response) => {
  const { name, description, reminder_enabled, reminder_time } = req.body;

  if (name !== undefined && !name?.trim()) {
    res.status(400).json({ error: 'El nombre no puede estar vacío' });
    return;
  }

  const { data, error } = await supabase
    .from('habits')
    .update({ name: name?.trim(), description, reminder_enabled, reminder_time: reminder_enabled ? reminder_time : null })
    .eq('id', req.params.id)
    .eq('user_id', req.user!.id)
    .select()
    .single();

  if (error || !data) { res.status(404).json({ error: 'Hábito no encontrado' }); return; }
  res.json(data);
});

// DELETE /habits/:id
router.delete('/:id', async (req: Request, res: Response) => {
  const { error } = await supabase
    .from('habits')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.user!.id);

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(204).send();
});

// POST /habits/:id/complete
router.post('/:id/complete', async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const habitId = req.params.id;
  const today = new Date().toISOString().split('T')[0];

  // Verificar que el hábito pertenece al usuario
  const { data: habit } = await supabase
    .from('habits')
    .select('id')
    .eq('id', habitId)
    .eq('user_id', userId)
    .single();

  if (!habit) { res.status(403).json({ error: 'Hábito no encontrado' }); return; }

  // Insertar completación (UNIQUE constraint manejará duplicados)
  const { error: completionError } = await supabase
    .from('habit_completions')
    .insert({ habit_id: habitId, user_id: userId, completed_on: today });

  if (completionError) {
    if (completionError.code === '23505') {
      res.status(409).json({ error: 'Hábito ya completado hoy' });
    } else {
      res.status(500).json({ error: completionError.message });
    }
    return;
  }

  // Calcular racha
  const { data: completions } = await supabase
    .from('habit_completions')
    .select('completed_on')
    .eq('habit_id', habitId)
    .eq('user_id', userId);

  const dates = (completions ?? []).map((c) => c.completed_on);
  const streak = calculateStreak(dates, today);
  const coinsEarned = calculateCoinsEarned(streak);

  // Actualizar monedas del usuario
  const { data: profile } = await supabase
    .from('profiles')
    .select('coins')
    .eq('id', userId)
    .single();

  await supabase
    .from('profiles')
    .update({ coins: (profile?.coins ?? 0) + coinsEarned })
    .eq('id', userId);

  res.json({ coins_earned: coinsEarned, streak, total_coins: (profile?.coins ?? 0) + coinsEarned });
});

export default router;
```

- [ ] **Step 2: Probar manualmente**

```bash
# Guardar el token del registro en $TOKEN
TOKEN="<token del paso anterior>"

# Crear hábito
curl -X POST http://localhost:3000/habits \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Leer 30 min","reminder_enabled":false}'

# Expected: { id, user_id, name, ... }

# Completar hábito (usar el id devuelto)
curl -X POST http://localhost:3000/habits/<HABIT_ID>/complete \
  -H "Authorization: Bearer $TOKEN"

# Expected: { coins_earned: 10, streak: 1, total_coins: 10 }
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/routes/habits.ts
git commit -m "feat: habits CRUD and completion endpoint"
```

---

## Task 7: Pokémon Service + Collection Backend

**Files:**
- Create: `backend/src/services/pokemonService.ts`
- Create: `backend/src/routes/collection.ts`
- Create: `backend/src/routes/profile.ts`

- [ ] **Step 1: Crear `backend/src/services/pokemonService.ts`**

```typescript
// Caches los 151 Pokémon en memoria al primer request
let cachedPokemon: Array<{ id: number; name: string; sprite: string }> | null = null;

async function fetchAllPokemon() {
  if (cachedPokemon) return cachedPokemon;

  const results: Array<{ id: number; name: string; sprite: string }> = [];

  // PokéAPI devuelve los primeros 151 con offset=0&limit=151
  const listRes = await fetch('https://pokeapi.co/api/v2/pokemon?limit=151&offset=0');
  const list = await listRes.json() as { results: Array<{ name: string; url: string }> };

  for (let i = 0; i < list.results.length; i++) {
    const id = i + 1;
    const name = list.results[i].name;
    const sprite = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
    results.push({ id, name, sprite });
  }

  cachedPokemon = results;
  return cachedPokemon;
}

export async function getPokemonWithCaughtStatus(
  caughtIds: number[]
): Promise<Array<{ id: number; name: string; sprite: string; caught: boolean }>> {
  const all = await fetchAllPokemon();
  const caughtSet = new Set(caughtIds);
  return all.map((p) => ({ ...p, caught: caughtSet.has(p.id) }));
}
```

- [ ] **Step 2: Crear `backend/src/routes/collection.ts`**

```typescript
import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { supabase } from '../services/supabase';
import { getPokemonWithCaughtStatus } from '../services/pokemonService';

const CATCH_COST = 50;
const router = Router();
router.use(requireAuth);

// GET /collection/available
router.get('/available', async (req: Request, res: Response) => {
  const { data: caught } = await supabase
    .from('pokemon_collection')
    .select('pokemon_id')
    .eq('user_id', req.user!.id);

  const caughtIds = (caught ?? []).map((c) => c.pokemon_id);
  const pokemon = await getPokemonWithCaughtStatus(caughtIds);
  res.json(pokemon);
});

// POST /collection/catch
router.post('/catch', async (req: Request, res: Response) => {
  const { pokemon_id } = req.body;
  const userId = req.user!.id;

  if (!pokemon_id || typeof pokemon_id !== 'number' || pokemon_id < 1 || pokemon_id > 151) {
    res.status(400).json({ error: 'pokemon_id debe ser un número entre 1 y 151' });
    return;
  }

  // Verificar monedas
  const { data: profile } = await supabase
    .from('profiles')
    .select('coins')
    .eq('id', userId)
    .single();

  if (!profile || profile.coins < CATCH_COST) {
    res.status(400).json({ error: 'Monedas insuficientes' });
    return;
  }

  // Insertar en colección
  const { error: insertError } = await supabase
    .from('pokemon_collection')
    .insert({ user_id: userId, pokemon_id });

  if (insertError) {
    if (insertError.code === '23505') {
      res.status(409).json({ error: 'Pokémon ya capturado' });
    } else {
      res.status(500).json({ error: insertError.message });
    }
    return;
  }

  // Descontar monedas
  const remaining = profile.coins - CATCH_COST;
  await supabase.from('profiles').update({ coins: remaining }).eq('id', userId);

  res.json({ pokemon_id, remaining_coins: remaining });
});

export default router;
```

**Nota sobre atomicidad:** Supabase no expone transacciones directamente desde el cliente JS. Para evitar inconsistencias, crear una función SQL en Supabase que haga el insert + update de monedas en una sola transacción y llamarla con `supabase.rpc('catch_pokemon', { p_user_id, p_pokemon_id })`. Agregar esto como mejora si el tiempo lo permite.

- [ ] **Step 3: Crear `backend/src/routes/profile.ts`**

```typescript
import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { supabase } from '../services/supabase';

const router = Router();
router.use(requireAuth);

router.get('/', async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const [profileRes, completionsRes, caughtRes] = await Promise.all([
    supabase.from('profiles').select('username, coins').eq('id', userId).single(),
    supabase.from('habit_completions').select('id', { count: 'exact' }).eq('user_id', userId),
    supabase.from('pokemon_collection').select('id', { count: 'exact' }).eq('user_id', userId),
  ]);

  res.json({
    username: profileRes.data?.username,
    coins: profileRes.data?.coins ?? 0,
    total_completions: completionsRes.count ?? 0,
    total_caught: caughtRes.count ?? 0,
  });
});

export default router;
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/services/pokemonService.ts backend/src/routes/collection.ts backend/src/routes/profile.ts
git commit -m "feat: pokemon service, collection and profile endpoints"
```

---

## Task 8: Auth Frontend (Login + Register)

**Files:**
- Create: `frontend/src/api/auth.ts`
- Create: `frontend/app/_layout.tsx`
- Create: `frontend/app/(auth)/_layout.tsx`
- Create: `frontend/app/(auth)/login.tsx`
- Create: `frontend/app/(auth)/register.tsx`

- [ ] **Step 1: Crear `frontend/src/api/auth.ts`**

```typescript
import { apiRequest } from './client';

interface AuthResponse {
  token: string;
  user: { id: string; email: string; username: string };
}

export const authApi = {
  register: (email: string, password: string, username: string) =>
    apiRequest<AuthResponse>('/auth/register', 'POST', { email, password, username }),

  login: (email: string, password: string) =>
    apiRequest<AuthResponse>('/auth/login', 'POST', { email, password }),
};
```

- [ ] **Step 2: Crear `frontend/app/_layout.tsx`**

```typescript
import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';

export default function RootLayout() {
  const { token, isLoading, loadFromStorage } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    loadFromStorage();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const inAuth = segments[0] === '(auth)';
    if (!token && !inAuth) router.replace('/(auth)/login');
    if (token && inAuth) router.replace('/(tabs)');
  }, [token, isLoading, segments]);

  return <Slot />;
}
```

- [ ] **Step 3: Crear `frontend/app/(auth)/_layout.tsx`**

```typescript
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

- [ ] **Step 4: Crear `frontend/app/(auth)/login.tsx`**

```typescript
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { authApi } from '../../src/api/auth';
import { useAuthStore } from '../../src/store/authStore';
import { rescheduleAllNotifications } from '../../src/utils/notifications';
import { habitsApi } from '../../src/api/habits';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) { Alert.alert('Error', 'Completa todos los campos'); return; }
    setLoading(true);
    try {
      const { token, user } = await authApi.login(email, password);
      await setAuth(token, user);
      // Reprogramar notificaciones tras login
      const habits = await habitsApi.getAll();
      await rescheduleAllNotifications(habits);
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Habitos</Text>
      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <TextInput style={styles.input} placeholder="Contraseña" value={password} onChangeText={setPassword} secureTextEntry />
      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Cargando...' : 'Iniciar sesión'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
        <Text style={styles.link}>¿No tienes cuenta? Regístrate</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', marginBottom: 32 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12 },
  button: { backgroundColor: '#e74c3c', padding: 14, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  link: { textAlign: 'center', marginTop: 16, color: '#3498db' },
});
```

- [ ] **Step 5: Crear `frontend/app/(auth)/register.tsx`**

```typescript
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { authApi } from '../../src/api/auth';
import { useAuthStore } from '../../src/store/authStore';
import { rescheduleAllNotifications } from '../../src/utils/notifications';
import { habitsApi } from '../../src/api/habits';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const router = useRouter();

  const handleRegister = async () => {
    if (!email || !password || !username) { Alert.alert('Error', 'Completa todos los campos'); return; }
    setLoading(true);
    try {
      const { token, user } = await authApi.register(email, password, username);
      await setAuth(token, user);
      // Usuario nuevo no tiene hábitos, pero llamamos reschedule de todas formas por consistencia
      const habits = await habitsApi.getAll();
      await rescheduleAllNotifications(habits);
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crear cuenta</Text>
      <TextInput style={styles.input} placeholder="Nombre de entrenador" value={username} onChangeText={setUsername} />
      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <TextInput style={styles.input} placeholder="Contraseña (mín. 6 caracteres)" value={password} onChangeText={setPassword} secureTextEntry />
      <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Cargando...' : 'Registrarse'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.link}>¿Ya tienes cuenta? Inicia sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', marginBottom: 32 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12 },
  button: { backgroundColor: '#e74c3c', padding: 14, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  link: { textAlign: 'center', marginTop: 16, color: '#3498db' },
});
```

- [ ] **Step 6: Probar en Expo Go**

```bash
cd frontend
npx expo start
```

- Abrir en dispositivo con Expo Go
- Verificar flujo: Register → login automático → redirige a tabs

- [ ] **Step 7: Commit**

```bash
git add frontend/src/api/auth.ts frontend/app/_layout.tsx frontend/app/(auth)/
git commit -m "feat: auth screens login and register"
```

---

## Task 9: Habits API + Notificaciones (Frontend)

**Files:**
- Create: `frontend/src/api/habits.ts`
- Create: `frontend/src/utils/notifications.ts`

- [ ] **Step 1: Crear `frontend/src/api/habits.ts`**

```typescript
import { apiRequest } from './client';
import { Habit } from '../types';

export const habitsApi = {
  getAll: () => apiRequest<Habit[]>('/habits'),

  create: (data: { name: string; description?: string; reminder_enabled: boolean; reminder_time?: string }) =>
    apiRequest<Habit>('/habits', 'POST', data),

  update: (id: string, data: Partial<Habit>) =>
    apiRequest<Habit>(`/habits/${id}`, 'PUT', data),

  remove: (id: string) =>
    apiRequest<void>(`/habits/${id}`, 'DELETE'),

  complete: (id: string) =>
    apiRequest<{ coins_earned: number; streak: number; total_coins: number }>(
      `/habits/${id}/complete`, 'POST'
    ),
};
```

Agregar la interfaz `Habit` a `frontend/src/types/index.ts` (crear el archivo si no existe):

```typescript
export interface Habit {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  reminder_enabled: boolean;
  reminder_time: string | null;
  created_at: string;
}
```

- [ ] **Step 2: Crear `frontend/src/utils/notifications.ts`**

```typescript
import * as Notifications from 'expo-notifications';
import { Habit } from '../types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleHabitNotification(habit: Habit): Promise<void> {
  if (!habit.reminder_enabled || !habit.reminder_time) return;

  const [hours, minutes] = habit.reminder_time.split(':').map(Number);

  // Cancelar notificación previa del mismo hábito (si existe)
  await cancelHabitNotification(habit.id);

  await Notifications.scheduleNotificationAsync({
    identifier: habit.id, // usar el id del hábito como identificador
    content: {
      title: '¡Es hora de tu hábito!',
      body: `${habit.name} 🎯`,
    },
    trigger: {
      hour: hours,
      minute: minutes,
      repeats: true,
    },
  });
}

export async function cancelHabitNotification(habitId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(habitId);
}

export async function rescheduleAllNotifications(habits: Habit[]): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const habit of habits) {
    if (habit.reminder_enabled) {
      await scheduleHabitNotification(habit);
    }
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/api/habits.ts frontend/src/utils/notifications.ts frontend/src/types/
git commit -m "feat: habits API client and notifications utility"
```

---

## Task 9b: Endpoint de Actividad Semanal (Backend)

**Files:**
- Modify: `backend/src/routes/profile.ts`

El calendario semanal en la tab Hoy necesita saber qué días de la semana actual el usuario completó al menos un hábito. Agregar este endpoint a `profile.ts`:

- [ ] **Step 1: Agregar `GET /profile/weekly-activity` a `backend/src/routes/profile.ts`**

```typescript
// GET /profile/weekly-activity
// Devuelve array de fechas ISO con al menos una completación esta semana
router.get('/weekly-activity', async (req: Request, res: Response) => {
  const userId = req.user!.id;

  // Calcular lunes de la semana actual
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Dom
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  const mondayStr = monday.toISOString().split('T')[0];
  const sundayStr = new Date(monday.getTime() + 6 * 86_400_000).toISOString().split('T')[0];

  const { data } = await supabase
    .from('habit_completions')
    .select('completed_on')
    .eq('user_id', userId)
    .gte('completed_on', mondayStr)
    .lte('completed_on', sundayStr);

  // Retornar fechas únicas
  const uniqueDates = [...new Set((data ?? []).map((c) => c.completed_on))];
  res.json(uniqueDates);
});
```

- [ ] **Step 2: Agregar a `frontend/src/api/profile.ts`**

```typescript
getWeeklyActivity: () => apiRequest<string[]>('/profile/weekly-activity'),
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/routes/profile.ts frontend/src/api/profile.ts
git commit -m "feat: weekly activity endpoint for home calendar"
```

---

## Task 10: Pantalla Hoy + Hábitos (Frontend)

**Files:**
- Create: `frontend/src/components/WeeklyCalendar.tsx`
- Create: `frontend/src/components/HabitCard.tsx`
- Create: `frontend/src/hooks/useHabits.ts`
- Create: `frontend/app/(tabs)/_layout.tsx`
- Create: `frontend/app/(tabs)/index.tsx`
- Create: `frontend/app/(tabs)/habits.tsx`

- [ ] **Step 1: Crear `frontend/src/hooks/useHabits.ts`**

```typescript
import { useState, useCallback } from 'react';
import { Habit } from '../types';
import { habitsApi } from '../api/habits';

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await habitsApi.getAll();
      setHabits(data);
    } finally {
      setLoading(false);
    }
  }, []);

  const complete = useCallback(async (habitId: string) => {
    return habitsApi.complete(habitId);
  }, []);

  return { habits, loading, refresh, complete };
}
```

- [ ] **Step 2: Crear `frontend/src/components/WeeklyCalendar.tsx`**

```typescript
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  completedDates: string[]; // ["2026-03-24", ...]
}

const DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export function WeeklyCalendar({ completedDates }: Props) {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);

  const completedSet = new Set(completedDates);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const iso = d.toISOString().split('T')[0];
    const isToday = iso === today.toISOString().split('T')[0];
    return { label: DAYS[i], iso, isToday, completed: completedSet.has(iso) };
  });

  return (
    <View style={styles.row}>
      {days.map((d) => (
        <View key={d.iso} style={[styles.day, d.isToday && styles.today, d.completed && styles.completed]}>
          <Text style={styles.label}>{d.label}</Text>
          <View style={[styles.dot, d.completed && styles.dotFilled]} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-around', padding: 12 },
  day: { alignItems: 'center', padding: 8, borderRadius: 8 },
  today: { backgroundColor: '#ffeaa7' },
  completed: { backgroundColor: '#55efc4' },
  label: { fontWeight: 'bold', marginBottom: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ddd' },
  dotFilled: { backgroundColor: '#00b894' },
});
```

- [ ] **Step 3: Crear `frontend/src/components/HabitCard.tsx`**

```typescript
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Habit } from '../types';

interface Props {
  habit: Habit;
  completedToday: boolean;
  streak: number;
  onComplete: () => void;
}

export function HabitCard({ habit, completedToday, streak, onComplete }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={styles.name}>{habit.name}</Text>
        <Text style={styles.streak}>🔥 {streak} días</Text>
      </View>
      <TouchableOpacity
        style={[styles.button, completedToday && styles.done]}
        onPress={onComplete}
        disabled={completedToday}
      >
        <Text style={styles.buttonText}>{completedToday ? '✓' : 'Listo'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderRadius: 12, marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600' },
  streak: { fontSize: 12, color: '#636e72', marginTop: 2 },
  button: { backgroundColor: '#e74c3c', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  done: { backgroundColor: '#00b894' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
});
```

- [ ] **Step 4: Crear `frontend/app/(tabs)/_layout.tsx`**

```typescript
import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#e74c3c' }}>
      <Tabs.Screen name="index" options={{ title: 'Hoy', tabBarIcon: () => null }} />
      <Tabs.Screen name="habits" options={{ title: 'Hábitos', tabBarIcon: () => null }} />
      <Tabs.Screen name="analytics" options={{ title: 'Analytics', tabBarIcon: () => null }} />
      <Tabs.Screen name="pokedex" options={{ title: 'Pokédex', tabBarIcon: () => null }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil', tabBarIcon: () => null }} />
    </Tabs>
  );
}
```

- [ ] **Step 5: Crear `frontend/app/(tabs)/index.tsx`** (tab Hoy)

```typescript
import { useEffect, useState } from 'react';
import { ScrollView, View, Text, Alert, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { useHabits } from '../../src/hooks/useHabits';
import { WeeklyCalendar } from '../../src/components/WeeklyCalendar';
import { HabitCard } from '../../src/components/HabitCard';
import { profileApi } from '../../src/api/profile';

export default function TodayScreen() {
  const { habits, loading, refresh, complete } = useHabits();
  const [coins, setCoins] = useState(0);
  const [completedToday, setCompletedToday] = useState<Set<string>>(new Set());
  const [streaks, setStreaks] = useState<Record<string, number>>({});
  const [weeklyDates, setWeeklyDates] = useState<string[]>([]);
  const today = new Date().toISOString().split('T')[0];

  useFocusEffect(useCallback(() => { load(); }, []));

  const load = async () => {
    const [profile, weekly] = await Promise.all([
      profileApi.get(),
      profileApi.getWeeklyActivity(),
    ]);
    setCoins(profile.coins);
    setWeeklyDates(weekly);
    await refresh();
  };

  const handleComplete = async (habitId: string) => {
    try {
      const result = await complete(habitId);
      setCompletedToday((prev) => new Set([...prev, habitId]));
      setStreaks((prev) => ({ ...prev, [habitId]: result.streak }));
      setCoins(result.total_coins);
      // Actualizar calendario si hoy no estaba marcado
      if (!weeklyDates.includes(today)) setWeeklyDates((prev) => [...prev, today]);
      Alert.alert('¡Completado!', `+${result.coins_earned} monedas 🪙`);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Hoy</Text>
        <Text style={styles.coins}>🪙 {coins}</Text>
      </View>
      <WeeklyCalendar completedDates={weeklyDates} />
      {habits.map((h) => (
        <HabitCard
          key={h.id}
          habit={h}
          completedToday={completedToday.has(h.id)}
          streak={streaks[h.id] ?? 0}
          onComplete={() => handleComplete(h.id)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa', padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 'bold' },
  coins: { fontSize: 18, fontWeight: '600' },
});
```

- [ ] **Step 6: Crear `frontend/app/(tabs)/habits.tsx`** — lista de hábitos con botones crear/editar/eliminar. Seguir el mismo patrón que `index.tsx`.

- [ ] **Step 7: Crear `frontend/src/api/profile.ts`**

```typescript
import { apiRequest } from './client';

interface ProfileData {
  username: string;
  coins: number;
  total_completions: number;
  total_caught: number;
}

export const profileApi = {
  get: () => apiRequest<ProfileData>('/profile'),
};
```

- [ ] **Step 8: Probar en Expo Go** — login, ver hábitos, completar uno, verificar monedas y calendario.

- [ ] **Step 9: Commit**

```bash
git add frontend/src/ frontend/app/(tabs)/
git commit -m "feat: Today tab with weekly calendar and habit cards"
```

---

## Task 11: Pokédex Frontend

**Files:**
- Create: `frontend/src/api/collection.ts`
- Create: `frontend/src/components/PokemonGrid.tsx`
- Create: `frontend/app/(tabs)/pokedex.tsx`

- [ ] **Step 1: Crear `frontend/src/api/collection.ts`**

```typescript
import { apiRequest } from './client';

export interface PokemonEntry {
  id: number;
  name: string;
  sprite: string;
  caught: boolean;
}

export const collectionApi = {
  getAvailable: () => apiRequest<PokemonEntry[]>('/collection/available'),
  catch: (pokemon_id: number) =>
    apiRequest<{ pokemon_id: number; remaining_coins: number }>('/collection/catch', 'POST', { pokemon_id }),
};
```

- [ ] **Step 2: Crear `frontend/src/components/PokemonGrid.tsx`**

```typescript
import { FlatList, View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { PokemonEntry } from '../api/collection';

interface Props {
  pokemon: PokemonEntry[];
  onCatch: (pokemon: PokemonEntry) => void;
}

export function PokemonGrid({ pokemon, onCatch }: Props) {
  return (
    <FlatList
      data={pokemon}
      numColumns={3}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.cell}
          onPress={() => !item.caught && onCatch(item)}
          disabled={item.caught}
        >
          <Image
            source={{ uri: item.sprite }}
            style={[styles.sprite, !item.caught && styles.silhouette]}
          />
          <Text style={styles.name}>{item.caught ? item.name : '???'}</Text>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  cell: { flex: 1, alignItems: 'center', padding: 8 },
  sprite: { width: 64, height: 64 },
  silhouette: { tintColor: '#2d3436' },
  name: { fontSize: 10, textAlign: 'center', marginTop: 2, textTransform: 'capitalize' },
});
```

- [ ] **Step 3: Crear `frontend/app/(tabs)/pokedex.tsx`**

```typescript
import { useEffect, useState } from 'react';
import { View, Text, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { collectionApi, PokemonEntry } from '../../src/api/collection';
import { PokemonGrid } from '../../src/components/PokemonGrid';
import { profileApi } from '../../src/api/profile';

export default function PokedexScreen() {
  const [pokemon, setPokemon] = useState<PokemonEntry[]>([]);
  const [coins, setCoins] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const [poke, profile] = await Promise.all([
      collectionApi.getAvailable(),
      profileApi.get(),
    ]);
    setPokemon(poke);
    setCoins(profile.coins);
    setLoading(false);
  };

  const handleCatch = (entry: PokemonEntry) => {
    Alert.alert(
      `Capturar ${entry.name}`,
      `Cuesta 50 monedas. Tienes ${coins}.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Capturar', onPress: async () => {
            try {
              const result = await collectionApi.catch(entry.id);
              setCoins(result.remaining_coins);
              setPokemon((prev) =>
                prev.map((p) => p.id === entry.id ? { ...p, caught: true } : p)
              );
            } catch (e: any) {
              Alert.alert('Error', e.message);
            }
          }
        }
      ]
    );
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Pokédex</Text>
        <Text style={styles.coins}>🪙 {coins}</Text>
      </View>
      <Text style={styles.subtitle}>
        {pokemon.filter((p) => p.caught).length} / 151 capturados
      </Text>
      <PokemonGrid pokemon={pokemon} onCatch={handleCatch} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold' },
  coins: { fontSize: 18 },
  subtitle: { textAlign: 'center', color: '#636e72', marginBottom: 8 },
});
```

- [ ] **Step 4: Probar en Expo Go** — navegar a Pokédex, ver 151 Pokémon, intentar capturar uno.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/api/collection.ts frontend/src/components/PokemonGrid.tsx frontend/app/(tabs)/pokedex.tsx
git commit -m "feat: Pokedex screen with catch mechanic"
```

---

## Task 12: Calendario Mensual (Detalle de Hábito)

**Files:**
- Create: `frontend/src/components/MonthlyCalendar.tsx`
- Create: `frontend/app/habits/[id].tsx`

- [ ] **Step 1: Agregar endpoint de completaciones al backend**

En `backend/src/routes/habits.ts`, agregar:

```typescript
// GET /habits/:id/completions
router.get('/:id/completions', async (req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('habit_completions')
    .select('completed_on')
    .eq('habit_id', req.params.id)
    .eq('user_id', req.user!.id);

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json((data ?? []).map((c) => c.completed_on));
});
```

- [ ] **Step 2: Agregar a `frontend/src/api/habits.ts`**

```typescript
getCompletions: (id: string) =>
  apiRequest<string[]>(`/habits/${id}/completions`),
```

- [ ] **Step 3: Crear `frontend/src/components/MonthlyCalendar.tsx`**

```typescript
import { Calendar } from 'react-native-calendars';

interface Props {
  completedDates: string[]; // ["2026-03-01", ...]
}

export function MonthlyCalendar({ completedDates }: Props) {
  const marked = Object.fromEntries(
    completedDates.map((d) => [d, { selected: true, selectedColor: '#00b894' }])
  );

  return (
    <Calendar
      markedDates={marked}
      theme={{ todayTextColor: '#e74c3c', selectedDayBackgroundColor: '#00b894' }}
    />
  );
}
```

- [ ] **Step 4: Crear `frontend/app/habits/[id].tsx`**

```typescript
import { useEffect, useState } from 'react';
import { ScrollView, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { habitsApi, Habit } from '../../src/api/habits';
import { MonthlyCalendar } from '../../src/components/MonthlyCalendar';

export default function HabitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [habit, setHabit] = useState<Habit | null>(null);
  const [completions, setCompletions] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([
      habitsApi.getAll().then((h) => h.find((x) => x.id === id) ?? null),
      habitsApi.getCompletions(id),
    ]).then(([h, c]) => { setHabit(h); setCompletions(c); });
  }, [id]);

  if (!habit) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{habit.name}</Text>
      <MonthlyCalendar completedDates={completions} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa' },
  title: { fontSize: 22, fontWeight: 'bold', padding: 16 },
});
```

- [ ] **Step 5: Commit**

```bash
git add backend/src/routes/habits.ts frontend/src/components/MonthlyCalendar.tsx frontend/app/habits/
git commit -m "feat: monthly calendar in habit detail"
```

---

## Task 13: Analytics (MVP)

**Files:**
- Create: `backend/src/routes/analytics.ts` (opcional si se calcula en frontend)
- Create: `frontend/app/(tabs)/analytics.tsx`

- [ ] **Step 1: Agregar endpoint de analytics al backend**

En `backend/src/app.ts` agregar la ruta de analytics. Crear `backend/src/routes/analytics.ts`:

```typescript
import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { supabase } from '../services/supabase';
import { calculateStreak, calculateMaxStreak } from '../services/streakService';

const router = Router();
router.use(requireAuth);

router.get('/', async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const { data: habits } = await supabase
    .from('habits')
    .select('id, name')
    .eq('user_id', userId);

  if (!habits?.length) { res.json([]); return; }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const fromDate = thirtyDaysAgo.toISOString().split('T')[0];
  const today = new Date().toISOString().split('T')[0];

  const stats = await Promise.all(
    habits.map(async (habit) => {
      const { data: completions } = await supabase
        .from('habit_completions')
        .select('completed_on')
        .eq('habit_id', habit.id)
        .eq('user_id', userId);

      const allDates = (completions ?? []).map((c) => c.completed_on);
      const recentDates = allDates.filter((d) => d >= fromDate);
      const completionRate = Math.round((recentDates.length / 30) * 100);
      const currentStreak = calculateStreak(allDates, today);
      const maxStreak = calculateMaxStreak(allDates);

      return { habit_id: habit.id, name: habit.name, completion_rate: completionRate, current_streak: currentStreak, max_streak: maxStreak, total_completions: allDates.length };
    })
  );

  res.json(stats);
});

export default router;
```

Registrar en `app.ts`: `app.use('/analytics', analyticsRoutes);`

- [ ] **Step 2: Crear `frontend/app/(tabs)/analytics.tsx`**

```typescript
import { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { apiRequest } from '../../src/api/client';

interface HabitStats {
  habit_id: string;
  name: string;
  completion_rate: number;
  current_streak: number;
  max_streak: number;
  total_completions: number;
}

export default function AnalyticsScreen() {
  const [stats, setStats] = useState<HabitStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<HabitStats[]>('/analytics').then(setStats).finally(() => setLoading(false));
  }, []);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Analytics</Text>
      {stats.map((s) => (
        <View key={s.habit_id} style={styles.card}>
          <Text style={styles.habitName}>{s.name}</Text>
          <Text>Completación (30 días): {s.completion_rate}%</Text>
          <Text>Racha actual: {s.current_streak} días 🔥</Text>
          <Text>Racha máxima: {s.max_streak} días</Text>
          <Text>Total histórico: {s.total_completions} completaciones</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa', padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, gap: 4 },
  habitName: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
});
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/routes/analytics.ts frontend/app/(tabs)/analytics.tsx
git commit -m "feat: analytics endpoint and screen (MVP)"
```

---

## Task 14: Perfil + Deployment

**Files:**
- Create: `frontend/app/(tabs)/profile.tsx`

- [ ] **Step 1: Crear `frontend/app/(tabs)/profile.tsx`**

```typescript
import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { profileApi } from '../../src/api/profile';
import { useAuthStore } from '../../src/store/authStore';
import * as Notifications from 'expo-notifications';

export default function ProfileScreen() {
  const [profile, setProfile] = useState<any>(null);
  const { user, logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    profileApi.get().then(setProfile);
  }, []);

  const handleLogout = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{user?.username}</Text>
      <Text style={styles.email}>{user?.email}</Text>
      {profile && (
        <View style={styles.stats}>
          <Text>🪙 {profile.coins} monedas</Text>
          <Text>✅ {profile.total_completions} completaciones</Text>
          <Text>🔴 {profile.total_caught} / 151 Pokémon</Text>
        </View>
      )}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa', padding: 24, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', marginTop: 32 },
  email: { color: '#636e72', marginBottom: 24 },
  stats: { gap: 8, marginBottom: 32, alignItems: 'center' },
  logoutButton: { backgroundColor: '#d63031', padding: 14, borderRadius: 8, width: '100%', alignItems: 'center' },
  logoutText: { color: '#fff', fontWeight: 'bold' },
});
```

- [ ] **Step 2: Desplegar el backend en Railway**

1. Crear cuenta en [railway.app](https://railway.app)
2. New Project → Deploy from GitHub repo → seleccionar el repo, raíz `backend/`
3. Agregar las variables de entorno (`SUPABASE_URL`, `SUPABASE_JWT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`)
4. Railway auto-detecta Node.js y ejecuta `npm run build && npm start`
5. Copiar la URL pública generada (ej. `https://habitos-backend.railway.app`)

- [ ] **Step 3: Actualizar URL en frontend**

En `frontend/constants/api.ts`, actualizar `API_BASE_URL` con la URL de Railway para producción. Usar `expo-constants` con `app.json` extra para manejar dev/prod:

```json
// app.json
"extra": {
  "apiUrl": "https://habitos-backend.railway.app"
}
```

- [ ] **Step 4: Commit final**

```bash
git add frontend/app/(tabs)/profile.tsx frontend/constants/api.ts frontend/app.json
git commit -m "feat: profile screen and production deployment config"
```

---

## Orden de Desarrollo Recomendado (2 personas)

| Semana | Persona A (Backend) | Persona B (Frontend) |
|---|---|---|
| 1 | Task 1 + 3 (Setup + Supabase) | Task 2 (Setup Expo) |
| 2 | Task 4 + 5 (Auth + StreakService) | Task 8 (Auth Frontend) |
| 3 | Task 6 (Habits CRUD) | Task 9 + 10 (Habits API + pantalla Hoy) |
| 4 | Task 7 (Pokémon Service) | Task 10 cont. (tab Hábitos) |
| 5 | Task 13 (Analytics backend) | Task 11 (Pokédex) |
| 6 | Buffer + bugs | Task 12 (Calendario mensual) |
| 7 | — | Task 13 cont. (Analytics frontend) |
| 8 | Task 14 (Despliegue) | Task 14 cont. (Perfil) |
| 9 | QA + demo prep | QA + demo prep |
