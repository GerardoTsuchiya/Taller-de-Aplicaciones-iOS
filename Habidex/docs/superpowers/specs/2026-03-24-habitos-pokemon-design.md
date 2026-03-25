# Habitos + Pokémon — Diseño de la Aplicación

**Fecha:** 2026-03-24
**Equipo:** 2 personas
**Entrega:** Última semana de Mayo 2026 (~9 semanas)
**Curso:** Proyecto universitario — Desarrollo de aplicaciones móviles

---

## Requerimientos

### Requerimientos Funcionales

---

**RF-01 — Registrar usuario**
**Descripción:** El sistema debe permitir crear una cuenta de usuario proporcionando un correo electrónico único, una contraseña y un nombre de usuario, siempre que los datos sean válidos y el correo no esté registrado previamente.
**Criterios de aceptación:**
- ✅ Se crea la cuenta y el usuario queda autenticado al proporcionar email válido, contraseña de mínimo 6 caracteres y username no vacío.
- ❌ No se acepta si el email ya está registrado → error "El correo ya está en uso".
- ❌ No se acepta si la contraseña tiene menos de 6 caracteres → error de validación.
- ❌ No se acepta si algún campo está vacío → error de validación por campo.

---

**RF-02 — Autenticar usuario**
**Descripción:** El sistema debe permitir iniciar sesión con correo electrónico y contraseña, siempre que las credenciales sean correctas, y mantener la sesión activa mediante un token JWT.
**Criterios de aceptación:**
- ✅ Se devuelve un JWT válido al ingresar credenciales correctas.
- ✅ La sesión persiste al cerrar y reabrir la app.
- ❌ No se acepta si el email no existe o la contraseña es incorrecta → error "Credenciales inválidas" (sin especificar cuál campo falló).
- ❌ No se acepta si el token está expirado o es inválido → HTTP 401 en cualquier endpoint protegido.

---

**RF-03 — Crear hábito**
**Descripción:** El sistema debe permitir al usuario autenticado crear un hábito con nombre obligatorio, descripción opcional y configuración de recordatorio opcional, siempre que el nombre no esté vacío.
**Criterios de aceptación:**
- ✅ El hábito aparece en la lista del usuario tras ser creado con nombre válido.
- ✅ Si `reminder_enabled = true` y se proporciona `reminder_time`, se programa la notificación local.
- ❌ No se acepta si el nombre está vacío → error de validación.
- ❌ No se acepta si `reminder_enabled = true` pero `reminder_time` es nulo → error de validación.

---

**RF-04 — Completar hábito**
**Descripción:** El sistema debe permitir al usuario marcar un hábito como completado una sola vez por día, calculando y acreditando las monedas correspondientes incluyendo el bonus de racha si aplica.
**Criterios de aceptación:**
- ✅ Se acreditan +10 monedas al completar. Si la racha resultante es múltiplo de 7, se acreditan +25 adicionales.
- ✅ El hábito aparece como completado en el calendario semanal y mensual del día actual.
- ❌ No se acepta completar el mismo hábito dos veces en el mismo día → HTTP 409 "Hábito ya completado hoy".
- ❌ No se acepta si el hábito no pertenece al usuario autenticado → HTTP 403.

---

**RF-05 — Calcular racha de hábito**
**Descripción:** El sistema debe calcular la racha consecutiva de cada hábito contando días consecutivos completados hacia atrás desde hoy (o desde ayer si hoy aún no fue completado), reiniciando a cero si hay un día sin completar.
**Criterios de aceptación:**
- ✅ La racha refleja correctamente los días consecutivos completados.
- ✅ No se penaliza el día en curso si aún no fue completado.
- ❌ No se acepta que la racha continúe si hay un día sin completar antes de ayer.
- ❌ No se acepta que el bonus de 7 días se pague más de una vez por el mismo múltiplo de 7.

---

**RF-06 — Capturar Pokémon**
**Descripción:** El sistema debe permitir al usuario gastar 50 monedas para capturar un Pokémon no capturado de los 151 disponibles, realizando la operación de forma atómica y actualizando su colección y saldo de monedas.
**Criterios de aceptación:**
- ✅ El Pokémon aparece en la Pokédex del usuario con sprite a color tras la captura exitosa.
- ✅ El saldo de monedas se reduce en 50 inmediatamente.
- ❌ No se acepta si el usuario tiene menos de 50 monedas → HTTP 400 "Monedas insuficientes".
- ❌ No se acepta capturar el mismo Pokémon dos veces → HTTP 409 "Pokémon ya capturado".

---

**RF-07 — Mostrar Pokédex**
**Descripción:** El sistema debe mostrar al usuario los 151 Pokémon de la primera generación, diferenciando visualmente los capturados (sprite a color) de los no capturados (silueta negra), siempre que el usuario esté autenticado.
**Criterios de aceptación:**
- ✅ Se muestran exactamente 151 Pokémon en un grid.
- ✅ Los capturados muestran sprite a color y nombre; los no capturados muestran silueta y nombre oculto ("???").
- ❌ No se acepta mostrar Pokémon de generaciones posteriores a la primera.
- ❌ No se acepta que un Pokémon capturado aparezca como silueta o viceversa.

---

**RF-08 — Programar recordatorio por hábito**
**Descripción:** El sistema debe permitir configurar una notificación local diaria a una hora específica para cada hábito, reprogramando automáticamente todas las notificaciones activas al iniciar sesión para soportar reinstalaciones o cambios de dispositivo.
**Criterios de aceptación:**
- ✅ La notificación se dispara a la hora configurada cada día mientras la app tenga permisos.
- ✅ Al eliminar un hábito, su notificación deja de dispararse.
- ✅ Al iniciar sesión, todas las notificaciones activas son reprogramadas.
- ❌ No se acepta programar notificación si el usuario rechazó los permisos del sistema → `reminder_enabled` se fuerza a `false`.
- ❌ No se acepta que una notificación de un hábito eliminado siga apareciendo.

---

**RF-09 — Visualizar calendario semanal**
**Descripción:** El sistema debe mostrar en la pantalla de Hoy un calendario de la semana actual (lunes a domingo) indicando los días en que el usuario completó al menos un hábito.
**Criterios de aceptación:**
- ✅ Los días con al menos una completación se muestran con un indicador visual diferenciado.
- ✅ El día actual está resaltado.
- ❌ No se acepta mostrar como completado un día en que no se completó ningún hábito.

---

**RF-10 — Visualizar calendario mensual de hábito**
**Descripción:** El sistema debe mostrar en el detalle de un hábito un calendario del mes actual marcando los días en que ese hábito específico fue completado.
**Criterios de aceptación:**
- ✅ Solo aparecen marcados los días en que ese hábito fue completado, no otros hábitos.
- ✅ El calendario refleja datos históricos correctos al navegar a meses anteriores.
- ❌ No se acepta mostrar completaciones de otros hábitos en el calendario del hábito seleccionado.

---

**RF-11 — Mostrar analíticas de hábitos (MVP)**
**Descripción:** El sistema debe mostrar al usuario estadísticas de sus hábitos incluyendo porcentaje de completación en los últimos 30 días, racha actual y racha máxima por hábito, y total histórico de completaciones.
**Criterios de aceptación:**
- ✅ El porcentaje de completación refleja correctamente los días completados sobre los 30 días anteriores.
- ✅ La racha máxima nunca es menor que la racha actual.
- ✅ El total histórico coincide con el conteo real de registros en `habit_completions`.
- ❌ No se acepta mostrar estadísticas de hábitos de otros usuarios.

---

### Requerimientos No Funcionales

---

**RNF-01 — Responder eficientemente**
**Descripción:** El sistema debe responder a las solicitudes de la API REST en un tiempo máximo de 2 segundos bajo condiciones normales de uso, para garantizar una experiencia de usuario fluida.
**Criterios de aceptación:**
- ✅ El 95% de las solicitudes a `/habits`, `/profile` y `/collection` responden en menos de 2 segundos.
- ❌ No se acepta que operaciones de lectura básicas superen los 2 segundos de forma consistente.

---

**RNF-02 — Proteger datos del usuario**
**Descripción:** El sistema debe garantizar que cada usuario solo pueda acceder y modificar sus propios datos, validando el JWT en cada endpoint protegido y rechazando solicitudes no autorizadas.
**Criterios de aceptación:**
- ✅ Un usuario autenticado no puede acceder a hábitos, colección o perfil de otro usuario.
- ✅ Cualquier request sin token o con token inválido recibe HTTP 401.
- ❌ No se acepta que un endpoint protegido responda con datos de otro usuario.

---

**RNF-03 — Funcionar en iOS y Android**
**Descripción:** El sistema debe ejecutarse correctamente en dispositivos iOS y Android mediante Expo Go, sin diferencias funcionales entre plataformas.
**Criterios de aceptación:**
- ✅ Todas las funcionalidades operan igual en iOS (≥15) y Android (≥10).
- ✅ Las notificaciones locales se disparan en ambas plataformas.
- ❌ No se acepta que una funcionalidad opere en una plataforma y falle en la otra.

---

**RNF-04 — Ser usable sin capacitación**
**Descripción:** El sistema debe permitir a un usuario nuevo registrarse, crear su primer hábito y completarlo por primera vez sin necesidad de instrucciones externas, mediante una interfaz intuitiva.
**Criterios de aceptación:**
- ✅ Un usuario nuevo puede completar el flujo registro → crear hábito → completar hábito en menos de 3 minutos sin ayuda.
- ❌ No se acepta que flujos críticos (registro, completar hábito, capturar Pokémon) requieran más de 3 pasos desde la pantalla principal.

---

### Requerimientos de Restricción

---

**RR-01 — Utilizar Expo Go como plataforma de desarrollo**
**Descripción:** El sistema debe desarrollarse con Expo Go usando React Native y TypeScript como tecnologías de frontend, sin ejectar el proyecto a código nativo puro, para garantizar compatibilidad con el entorno de evaluación universitario.
**Criterios de aceptación:**
- ✅ La app corre con `npx expo start` sin configuración nativa adicional.
- ❌ No se acepta usar `expo eject` ni código nativo en Swift/Kotlin directamente.

---

**RR-02 — Utilizar Supabase como proveedor de base de datos y autenticación**
**Descripción:** El sistema debe usar Supabase como única fuente de datos persistentes y para la gestión de autenticación, sin integrar otras bases de datos o servicios de auth externos.
**Criterios de aceptación:**
- ✅ Todos los datos de usuarios, hábitos y colección persisten en Supabase PostgreSQL.
- ❌ No se acepta usar Firebase, MongoDB u otro servicio de base de datos en paralelo.

---

**RR-03 — Consumir PokéAPI para datos de Pokémon**
**Descripción:** El sistema debe obtener los datos y sprites de los 151 Pokémon exclusivamente desde la PokéAPI pública, sin almacenar imágenes localmente en el proyecto.
**Criterios de aceptación:**
- ✅ Los sprites se cargan desde las URLs de PokéAPI en tiempo de ejecución.
- ❌ No se acepta incluir imágenes de Pokémon como assets estáticos en el repositorio.

---

**RR-04 — Entregar en la última semana de Mayo de 2026**
**Descripción:** El sistema debe estar funcional y demostrable en su versión MVP antes del inicio de la última semana de Mayo de 2026, priorizando las funcionalidades core sobre las features stretch.
**Criterios de aceptación:**
- ✅ Auth, gestión de hábitos, Pokédex básica y Analytics MVP están operativos para la fecha de entrega.
- ❌ No se acepta presentar solo el backend o solo el frontend de forma aislada; la integración completa es requisito.

---

## Resumen

Aplicación móvil de seguimiento y constancia de hábitos con gamificación basada en Pokémon. Los usuarios registran hábitos diarios binarios (hecho/no hecho), mantienen rachas y ganan monedas al completar hábitos. Las monedas se gastan para capturar Pokémon en una colección estilo Pokédex.

---

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | Expo Go + React Native + TypeScript |
| Backend | Node.js + Express (REST API) |
| Base de datos | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email/password + JWT) |
| Datos Pokémon | PokéAPI (llamada desde backend) |
| Notificaciones | Expo Notifications (locales, sin backend) |

---

## Arquitectura

```
┌─────────────────────────────────────────────┐
│           Expo Go (React Native + TS)        │
│  - Pantallas y navegación                    │
│  - Expo Notifications (recordatorios)        │
│  - Llamadas a API propia + PokéAPI           │
└──────────────┬──────────────────────────────┘
               │ HTTP / REST + JWT
┌──────────────▼──────────────────────────────┐
│         Node.js + Express (API REST)         │
│  - Rutas: /habits, /collection, /auth        │
│  - Lógica de negocio (rachas, monedas)       │
│  - Validación y autorización (JWT)           │
└──────────┬──────────────────────────────────┘
           │
┌──────────▼──────────┐     ┌─────────────────┐
│   Supabase           │     │   PokéAPI        │
│  - Auth (email/pass) │     │  (datos y sprites│
│  - PostgreSQL        │     │   de Pokémon)    │
└──────────────────────┘     └─────────────────┘
```

**Autenticación:** Supabase Auth emite un JWT → el cliente lo envía en cada request a Express como `Authorization: Bearer <token>` → Express lo verifica usando el `SUPABASE_JWT_SECRET` (variable de entorno `SUPABASE_JWT_SECRET` obtenida desde el dashboard de Supabase en Settings → API → JWT Secret). No se usa JWKS; la verificación es con `jsonwebtoken.verify(token, process.env.SUPABASE_JWT_SECRET)`.

**PokéAPI:** Se llama desde el backend para controlar qué Pokémon están disponibles y cachear respuestas. No se expone directamente al cliente.

---

## Modelo de Datos (PostgreSQL / Supabase)

```sql
-- Perfil de usuario (extiende auth.users de Supabase)
profiles
  id          uuid PRIMARY KEY  -- FK → auth.users
  username    text NOT NULL
  coins       integer NOT NULL DEFAULT 0
  created_at  timestamp DEFAULT now()

-- Hábitos
habits
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid()
  user_id           uuid NOT NULL REFERENCES profiles(id)
  name              text NOT NULL
  description       text
  reminder_enabled  boolean NOT NULL DEFAULT false
  reminder_time     time    -- ej. '07:30', NULL si reminder_enabled = false
  created_at        timestamp DEFAULT now()

-- Completaciones diarias (una por hábito por día)
habit_completions
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
  habit_id      uuid NOT NULL REFERENCES habits(id) ON DELETE CASCADE
  user_id       uuid NOT NULL REFERENCES profiles(id)
  completed_on  date NOT NULL
  UNIQUE (habit_id, completed_on)

-- Colección Pokémon del usuario
pokemon_collection
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
  user_id     uuid NOT NULL REFERENCES profiles(id)
  pokemon_id  integer NOT NULL  -- ID de PokéAPI (ej. 25 = Pikachu)
  caught_at   timestamp DEFAULT now()
  UNIQUE (user_id, pokemon_id)
```

---

## Lógica de Gamificación

### Monedas por completación
- Completar un hábito → **+10 monedas**
- Si la racha del hábito alcanza exactamente un múltiplo de 7 días (7, 14, 21, ...) → **+25 monedas de bonus adicional**
  - Ejemplo: día 7 → +10 + 25 = 35 monedas. Día 8 → +10 monedas. Día 14 → +10 + 25 = 35 monedas.
  - El bonus se paga cada vez que se alcanza un nuevo múltiplo de 7, incentivando mantener la racha indefinidamente.

### Cálculo de racha
- La racha se calcula en el backend contando `habit_completions` consecutivas hacia atrás desde hoy.
- Si hoy no está completado, la racha cuenta desde ayer hacia atrás (no se penaliza el día en curso).
- Si hay un día sin completar antes de ayer, la racha se rompe y empieza desde el último completado.

### Captura de Pokémon (transaccional)
- Capturar un Pokémon → **cuesta 50 monedas**
- La operación en `POST /collection/catch` se ejecuta como una transacción de Supabase:
  1. Verificar que `profile.coins >= 50` → si no, responder `HTTP 400 { error: "Monedas insuficientes" }`
  2. Verificar que el `pokemon_id` no esté ya en `pokemon_collection` del usuario → si ya está, `HTTP 409 { error: "Pokémon ya capturado" }`
  3. Insertar en `pokemon_collection` + decrementar `profile.coins` en una sola transacción
- Un hábito solo puede completarse una vez por día (constraint `UNIQUE` en la tabla)

### Pokédex — definición de "disponibles"
- La Pokédex muestra los primeros **151 Pokémon** (generación 1) de PokéAPI.
- Todos los 151 son visibles desde el inicio: capturados muestran el sprite a color, no capturados muestran silueta negra.
- `GET /collection/available` devuelve los 151 Pokémon con un flag `caught: boolean` para cada uno.
- No hay progresión — cualquier Pokémon no capturado puede comprarse con 50 monedas en cualquier momento.

---

## API REST (Express)

Todos los endpoints (excepto auth) requieren `Authorization: Bearer <jwt>`.

### Formato de error estándar
Todos los errores devuelven:
```json
{ "error": "Descripción del error en español" }
```
Con el código HTTP apropiado: `400` (validación), `401` (no autenticado), `403` (no autorizado), `404` (no encontrado), `409` (conflicto), `500` (error interno).

### Endpoints

```
AUTH
  POST   /auth/register         crear cuenta (email + password + username)
                                → HTTP 201 { user, token }
  POST   /auth/login            iniciar sesión
                                → HTTP 200 { user, token }

HÁBITOS
  GET    /habits                listar hábitos del usuario autenticado
  POST   /habits                crear hábito
                                body: { name, description?, reminder_enabled, reminder_time? }
  PUT    /habits/:id            editar hábito
  DELETE /habits/:id            eliminar hábito → HTTP 204
  POST   /habits/:id/complete   marcar como completado hoy
                                → HTTP 200 { coins_earned, streak, total_coins }
                                → HTTP 409 si ya fue completado hoy

COLECCIÓN POKÉMON
  GET    /collection/available  lista los 151 Pokémon con flag caught: boolean
  POST   /collection/catch      capturar Pokémon (transaccional)
                                body: { pokemon_id }
                                → HTTP 200 { pokemon, remaining_coins }
                                → HTTP 400 si monedas insuficientes
                                → HTTP 409 si ya capturado

PERFIL
  GET    /profile               datos del usuario (username, coins, stats)
                                → { username, coins, total_completions, total_caught }
```

---

## Navegación Frontend

### Stack de Auth (sin sesión activa)
- **Login** — email + password
- **Registro** — email + password + username

### Tab Navigator (5 tabs, tras iniciar sesión)

#### 🏠 Hoy (Home)
- Calendario semanal (Lun–Dom) mostrando días con al menos una completación
- Lista de hábitos del día con botón para marcar como completado
- Contador de monedas disponibles

#### 📋 Hábitos
- Lista de todos los hábitos con racha actual
- Crear / editar / eliminar hábito
- Configurar recordatorio por hábito (hora)
- **Detalle de hábito** → Calendario mensual con historial completo de completaciones

#### 📊 Analytics
**MVP (obligatorio):**
- Porcentaje de completación por hábito (últimos 30 días)
- Racha actual y racha máxima por hábito
- Total histórico de hábitos completados

**Stretch (si hay tiempo):**
- Gráfica de progreso semanal/mensual
- Comparativa entre hábitos
- Días más productivos de la semana

#### 🔴 Pokédex
- Grid de los 151 Pokémon: capturados (sprites a color) y no capturados (siluetas)
- Pantalla de captura: seleccionar Pokémon no capturado + confirmar gasto de 50 monedas

#### ⚙️ Perfil
- Stats del usuario (total completaciones, rachas, Pokémon capturados)
- Cerrar sesión

---

## Notificaciones

Implementadas con `expo-notifications` (locales, sin servidor):

- Al crear/editar un hábito con recordatorio → se programa una notificación diaria recurrente a la hora configurada usando el identificador del hábito como ID de notificación
- Al eliminar un hábito → se cancela su notificación programada por ID
- **Al iniciar sesión:** el frontend consulta `GET /habits` y reprograma todas las notificaciones activas (maneja reinstalación de app o cambio de dispositivo)
- Mensaje: `"¡Es hora de [nombre del hábito]! 🎯"`
- Requiere solicitar permisos en el primer uso; si el usuario los rechaza, `reminder_enabled` se fuerza a `false`
- No requiere ningún endpoint en el backend

---

## Entorno y Despliegue

### Variables de entorno del backend (.env)
```
SUPABASE_URL=https://<proyecto>.supabase.co
SUPABASE_JWT_SECRET=<obtenido de Supabase → Settings → API → JWT Secret>
SUPABASE_SERVICE_ROLE_KEY=<para operaciones administrativas>
PORT=3000
```

### Desarrollo local con Expo Go
- Expo Go en dispositivo físico no puede acceder a `localhost`. El backend debe correr en la IP local de la máquina (ej. `192.168.x.x:3000`) y configurarse en el cliente como `API_BASE_URL`.
- Usar `expo-constants` o un archivo `.env` en el frontend para la URL del backend.

### Despliegue
- Backend: **Railway** o **Render** (plan gratuito, suficiente para proyecto universitario)
- Supabase: plan gratuito (límites generosos para desarrollo)

---

## Alcance y Decisiones de Diseño

- **Hábitos binarios únicamente** — hecho/no hecho, sin cantidades. Simplifica el modelo y la UX.
- **PokéAPI desde backend** — evita exponer lógica de disponibilidad al cliente y permite cacheo.
- **151 Pokémon (Gen 1)** — scope controlado, icónicos y reconocibles.
- **Notificaciones locales** — sin push notifications de servidor. Más simple, funciona offline.
- **Analytics calculados desde `habit_completions`** — no se necesitan tablas adicionales de resumen.
- **Sin features sociales** — fuera de alcance para el tiempo disponible.

---

## Riesgos y Mitigaciones

| Riesgo | Mitigación |
|---|---|
| Analytics con gráficas toma más tiempo del esperado | Gráficas son stretch; MVP usa solo texto y porcentajes |
| PokéAPI rate limiting | Cachear los 151 Pokémon en memoria al arrancar el servidor |
| Expo Notifications requiere permisos en iOS/Android | Solicitar permisos en onboarding; deshabilitar recordatorio si se rechaza |
| Expo Go no accede a localhost | Usar IP local en desarrollo; Railway/Render en producción |
| 9 semanas para 2 personas | MVP funcional primero (auth + hábitos + Pokédex básica); Analytics y pulido al final |
