# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Habidex is a mobile habit-tracking app with Pokémon gamification. Users complete daily habits, earn coins, and spend them to catch Pokémon in a Gen 1 Pokédex.

**Monorepo structure:** `backend/` (Node.js/Express/TypeScript REST API) + `frontend/` (Expo/React Native/TypeScript).

## Commands

### Backend
```bash
cd backend
npm install          # install dependencies
npm run dev          # start dev server with ts-node-dev
npm run build        # compile TypeScript
npm start            # run compiled JS
npm test             # run Jest tests
npm test -- --testPathPattern=streakService   # run a single test file
```

### Frontend
```bash
cd frontend
npm install
npx expo start       # start Expo dev server (scan QR with Expo Go)
npx expo start --clear   # clear cache and restart
```

> Expo Go on a physical device cannot reach `localhost`. Set `API_BASE_URL` in `frontend/constants/api.ts` to the machine's local IP (e.g. `http://192.168.x.x:3000`) during development.

## Architecture

### Auth Flow
Supabase Auth issues a JWT on login/register. The client stores it in `expo-secure-store` via the Zustand `authStore`, and sends it as `Authorization: Bearer <token>` on every API call. Express middleware verifies the JWT using `SUPABASE_JWT_SECRET` (from `backend/.env`) with `jsonwebtoken.verify` — no JWKS.

### Backend (`backend/src/`)
- `app.ts` — Express app (no `listen`; kept separate so Jest can import it)
- `server.ts` — entry point, calls `app.listen`
- `middleware/auth.ts` — JWT verification; attaches `req.user` (Supabase user)
- `services/streakService.ts` — streak calculation and coin bonus logic (most critical business logic; has unit tests)
- `services/pokemonService.ts` — PokéAPI calls + in-memory cache for all 151 Pokémon (cache is populated at server startup)
- `services/supabase.ts` — Supabase client singleton using `SUPABASE_SERVICE_ROLE_KEY`

### Frontend (`frontend/`)
- `app/` — Expo Router file-based routing: `(auth)/` stack for unauthenticated, `(tabs)/` for authenticated
- `app/_layout.tsx` — root layout + auth guard (redirects based on Zustand token state)
- `src/api/client.ts` — base fetch wrapper that injects the JWT header
- `src/store/authStore.ts` — Zustand store: `token`, `user`, `login()`, `logout()`
- `src/utils/notifications.ts` — `scheduleHabitNotification()`, `cancelNotification()`, `rescheduleAll()` using `expo-notifications`

### Database (Supabase/PostgreSQL)
Four tables: `profiles` (extends `auth.users`), `habits`, `habit_completions` (unique per habit+day; ON DELETE CASCADE from habits), `pokemon_collection` (unique per user+pokemon_id).

### Gamification Rules
- Complete habit → **+10 coins**; if resulting streak is a multiple of 7 → **+25 bonus coins**
- Catch Pokémon → **costs 50 coins** (atomic transaction: check balance → check duplicate → insert + decrement)
- Streak is calculated server-side: count consecutive days backward from today (or yesterday if today not yet completed)

## Environment Variables

Backend `.env` (see `backend/.env.example`):
```
SUPABASE_URL=
SUPABASE_JWT_SECRET=      # Supabase Dashboard → Settings → API → JWT Secret
SUPABASE_SERVICE_ROLE_KEY=
PORT=3000
```

## Key Constraints

- **No `expo eject`** — must run with `npx expo start` (RR-01)
- **Supabase only** — no Firebase or other databases (RR-02)
- **Pokémon sprites from PokéAPI at runtime** — no static image assets in repo (RR-03)
- **Gen 1 only** — exactly 151 Pokémon (IDs 1–151)
- **Notifications are local only** — `expo-notifications`, no push server needed
- **Error messages in Spanish** — all API error responses: `{ "error": "..." }`

## Docs

- Spec & requirements: `docs/superpowers/specs/2026-03-24-habitos-pokemon-design.md`
- Implementation plan: `docs/superpowers/plans/2026-03-24-habitos-pokemon.md`
- Study notes (for the team): `docs/notas/`

## Session Notes

### How we work
We use the `university-project-guide` skill — guided step by step, student writes the code, Claude reviews and commits. After each approved step: commit + push + Obsidian notes at `C:\Users\Jerry\Tera\iOS\`.

### Backend progress (as of 2026-04-06)
**Done:**
- `backend/package.json` — npm init, dependencies installed, scripts configured, Jest config
- `backend/.gitignore` — node_modules, dist, .env
- `backend/tsconfig.json` — CommonJS, ES2020, esModuleInterop, resolveJsonModule
- `backend/src/app.ts` — Express app, express.json() middleware, no listen
- `backend/src/server.ts` — listens on process.env.PORT || 3000
- `backend/src/types/index.ts` — AuthUser, Habit, HabitCompletion, Profile, PokemonSummary, Express Request augmentation
- `backend/src/middleware/errorHandler.ts` — 4-param error middleware, responds { error: '...' }
- `backend/.env.example` + `.env` — Supabase credentials (SUPABASE_URL, SUPABASE_JWT_SECRET usa Legacy JWT Secret, SUPABASE_SERVICE_ROLE_KEY)
- `backend/src/services/supabase.ts` — Supabase client singleton con service role key
- `backend/src/middleware/auth.ts` — JWT verification; extrae Bearer token, valida con SUPABASE_JWT_SECRET, adjunta req.user

**Next up (backend):**
- `backend/src/routes/auth.ts` — POST /auth/register, /auth/login
- `backend/src/routes/habits.ts` — CRUD + POST /habits/:id/complete
- `backend/src/services/streakService.ts` — streak + coin logic (needs unit tests)
- `backend/src/services/pokemonService.ts` — PokéAPI + in-memory cache
- `backend/src/routes/collection.ts` — GET /collection/available, POST /collection/catch
- `backend/src/routes/profile.ts` — GET /profile
- Wire all routes into app.ts
