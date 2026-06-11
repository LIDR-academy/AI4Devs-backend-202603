# Spec 001 — GET /positions/:id/candidates

## User Story

Como reclutador, quiero obtener todos los candidatos en proceso para una posición concreta, para poder visualizarlos en el tablero Kanban con su etapa actual y puntuación media.

## Contrato HTTP

**Request**
```
GET /positions/:id/candidates
```

| Param | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `id` | integer (path) | sí | ID de la posición. Debe ser entero positivo. |

**Response 200** — array (puede ser vacío)
```json
[
  {
    "fullName": "Jane Doe",
    "currentInterviewStep": "Technical Interview",
    "averageScore": 4.5
  }
]
```

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| `fullName` | string | no | `candidate.firstName + ' ' + candidate.lastName` |
| `currentInterviewStep` | string | no | `interviewStep.name` del paso actual de la aplicación |
| `averageScore` | number | **sí** | Media de `interview.score` ignorando nulls. **`null` si no hay scores válidos** — nunca `0`, nunca `NaN`. |

**Response 400** — ID inválido
```json
{ "message": "Invalid position id" }
```
Casos: `id` no es entero, es `0`, es negativo, es `NaN`.

**Response 404** — Posición no existe
```json
{ "message": "Position not found" }
```

## Acceptance Criteria

- **GIVEN** una posición con ID válido que tiene candidatos **WHEN** GET /positions/1/candidates **THEN** 200 con array de candidatos con `fullName`, `currentInterviewStep` y `averageScore`
- **GIVEN** una posición sin candidatos **WHEN** GET /positions/1/candidates **THEN** 200 con array vacío `[]`
- **GIVEN** candidatos sin entrevistas puntuadas **WHEN** se consulta la posición **THEN** `averageScore` es `null` (NO `0`, NO `NaN`)
- **GIVEN** candidatos con scores mixtos (algunos null) **WHEN** se calcula la media **THEN** sólo se promedian los scores no-null
- **GIVEN** un ID de posición inexistente **WHEN** GET /positions/999/candidates **THEN** 404 con `{ "message": "Position not found" }`
- **GIVEN** un ID no numérico **WHEN** GET /positions/abc/candidates **THEN** 400 con `{ "message": "Invalid position id" }`

## Ficheros a crear/modificar

| Fichero | Acción |
|---------|--------|
| `backend/api-spec.yaml` | Añadir path `/positions/{id}/candidates` |
| `backend/src/domain/models/Position.ts` | Añadir `static findWithCandidates(id)` |
| `backend/src/application/services/positionService.ts` | Crear con `getPositionCandidates(id)` |
| `backend/src/presentation/controllers/positionController.ts` | Crear handler |
| `backend/src/routes/positionRoutes.ts` | Crear router |
| `backend/src/index.ts` | Registrar `/positions` router |
| `backend/tests/positionService.test.ts` | Ya existe — tests RED listos |

## Jira

- Epic: L1DR-27
- Tests pre-escritos: `backend/tests/positionService.test.ts`
