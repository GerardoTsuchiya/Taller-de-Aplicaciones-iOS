---
tags: [npm, dependencias, gitignore, nodejs, iOS]
related: ["[[npm-y-estructura-de-proyecto-node]]"]
---

## Qué es
Las dependencias de un proyecto Node.js se dividen en dos grupos: `dependencies` (código que corre en producción) y `devDependencies` (herramientas que solo se usan durante el desarrollo). Esta separación permite que el servidor de producción solo instale lo estrictamente necesario.

## Conceptos detallados

### `dependencies` vs `devDependencies`
Cuando subes tu app a un servidor de producción, corres `npm install --production`, que **solo instala `dependencies`** e ignora `devDependencies`. Esto reduce el peso del deploy, acelera la instalación y evita exponer herramientas de desarrollo en producción.

En producción tu código ya está **compilado a JavaScript** (`npm run build`), entonces TypeScript, `ts-node-dev` y Jest ya no sirven para nada ahí.

### `.gitignore`
Le dice a Git qué archivos y carpetas ignorar y nunca incluir en commits. Es crítico para:
- **`node_modules/`** — miles de archivos que se pueden regenerar con `npm install`. Subirlos al repo desperdicia espacio y hace los commits enormes.
- **`dist/`** — código compilado que se regenera con `npm run build`. No tiene sentido versionarlo.
- **`.env`** — contiene credenciales y secretos. Nunca debe subirse al repo público.

---

## Implementación en Habidex

**Dependencias de producción** — código que corre en el servidor:
```bash
npm install express @supabase/supabase-js jsonwebtoken node-fetch
```

| Paquete | Para qué sirve |
|---|---|
| `express` | Framework HTTP — recibe peticiones y manda respuestas |
| `@supabase/supabase-js` | Cliente oficial para conectarse a Supabase |
| `jsonwebtoken` | Verifica los tokens JWT del frontend |
| `node-fetch` | Hace peticiones HTTP al PokéAPI |

**Dependencias de desarrollo** — solo para programar y hacer pruebas:
```bash
npm install -D typescript ts-node-dev @types/express @types/jsonwebtoken @types/node jest ts-jest @types/jest
```

| Paquete | Para qué sirve |
|---|---|
| `typescript` | Compilador de TypeScript a JavaScript |
| `ts-node-dev` | Corre TypeScript en dev, recarga al guardar |
| `@types/*` | Tipos de TypeScript para las librerías |
| `jest` + `ts-jest` | Framework de pruebas unitarias |

**`.gitignore` del backend:**
```
node_modules/
dist/
.env
```

---

## Comandos / funciones importantes
- `npm install <pkg>` — instala en `dependencies` (producción)
- `npm install -D <pkg>` — instala en `devDependencies` (solo desarrollo)
- `npm install --production` — instala solo `dependencies`, ignora `devDependencies`

## Errores comunes
- No crear `.gitignore` antes del primer commit — `node_modules/` se sube al repo (miles de archivos innecesarios)
- El `.gitignore` debe incluir `node_modules/`, `dist/` y `.env`
- Instalar todo sin `-D` — funciona localmente pero el deploy de producción descarga paquetes innecesarios
