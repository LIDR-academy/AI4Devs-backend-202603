# Revisión: endpoints de reclutamiento

## Resumen

**PASS con correcciones** — La implementación cumple los criterios de aceptación de `endpoints-spec.md`. Se detectó y corrigió un bug menor en la validación del body del PUT cuando llega `null`/`undefined`.

Revisión basada en análisis estático del código y compilación (`npm run build` ✓). Pruebas HTTP manuales no ejecutadas: la base de datos Docker no estaba levantada en el entorno de revisión.

---

## Criterios de aceptación

| Criterio | Estado | Notas |
|---|---|---|
| `GET /positions/1/candidates` con candidaturas en seed → `200` | OK | `positionService` mapea `candidateId`, `fullName`, `currentInterviewStep`, `averageScore` |
| Posición sin candidaturas → `200` con `[]` | OK | `applications` vacío produce `candidates: []` |
| Posición inexistente → `404` | OK | `positionController` línea 12-14 |
| Media de scores 5 y 4 → `4.5` | OK | `calculateAverageScore` redondea a 1 decimal |
| Sin scores → `averageScore: null` | OK | Seed: candidato 3 en posición 1 sin entrevistas |
| `:id` = `"abc"` → `400` | OK | `isNaN(parseInt(...))` en controlador |
| `PUT` actualiza paso válido → `200` | OK | Actualiza `Application.currentInterviewStep` y devuelve paso |
| Sin candidatura → `404 Application not found` | OK | `candidateService` línea 84-86 |
| Paso de otro flujo → `400` | OK | Compara `interviewFlowId` |
| Body sin `positionId` → `400` | OK | `validateUpdateStageData` |
| Candidato inexistente → `404` | OK | `candidateService` línea 74-76 |
| `GET` refleja nuevo paso tras `PUT` | OK | Ambos leen `Application.currentInterviewStep` |

---

## Casos límite

### `GET /positions/:id/candidates`

| Caso | Estado | Código HTTP | Notas |
|---|---|---|---|
| `:id` numérico y positivo válido | OK | `200` | Estructura `{ positionId, candidates }` |
| `:id` no numérico o ≤ 0 | OK | `400` | `{ "error": "Invalid ID format" }` |
| Posición inexistente | OK | `404` | `{ "error": "Position not found" }` |
| Posición sin candidaturas | OK | `200` | Posición 2 en seed sin applications |
| Sin entrevistas con `score` | OK | `200` | `averageScore: null` |
| Con entrevistas puntuadas | OK | `200` | Media aritmética redondeada |
| Error de BD/servidor | OK | `500` | `catch` en `positionController` |

### `PUT /candidates/:id/stage`

| Caso | Estado | Código HTTP | Notas |
|---|---|---|---|
| `:id` no numérico o ≤ 0 | OK | `400` | `{ "error": "Invalid ID format" }` |
| Body sin `positionId` | OK | `400` | `{ "error": "Invalid positionId" }` |
| Body sin `interviewStepId` | OK | `400` | `{ "error": "Invalid interviewStepId" }` |
| Body `null`/`undefined` | OK (corregido) | `400` | Antes → `500`; ahora `{ "error": "Invalid request body" }` |
| Candidato inexistente | OK | `404` | `{ "error": "Candidate not found" }` |
| Posición inexistente | OK | `404` | `{ "error": "Position not found" }` |
| Candidatura inexistente | OK | `404` | `{ "error": "Application not found" }` |
| Paso de otro flujo | OK | `400` | Mensaje coherente con spec |
| Paso inexistente | OK | `400` | Mismo mensaje que paso de otro flujo (aceptable por spec) |
| Actualización válida | OK | `200` | Devuelve `currentInterviewStep` actualizado |
| Error de BD/servidor | OK | `500` | Errores no mapeados → `catch` en controlador |

### Coherencia HTTP

| Aspecto | Estado | Notas |
|---|---|---|
| Formato `{ "error": "..." }` | OK | Alineado con `GET /candidates/:id` |
| Códigos `400`/`404`/`500` | OK | Según `endpoints-spec.md` |
| Endpoints existentes intactos | OK | Solo se añadieron rutas nuevas |

---

## Hallazgos y correcciones

| Severidad | Endpoint | Descripción | Acción tomada |
|---|---|---|---|
| OK | GET | Contrato, validaciones y mapeo correctos | Ninguna |
| OK | PUT | Flujo de validación y actualización correcto | Ninguna |
| BUG | PUT | Body `null`/`undefined` causaba `TypeError` → `500` | Añadida guarda en `validateUpdateStageData` |
| MEJORA menor | GET/PUT | `parseInt("12abc")` acepta `12` (comportamiento JS estándar) | No corregido (fuera de spec, mismo patrón que `getCandidateById`) |
| MEJORA menor | PUT | Paso inexistente devuelve mismo mensaje que paso de otro flujo | No corregido (spec solo exige `400`) |

---

## Archivos modificados

- `backend/src/application/validator.ts` — guarda para body ausente en `validateUpdateStageData`

---

## Cómo verificar

```bash
# Levantar BD y seed
docker compose up -d
cd backend
npx prisma db seed
npm run dev

# GET — éxito (posición 1 con candidatos)
curl http://localhost:3010/positions/1/candidates

# GET — lista vacía (posición 2 sin candidaturas en seed)
curl http://localhost:3010/positions/2/candidates

# GET — ID inválido
curl http://localhost:3010/positions/abc/candidates

# GET — posición inexistente
curl http://localhost:3010/positions/9999/candidates

# PUT — actualizar etapa
curl -X PUT http://localhost:3010/candidates/1/stage \
  -H "Content-Type: application/json" \
  -d "{\"positionId\": 1, \"interviewStepId\": 3}"

# PUT — body incompleto
curl -X PUT http://localhost:3010/candidates/1/stage \
  -H "Content-Type: application/json" \
  -d "{}"

# PUT — candidato inexistente
curl -X PUT http://localhost:3010/candidates/9999/stage \
  -H "Content-Type: application/json" \
  -d "{\"positionId\": 1, \"interviewStepId\": 2}"

# PUT — paso de otro flujo (usar interviewStepId de interviewFlow2)
curl -X PUT http://localhost:3010/candidates/1/stage \
  -H "Content-Type: application/json" \
  -d "{\"positionId\": 1, \"interviewStepId\": 99}"

# Verificar coherencia tras PUT
curl http://localhost:3010/positions/1/candidates
```
