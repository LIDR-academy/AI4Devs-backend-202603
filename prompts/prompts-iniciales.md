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

---

## [2026-06-11] — Implementación TDD de PUT /candidates/:id/stage (L1DR-2)

**Prompt usado:**
> `/tdd PUT /candidates/{id}/stage` → escribir tests RED para `updateCandidateStage` en `backend/tests/applicationService.test.ts`. Luego `GREEN` para implementar en capas: domain model → service → controller → route.

**Lo que generó:**
- `backend/tests/applicationService.test.ts` — 7 casos: happy path, 404 (app not found), 400 (applicationId NaN/0/-1), 400 (interviewStepId inválido), 400 (step not found), 409 (step de flow equivocado), más el mock triple de `PrismaClient`
- `backend/src/application/services/applicationService.ts` — `updateCandidateStage` con validaciones ordenadas: inputs → app existe → step existe → flow coincide → update
- `backend/src/presentation/controllers/applicationController.ts` — handler con `catch (error: any)` mapeando 400/404/409/500
- `backend/src/routes/candidateRoutes.ts` — `router.put('/:id/stage', updateCandidateStageController)` añadido al router existente
- `backend/src/domain/models/Application.ts` — método estático `findWithPosition()` añadido (no usado finalmente en el service, que instancia Prisma directamente)

**Correcciones necesarias:**
- Primera implementación instanciaba `const prisma = new PrismaClient()` a nivel de módulo (top del fichero). Esto causa que `new PrismaClient()` se ejecute durante la carga del módulo, ANTES de que los `const mockXxx = jest.fn()` del test estén inicializados. Los 4 tests que llaman a Prisma fallaban con `prisma.application.findUnique is not a function`. Solución: mover `const prisma = new PrismaClient()` DENTRO de la función, igual que hace `positionService.ts`.

**Lecciones:**
- **Regla crítica para este proyecto**: `new PrismaClient()` debe instanciarse siempre DENTRO de la función del service, nunca al nivel de módulo. Los tests con `jest.mock('@prisma/client', factory)` solo funcionan si el constructor se llama después de que las variables mock estén inicializadas.
- El patrón de mock con múltiples tablas (`application`, `interviewStep`) funciona igual que con una sola tabla — la clave es la instanciación dentro de la función.
- Los tests de validación de inputs (400 para NaN/0/-1) no necesitan mocks configurados porque el throw ocurre antes de cualquier llamada a Prisma — son los más rápidos de escribir y los primeros en pasar.
- El orden de validación en el service importa para la semántica HTTP: primero inputs (400), luego existencia de recursos (404/400), luego reglas de negocio (409). Este orden es también el que hace los tests más predecibles.
