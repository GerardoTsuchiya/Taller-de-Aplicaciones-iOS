---
tags: [typescript, interfaces, supabase, uuid, iOS]
related: ["[[tsconfig-node]]", "[[express-app-vs-server]]"]
---

## Qué es
Las interfaces en TypeScript definen la "forma" de un objeto — qué campos tiene y qué tipo es cada uno. Sirven como contratos que todo el código debe respetar, permitiendo que el compilador detecte errores antes de que el programa corra.

## Conceptos detallados

### `interface` vs objeto normal
Un objeto en JavaScript puede tener cualquier forma. Una interfaz en TypeScript le dice al compilador exactamente qué campos esperar y de qué tipo. Si algún lugar del código intenta acceder a un campo que no existe en la interfaz, TypeScript lo marca como error **antes de correr el programa**.

### `string | null` — tipos de unión
El operador `|` significa "puede ser uno u otro tipo". `string | null` significa que el campo existe en el objeto pero su valor puede ser una cadena de texto o `null`. Se usa cuando una columna en la base de datos es *nullable* — es decir, puede no tener valor.

```typescript
description: string | null;   // puede ser "Hacer 30 minutos" o null
reminder_time: string | null; // puede ser "08:00" o null
```

### `field?: type` — campos opcionales
El `?` después del nombre significa que el campo puede no estar presente en el objeto. Es diferente a `null` — `null` es un valor explícito, `?` significa que la propiedad puede no existir.

### `declare global` — extender tipos de librerías externas
Cuando usas una librería como Express, sus tipos ya están definidos. Si quieres agregar un campo extra (como `user` en `Request`), no puedes modificar la librería directamente. `declare global` te permite "fusionar" tu definición con la existente sin tocar el código de Express.

### Por qué los IDs son `string` y no `number`
Supabase usa **UUIDs** como identificadores: cadenas con formato `"a3f2c1d0-4b3e-11ec-81d3-0242ac130003"`. Son strings, no enteros. Si defines el `id` como `number`, TypeScript no detectará el error cuando recibas un UUID del servidor — el programa fallará en tiempo de ejecución en vez de al compilar.

**Excepción:** Los IDs de PokéAPI sí son números enteros (1–151), por eso `PokemonSummary.id` es `number`.

### Por qué usar `snake_case` en los campos
Supabase retorna los datos con los **nombres exactos de las columnas** de PostgreSQL, que por convención usan `snake_case` (`user_id`, `created_at`, `reminder_enabled`). Si defines la interfaz con `camelCase` (`userId`, `createdAt`), TypeScript no detectará el desajuste y el campo llegará como `undefined` en tiempo de ejecución.

---

## Implementación en Habidex

Todas las interfaces viven en `backend/src/types/index.ts` y se exportan para que todo el backend las use.

### `AuthUser`
Representa al usuario que ya inició sesión. Solo `id` y `email` porque Supabase maneja todo lo demás (contraseña, sesión, tokens).

```typescript
interface AuthUser {
    id: string;      // UUID de Supabase, ej: "a3f2c1d0-4b3e-..."
    email: string;   // "usuario@gmail.com"
}
```

### `Habit`
Un hábito creado por el usuario. `description` y `reminder_time` son `string | null` porque en la base de datos esas columnas son *nullable*.

```typescript
interface Habit {
    id: string;
    user_id: string;              // a quién pertenece el hábito
    name: string;                 // "Ir al gimnasio"
    description: string | null;
    reminder_enabled: boolean;    // ¿tiene recordatorio activado?
    reminder_time: string | null; // "08:00" o null
    created_at: string;           // "2026-03-24T10:00:00Z"
}
```

### `HabitCompletion`
Registra que un hábito fue completado en un día. No tiene `completed: boolean` porque **el hecho de que exista el registro ya significa que se completó** — si no se completó, simplemente no hay registro.

```typescript
interface HabitCompletion {
    id: string;
    user_id: string;
    habit_id: string;
    completed_on: string; // "2026-04-01" — solo la fecha, no datetime
}
```

### `Profile`
El perfil del usuario dentro de Habidex. Su `id` es el mismo UUID de Supabase Auth — no es una entidad separada, es una extensión del usuario.

```typescript
interface Profile {
    id: string;        // mismo UUID que AuthUser.id
    username: string;  // "GerardoT"
    coins: number;     // 150 — monedas para atrapar Pokémon
    created_at: string;
}
```

### `PokemonSummary`
Un Pokémon tal como aparece en el Pokédex. `caught` indica si este usuario ya lo atrapó. `id` es `number` porque PokéAPI usa enteros del 1 al 151.

```typescript
interface PokemonSummary {
    id: number;      // 25 = Pikachu
    name: string;    // "pikachu"
    sprite: string;  // URL de la imagen desde PokéAPI
    caught: boolean; // ¿lo atrapó este usuario?
}
```

### `declare global` — extender Express Request
Le dice a TypeScript que `req.user` existe en todas las peticiones de Express. Sin esto, el middleware de autenticación no podría escribir `req.user = usuario` sin errores de compilación.

```typescript
declare global {
    namespace Express {
        interface Request {
            user?: AuthUser; // opcional — solo existe en rutas autenticadas
        }
    }
}
```

---

## Comandos / funciones importantes
- `export interface X {}` — define y exporta una interfaz para usarla en otros archivos
- `string | null` — campo que existe pero puede ser nulo
- `field?: type` — campo que puede no estar presente
- `declare global {}` — extiende tipos de librerías externas

## Errores comunes
- Usar `number` para IDs de Supabase — Supabase usa UUIDs (strings)
- Usar `camelCase` para campos que vienen de Supabase — llegará `undefined` en runtime
- Usar `Date` para fechas de la BD — Supabase retorna fechas como strings ISO (`"YYYY-MM-DD"`)
- Usar `completed: boolean` en HabitCompletion — la existencia del registro es suficiente
- Olvidar exportar las interfaces — otros archivos no podrán importarlas
