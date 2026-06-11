# Diario de prompts — AI4Devs LTI Backend

Registro de prompts significativos, sus outputs y lecciones aprendidas.

---

## [2026-06-11] — Contrato OpenAPI para GET /positions/:id/candidates

**Prompt usado:**
> `/contrato GET /positions/:id/candidates` — Actualiza `backend/api-spec.yaml` siguiendo OpenAPI 3.0.3. Schemas reutilizables en `components/schemas`. Path params numéricos con `minimum: 1`. Respuestas mínimas 200, 400, 404. `nullable: true` para `averageScore`. Validar con `npx @redocly/cli lint`.

**Lo que generó:**
- Bump de `openapi: 3.0.0` → `3.0.3` y título actualizado a `AI4Devs LTI API`
- Nuevo path `/positions/{id}/candidates` con GET, parameter `id` (integer, minimum 1)
- Responses 200 (array de `$ref CandidateRow`), 400 y 404 (`$ref Error`)
- `components/schemas/CandidateRow` con `fullName`, `currentInterviewStep`, `averageScore` (nullable)
- `components/schemas/Error` con `message` (string, required)
- Añadidos `servers` (localhost:3010) y `security: []` a nivel raíz tras el primer lint fallido

**Correcciones necesarias:**
- Primera pasada de lint falló con 4 errores: `no-empty-servers` y `security-defined` en los 3 endpoints. Hubo que añadir `servers:` y `security: []` a nivel raíz en una segunda edición.
- El spec original usaba `openapi: 3.0.0`; el skill exige `3.0.3` — hay que especificarlo explícitamente en el argumento o el modelo no lo cambia solo.

**Lecciones:**
- Incluir `servers` y `security: []` en la plantilla base del skill `openapi-contract` desde el principio para evitar la segunda iteración de lint.
- Cuando el spec ya existe, el modelo no bumpeará la versión de OpenAPI a menos que se le indique explícitamente — añadir "actualiza a 3.0.3 si el fichero usa una versión anterior" al prompt de `/contrato`.
- El lint de Redocly es estricto con `security-defined` incluso para APIs sin auth: `security: []` a nivel raíz es la solución canónica y debe estar en el boilerplate.
- Los warnings de `operationId`, `info-license` y `no-server-example.com` son ruido esperado en este proyecto — documentarlo en el skill para no investigarlos cada vez.
