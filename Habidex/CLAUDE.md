# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Habidex is a mobile habit-tracking app with Pokémon gamification. Users complete daily habits, earn coins, and spend them to catch Pokémon in a Gen 1 Pokédex.

**Monorepo structure:** `backend/` (Node.js/Express/TypeScript REST API) + `frontend/` (Expo/React Native/TypeScript — pendiente de implementar).

## Commands

### Backend
```bash
cd backend
npm install          # install dependencies
npm run dev          # start dev server with ts-node-dev
npm run build        # compile TypeScript (usa tsconfig.build.json)
npm start            # run compiled JS
npm test             # run Jest tests (17 tests, todos pasando)
npm test -- --testPathPatterns=streakService   # run a single test file (Jest 30+)
```

### Frontend (pendiente)
```bash
cd frontend
npm install
npx expo start       # start Expo dev server (scan QR with Expo Go)
npx expo start --clear   # clear cache and restart
```

> Expo Go on a physical device cannot reach `localhost`. Set `API_BASE_URL` in `frontend/constants/api.ts` to the machine's local IP (e.g. `http://192.168.x.x:3000`) during development.

## Architecture

### Auth Flow
Supabase Auth issues a JWT on login/register. The client stores it and sends it as `Authorization: Bearer <token>` on every API call. Express middleware verifies the JWT using `SUPABASE_JWT_SECRET` with `jsonwebtoken.verify` — no JWKS. The Supabase JWT uses `sub` (not `id`) for the user UUID — `req.user.sub` is the correct field in all route handlers.

### Backend (`backend/src/`)
- `app.ts` — Express app (no `listen`; kept separate so Jest can import it without calling PokéAPI)
- `server.ts` — entry point: calls `initPokemonCache()` first, then `app.listen`
- `middleware/auth.ts` — JWT verification; attaches `req.user` (AuthUser with `sub` and `email`)
- `middleware/errorHandler.ts` — 4-param error middleware, responds `{ error: '...' }`
- `services/streakService.ts` — streak + coin logic (unit tested, 17 tests passing)
- `services/pokemonService.ts` — 1 request to PokéAPI at startup, caches 151 Pokémon in memory
- `services/supabase.ts` — Supabase client singleton using `SUPABASE_SERVICE_ROLE_KEY`
- `routes/auth.ts` — POST /auth/register, POST /auth/login
- `routes/habits.ts` — CRUD + POST /habits/:id/complete + GET /habits/:id/completions
- `routes/collection.ts` — GET /collection/available, POST /collection/catch
- `routes/profile.ts` — GET /profile, GET /analytics

### TypeScript Config
Two tsconfig files to avoid `rootDir` conflict with tests:
- `tsconfig.json` — used for type-checking and ts-jest (includes `src/` and `tests/`)
- `tsconfig.build.json` — used for `npm run build` (only `src/`, sets `rootDir: "./src"`)

### Frontend (`frontend/` — pendiente de implementar)
- `app/` — Expo Router file-based routing: `(auth)/` stack for unauthenticated, `(tabs)/` for authenticated
- `app/_layout.tsx` — root layout + auth guard (redirects based on Zustand token state)
- `src/api/client.ts` — base fetch wrapper that injects the JWT header
- `src/store/authStore.ts` — Zustand store: `token`, `user`, `login()`, `logout()`
- `src/utils/notifications.ts` — `scheduleHabitNotification()`, `cancelNotification()`, `rescheduleAll()` using `expo-notifications`

### Database (Supabase/PostgreSQL) — CREADA el 2026-05-05
Cuatro tablas ya existentes en Supabase:
- `profiles` — extiende `auth.users`; campos: id, username, coins (default 0), created_at
- `habits` — campos: id, user_id, name, description, reminder_time, reminder_enabled, created_at
- `habit_completions` — campos: id, user_id, habit_id, completed_on (DATE); UNIQUE(habit_id, completed_on); ON DELETE CASCADE desde habits
- `pokemon_collection` — campos: id, user_id, pokemon_id (1-151), caught_at; UNIQUE(user_id, pokemon_id)

Trigger `on_auth_user_created` crea automáticamente un registro en `profiles` al registrarse un usuario.

**RLS:** deshabilitado (el backend usa service role key que lo bypasea; el control de acceso se hace en código con filtros `user_id`).

### Gamification Rules
- Complete habit → **+10 coins**; if resulting streak is a multiple of 7 → **+25 bonus coins**
- Catch Pokémon → **costs 50 coins** (check balance → check duplicate → insert → decrement)
- Streak calculated server-side: count consecutive days backward from today (or yesterday if today not yet completed)

## API Endpoints (backend completo)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/health` | No | Health check |
| POST | `/auth/register` | No | Registrar usuario |
| POST | `/auth/login` | No | Iniciar sesión → retorna `session.access_token` |
| GET | `/habits` | Sí | Listar hábitos del usuario |
| POST | `/habits` | Sí | Crear hábito (name requerido) |
| PUT | `/habits/:id` | Sí | Editar hábito (solo campos enviados) |
| DELETE | `/habits/:id` | Sí | Eliminar hábito → 204 |
| POST | `/habits/:id/complete` | Sí | Completar hábito → `{ streak, coins_earned, coins_breakdown, total_coins }` |
| GET | `/habits/:id/completions` | Sí | Historial → `{ completions, current_streak, max_streak }` |
| GET | `/collection/available` | Sí | 151 Pokémon con `caught: true/false` |
| POST | `/collection/catch` | Sí | Capturar Pokémon → body: `{ pokemon_id }` (entero 1-151) |
| GET | `/profile` | Sí | Perfil + `habits_count` + `pokemon_caught` |
| GET | `/profile/analytics` | Sí | Stats por hábito: rate, current_streak, max_streak, overall_rate |

**Auth header:** `Authorization: Bearer <access_token>` (el token viene de `session.access_token` en login/register).

## Environment Variables

Backend `.env`:
```
SUPABASE_URL=https://riyvwzdlypcupqhievtq.supabase.co
SUPABASE_JWT_SECRET=<Legacy JWT Secret del dashboard>
SUPABASE_SERVICE_ROLE_KEY=<service role key>
PORT=3000
```

## Key Constraints

- **No `expo eject`** — must run with `npx expo start` (RR-01)
- **Supabase only** — no Firebase or other databases (RR-02)
- **Pokémon sprites from PokéAPI at runtime** — no static image assets in repo (RR-03)
- **Gen 1 only** — exactly 151 Pokémon (IDs 1–151)
- **Notifications are local only** — `expo-notifications`, no push server needed
- **Error messages in Spanish** — all API error responses: `{ "error": "..." }`
- **req.user.sub** — siempre usar `.sub` (no `.id`) para obtener el UUID del usuario en routes
- **JWT ES256** — Supabase firma tokens con ES256 (ECDSA). El middleware de auth verifica con la clave pública del JWKS endpoint (`/auth/v1/.well-known/jwks.json`), cacheada en memoria. NO usar `SUPABASE_JWT_SECRET` para `jwt.verify` — ese era el secreto legacy HS256 y ya no aplica.
- **DELETE ownership check** — `DELETE /habits/:id` usa `.select()` en el query de Supabase para verificar que realmente se eliminó una fila; si retorna vacío → 404 (Supabase no devuelve error al borrar 0 filas)

## Docs

- Spec & requirements: `docs/superpowers/specs/2026-03-24-habitos-pokemon-design.md`
- Plan de implementación backend: `docs/superpowers/plans/2026-05-05-backend-completo.md`
- Plan frontend UI: `docs/superpowers/plans/2026-04-21-frontend-ui.md` (pendiente)
- Plan de pruebas: `iOS_Plan-Pruebas.pdf` (en raíz del monorepo)

## Estado del Proyecto (2026-05-06)

### Backend — COMPLETO + PROBADO ✅
Todo implementado, probado con plan de pruebas automatizado (37/37 pasaron):
- Auth (register/login)
- Hábitos (CRUD + completación con streaks + historial)
- Pokémon (caché en memoria + pokédex + captura)
- Perfil + analíticas
- Base de datos creada en Supabase
- 17 unit tests pasando (`streakService`)

**Bugs encontrados y corregidos durante el plan de pruebas (2026-05-06):**
1. `middleware/auth.ts` — Supabase migró a ES256 (ECDSA). Actualizado a JWKS verification con clave pública cacheada.
2. `routes/habits.ts` DELETE — no verificaba si realmente eliminó alguna fila; ahora retorna 404 si el hábito no existe o es ajeno.
3. `routes/profile.ts` GET analytics — ruta correcta es `/profile/analytics` (no `/analytics`); CLAUDE.md y tests actualizados.

**Script de pruebas automatizado:** `backend/test-plan.js` — corre todos los 37 casos via API (Node.js nativo).

### Plan de Pruebas — EJECUTADO ✅
- 37/37 casos ejecutados vía API pasaron
- CP-02.1 + CP-05/05.1/05.2 pendientes (requieren app iOS)

### Frontend — PENDIENTE
El frontend en Expo/React Native no ha sido implementado aún.
Mockups diseñados (estilo Pixel Neon) en `Habidex/.superpowers/brainstorm/`.
Plan de implementación frontend pendiente de redactar.
