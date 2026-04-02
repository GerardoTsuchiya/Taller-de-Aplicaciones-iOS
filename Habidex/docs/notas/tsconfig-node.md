---
tags: [typescript, tsconfig, nodejs, commonjs, iOS]
related: ["[[npm-y-estructura-de-proyecto-node]]", "[[dependencies-y-gitignore]]"]
---

## Qué es
`tsconfig.json` es el archivo de configuración de TypeScript. Le dice al compilador desde dónde leer el código fuente, a dónde escribir el JavaScript compilado, y qué tan estricto ser al validar el código.

## Conceptos detallados

### CommonJS vs ESM
Node.js tiene dos sistemas de módulos:
- **CommonJS** (el clásico): `const express = require('express')` y `module.exports = app`
- **ESM** (moderno): `import express from 'express'` y `export default app`

TypeScript moderno prefiere la sintaxis ESM, pero Node.js históricamente usa CommonJS. Con `"module": "commonjs"` le decimos al compilador que genere código CommonJS compatible con Node.js, y con `esModuleInterop: true` podemos escribir la sintaxis ESM moderna aunque las librerías usen CommonJS internamente.

### `esModuleInterop: true`
Sin esta opción, importar una librería CommonJS en TypeScript requiere: `import * as express from 'express'`. Con ella puedes escribir la forma natural: `import express from 'express'`. TypeScript genera el código puente necesario automáticamente.

### `resolveJsonModule: true`
Permite importar archivos `.json` directamente como módulos: `import config from './config.json'`. TypeScript además infiere automáticamente los tipos del JSON — si el JSON tiene `{ "port": 3000 }`, TypeScript sabe que `config.port` es `number`.

### `"types": []` — por qué NO usarlo
Un arreglo vacío le dice a TypeScript "no cargues ningún paquete `@types/*`", anulando todos los `@types/express`, `@types/node`, etc. instalados. Sin este campo, TypeScript los descubre automáticamente desde `node_modules/@types/`.

### Opciones incompatibles con Node.js backend
- `"jsx": "react-jsx"` — es para React, el backend no tiene JSX
- `"verbatimModuleSyntax": true` — incompatible con CommonJS, causa errores de compilación
- `"isolatedModules": true` — es para bundlers como Webpack, no para Node.js directo

---

## Implementación en Habidex

`backend/tsconfig.json` configurado para Node.js con CommonJS:

```json
{
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
    "module": "commonjs",
    "target": "ES2020",
    "strict": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "sourceMap": true,
    "declaration": true
  },
  "include": ["src", "tests"]
}
```

- `rootDir: "./src"` — el código TypeScript vive en `src/`
- `outDir: "./dist"` — el JavaScript compilado va a `dist/` (ignorado por `.gitignore`)
- `include: ["src", "tests"]` — TypeScript compila tanto el código como los tests

---

## Comandos / funciones importantes
- `tsc` — compila todo el proyecto según `tsconfig.json`
- `tsc --noEmit` — verifica tipos sin generar archivos (útil en CI)
- `"rootDir"` — carpeta fuente de TypeScript
- `"outDir"` — carpeta destino del JavaScript compilado
- `"strict": true` — activa todas las validaciones estrictas

## Errores comunes
- Usar `"verbatimModuleSyntax": true` con CommonJS — son incompatibles
- Usar `"jsx": "react-jsx"` en el backend — JSX es solo para React
- Poner `"types": []` vacío — anula todos los `@types/*` instalados
- Olvidar `"include"` — TypeScript puede no encontrar los archivos de tests
