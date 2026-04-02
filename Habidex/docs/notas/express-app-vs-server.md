---
tags: [express, nodejs, typescript, arquitectura, iOS]
related: ["[[tsconfig-node]]", "[[npm-y-estructura-de-proyecto-node]]"]
---

## Qué es
En un backend Express con TypeScript se separa la configuración de la app (`app.ts`) del punto de entrada del servidor (`server.ts`). Esta separación permite importar la app en tests sin abrir puertos reales.

## Conceptos detallados

### Qué es Express
Express es un framework minimalista para Node.js que simplifica crear servidores HTTP. Te permite definir rutas (`GET /habits`), agregar middlewares (funciones que procesan las peticiones) y manejar errores de forma centralizada.

### Middleware en Express
Un middleware es una función que se ejecuta entre que llega la petición y que se manda la respuesta. Se registra con `app.use()`. `express.json()` es un middleware built-in que lee el cuerpo de las peticiones HTTP y lo convierte en un objeto JavaScript accesible como `req.body`.

### Por qué separar `app.ts` de `server.ts`
Si pones `app.listen()` en el mismo archivo donde configuras las rutas, cada vez que un test importe ese archivo se abrirá un puerto real. Eso causa:
- **"address already in use"** — si corres múltiples tests en paralelo
- **Tests lentos** — abrir y cerrar puertos tiene overhead
- **Tests acoplados** — dependen de que el puerto esté disponible

Separando la configuración del `listen()`, los tests importan solo `app.ts` y hacen peticiones sin necesitar un puerto real.

### `process.env.PORT`
Las plataformas de producción (Railway, Render, Heroku) asignan el puerto dinámicamente a través de variables de entorno. Si hardcodeas `3000`, tu app fallará en producción porque intentará usar un puerto que la plataforma no le asignó. Con `process.env.PORT || 3000` usas el puerto de la plataforma en producción y `3000` como fallback en desarrollo.

---

## Implementación en Habidex

### `backend/src/app.ts`
Configura Express, registra middlewares globales y exporta la app. Las rutas se agregarán después en este mismo archivo.

```typescript
import express from 'express';

const app = express();
app.use(express.json()); // parsea req.body como JSON

export default app;
```

### `backend/src/server.ts`
Único punto de entrada. Solo importa la app y abre el puerto.

```typescript
import app from './app';

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`El servidor esta corriendo en el puerto ${PORT}`);
});
```

### Scripts en `package.json`
```json
"scripts": {
  "dev": "ts-node-dev --respawn src/server.ts",
  "build": "tsc",
  "start": "node dist/server.js",
  "test": "jest"
}
```

- `dev` — desarrollo: corre TypeScript directo, reinicia al guardar cambios (`--respawn`)
- `build` — compila TypeScript a JavaScript en `dist/`
- `start` — producción: corre el JavaScript ya compilado
- `test` — corre las pruebas unitarias con Jest

---

## Comandos / funciones importantes
- `express()` — crea una instancia de la aplicación Express
- `app.use(middleware)` — registra un middleware global
- `app.use(express.json())` — parsea el body de peticiones como JSON
- `app.listen(PORT, callback)` — abre el puerto y comienza a escuchar peticiones
- `process.env.PORT` — lee el puerto desde variables de entorno

## Errores comunes
- Poner `app.listen()` en `app.ts` — rompe los tests porque abre el puerto al importar
- Usar `require`/`module.exports` en vez de `import`/`export default` en TypeScript
- Hardcodear el puerto en vez de leerlo de `process.env.PORT` — falla en producción
