---
description: "Ciclo RED: escribe sólo los tests y confirma que todos fallan antes de implementar"
argument-hint: "<METHOD> <path> — ej: GET /positions/:id/candidates"
---

Ciclo TDD fase RED. Escribe **únicamente** los tests. Confirma que todos fallan. Se detiene y espera "GREEN" del humano antes de cualquier implementación.

## Tests obligatorios por endpoint

Para **GET /positions/:id/candidates**:
1. Happy path — 200 con array de candidatos con `fullName`, `currentInterviewStep` (nombre del step), `averageScore`
2. `averageScore` es `null` (no `0`, no `NaN`) cuando no hay entrevistas con score
3. Media ignora scores `null` y sólo promedia los numéricos
4. Array vacío `[]` cuando la posición no tiene candidatos
5. 404 con `{ status: 404, message: 'Position not found' }` cuando la posición no existe
6. 400 con `{ status: 400, message: 'Invalid position id' }` para IDs no válidos (NaN, 0, negativos)

Para **PUT /candidates/:id/stage**:
1. Happy path — 200 con la aplicación actualizada
2. 404 — aplicación no encontrada
3. 400 — `interviewStepId` no es entero válido
4. 409 — el `interviewStepId` no pertenece al `interviewFlowId` de la posición

## Convenciones

- Fichero: `backend/tests/<dominio>Service.test.ts`
- Mock de Prisma siguiendo el patrón de `backend/tests/positionService.test.ts`:
  ```typescript
  const mockFindUnique = jest.fn();
  jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn().mockImplementation(() => ({
      position: { findUnique: mockFindUnique },
    })),
  }));
  ```
- `beforeEach(() => jest.clearAllMocks())`
- Nombres descriptivos: `'returns averageScore as null (not 0) when no interviews have a score'`

## Flujo

1. Lee `specs/<nnn>-<feature>/spec.md` y `data-model.md` para entender el contrato.
2. Escribe los tests en el fichero correspondiente.
3. Ejecuta:
   ```bash
   cd backend && npm test -- --testPathPattern="<fichero>"
   ```
4. Confirma en el output que **todos los tests fallan** (RED confirmado).
5. **PAUSA OBLIGATORIA**:
   ```
   ✋ RED confirmado: X tests fallan. Escribe "GREEN" para comenzar la implementación.
   ```

No escribas ningún código de implementación en esta fase.
