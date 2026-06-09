# Prompt inicial

## ROL

Actúa como un Staff Software Engineer especializado en backend, diseño de APIs REST, arquitectura limpia y revisión de código.

Revisa la estructura actual del proyecto y el README.md. Antes de generar código, necesito que elabores un plan de ejecución detallado para implementar los siguientes requisitos.

## Objetivo

Implementar dos endpoints desde la capa backend:

GET /positions/:id/candidates

Debe devolver todos los candidatos en proceso para una determinada posición, es decir, todas las aplicaciones para un determinado positionID.

Debe proporcionar la siguiente información básica:
- Nombre completo del candidato (de la tabla candidate).
- current_interview_step: en qué fase del proceso está el candidato (de la tabla application).
- La puntuación media del candidato. Recuerda que cada entrevist (interview) realizada por el candidato tiene un score

PUT /candidates/:id/stage

Debe actualizar la etapa actual del un candidato, permitiendo modificar la fase actual del proceso de entrevista en la que se encuentra un candidato específico

## Instrucciones

Analiza la estructura del proyecto y genera un plan de implementación SIN escribir código todavía. Los cambios deben centrarse en la capa backend.

Quiero que el plan incluya:
- Análisis de la arquitectura existente.
- Componentes afectados.
- Modelos y relaciones de base de datos implicadas.
- Flujo completo de datos para cada endpoint.
- Cambios necesarios en consultas SQL/ORM.
- Contratos de request y response.
- Validaciones necesarias.
- Casos límite y manejo de errores.
- Estrategia de testing:
  - Unit tests
  - Integration tests
  - E2E tests
- Riesgos técnicos o posibles problemas de rendimiento.
- Orden recomendado de implementación paso a paso haciendo uso de TDD.

Importante:
- No generes código todavía.
- Si detectas ambigüedades en el requisito, enuméralas y propón alternativas.
- Si la estructura actual no sigue buenas prácticas, indícalo antes de proponer cambios.
- Justifica cada decisión arquitectónica.
- Devuelve el resultado en formato de plan técnico detallado.
- Actualiza el fichero prompts-JRG.md que la respuesta completa.

---

# Plan Técnico de Implementación

## 1. Análisis de la Arquitectura Existente

### 1.1 Estructura general

El proyecto sigue un enfoque de **Clean Architecture** con tres capas bien diferenciadas:

```
src/
├── presentation/controllers/   ← HTTP handlers (entrada/salida HTTP)
├── application/services/       ← Lógica de negocio + validación
├── domain/models/              ← Entidades del dominio + acceso a datos
└── routes/                     ← Definición de rutas Express
```

**Tecnologías:** TypeScript, Express, Prisma ORM, PostgreSQL.

### 1.2 Problemas detectados en la arquitectura actual

Antes de proponer cambios, estos problemas deben conocerse, aunque no se corrijan todos en este PR:

| Problema | Ubicación | Severidad | Descripción |
|---|---|---|---|
| **PrismaClient duplicado** | Cada archivo en `domain/models/` | Alta | Cada modelo instancia `new PrismaClient()` propio. Prisma recomienda un singleton compartido. En producción genera connection pool exhaustion. |
| **Credenciales hardcodeadas** | `prisma/schema.prisma` línea 14 | Alta | La `DATABASE_URL` tiene usuario y contraseña en texto plano. Debería usar `env("DATABASE_URL")`. |
| **Middleware de logging mal posicionado** | `src/index.ts` líneas 45-48 | Media | El logger se registra **después** de las rutas, por lo que no intercepta ninguna request. |
| **Controlador exporta servicio** | `candidateController.ts` línea 34 | Baja | `export { addCandidate }` re-exporta la función de servicio directamente desde el controller, rompiendo la separación de capas. |
| **Ruta POST inline** | `candidateRoutes.ts` líneas 6-18 | Baja | La ruta POST tiene lógica inline en lugar de delegar al controller, duplicando el patrón. |
| **Sin tests** | Todo el proyecto | Alta | `jest.config.js` configurado pero no existe ningún test. |

**Decisión para este PR:** No se corregirán todos los problemas. Se seguirá el patrón existente para mantener consistencia, excepto el singleton de Prisma que sí se introducirá como utilidad compartida para los nuevos servicios (decisión justificada: evitar degradación de rendimiento nueva).

---

## 2. Ambigüedades Detectadas

### Ambigüedad 1 — `PUT /candidates/:id/stage`: ¿Qué `:id` actualizar?

**Problema:** Un candidato puede tener múltiples aplicaciones a distintas posiciones. El `:id` en la URL referencia al `candidateId`, pero `currentInterviewStep` pertenece a la entidad `Application`, no a `Candidate`. Si un candidato tiene 3 aplicaciones activas, ¿cuál se actualiza?

**Alternativas:**
- **A (recomendada):** El body incluye `applicationId` y `currentInterviewStep`. La URL identifica el candidato para validación, el body identifica la aplicación concreta.
- **B:** La URL usa el `applicationId` en lugar del `candidateId`: `PUT /applications/:id/stage`. Más limpio semánticamente, pero cambia el contrato pedido.
- **C:** Se asume que el candidato solo tiene una aplicación activa (peligroso, el esquema no lo garantiza).

**Propuesta adoptada:** Opción A. La URL mantiene `/candidates/:id/stage` como pide el requisito; el body lleva `applicationId` y `currentInterviewStep`.

### Ambigüedad 2 — `currentInterviewStep` en la respuesta de GET

**Problema:** `Application.currentInterviewStep` es un `Int` (FK a `InterviewStep.id`). El requisito dice "en qué fase del proceso está", que implica algo legible.

**Alternativas:**
- **A (recomendada):** Devolver tanto el `id` como el `name` del `InterviewStep`.
- **B:** Devolver solo el nombre (pérdida del ID para operaciones frontend).
- **C:** Devolver solo el ID (no informativo para consumidores de la API).

**Propuesta adoptada:** Opción A. Incluir `currentInterviewStep: { id, name }`.

### Ambigüedad 3 — Cálculo de `averageScore` con scores nulos

**Problema:** `Interview.score` es `Int?` (nullable). Un candidato puede tener entrevistas sin puntuación todavía.

**Alternativas:**
- **A (recomendada):** Calcular la media solo sobre entrevistas con `score != null`. Si ninguna tiene score, devolver `null`.
- **B:** Tratar `null` como `0` (distorsiona la media).
- **C:** Excluir al candidato si no tiene ningún score (pierde visibilidad).

**Propuesta adoptada:** Opción A. `averageScore: number | null`.

### Ambigüedad 4 — Validación del nuevo `currentInterviewStep` en PUT

**Problema:** Al actualizar la etapa, ¿debe validarse que el nuevo `InterviewStep` pertenece al `InterviewFlow` de la `Position` asociada a la aplicación?

**Alternativas:**
- **A (recomendada):** Sí validar. Evita asignar un step de otro flujo de entrevistas.
- **B:** No validar, confiar en el frontend.

**Propuesta adoptada:** Opción A. Validación en capa de servicio.

---

## 3. Modelos y Relaciones de Base de Datos Implicadas

### Diagrama de relaciones relevantes

```
Position (id, interviewFlowId)
    │
    ├── Application (id, positionId, candidateId, currentInterviewStep → InterviewStep.id)
    │       │
    │       ├── Candidate (id, firstName, lastName)
    │       │
    │       └── Interview (id, applicationId, score?)
    │
    └── InterviewFlow (id)
            │
            └── InterviewStep (id, name, orderIndex, interviewFlowId)
```

### Campos relevantes por tabla

| Tabla | Campos usados |
|---|---|
| `Application` | `id`, `positionId`, `candidateId`, `currentInterviewStep` |
| `Candidate` | `id`, `firstName`, `lastName` |
| `Interview` | `applicationId`, `score` |
| `InterviewStep` | `id`, `name`, `interviewFlowId` |
| `Position` | `id`, `interviewFlowId` |
| `InterviewFlow` | `id` |

---

## 4. Componentes Afectados

### Archivos nuevos a crear

```
src/
├── application/services/positionService.ts      ← Lógica de negocio GET endpoint
├── presentation/controllers/positionController.ts ← HTTP handler GET endpoint
└── routes/positionRoutes.ts                       ← Router para /positions
```

### Archivos existentes a modificar

```
src/
├── application/services/candidateService.ts     ← Añadir updateCandidateStage()
├── presentation/controllers/candidateController.ts ← Añadir updateStageController()
├── routes/candidateRoutes.ts                    ← Añadir PUT /:id/stage
└── index.ts                                     ← Registrar positionRoutes
```

### Archivos de test a crear

```
src/__tests__/ (o tests/ según convención Jest)
├── unit/
│   ├── positionService.test.ts
│   └── candidateService.updateStage.test.ts
├── integration/
│   ├── positions.candidates.integration.test.ts
│   └── candidates.stage.integration.test.ts
└── e2e/
    ├── GET_positions_id_candidates.e2e.test.ts
    └── PUT_candidates_id_stage.e2e.test.ts
```

---

## 5. Flujo Completo de Datos

### 5.1 GET /positions/:id/candidates

```
Request: GET /positions/1/candidates
    │
    ▼
positionRoutes.ts
  router.get('/:id/candidates', getPositionCandidatesController)
    │
    ▼
positionController.ts :: getPositionCandidatesController()
  1. Parsear y validar req.params.id → integer
  2. Llamar positionService.getCandidatesByPosition(positionId)
  3. Devolver 200 con array o 404/400/500 según error
    │
    ▼
positionService.ts :: getCandidatesByPosition(positionId: number)
  1. Verificar que la Position existe
  2. Consultar Application con includes (candidate, interviewStep, interviews)
  3. Mapear resultados: calcular averageScore por application
  4. Devolver array de DTOs
    │
    ▼
Prisma ORM
  prisma.application.findMany({
    where: { positionId },
    include: {
      candidate: { select: { firstName, lastName } },
      interviewStep: { select: { id, name } },
      interviews: { select: { score: true } }
    }
  })
    │
    ▼
PostgreSQL
  SELECT a.id, c.firstName, c.lastName, 
         is.id as stepId, is.name as stepName,
         AVG(i.score) as avgScore
  FROM Application a
  JOIN Candidate c ON a.candidateId = c.id
  JOIN InterviewStep is ON a.currentInterviewStep = is.id
  LEFT JOIN Interview i ON i.applicationId = a.id
  WHERE a.positionId = :id
  GROUP BY a.id, c.firstName, c.lastName, is.id, is.name
```

### 5.2 PUT /candidates/:id/stage

```
Request: PUT /candidates/1/stage
         Body: { "applicationId": 3, "currentInterviewStep": 2 }
    │
    ▼
candidateRoutes.ts
  router.put('/:id/stage', updateStageController)
    │
    ▼
candidateController.ts :: updateStageController()
  1. Parsear req.params.id → candidateId (integer)
  2. Parsear req.body: applicationId, currentInterviewStep
  3. Llamar candidateService.updateCandidateStage(candidateId, applicationId, newStepId)
  4. Devolver 200 con application actualizada o error
    │
    ▼
candidateService.ts :: updateCandidateStage()
  1. Verificar que Candidate con candidateId existe
  2. Verificar que Application con applicationId existe Y pertenece al candidato
  3. Obtener la Position de la Application → obtener interviewFlowId
  4. Verificar que InterviewStep con newStepId existe Y pertenece al mismo InterviewFlow
  5. Actualizar Application.currentInterviewStep = newStepId
  6. Devolver application actualizada
    │
    ▼
Prisma ORM
  prisma.application.update({
    where: { id: applicationId },
    data: { currentInterviewStep: newStepId },
    include: { interviewStep: { select: { id, name } } }
  })
```

---

## 6. Consultas ORM (Prisma)

### GET /positions/:id/candidates

```typescript
// Verificación de existencia de posición
prisma.position.findUnique({ where: { id: positionId } })

// Query principal
prisma.application.findMany({
  where: { positionId },
  include: {
    candidate: {
      select: { id: true, firstName: true, lastName: true }
    },
    interviewStep: {
      select: { id: true, name: true }
    },
    interviews: {
      select: { score: true },
      where: { score: { not: null } }  // solo entrevistas con score
    }
  }
})
// averageScore se calcula en capa de servicio: sum(scores) / count
```

### PUT /candidates/:id/stage

```typescript
// 1. Verificar candidato
prisma.candidate.findUnique({ where: { id: candidateId } })

// 2. Verificar application + pertenece al candidato
prisma.application.findFirst({
  where: { id: applicationId, candidateId },
  include: { position: { select: { interviewFlowId: true } } }
})

// 3. Verificar nuevo step pertenece al mismo flow
prisma.interviewStep.findFirst({
  where: { id: newStepId, interviewFlowId: application.position.interviewFlowId }
})

// 4. Actualizar
prisma.application.update({
  where: { id: applicationId },
  data: { currentInterviewStep: newStepId }
})
```

---

## 7. Contratos de Request y Response

### GET /positions/:id/candidates

**Request:**
```
GET /positions/:id/candidates
Params:
  id: integer (requerido) — ID de la posición

Headers:
  Content-Type: application/json
```

**Response 200 OK:**
```json
[
  {
    "candidateId": 1,
    "fullName": "John Doe",
    "currentInterviewStep": {
      "id": 2,
      "name": "Technical Interview"
    },
    "averageScore": 7.5
  },
  {
    "candidateId": 2,
    "fullName": "Jane Smith",
    "currentInterviewStep": {
      "id": 1,
      "name": "HR Interview"
    },
    "averageScore": null
  }
]
```

**Responses de error:**
```
400 Bad Request    → { "error": "Invalid position ID" }
404 Not Found      → { "error": "Position not found" }
500 Internal Error → { "error": "Internal Server Error" }
```

### PUT /candidates/:id/stage

**Request:**
```
PUT /candidates/:id/stage
Params:
  id: integer (requerido) — ID del candidato

Body:
{
  "applicationId": 3,
  "currentInterviewStep": 2
}
```

**Response 200 OK:**
```json
{
  "message": "Stage updated successfully",
  "data": {
    "applicationId": 3,
    "candidateId": 1,
    "currentInterviewStep": {
      "id": 2,
      "name": "Technical Interview"
    }
  }
}
```

**Responses de error:**
```
400 Bad Request    → { "error": "Invalid candidate ID" }
400 Bad Request    → { "error": "applicationId and currentInterviewStep are required" }
400 Bad Request    → { "error": "Interview step does not belong to this position's flow" }
404 Not Found      → { "error": "Candidate not found" }
404 Not Found      → { "error": "Application not found or does not belong to this candidate" }
404 Not Found      → { "error": "Interview step not found" }
500 Internal Error → { "error": "Internal Server Error" }
```

---

## 8. Validaciones Necesarias

### GET /positions/:id/candidates

| Validación | Capa | Regla |
|---|---|---|
| `id` es entero positivo | Controller | `parseInt`, verificar `!isNaN && id > 0` |
| Position existe | Service | `prisma.position.findUnique` → 404 si null |

### PUT /candidates/:id/stage

| Validación | Capa | Regla |
|---|---|---|
| `:id` candidato es entero positivo | Controller | `parseInt`, verificar `!isNaN && id > 0` |
| `applicationId` presente en body | Controller | Typeof check, integer positivo |
| `currentInterviewStep` presente en body | Controller | Typeof check, integer positivo |
| Candidato existe | Service | findUnique → 404 si null |
| Application existe + pertenece al candidato | Service | `findFirst({ where: { id, candidateId } })` → 404 si null |
| InterviewStep existe + pertenece al InterviewFlow de la Position | Service | Query con `where: { id, interviewFlowId }` → 400 si no coincide |

---

## 9. Casos Límite y Manejo de Errores

### GET /positions/:id/candidates

| Caso | Comportamiento esperado |
|---|---|
| Position inexistente | 404 `Position not found` |
| Position sin aplicaciones | 200 con array vacío `[]` |
| Aplicación sin ninguna entrevista | `averageScore: null` |
| Aplicación con entrevistas pero todas sin score | `averageScore: null` |
| `id` no es número (e.g. `"abc"`) | 400 `Invalid position ID` |
| `id` negativo o cero | 400 `Invalid position ID` |
| Error de base de datos | 500 `Internal Server Error` |

### PUT /candidates/:id/stage

| Caso | Comportamiento esperado |
|---|---|
| Candidato inexistente | 404 `Candidate not found` |
| Application no pertenece al candidato | 404 `Application not found` |
| `currentInterviewStep` de otro InterviewFlow | 400 `Interview step does not belong...` |
| Body vacío o campos faltantes | 400 con mensaje descriptivo |
| Actualizar al mismo step ya activo | 200 OK (idempotente, no es error) |
| `id` candidato no es número | 400 `Invalid candidate ID` |
| Error de base de datos | 500 `Internal Server Error` |

---

## 10. Estrategia de Testing

### 10.1 Unit Tests

**Objetivo:** Probar lógica de negocio en servicios, aislando Prisma con mocks.

**Herramienta:** Jest + `jest.mock('@prisma/client')` o `jest-mock-extended`.

**Tests para `positionService.getCandidatesByPosition`:**
- Devuelve lista de candidatos con datos correctos cuando hay aplicaciones
- Calcula `averageScore` correctamente (solo scores no nulos)
- Devuelve `averageScore: null` cuando no hay entrevistas con score
- Devuelve array vacío cuando no hay aplicaciones
- Lanza error si la position no existe

**Tests para `candidateService.updateCandidateStage`:**
- Actualiza correctamente cuando todos los datos son válidos
- Lanza error si candidato no existe
- Lanza error si application no pertenece al candidato
- Lanza error si el nuevo step no pertenece al InterviewFlow de la Position
- Idempotente: actualizar al mismo step no falla

### 10.2 Integration Tests

**Objetivo:** Probar los servicios contra una base de datos real (test DB) o Prisma sin mock.

**Estrategia:** Usar una base de datos PostgreSQL de test (variable `DATABASE_URL_TEST`) o SQLite con Prisma si se configura un provider alternativo para tests.

**Setup/Teardown:** `beforeEach` con seed de datos mínimos, `afterEach` con limpieza (`prisma.$transaction` con rollback o `deleteMany` en orden inverso de FK).

**Tests de integración:**
- GET devuelve candidatos reales con datos correctos de la DB
- GET devuelve 200 con `[]` para position sin aplicaciones
- PUT actualiza `currentInterviewStep` en la DB y confirma con lectura posterior
- PUT falla correctamente con datos de FK inválidos (constraints de integridad)

### 10.3 E2E Tests

**Objetivo:** Probar los endpoints HTTP completos incluyendo routing, middleware y serialización.

**Herramienta:** Jest + `supertest` (ya en dependencias? verificar, si no añadir).

**Tests E2E:**

Para `GET /positions/:id/candidates`:
```
GET /positions/1/candidates         → 200 array con candidatos
GET /positions/999/candidates       → 404
GET /positions/abc/candidates       → 400
GET /positions/1/candidates         → 200 [] (position sin aplicaciones)
```

Para `PUT /candidates/:id/stage`:
```
PUT /candidates/1/stage  { valid body }    → 200
PUT /candidates/999/stage { valid body }   → 404
PUT /candidates/1/stage  {}                → 400
PUT /candidates/1/stage  { wrong stepId }  → 400/404
PUT /candidates/abc/stage { valid body }   → 400
```

---

## 11. Riesgos Técnicos y Problemas de Rendimiento

### Riesgo 1 — N+1 en cálculo de averageScore (ALTO)

Si se calcula el average iterando application por application con queries separadas, se genera N+1. **Mitigación:** Usar `include: { interviews: { select: { score } } }` en una sola query y calcular en memoria, o usar `_avg` de Prisma en una query agrupada.

### Riesgo 2 — PrismaClient singleton (MEDIO)

Los modelos de dominio existentes crean su propio PrismaClient. Los nuevos servicios deben usar un singleton. Si la refactorización no es completa, habrá N instancias de PrismaClient compitiendo por conexiones en el pool. **Mitigación:** Crear `src/infrastructure/prisma.ts` como singleton y usarlo en los nuevos servicios. Los modelos existentes se dejan para no alterar comportamiento actual.

### Riesgo 3 — Consistencia de datos en PUT (MEDIO)

Entre la validación del step y el update, otro proceso podría modificar la application. **Mitigación:** Usar una transacción Prisma (`prisma.$transaction`) que incluya la lectura-validación y el update como operación atómica.

### Riesgo 4 — Posición con estado `Draft` o `Closed` (BAJO)

¿Debe GET devolver candidatos de posiciones en cualquier estado? El campo `status` existe en `Position` (`Draft`, presumiblemente también `Open`, `Closed`). **Mitigación:** No filtrar por status en este PR (la query devuelve lo que hay). Documentar como decisión explícita.

### Riesgo 5 — Escalabilidad de la query (BAJO a MEDIO)

Si una posición tiene miles de aplicaciones, devolver todo sin paginación es un problema. **Mitigación:** Añadir paginación opcional (`?page=1&limit=20`) en el futuro. En este PR, sin paginación pero con índice en `Application.positionId` (ya garantizado por la FK de Prisma).

---

## 12. Orden de Implementación con TDD

### Fase 1 — Infraestructura base (sin tests de negocio aún)

1. Crear `src/infrastructure/prismaClient.ts` — singleton de PrismaClient para nuevos servicios
2. Crear estructura de carpetas de tests: `src/__tests__/unit/`, `integration/`, `e2e/`
3. Verificar que `jest.config.js` tiene `testMatch` configurado correctamente
4. Instalar `supertest` y `@types/supertest` si no están en `package.json`

### Fase 2 — TDD: GET /positions/:id/candidates

**Ciclo Red → Green → Refactor:**

1. **RED:** Escribir test unitario para `positionService.getCandidatesByPosition` — falla porque el archivo no existe
2. **GREEN:** Crear `positionService.ts` con implementación mínima que pase los tests
3. **RED:** Escribir test unitario para casos límite (position inexistente, sin candidatos, averageScore null)
4. **GREEN:** Completar la lógica de servicio
5. **RED:** Escribir test E2E con supertest para `GET /positions/:id/candidates` — falla porque la ruta no existe
6. **GREEN:** Crear `positionController.ts` → `positionRoutes.ts` → registrar en `index.ts`
7. **REFACTOR:** Revisar manejo de errores, tipos TypeScript, respuesta consistente
8. **Integration test:** Escribir y pasar test de integración contra DB de test

### Fase 3 — TDD: PUT /candidates/:id/stage

**Ciclo Red → Green → Refactor:**

1. **RED:** Escribir test unitario para `candidateService.updateCandidateStage` — falla
2. **GREEN:** Implementar `updateCandidateStage` en `candidateService.ts`
3. **RED:** Cubrir casos: candidato no existe, application no pertenece, step de otro flow
4. **GREEN:** Completar validaciones en el servicio
5. **RED:** Escribir test E2E para `PUT /candidates/:id/stage` — falla por ruta inexistente
6. **GREEN:** Añadir `updateStageController` en `candidateController.ts` + ruta en `candidateRoutes.ts`
7. **REFACTOR:** Revisar transaccionalidad, tipos, respuestas HTTP
8. **Integration test:** Escribir y pasar test de integración

### Fase 4 — Validación final

1. Ejecutar todos los tests: `npm test`
2. Verificar con `supertest` o cliente HTTP manual los happy paths y error cases
3. Revisar que no se rompieron los endpoints existentes (`POST /candidates`, `GET /candidates/:id`)
4. Actualizar `api-spec.yaml` con los nuevos endpoints

---

## 13. Resumen de Decisiones Arquitectónicas

| Decisión | Justificación |
|---|---|
| Seguir patrón routes → controller → service → domain existente | Consistencia con el código base. No introduce deuda nueva. |
| No crear nuevos modelos de dominio para este feature | Las entidades necesarias (Application, Candidate, InterviewStep) ya existen. Un servicio de consulta no requiere un modelo de dominio nuevo. |
| `positionService.ts` separado de `candidateService.ts` | Separación de responsabilidades. GET sobre positions no pertenece conceptualmente al servicio de candidatos. |
| Calcular averageScore en capa de servicio (no en DB) | Mantiene la query simple y testeable. Con pocos scores por aplicación, la diferencia de rendimiento es irrelevante. Con volumen alto, revisitar. |
| Singleton de PrismaClient solo para nuevos servicios | No romper código existente. Introduce buena práctica de forma incremental. |
| Validar que InterviewStep pertenece al InterviewFlow de la Position | Invariante de negocio: no tiene sentido asignar un step de un flujo diferente. Protege integridad de datos. |
| `averageScore: null` cuando no hay scores | Semánticamente correcto: null ≠ 0. Un candidato sin entrevistas puntuadas no tiene media, no tiene media cero. |

---

# Prompt implementación TDD

## Petición

Implementar el plan técnico anterior siguiendo TDD estricto (Red → Green → Refactor) para los dos endpoints:
- `GET /positions/:id/candidates`
- `PUT /candidates/:id/stage`

## Ejecución realizada

### Dependencias instaladas

```bash
npm install --save-dev supertest @types/supertest jest-mock-extended
```

### Fase 1 — Infraestructura

| Acción | Archivo | Descripción |
|---|---|---|
| Creado | `src/infrastructure/prismaClient.ts` | Singleton de PrismaClient para nuevos servicios |
| Modificado | `jest.config.js` | Añadido `testMatch` y `clearMocks: true` |
| Modificado | `src/index.ts` | `app.listen` guardado con `require.main === module` (evita EADDRINUSE en tests) |

### Fase 2 — GET /positions/:id/candidates (TDD)

**RED** → `src/__tests__/unit/positionService.test.ts` (5 tests, fallaban: módulo no existía)

**GREEN** → `src/application/services/positionService.ts`
- Verifica existencia de Position (lanza `'Position not found'` si no existe)
- Query Prisma con `include` de candidate, interviewStep e interviews en una sola llamada (evita N+1)
- Calcula `averageScore` en capa de servicio, ignorando scores `null`
- Devuelve `averageScore: null` si no hay scores

**RED** → `src/__tests__/e2e/positions.e2e.test.ts` (4 tests, fallaban: ruta no existía)

**GREEN** →
- `src/presentation/controllers/positionController.ts` — valida `id`, delega a servicio, mapea errores a HTTP
- `src/routes/positionRoutes.ts` — `GET /:id/candidates`
- `src/index.ts` — `app.use('/positions', positionRoutes)`

### Fase 3 — PUT /candidates/:id/stage (TDD)

**RED** → `src/__tests__/unit/candidateService.updateStage.test.ts` (5 tests, fallaban: función no existía)

**GREEN** → `src/application/services/candidateService.ts` — añadida `updateCandidateStage(candidateId, applicationId, newStepId)`:
1. Verifica candidato existe
2. Verifica application existe Y pertenece al candidato
3. Verifica InterviewStep pertenece al InterviewFlow de la Position (invariante de negocio)
4. Actualiza `Application.currentInterviewStep`

**RED** → `src/__tests__/e2e/candidates.stage.e2e.test.ts` (6 tests, fallaban: ruta no existía)

**GREEN** →
- `src/presentation/controllers/candidateController.ts` — añadido `updateStageController`
- `src/routes/candidateRoutes.ts` — `PUT /:id/stage`

### Resultado final

```
Test Suites: 4 passed, 4 total
Tests:       20 passed, 20 total
```

| Archivo de test | Tests | Tipo |
|---|---|---|
| `positionService.test.ts` | 5 | Unit |
| `candidateService.updateStage.test.ts` | 5 | Unit |
| `positions.e2e.test.ts` | 4 | E2E |
| `candidates.stage.e2e.test.ts` | 6 | E2E |

### Árbol de archivos nuevos/modificados

```
src/
├── infrastructure/
│   └── prismaClient.ts               ← NUEVO: singleton PrismaClient
├── application/services/
│   ├── positionService.ts            ← NUEVO: getCandidatesByPosition
│   └── candidateService.ts           ← MODIFICADO: +updateCandidateStage
├── presentation/controllers/
│   ├── positionController.ts         ← NUEVO: getPositionCandidatesController
│   └── candidateController.ts        ← MODIFICADO: +updateStageController
├── routes/
│   ├── positionRoutes.ts             ← NUEVO: GET /:id/candidates
│   └── candidateRoutes.ts            ← MODIFICADO: +PUT /:id/stage
├── index.ts                          ← MODIFICADO: +positionRoutes, require.main guard
└── __tests__/
    ├── unit/
    │   ├── positionService.test.ts   ← NUEVO: 5 tests
    │   └── candidateService.updateStage.test.ts ← NUEVO: 5 tests
    └── e2e/
        ├── positions.e2e.test.ts     ← NUEVO: 4 tests
        └── candidates.stage.e2e.test.ts ← NUEVO: 6 tests
```

---

# Prompt validación y documentación

## Petición

Verifica que los test funcionan, lanza curl de pruebas para validar los nuevos endpoints y por último actualiza api-spec.yaml si todo ha funcionado correctamente. Si detectas cualquier error indícamelo y no sigas ejecutando los siguientes pasos. Por último actualiza el fichero prompts-JRG.md con mi petición y la respuesta.

## Ejecución realizada

### Paso 1 — Tests

Ejecutado `npm test -- --verbose` en `backend/`.

**Resultado: 20/20 tests pasados, 0 fallos.**

| Suite | Tests | Resultado |
|---|---|---|
| `unit/positionService.test.ts` | 5 | PASS |
| `unit/candidateService.updateStage.test.ts` | 5 | PASS |
| `e2e/positions.e2e.test.ts` | 4 | PASS |
| `e2e/candidates.stage.e2e.test.ts` | 6 | PASS |

### Paso 2 — Curl de pruebas

Servidor arrancado con `ts-node-dev` en `http://localhost:3010`.

#### GET /positions/:id/candidates

| Request | Status | Resultado |
|---|---|---|
| `GET /positions/1/candidates` | 200 | Array con 3 candidatos, fullName + currentInterviewStep + averageScore correctos |
| `GET /positions/999/candidates` | 404 | `{"error":"Position not found"}` |
| `GET /positions/abc/candidates` | 400 | `{"error":"Invalid position ID"}` |

#### PUT /candidates/:id/stage

| Request | Status | Resultado |
|---|---|---|
| `PUT /candidates/1/stage` `{applicationId:1, currentInterviewStep:2}` | 200 | `{"message":"Stage updated successfully","data":{...}}` |
| `PUT /candidates/999/stage` | 404 | `{"error":"Candidate not found"}` |
| `PUT /candidates/abc/stage` | 400 | `{"error":"Invalid candidate ID"}` |
| `PUT /candidates/1/stage` `{}` | 400 | `{"error":"applicationId and currentInterviewStep are required and must be numbers"}` |
| `PUT /candidates/1/stage` `{applicationId:1, currentInterviewStep:999}` | 400 | `{"error":"Interview step does not belong to this position's interview flow"}` |

### Paso 3 — api-spec.yaml actualizado

Añadidos 3 paths nuevos en `backend/api-spec.yaml`:

- `GET /candidates/{id}` — obtener candidato por ID
- `PUT /candidates/{id}/stage` — actualizar etapa de entrevista con request body `{applicationId, currentInterviewStep}` y response `{message, data}`
- `GET /positions/{id}/candidates` — obtener candidatos de una posición con response array `[{candidateId, fullName, currentInterviewStep:{id,name}, averageScore}]`

Cada path incluye: summary, description, parámetros, request body (donde aplica), y responses (200, 400, 404, 500) con schemas detallados.

### Resumen

Tests: 20/20 pass (4 suites: 2 unit + 2 e2e)

Curl validaciones:

GET /positions/1/candidates → 200 con array correcto
GET /positions/999/candidates → 404
GET /positions/abc/candidates → 400
PUT /candidates/1/stage (válido) → 200
PUT /candidates/999/stage → 404
PUT /candidates/abc/stage → 400
PUT /candidates/1/stage (body vacío) → 400
PUT /candidates/1/stage (step inválido) → 400
api-spec.yaml actualizado con 3 nuevos paths: GET /candidates/{id}, PUT /candidates/{id}/stage, GET /positions/{id}/candidates.

prompts-JRG.md actualizado con petición y respuesta completa.

---
