# Plan de implementación — PUT /candidates/:id/stage

## Estado actual

- Tests RED: **pendientes** — escribir en `backend/tests/applicationService.test.ts`
- OpenAPI: **pendiente** — añadir `PUT /candidates/{id}/stage` a `api-spec.yaml`
- Implementación: **pendiente**

## Orden de implementación

### 0. Escribir tests RED
Crear `backend/tests/applicationService.test.ts` con los 4 casos:
1. Happy path — 200 con aplicación actualizada
2. 404 — aplicación no encontrada
3. 400 — ID inválido
4. 409 — step no pertenece al flow de la posición

```bash
cd backend && npm test -- --testPathPattern="applicationService"
```
Confirmar que todos fallan.

### 1. Contrato OpenAPI
Añadir a `backend/api-spec.yaml`:
- Path `PUT /candidates/{id}/stage`
- Schema `UpdateStageRequest` en `components/schemas`
- Reutilizar `Error` de `components/schemas` (ya definido por spec 001)
- Validar con `npx @redocly/cli lint api-spec.yaml`

### 2. Domain model — `Application.ts`
Añadir método `updateStage` al fichero existente `backend/src/domain/models/Application.ts`:

```typescript
async updateStage(interviewStepId: number) {
  return prisma.application.update({
    where: { id: this.id },
    data: { currentInterviewStep: interviewStepId },
  });
}

static async findWithPosition(id: number) {
  return prisma.application.findUnique({
    where: { id },
    include: { position: { select: { interviewFlowId: true } } },
  });
}
```

→ `npm run build` — debe pasar.

### 3. Service — `applicationService.ts`
Crear `backend/src/application/services/applicationService.ts`:
- Exportar `updateCandidateStage(applicationId, interviewStepId)`
- Validaciones: ID entero positivo, aplicación existe (404), step existe (400), flow coincide (409)
- Actualizar y devolver la aplicación actualizada

→ `npm run build` — debe pasar.

### 4. Controller — `applicationController.ts`
Crear `backend/src/presentation/controllers/applicationController.ts`:
- Handler `updateCandidateStageController`
- `Request<{ id: string }, {}, { interviewStepId: number }>`
- `catch (error: any)` con manejo de 400/404/409/500

→ `npm run build` — debe pasar.

### 5. Route — añadir a `candidateRoutes.ts`
Añadir en `backend/src/routes/candidateRoutes.ts` (router existente):
```typescript
import { updateCandidateStageController } from '../presentation/controllers/applicationController';
router.put('/:id/stage', updateCandidateStageController);
```

→ `npm run build` — debe pasar.

### 6. Verificar tests GREEN
```bash
cd backend && npm test
```
Todos los tests deben pasar (spec 001 + spec 002).

### 7. Revisión adversarial
Invocar agente `reviewer` con `git diff HEAD`.

## Decisiones de diseño

| Decisión | Alternativa descartada | Razón |
|----------|----------------------|-------|
| El path param `id` es `Application.id`, no `Candidate.id` | `Candidate.id` | Un candidato puede tener múltiples aplicaciones; la etapa es por aplicación, no por candidato |
| 409 para step de flow equivocado | 400 | El dato es técnicamente válido (el step existe), pero viola una regla de negocio (contexto incorrecto) — semántica HTTP correcta |
| Validar en el service con dos queries separadas | Un join complejo | Más legible; el coste de dos queries simples es despreciable para este caso de uso |
| Reutilizar `candidateRoutes.ts` en lugar de crear `applicationRoutes.ts` | Router separado | El path es `/candidates/:id/stage`, encaja en el router de candidatos existente |
