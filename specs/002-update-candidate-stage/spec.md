# Spec 002 — PUT /candidates/:id/stage

## User Story

Como reclutador, quiero mover a un candidato a una etapa diferente del proceso de entrevistas para una posición concreta, para poder actualizar el estado del Kanban cuando el candidato avanza o retrocede.

## Contrato HTTP

**Request**
```
PUT /candidates/:id/stage
```

| Param | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `id` | integer (path) | sí | ID de la **aplicación** (Application.id) |

**Request Body**
```json
{
  "interviewStepId": 3
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `interviewStepId` | integer | sí | ID del nuevo InterviewStep. Debe pertenecer al `interviewFlowId` de la posición de la aplicación. |

**Response 200** — aplicación actualizada
```json
{
  "id": 1,
  "positionId": 2,
  "candidateId": 5,
  "currentInterviewStep": 3,
  "applicationDate": "2024-01-15T10:00:00.000Z",
  "notes": null
}
```

**Response 400** — ID inválido o body inválido
```json
{ "message": "Invalid application id" }
```
o
```json
{ "message": "interviewStepId must be a positive integer" }
```

**Response 404** — Aplicación no existe
```json
{ "message": "Application not found" }
```

**Response 409** — El step no pertenece al flow de la posición
```json
{ "message": "Interview step does not belong to the position's interview flow" }
```

## Acceptance Criteria

- **GIVEN** una aplicación válida y un step que pertenece al flow de la posición **WHEN** PUT /candidates/1/stage con `{ interviewStepId: 3 }` **THEN** 200 con la aplicación actualizada mostrando el nuevo `currentInterviewStep`
- **GIVEN** un `interviewStepId` que NO pertenece al `interviewFlowId` de la posición **WHEN** PUT /candidates/1/stage **THEN** 409 con mensaje descriptivo
- **GIVEN** un ID de aplicación inexistente **WHEN** PUT /candidates/999/stage **THEN** 404
- **GIVEN** un ID no numérico **WHEN** PUT /candidates/abc/stage **THEN** 400
- **GIVEN** `interviewStepId` no es entero **WHEN** PUT /candidates/1/stage con `{ interviewStepId: "abc" }` **THEN** 400

## Lógica de validación del step

Un `interviewStepId` es válido para una aplicación si:
```
InterviewStep.interviewFlowId === Application.position.interviewFlowId
```

Pasos de validación en el service:
1. Buscar la `Application` con `include: { position: true }`
2. Si no existe → 404
3. Buscar el `InterviewStep` por `interviewStepId`
4. Si no existe → 400 (step inválido)
5. Si `step.interviewFlowId !== application.position.interviewFlowId` → 409
6. Actualizar `application.currentInterviewStep = interviewStepId`

## Ficheros a crear/modificar

| Fichero | Acción |
|---------|--------|
| `backend/api-spec.yaml` | Añadir path `/candidates/{id}/stage` |
| `backend/src/domain/models/Application.ts` | Añadir método `updateStage` |
| `backend/src/application/services/applicationService.ts` | Crear con `updateCandidateStage` |
| `backend/src/presentation/controllers/applicationController.ts` | Crear handler |
| `backend/src/routes/candidateRoutes.ts` | Añadir `PUT /:id/stage` al router existente |

## Jira

- Ticket: L1DR-2
- Relacionado con: L1DR-27 (misma posición → mismo interviewFlow)
