---
tags: [npm, nodejs, estructura-de-proyecto, iOS]
related: []
---

## Qué es
`npm` (Node Package Manager) es el gestor de paquetes de Node.js. Permite inicializar proyectos, instalar dependencias y definir scripts de automatización. `npm init -y` genera un `package.json` respondiendo "sí" a todas las preguntas automáticamente.

## Conceptos detallados

### `package.json`
Es el corazón de cualquier proyecto Node.js. Describe el proyecto (nombre, versión, autor) y lista todas sus dependencias. Sin este archivo, Node.js no sabe qué paquetes necesita tu proyecto ni cómo correrlo.

### `mkdir -p`
El flag `-p` ("parents") le dice a `mkdir` que cree todas las carpetas intermedias que no existan. Sin `-p`, si intentas crear `backend/src/routes` y `backend/` no existe todavía, el comando falla. Con `-p`, las crea todas de un solo golpe.

### Por qué organizar en carpetas
Separar el código en carpetas (`routes/`, `services/`, `middleware/`, `types/`) es una convención de arquitectura llamada **separación de responsabilidades** — cada carpeta tiene un propósito claro. Esto hace el código más fácil de encontrar, modificar y entender conforme el proyecto crece.

---

## Implementación en Habidex

La estructura de carpetas del backend se creó con un solo comando:

```bash
mkdir -p backend/tests backend/src/routes backend/src/services backend/src/middleware backend/src/types
cd backend
npm init -y
```

**Resultado:**
```
backend/
├── src/
│   ├── routes/      ← rutas HTTP (/habits, /auth, /collection, /profile)
│   ├── services/    ← lógica de negocio (streakService, pokemonService, supabase)
│   ├── middleware/  ← auth JWT, manejo de errores
│   └── types/       ← interfaces TypeScript compartidas
├── tests/           ← pruebas unitarias con Jest
└── package.json     ← generado por npm init -y
```

---

## Comandos / funciones importantes
- `mkdir -p <ruta>` — crea carpetas anidadas en un solo comando
- `npm init -y` — inicializa un proyecto Node.js generando `package.json` sin preguntas interactivas
- `npm install <pkg>` — instala una dependencia de producción (queda en `dependencies`)
- `npm install -D <pkg>` — instala una dependencia de desarrollo (queda en `devDependencies`)

## Errores comunes
- Olvidar el flag `-p` en `mkdir` cuando la carpeta padre no existe aún — da error "No such file or directory"
- Correr `npm init` sin `-y` en un script automatizado — se queda esperando input del usuario
