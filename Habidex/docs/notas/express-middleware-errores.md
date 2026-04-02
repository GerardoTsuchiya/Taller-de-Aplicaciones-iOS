---
tags: [express, middleware, errores, typescript, iOS]
related: ["[[express-app-vs-server]]", "[[typescript-interfaces]]"]
---

## Qué es
Un middleware de manejo de errores en Express es una función especial que captura cualquier error lanzado en las rutas y lo procesa de forma centralizada. Express lo identifica porque tiene exactamente **cuatro parámetros**: `(err, req, res, next)`.

## Conceptos detallados

### Cómo funciona el middleware de errores
En Express, cuando una ruta lanza un error (con `throw` o pasándolo a `next(error)`), Express lo pasa automáticamente al siguiente middleware que tenga cuatro parámetros. Esto evita tener que manejar errores en cada ruta individualmente.

```
Petición → Ruta → Error lanzado → errorHandler → Respuesta 500
```

### Por qué cuatro parámetros
Express distingue el middleware de errores del middleware normal por el número de parámetros. Si tu función tiene tres parámetros `(req, res, next)`, Express la trata como middleware normal. Con cuatro `(err, req, res, next)`, Express la usa solo cuando hay errores.

**Importante:** aunque no uses `next` en el body, debes incluirlo en la firma — si lo omites, Express no lo reconocerá como middleware de errores.

### Convención de errores en este proyecto
Todas las respuestas de error de la API usan la clave `error` (no `message`):
```json
{ "error": "Error interno del servidor" }
```
Esto asegura que el frontend siempre sepa dónde leer el mensaje de error.

### `err.stack`
La propiedad `stack` de un objeto `Error` contiene el rastro completo de dónde ocurrió el error (archivo, línea, función). Se imprime con `console.error` para debugging, pero **no se envía al cliente** por seguridad — revelar el stack trace en producción puede exponer información interna del servidor.

---

## Implementación en Habidex

`backend/src/middleware/errorHandler.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';

function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
    console.error(err.stack);
    res.status(500).json({ error: 'Error interno del servidor' });
}

export default errorHandler;
```

Se registra en `app.ts` **al final**, después de todas las rutas:
```typescript
app.use(errorHandler); // siempre al final
```

---

## Comandos / funciones importantes
- `res.status(500).json({})` — responde con código HTTP 500 y un cuerpo JSON
- `console.error(err.stack)` — imprime el error completo en la consola del servidor
- `next(error)` — desde cualquier ruta, pasa el error al middleware de errores

## Errores comunes
- Definir el middleware con solo tres parámetros — Express no lo reconoce como manejador de errores
- Omitir `next` aunque no se use — la firma de cuatro parámetros es obligatoria
- Usar `message` en vez de `error` como clave del JSON — inconsistente con el resto de la API
- Registrar el middleware antes de las rutas — los errores de las rutas no llegarán a él
- Enviar `err.stack` al cliente — expone información interna del servidor
