# Habidex — Diseño de Mockups UI

**Fecha:** 2026-04-21  
**Versión aprobada:** `all-screens-v3.html`  
**Archivo de referencia:** `Habidex/.superpowers/brainstorm/310-1777341571/content/all-screens-v3.html`

---

## Estilo visual: Pixel Neon

El sistema de diseño combina estética de videojuego retro con glow neon, sin scanlines CRT.

### Paleta de colores

| Rol | Valor | Uso |
|-----|-------|-----|
| Fondo base | `#08080f` | Background de todas las pantallas |
| Fondo página | `#06060d` | Wrapper exterior |
| Rojo primario | `#cc0000` | Acciones principales, headers, bordes activos |
| Rojo glow | `#e63946` | Texto activo, tab seleccionado, estados de alerta |
| Dorado | `#ffd700` | Monedas, rachas, valores destacados |
| Verde | `#4ade80` | Hábitos completados, Pokémon atrapados, logros |
| Texto principal | `#c8c8d8` | Texto de interfaz general |
| Texto secundario | `#b0b0c4` | Labels, tabs inactivos |
| Texto deshabilitado | `#666` | Hábitos pendientes, items bloqueados |

### Tipografía

- **`Press Start 2P`** — todas las etiquetas, títulos, valores, botones y navegación
- **`Rajdhani 500/600/700`** — nunca usada en pantallas de app; reservada para el wrapper de galería de mockups
- Tamaños en mockup a escala 212px (~0.54× del dispositivo real):
  - Logo / título de pantalla: 8–11px
  - Labels y botones: 5–6px
  - Valores grandes (monedas, %): 8–9px
  - Números pequeños (Pokédex, streaks): 4–5px

### Efectos

- **Glow rojo:** `text-shadow: 0 0 8–16px rgba(204,0,0,0.6–0.8)` en elementos activos
- **Glow dorado:** `text-shadow: 0 0 8px rgba(255,215,0,0.8)` en monedas y rachas
- **Glow verde:** `text-shadow: 0 0 6–10px rgba(74,222,128,0.5–0.9)` en completados
- **Grid sutil:** `background-image` de líneas en `rgba(255,255,255,0.018)` a 18px
- **Sin scanlines CRT**

---

## Estructura de la app

### Navegación

Tab bar inferior con 4 tabs:

| Icono | Label | Pantalla |
|-------|-------|----------|
| ⊞ | HÁBITOS | Lista de hábitos del día |
| ◉ | POKÉDEX | Galería Gen I |
| 📊 | STATS | Analytics |
| ♟ | PERFIL | Perfil del entrenador |

Las pantallas Login, Completado y Atrapar Pokémon son modales/flows sin tab bar.

### Zonas HIG (iPhone 14, 390×844pt)

Escala del mockup: 212px de ancho = factor 0.544×

| Zona | Medida HIG | Píxeles en mockup |
|------|-----------|-------------------|
| Status bar (Face ID) | 59pt | 32px |
| Navigation bar | 44pt | ~30px (header actual) |
| Área de contenido | variable | 459 − 32 − 30 − 29 − 18 = 350px |
| Tab bar mínimo | 49pt | 29px (padding 8px×2 + contenido) |
| Home indicator | 34pt | 18px |

**Todos los touch targets tienen `min-height: 24px` (≈44pt en dispositivo real).**

---

## Pantallas

### 01 — Login

**Flujo:** Pantalla de entrada, sin tab bar.

**Elementos:**
- Status bar del sistema
- Header: logo `★ HABIDEX`
- Logo central: `★ HABIDEX ★` + subtítulo `HABIT TRAINER`
- Campo: CORREO (input pixel)
- Campo: CONTRASEÑA (input pixel)
- Botón primario: `► INICIAR SESIÓN`
- Separador: `── ─ ──`
- Texto: `¿NO TIENES CUENTA?`
- Botón secundario (outline): `► REGISTRARSE`
- Home indicator del sistema

---

### 02 — Hábitos (tab principal)

**Flujo:** Tab activo ⊞ HÁBITOS.

**Elementos:**
- Status bar + header con logo y contador de monedas (`💰 120 PTS`)
- Fila de fecha: `LUN  21  ABR  2026`
- Caja de racha: `🔥 RACHA` / `3 DÍAS` (fondo rojo oscuro, borde rojo)
- Lista de hábitos:
  - Hábito completado: texto verde con `✓`, dots en verde, borde verde tenue
  - Hábitos pendientes: texto `#666`, dots en rojo, sin borde especial
  - Cada hábito muestra 7 dots de progreso semanal
- Botón `▶ COMPLETAR HOY`
- Tab bar + home indicator

---

### 03 — Completado

**Flujo:** Modal que aparece al completar un hábito.

**Elementos:**
- Status bar + header con monedas actualizadas
- Anillo grande verde con `✓` (glow verde intenso)
- Título `¡COMPLETADO!` en verde
- Nombre del hábito en gris
- Dos reward boxes en fila:
  - Box dorado: `+10` / `💰 MONEDAS`
  - Box rojo: `🔥 4` / `DÍAS RACHA`
- Botón `► CONTINUAR`
- Home indicator

---

### 04 — Pokédex (tab)

**Flujo:** Tab activo ◉ POKÉDEX.

**Elementos:**
- Status bar + header `★ POKÉDEX` con monedas
- Fila: título `GEN I` + contador `✓ 4/151`
- Grid 3 columnas de Pokémon:
  - **Atrapado:** sprite a color, número en verde, nombre en verde, borde verde tenue
  - **Bloqueado:** sprite en silhouette (`filter: brightness(0.1) saturate(0)`), número en `#333`, nombre `???`
- Sprites de PokéAPI: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/{id}.png`
- Tab bar + home indicator

---

### 05 — Atrapar Pokémon

**Flujo:** Modal desde Pokédex al tocar un Pokémon bloqueado.

**Elementos:**
- Status bar + header con `◄ VOLVER` y monedas
- Anillo rojo grande con sprite del Pokémon (66×66px, `image-rendering: pixelated`)
- Número (`#006`) y nombre (`CHARIZARD`) en grande
- Badges de tipo: `FUEGO` (fondo rojo), `VOLADOR` (fondo azul)
- Costo: `💰 COSTO: 50 MONEDAS` en dorado
- Botón primario: `► ATRAPAR POKÉMON`
- Botón outline: `CANCELAR`
- Home indicator

---

### 06 — Perfil (tab)

**Flujo:** Tab activo ♟ PERFIL.

**Elementos:**
- Status bar + header con logo y monedas
- Fila de avatar: círculo 40px con emoji 🎮, label `ENTRENADOR`, nombre `GERARDO`
- Grid 2×2 de estadísticas:
  - Monedas (dorado), Racha actual (rojo), Pokémon atrapados (verde), Mejor racha (dorado)
- Barra de progreso Pokédex: `POKÉDEX: 4 / 151` + track con relleno rojo
- Botón destructivo (muy tenue): `► CERRAR SESIÓN`
- Tab bar + home indicator

---

### 07 — Analytics / Stats (tab)

**Flujo:** Tab activo 📊 STATS. Pantalla con scroll vertical.

**Elementos:**
- Status bar + header `★ ANALYTICS` con label `ÚLT. 30 DÍAS`
- Fila combo (donut + chips):
  - Donut SVG: arco verde al 73%, texto central `73%` y `30 DÍAS`
  - Chips a la derecha: total histórico (dorado) y racha actual (rojo)
- Sección `▸ POR HÁBITO — 30 DÍAS`
- Por cada hábito:
  - Nombre + porcentaje (rojo si < 90%, verde si ≥ 90%)
  - Barra horizontal con relleno pixelado (rojo < 90%, verde ≥ 90%)
  - Racha actual y máxima en dorado
- Tab bar sticky en `bottom: 18px` + home indicator

---

## Componentes reutilizables

| Componente | Descripción |
|-----------|-------------|
| `.statusbar` | Status bar 32px, sticky top:0, hora + íconos |
| `.hdr` | Navigation bar sticky top:32px, logo + monedas |
| `.tabs` | Tab bar 29px, sticky bottom:18px, 4 tabs |
| `.homebar` | Home indicator 18px, sticky bottom:0, pill blanco |
| `.habit` | Fila de hábito con min-height 24px, dots, check |
| `.btn-r` | Botón primario rojo, min-height 24px |
| `.btn-out` | Botón outline rojo, min-height 24px |
| `.input-px` | Input pixel style, min-height 24px |
| `.poke-cell` | Celda Pokédex con sprite 32px (touch target cumplido) |
| `.rew-box` | Caja de recompensa dorado/rojo |
| `.stat-box` | Caja de estadística con valor grande + label |
| `.mb-row` | Fila de analytics con barra y streaks |

---

## Decisiones de diseño

- **Tipografía fija vs Dynamic Type:** `Press Start 2P` es intencional como estética de juego. Excepción válida según HIG para apps de gamificación.
- **Color `#666` en hábitos pendientes:** borderline en contraste. Aceptado por ser texto decorativo, no de acción.
- **Sprites de PokéAPI en runtime:** sin assets estáticos en el repo (ver RR-03 en CLAUDE.md).
- **Home indicator siempre visible:** diseño apunta a iPhone X+ (Face ID). No se considera soporte para modelos con botón Home.
