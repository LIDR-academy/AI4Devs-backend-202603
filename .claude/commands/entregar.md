---
description: "Checklist final de entrega: tests, OpenAPI, prompts, rama, build, PR description"
---

Ejecuta el checklist de entrega **en orden estricto**. Si cualquier paso falla, muestra el error y detente ahí — no continúes al siguiente paso.

## Checklist

### Paso 1 — Tests en verde
```bash
cd backend && npm test
```
Criterio: todos los tests pasan. Si alguno falla, muestra el error completo y **para aquí**.

### Paso 2 — OpenAPI válido
```bash
cd backend && npx @redocly/cli lint api-spec.yaml
```
Criterio: cero errores (warnings son aceptables). Si hay errores, muéstralos y **para aquí**.

### Paso 3 — Diario de prompts existe
Verifica que `prompts/prompts-iniciales.md` existe y tiene al menos una entrada.
Si no existe, recuerda al humano que ejecute `/log-prompt` y **para aquí**.

### Paso 4 — Rama no es main
```bash
git branch --show-current
```
Criterio: la rama actual NO es `main`. Si es `main`, **para aquí** y pide crear una rama de feature.

### Paso 5 — Compilación TypeScript limpia
```bash
cd backend && npm run build
```
Criterio: cero errores de compilación. Si hay errores, muéstralos y **para aquí**.

---

## Paso 6 — Genera descripción de PR

Sólo si los 5 pasos anteriores pasan, genera la descripción del PR para que el humano la copie:

```markdown
## Resumen
- <qué endpoint se implementó>
- <lógica de negocio clave — ej: averageScore null cuando no hay scores>
- <tests añadidos>

## Cómo probar
1. `docker-compose up -d` — levanta PostgreSQL
2. `cd backend && npm run dev` — servidor en :3010
3. Solicitud de ejemplo:
   ```
   GET http://localhost:3010/positions/1/candidates
   ```
4. Casos de error:
   - `GET /positions/999/candidates` → 404
   - `GET /positions/abc/candidates` → 400

## Decisiones técnicas
- <decisión 1 y su justificación>
- <decisión 2 y su justificación>

## Tests
```bash
cd backend && npm test
```
Resultado: X tests pasan, 0 fallan.
```

No hace push. No crea el PR. Sólo muestra la descripción.
