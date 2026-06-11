# Especificación técnica: endpoints de reclutamiento

## Resumen

Dos endpoints nuevos que consultan y actualizan el estado del proceso de selección cruzando `Position`, `Application`, `Candidate`, `InterviewStep` e `Interview`. Siguen el flujo existente: **route → controller → service → domain model (Prisma)**.

| Endpoint | Propósito |
|---|---|
| `GET /positions/:id/candidates` | Listar candidatos en proceso para una posición |
| `PUT /candidates/:id/stage` | Actualizar la etapa actual de entrevista de un candidato |

---

## GET /positions/:id/candidates

### Contrato

**Parámetros de ruta**

| Param | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `id` | `integer` | Sí | ID de la `Position` |

**Respuesta exitosa — `200 OK`**

```json
{
  "positionId": 1,
  "candidates": [
    {
      "candidateId": 10,
      "fullName": "John Doe",
      "currentInterviewStep": {
        "id": 2,
        "name": "Technical Interview",
        "orderIndex": 2
      },
      "averageScore": 4.5
    }
  ]
}
```

| Campo | Origen | Notas |
|---|---|---|
| `candidateId` | `Candidate.id` | — |
| `fullName` | `Candidate.firstName` + espacio + `Candidate.lastName` | Concatenación simple |
| `currentInterviewStep` | `Application.currentInterviewStep` → `InterviewStep` | Objeto con `id`, `name`, `orderIndex` |
| `averageScore` | `Interview.score` de la `Application` | Media aritmética; ver reglas abajo |

**Definición de "en proceso":** candidato con al menos un registro `Application` donde `Application.positionId` = `:id`. No existe campo de estado en `Application`; toda candidatura activa en BD se considera en proceso.

**Cálculo de `averageScore`:**

- Solo entrevistas de la `Application` de ese candidato para esa posición (`Interview.applicationId`).
- Solo cuentan registros con `score` no nulo.
- Si ninguna entrevista tiene `score` → `averageScore: null`.
- Resultado redondeado a 1 decimal.

**Lista vacía:** si la posición existe pero no tiene candidaturas → `200` con `"candidates": []`.

### Validaciones

1. `:id` debe ser entero positivo parseable; si no → `400`.
2. La `Position` con ese `id` debe existir; si no → `404`.

### Errores

| Código | Condición | Cuerpo |
|---|---|---|
| `400` | `:id` no numérico o ≤ 0 | `{ "error": "Invalid ID format" }` |
| `404` | Posición no encontrada | `{ "error": "Position not found" }` |
| `500` | Error inesperado de BD o servidor | `{ "error": "Internal Server Error" }` |

### Archivos

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `backend/src/routes/positionRoutes.ts` | Crear | Define `GET /:id/candidates` |
| `backend/src/presentation/controllers/positionController.ts` | Crear | Parsea `id`, delega al servicio, responde HTTP |
| `backend/src/application/services/positionService.ts` | Crear | Orquesta consulta y mapeo de respuesta |
| `backend/src/domain/models/Position.ts` | Modificar | Método estático p. ej. `findCandidatesInProcess(id)` con `include` de `applications → candidate, interviewStep, interviews` |
| `backend/src/index.ts` | Modificar | `app.use('/positions', positionRoutes)` |
| `backend/api-spec.yaml` | Modificar | Documentar endpoint |

### Criterios de aceptación

- [ ] **Dado** una posición con candidaturas en seed, **cuando** `GET /positions/1/candidates`, **entonces** `200` con lista de candidatos y campos requeridos.
- [ ] **Dado** una posición sin candidaturas, **cuando** `GET /positions/{id}/candidates`, **entonces** `200` con `"candidates": []`.
- [ ] **Dado** un `id` de posición inexistente, **cuando** se consulta, **entonces** `404`.
- [ ] **Dado** un candidato con entrevistas `score` 5 y 4, **cuando** se consulta, **entonces** `averageScore` = `4.5`.
- [ ] **Dado** un candidato sin entrevistas con `score`, **cuando** se consulta, **entonces** `averageScore` = `null`.
- [ ] **Dado** `:id` = `"abc"`, **cuando** se consulta, **entonces** `400`.

---

## PUT /candidates/:id/stage

### Contrato

**Parámetros de ruta**

| Param | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `id` | `integer` | Sí | ID del `Candidate` |

**Body — `application/json`**

```json
{
  "positionId": 1,
  "interviewStepId": 3
}
```

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `positionId` | `integer` | Sí | Identifica la candidatura (`Application`) a actualizar |
| `interviewStepId` | `integer` | Sí | Nuevo valor de `Application.currentInterviewStep` |

**Respuesta exitosa — `200 OK`**

```json
{
  "applicationId": 5,
  "candidateId": 10,
  "positionId": 1,
  "currentInterviewStep": {
    "id": 3,
    "name": "Manager Interview",
    "orderIndex": 3
  }
}
```

Actualiza `Application.currentInterviewStep` del registro que coincida con `candidateId` (= `:id`) y `positionId` del body.

### Validaciones

1. `:id`, `positionId` e `interviewStepId` deben ser enteros positivos.
2. `Candidate` con `:id` debe existir.
3. `Position` con `positionId` debe existir.
4. Debe existir `Application` con ese `candidateId` y `positionId`.
5. `InterviewStep` con `interviewStepId` debe existir.
6. El paso debe pertenecer al flujo de la posición: `InterviewStep.interviewFlowId` = `Position.interviewFlowId`.

### Errores

| Código | Condición | Cuerpo |
|---|---|---|
| `400` | ID inválido, body incompleto o paso no pertenece al flujo | `{ "error": "<mensaje descriptivo>" }` |
| `404` | Candidato, posición o candidatura no encontrados | `{ "error": "Candidate not found" }` / `"Position not found"` / `"Application not found"` |
| `500` | Error inesperado | `{ "error": "Internal Server Error" }` |

### Archivos

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `backend/src/routes/candidateRoutes.ts` | Modificar | Añadir `PUT /:id/stage` **antes** de `GET /:id` para evitar conflicto de rutas |
| `backend/src/presentation/controllers/candidateController.ts` | Modificar | Handler `updateCandidateStage` |
| `backend/src/application/services/candidateService.ts` | Modificar | Lógica `updateCandidateStage` |
| `backend/src/application/validator.ts` | Modificar | `validateUpdateStageData(body)` |
| `backend/src/domain/models/Application.ts` | Modificar | `findByCandidateAndPosition()`, reutilizar `save()` para actualizar |
| `backend/src/domain/models/InterviewStep.ts` | Modificar | Consulta para validar pertenencia al flujo (o validar en servicio) |
| `backend/api-spec.yaml` | Modificar | Documentar endpoint |

### Criterios de aceptación

- [ ] **Dado** candidato con candidatura en posición 1 en paso 1, **cuando** `PUT /candidates/10/stage` con `{ "positionId": 1, "interviewStepId": 2 }` y paso 2 pertenece al flujo, **entonces** `200` y `currentInterviewStep.id` = 2.
- [ ] **Dado** candidato sin candidatura para esa posición, **cuando** se actualiza, **entonces** `404` `"Application not found"`.
- [ ] **Dado** `interviewStepId` de otro flujo, **cuando** se actualiza, **entonces** `400` con mensaje de paso inválido.
- [ ] **Dado** body sin `positionId`, **cuando** se actualiza, **entonces** `400`.
- [ ] **Dado** candidato inexistente, **cuando** se actualiza, **entonces** `404` `"Candidate not found"`.
- [ ] Tras actualización, un `GET /positions/{positionId}/candidates` refleja el nuevo paso.

---

## Archivos compartidos

| Archivo | Acción |
|---|---|
| `backend/src/index.ts` | Modificar — montar `positionRoutes` |
| `backend/api-spec.yaml` | Modificar — ambos endpoints |

No se requieren cambios en `backend/prisma/schema.prisma`.

---

## Riesgos o supuestos abiertos

1. **Sin estado de candidatura:** no hay campo `status` en `Application`; "en proceso" = existencia del registro. Si en el futuro se añade cierre de procesos, habrá que filtrar.
2. **Candidato en varias posiciones:** el PUT requiere `positionId` en body para desambiguar; un candidato puede tener varias `Application`.
3. **Orden de rutas en `candidateRoutes`:** `PUT /:id/stage` debe registrarse antes que `GET /:id` para que Express no interprete `"stage"` como ID.
4. **Convención de errores:** se replica el patrón de `getCandidateById` (`{ "error": "..." }`); no unificar con `POST /candidates` (`{ "message": "..." }`) en esta iteración.
