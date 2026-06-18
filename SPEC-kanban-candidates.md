# Especificación Técnica — Endpoints Kanban de Candidatos

**Versión:** 1.0  
**Fecha:** 2026-06-17  
**Estado:** Listo para desarrollo  

---

## Tabla de Contenidos

1. [Contexto y Objetivo](#1-contexto-y-objetivo)
2. [Endpoint 1 — GET /positions/:id/candidates](#2-endpoint-1--get-positionsidcandidates)
3. [Endpoint 2 — PUT /candidates/:id/stage](#3-endpoint-2--put-candidatesidstage)
4. [Archivos a Crear / Modificar](#4-archivos-a-crear--modificar)
5. [Plan de Ejecución Paso a Paso](#5-plan-de-ejecución-paso-a-paso)
6. [Tests Unitarios](#6-tests-unitarios)
7. [Criterios de Aceptación](#7-criterios-de-aceptación)
8. [Requisitos No Funcionales](#8-requisitos-no-funcionales)

---

## 1. Contexto y Objetivo

El frontend dispone de una vista tipo **tablero Kanban** donde cada columna representa una etapa del proceso de entrevista (`InterviewStep`) y cada tarjeta representa a un candidato postulado a una posición concreta (`Application`).

Esta funcionalidad requiere dos operaciones:

1. **Obtener** todos los candidatos (aplicaciones) de una posición, con su etapa actual y puntuación media.
2. **Actualizar** la etapa de una aplicación cuando el usuario arrastra una tarjeta de una columna a otra.

### Modelo de datos involucrado

```
Position (1) ──► Application (N) ◄── Candidate (1)
                     │
                     ├── currentInterviewStep ──► InterviewStep
                     └── Interview (N) ──► score
```

---

## 2. Endpoint 1 — GET /positions/:id/candidates

### Descripción

Devuelve todas las postulaciones activas para una posición dada. Por cada postulación incluye: nombre completo del candidato, etapa actual del proceso y puntuación media de todas las entrevistas realizadas.

### Especificación HTTP


| Atributo                   | Valor                       |
| -------------------------- | --------------------------- |
| **Método**                 | `GET`                       |
| **URL**                    | `/positions/:id/candidates` |
| **Autenticación**          | No requerida (MVP)          |
| **Content-Type respuesta** | `application/json`          |


### Parámetros de ruta


| Parámetro | Tipo      | Requerido | Descripción                       |
| --------- | --------- | --------- | --------------------------------- |
| `id`      | `integer` | Sí        | ID de la posición (`Position.id`) |


### Validaciones de entrada

- `id` debe ser un entero positivo. Si no es numérico → `400 Bad Request`.
- La posición debe existir en base de datos. Si no existe → `404 Not Found`.
- Si la posición existe pero no tiene aplicaciones → `200 OK` con array vacío `[]`.

### Respuesta exitosa — `200 OK`

```json
[
  {
    "applicationId": 1,
    "candidateId": 3,
    "fullName": "Ana García",
    "currentInterviewStep": {
      "id": 2,
      "name": "Entrevista Técnica",
      "orderIndex": 2
    },
    "averageScore": 7.5
  },
  {
    "applicationId": 2,
    "candidateId": 7,
    "fullName": "Carlos López",
    "currentInterviewStep": {
      "id": 1,
      "name": "Entrevista RRHH",
      "orderIndex": 1
    },
    "averageScore": null
  }
]
```

### Descripción de campos de respuesta


| Campo                             | Tipo           | Nullable | Fuente                                           | Descripción                                                   |
| --------------------------------- | -------------- | -------- | ------------------------------------------------ | ------------------------------------------------------------- |
| `applicationId`                   | `integer`      | No       | `Application.id`                                 | ID de la postulación                                          |
| `candidateId`                     | `integer`      | No       | `Candidate.id`                                   | ID del candidato                                              |
| `fullName`                        | `string`       | No       | `Candidate.firstName + ' ' + Candidate.lastName` | Nombre completo                                               |
| `currentInterviewStep.id`         | `integer`      | No       | `InterviewStep.id`                               | ID de la etapa actual                                         |
| `currentInterviewStep.name`       | `string`       | No       | `InterviewStep.name`                             | Nombre de la etapa                                            |
| `currentInterviewStep.orderIndex` | `integer`      | No       | `InterviewStep.orderIndex`                       | Orden dentro del flujo                                        |
| `averageScore`                    | `float | null` | Sí       | `AVG(Interview.score)`                           | Media de puntuaciones; `null` si no hay entrevistas con score |


> **Cálculo de `averageScore`:** Se promedia `Interview.score` de todas las entrevistas asociadas a la `Application`. Si ninguna entrevista tiene `score`, se devuelve `null`. Se redondea a 2 decimales.

### Respuestas de error


| Código | Condición                   | Body                                                                     |
| ------ | --------------------------- | ------------------------------------------------------------------------ |
| `400`  | `id` no es un entero válido | `{ "error": "El ID de la posición debe ser un número entero positivo" }` |
| `404`  | Posición no encontrada      | `{ "error": "Posición no encontrada" }`                                  |
| `500`  | Error interno del servidor  | `{ "error": "Error interno del servidor" }`                              |


### Query Prisma equivalente

```typescript
const applications = await prisma.application.findMany({
  where: { positionId: id },
  include: {
    candidate: {
      select: { firstName: true, lastName: true }
    },
    interviewStep: {
      select: { id: true, name: true, orderIndex: true }
    },
    interviews: {
      select: { score: true }
    }
  }
});
```

---

## 3. Endpoint 2 — PUT /candidates/:id/stage

### Descripción

Actualiza la etapa actual (`currentInterviewStep`) de una postulación concreta. Se usa cuando el reclutador arrastra una tarjeta de candidato de una columna a otra en el tablero Kanban. El parámetro `:id` de la URL corresponde al **ID de la postulación** (`Application.id`), ya que un candidato puede tener múltiples postulaciones activas en posiciones distintas y debemos identificar con precisión cuál actualizar.

> **Nota de diseño:** Aunque la URL dice `/candidates/:id`, el `:id` identifica la postulación (`Application.id`) que vincula al candidato con la posición. Esto es necesario porque un candidato puede estar postulado a N posiciones simultáneamente.

### Especificación HTTP


| Atributo                   | Valor                   |
| -------------------------- | ----------------------- |
| **Método**                 | `PUT`                   |
| **URL**                    | `/candidates/:id/stage` |
| **Autenticación**          | No requerida (MVP)      |
| **Content-Type entrada**   | `application/json`      |
| **Content-Type respuesta** | `application/json`      |


### Parámetros de ruta


| Parámetro | Tipo      | Requerido | Descripción                             |
| --------- | --------- | --------- | --------------------------------------- |
| `id`      | `integer` | Sí        | ID de la postulación (`Application.id`) |


### Body de la petición

```json
{
  "newInterviewStepId": 3
}
```


| Campo                | Tipo      | Requerido | Descripción                                                              |
| -------------------- | --------- | --------- | ------------------------------------------------------------------------ |
| `newInterviewStepId` | `integer` | Sí        | ID de la nueva etapa (`InterviewStep.id`) a la que se mueve el candidato |


### Validaciones de entrada

- `:id` debe ser un entero positivo. Si no es numérico → `400`.
- `newInterviewStepId` debe estar presente en el body → si falta → `400`.
- `newInterviewStepId` debe ser un entero positivo → `400`.
- La postulación (`:id`) debe existir → `404`.
- El `InterviewStep` con `newInterviewStepId` debe existir → `404`.
- El `InterviewStep` debe pertenecer al mismo `InterviewFlow` que la posición de la postulación → `400`. Esto evita asignar una etapa de un flujo distinto.

### Respuesta exitosa — `200 OK`

```json
{
  "message": "Etapa actualizada correctamente",
  "data": {
    "applicationId": 1,
    "candidateId": 3,
    "newInterviewStep": {
      "id": 3,
      "name": "Entrevista Final",
      "orderIndex": 3
    }
  }
}
```

### Descripción de campos de respuesta


| Campo                         | Tipo      | Fuente                     | Descripción                      |
| ----------------------------- | --------- | -------------------------- | -------------------------------- |
| `applicationId`               | `integer` | `Application.id`           | ID de la postulación actualizada |
| `candidateId`                 | `integer` | `Application.candidateId`  | ID del candidato                 |
| `newInterviewStep.id`         | `integer` | `InterviewStep.id`         | ID de la nueva etapa             |
| `newInterviewStep.name`       | `string`  | `InterviewStep.name`       | Nombre de la nueva etapa         |
| `newInterviewStep.orderIndex` | `integer` | `InterviewStep.orderIndex` | Orden en el flujo                |


### Respuestas de error


| Código | Condición                                     | Body                                                                                           |
| ------ | --------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `400`  | `:id` no es entero positivo                   | `{ "error": "El ID de la postulación debe ser un número entero positivo" }`                    |
| `400`  | `newInterviewStepId` ausente o inválido       | `{ "error": "El campo newInterviewStepId es requerido y debe ser un número entero positivo" }` |
| `400`  | La etapa no pertenece al flujo de la posición | `{ "error": "La etapa indicada no pertenece al flujo de entrevistas de esta posición" }`       |
| `404`  | Postulación no encontrada                     | `{ "error": "Postulación no encontrada" }`                                                     |
| `404`  | InterviewStep no encontrado                   | `{ "error": "Etapa de entrevista no encontrada" }`                                             |
| `500`  | Error interno del servidor                    | `{ "error": "Error interno del servidor" }`                                                    |


### Query Prisma equivalente

```typescript
// Validación previa
const application = await prisma.application.findUnique({
  where: { id: applicationId },
  include: { position: { select: { interviewFlowId: true } } }
});

const step = await prisma.interviewStep.findUnique({
  where: { id: newInterviewStepId }
});

// Validar que el step pertenece al mismo flujo
if (step.interviewFlowId !== application.position.interviewFlowId) {
  throw new Error('Etapa no pertenece al flujo de la posición');
}

// Actualización
await prisma.application.update({
  where: { id: applicationId },
  data: { currentInterviewStep: newInterviewStepId }
});
```

---

## 4. Archivos a Crear / Modificar

Siguiendo la arquitectura en capas existente del proyecto:

```
backend/src/
│
├── routes/
│   ├── candidateRoutes.ts          ← MODIFICAR: añadir PUT /:id/stage
│   └── positionRoutes.ts           ← CREAR: nuevo archivo de rutas
│
├── presentation/
│   └── controllers/
│       ├── candidateController.ts  ← MODIFICAR: añadir updateCandidateStage()
│       └── positionController.ts   ← CREAR: nuevo controlador
│
├── application/
│   └── services/
│       ├── candidateService.ts     ← MODIFICAR: añadir updateApplicationStage()
│       └── positionService.ts      ← CREAR: nuevo servicio
│
├── domain/
│   └── models/
│       └── Application.ts          ← MODIFICAR: añadir findByPositionId() y update()
│
└── index.ts                        ← MODIFICAR: registrar positionRoutes
```

### Detalle por archivo

#### `backend/src/routes/positionRoutes.ts` — CREAR

```typescript
import { Router } from 'express';
import { getCandidatesByPosition } from '../presentation/controllers/positionController';

const router = Router();
router.get('/:id/candidates', getCandidatesByPosition);

export default router;
```

#### `backend/src/presentation/controllers/positionController.ts` — CREAR

Controlador HTTP que:

- Extrae y valida `req.params.id`.
- Llama a `positionService.getCandidatesByPosition(id)`.
- Devuelve `200` con el array de candidatos o el error correspondiente.

#### `backend/src/application/services/positionService.ts` — CREAR

Servicio que:

- Consulta `Application.findByPositionId(positionId)` con los includes necesarios.
- Calcula `averageScore` por postulación: promedio de `Interview.score` filtrando nulls.
- Mapea al DTO de respuesta.

#### `backend/src/presentation/controllers/candidateController.ts` — MODIFICAR

Añadir la función `updateCandidateStage`:

- Extrae y valida `req.params.id` y `req.body.newInterviewStepId`.
- Llama a `candidateService.updateApplicationStage(applicationId, newInterviewStepId)`.
- Devuelve `200` con los datos actualizados o el error correspondiente.

#### `backend/src/application/services/candidateService.ts` — MODIFICAR

Añadir la función `updateApplicationStage`:

- Busca la `Application` con su posición e `interviewFlowId`.
- Valida que el `InterviewStep` existe y pertenece al mismo flujo.
- Ejecuta el `update` en Prisma.

#### `backend/src/domain/models/Application.ts` — MODIFICAR

Añadir dos métodos estáticos:

- `findByPositionId(positionId: number)`: consulta con includes de candidato, interviewStep e interviews.
- `updateStage(applicationId: number, newStepId: number)`: ejecuta el update en Prisma.

#### `backend/src/index.ts` — MODIFICAR

Registrar las rutas de posición:

```typescript
import positionRoutes from './routes/positionRoutes';
app.use('/positions', positionRoutes);
```

---

## 5. Plan de Ejecución Paso a Paso

### Paso 1 — Ampliar el modelo `Application`

**Archivo:** `backend/src/domain/models/Application.ts`

Añadir el método estático `findByPositionId` con los includes necesarios para la respuesta del Kanban, y el método `updateStage` para actualizar la etapa.

**Resultado esperado:** Los métodos están disponibles y pueden ser llamados desde los servicios.

---

### Paso 2 — Crear el servicio de posiciones

**Archivo:** `backend/src/application/services/positionService.ts`

Implementar `getCandidatesByPosition(positionId: number)` que:

1. Verifica que la posición existe (si no → lanzar error con código `NOT_FOUND`).
2. Obtiene aplicaciones con `Application.findByPositionId`.
3. Por cada aplicación, calcula `averageScore` con `Math.round((sum / count) * 100) / 100`.
4. Devuelve el array de DTOs mapeados.

---

### Paso 3 — Crear el controlador de posiciones

**Archivo:** `backend/src/presentation/controllers/positionController.ts`

Implementar `getCandidatesByPosition(req, res)`:

1. Parsear y validar `req.params.id` como entero positivo.
2. Llamar al servicio.
3. Manejar errores diferenciando `NOT_FOUND` (404) de errores genéricos (500).

---

### Paso 4 — Crear las rutas de posiciones

**Archivo:** `backend/src/routes/positionRoutes.ts`

Registrar `GET /:id/candidates`.

---

### Paso 5 — Ampliar el servicio de candidatos

**Archivo:** `backend/src/application/services/candidateService.ts`

Añadir `updateApplicationStage(applicationId, newInterviewStepId)`:

1. Buscar la `Application` con su `position.interviewFlowId`.
2. Buscar el `InterviewStep` con `newInterviewStepId`.
3. Validar que el step pertenece al mismo flujo.
4. Ejecutar `Application.updateStage`.
5. Devolver los datos actualizados.

---

### Paso 6 — Ampliar el controlador de candidatos

**Archivo:** `backend/src/presentation/controllers/candidateController.ts`

Añadir `updateCandidateStage(req, res)`:

1. Parsear y validar `:id` y `body.newInterviewStepId`.
2. Llamar al servicio.
3. Manejar errores por tipo.

---

### Paso 7 — Registrar la nueva ruta en candidatos

**Archivo:** `backend/src/routes/candidateRoutes.ts`

Añadir:

```typescript
router.put('/:id/stage', updateCandidateStage);
```

---

### Paso 8 — Registrar rutas de posiciones en el servidor

**Archivo:** `backend/src/index.ts`

```typescript
import positionRoutes from './routes/positionRoutes';
app.use('/positions', positionRoutes);
```

---

### Paso 9 — Escribir tests unitarios

Ver sección [6. Tests Unitarios](#6-tests-unitarios).

---

### Paso 10 — Verificación manual con curl / Postman

```bash
# Obtener candidatos de la posición 1
curl http://localhost:3010/positions/1/candidates

# Mover aplicación 1 a la etapa 3
curl -X PUT http://localhost:3010/candidates/1/stage \
  -H "Content-Type: application/json" \
  -d '{ "newInterviewStepId": 3 }'
```

---

## 6. Tests Unitarios

**Ubicación:** `backend/src/tests/`

### 6.1 Tests para `positionService`

**Archivo:** `backend/src/tests/positionService.test.ts`

```typescript
describe('positionService - getCandidatesByPosition', () => {

  it('givenValidPositionId_whenGetCandidates_thenReturnCandidateList', async () => {
    // Arrange: mockear Application.findByPositionId con datos de prueba
    // Act: llamar getCandidatesByPosition(1)
    // Assert: el resultado tiene fullName, currentInterviewStep, averageScore
  });

  it('givenPositionWithNoApplications_whenGetCandidates_thenReturnEmptyArray', async () => {
    // Arrange: mock devuelve []
    // Act + Assert: resultado es []
  });

  it('givenInterviewsWithNullScore_whenGetCandidates_thenAverageScoreIsNull', async () => {
    // Arrange: interviews con score = null
    // Assert: averageScore === null
  });

  it('givenNonExistentPositionId_whenGetCandidates_thenThrowNotFoundError', async () => {
    // Arrange: mock de Position.findUnique devuelve null
    // Assert: lanza error con código NOT_FOUND
  });

});
```

### 6.2 Tests para `candidateService`

**Archivo:** `backend/src/tests/candidateService.test.ts`

```typescript
describe('candidateService - updateApplicationStage', () => {

  it('givenValidApplicationAndStep_whenUpdateStage_thenReturnUpdatedData', async () => {
    // Arrange: mocks de Application y InterviewStep válidos y del mismo flujo
    // Act: llamar updateApplicationStage(1, 3)
    // Assert: se llama Application.updateStage y retorna datos correctos
  });

  it('givenNonExistentApplication_whenUpdateStage_thenThrowNotFoundError', async () => {
    // Arrange: Application.findOne devuelve null
    // Assert: lanza error NOT_FOUND
  });

  it('givenStepFromDifferentFlow_whenUpdateStage_thenThrowValidationError', async () => {
    // Arrange: step.interviewFlowId !== application.position.interviewFlowId
    // Assert: lanza error de validación
  });

  it('givenNonExistentStep_whenUpdateStage_thenThrowNotFoundError', async () => {
    // Arrange: InterviewStep.findUnique devuelve null
    // Assert: lanza error NOT_FOUND
  });

});
```

### Comando para ejecutar tests

```bash
cd backend
npm test
```

---

## 7. Criterios de Aceptación

La tarea se considera **completa** cuando se cumplen **todos** los siguientes puntos:

### Funcionales

- [ ] `GET /positions/1/candidates` devuelve `200` con array de candidatos cuando hay aplicaciones.
- [ ] `GET /positions/1/candidates` devuelve `200` con `[]` cuando no hay aplicaciones.
- [ ] `GET /positions/999/candidates` devuelve `404` cuando la posición no existe.
- [ ] `GET /positions/abc/candidates` devuelve `400` cuando el ID no es numérico.
- [ ] El campo `averageScore` es `null` cuando no hay entrevistas con score.
- [ ] El campo `averageScore` es el promedio correcto (redondeado a 2 decimales) cuando hay scores.
- [ ] `PUT /candidates/1/stage` con `{ "newInterviewStepId": 3 }` actualiza la etapa correctamente y devuelve `200`.
- [ ] `PUT /candidates/1/stage` devuelve `400` si `newInterviewStepId` no se envía en el body.
- [ ] `PUT /candidates/999/stage` devuelve `404` si la aplicación no existe.
- [ ] `PUT /candidates/1/stage` con un step de otro flujo devuelve `400`.

### Técnicos

- [ ] Todos los tests unitarios pasan (`npm test`).
- [ ] No hay errores de TypeScript (`npm run build` sin errores).
- [ ] Los nuevos archivos siguen la convención de nombres del proyecto.
- [ ] El archivo `README-LTI.md` tiene los nuevos endpoints documentados en la sección de API.

---

## 8. Requisitos No Funcionales

### Seguridad

- Sanitizar todos los parámetros de entrada antes de usarlos en consultas Prisma (Prisma parametriza automáticamente, pero los `parseInt` deben validarse explícitamente).
- No exponer stack traces en los errores de producción: los mensajes de `500` deben ser genéricos.
- No incluir datos sensibles del candidato (email, teléfono, dirección) en la respuesta del kanban.

### Rendimiento

- La consulta de `GET /positions/:id/candidates` debe resolverse con **una sola query** a Prisma usando `include` anidado, evitando N+1 queries.
- El cálculo de `averageScore` se realiza **en memoria** (JavaScript) sobre los datos ya traídos, sin queries adicionales a la base de datos.
- Tiempo de respuesta esperado: < 300 ms bajo condiciones normales (posición con ≤ 500 candidatos).

### Mantenibilidad

- Ningún controlador debe contener lógica de negocio: solo parseo de request y formateo de response.
- Ningún servicio debe importar directamente `PrismaClient`: acceder a la base de datos solo a través de los métodos de los modelos de dominio.
- Los mensajes de error deben ser constantes o enums, no strings inline.

### Compatibilidad

- Los endpoints deben ser accesibles desde `http://localhost:3000` (CORS ya configurado en `index.ts`).
- La respuesta debe ser siempre `Content-Type: application/json`.

