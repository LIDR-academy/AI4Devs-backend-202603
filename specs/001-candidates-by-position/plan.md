# Plan de implementación — GET /positions/:id/candidates

## Estado actual

- Tests RED: **listos** en `backend/tests/positionService.test.ts`
- OpenAPI: **pendiente** — añadir `/positions/{id}/candidates` a `api-spec.yaml`
- Implementación: **pendiente**

## Orden de implementación

### 0. Verificar tests RED
```bash
cd backend && npm test -- --testPathPattern="positionService"
```
Todos los tests deben fallar (el service no existe aún).

### 1. Contrato OpenAPI
Añadir a `backend/api-spec.yaml`:
- Path `/positions/{id}/candidates`
- Schema `CandidateRow` en `components/schemas`
- Schema `Error` en `components/schemas` (reutilizable)
- Validar con `npx @redocly/cli lint api-spec.yaml`

### 2. Domain model — `Position.ts`
Añadir método estático `findWithCandidates` al fichero existente `backend/src/domain/models/Position.ts`.

```typescript
static async findWithCandidates(id: number) {
  return prisma.position.findUnique({
    where: { id },
    include: {
      applications: {
        include: {
          candidate: { select: { firstName: true, lastName: true } },
          interviewStep: { select: { name: true } },
          interviews: { select: { score: true } },
        },
      },
    },
  });
}
```

→ `npm run build` — debe pasar.

### 3. Service — `positionService.ts`
Crear `backend/src/application/services/positionService.ts`:
- Exportar `getPositionCandidates(id: number): Promise<CandidateRow[]>`
- Validación de ID: `!Number.isInteger(id) || id <= 0` → throw `{ status: 400 }`
- 404 si `findWithCandidates` devuelve null
- Mapear applications con la lógica de `averageScore`

→ `npm run build` — debe pasar.

### 4. Controller — `positionController.ts`
Crear `backend/src/presentation/controllers/positionController.ts`:
- Handler `getPositionCandidatesController`
- `Request<{ id: string }>` con `parseInt(req.params.id, 10)`
- `catch (error: any)` con manejo de 400/404/500

→ `npm run build` — debe pasar.

### 5. Route — `positionRoutes.ts`
Crear `backend/src/routes/positionRoutes.ts`:
```typescript
import { Router } from 'express';
import { getPositionCandidatesController } from '../presentation/controllers/positionController';

const router = Router();
router.get('/:id/candidates', getPositionCandidatesController);
export default router;
```

→ `npm run build` — debe pasar.

### 6. Registro en `index.ts`
Añadir en `backend/src/index.ts`:
```typescript
import positionRoutes from './routes/positionRoutes';
app.use('/positions', positionRoutes);
```

→ `npm run build` — debe pasar.

### 7. Verificar tests GREEN
```bash
cd backend && npm test
```
Todos los tests deben pasar.

### 8. Revisión adversarial
Invocar agente `reviewer` con `git diff HEAD`.

## Decisiones de diseño

| Decisión | Alternativa descartada | Razón |
|----------|----------------------|-------|
| `averageScore: null` cuando no hay scores | `averageScore: 0` | 0 es ambiguo — no sabemos si es score real o ausencia de datos |
| `currentInterviewStep` como string (nombre) | Como integer (orderIndex o id) | El Kanban necesita labels legibles, no IDs numéricos |
| Validación de ID en el service (no en el controller) | Validar en controller | Mantiene el service testeable de forma aislada y la lógica de negocio en la capa correcta |
| Type predicate `(s): s is number` | `filter(s => s !== null) as number[]` | El predicate es más type-safe con strict mode |
