#PROMTPT 1
Recopila el contexto que necesites para generar un prompt, para ejecutar la siguiente tarea "Tenemos que crear dos end points GET
/positions/:id/candidates
Este endpoint recogerá todos los candidatos en proceso para una determinada posición, es decir, todas las aplicaciones para un determinado
positionID. Debe proporcionar la siguiente información básica:

Nombre completo del candidato (de la tabla candidate).

current_interview_step: en qué fase del proceso está el candidato (de la tabla application).

La puntuación media del candidato. Recuerda que cada entrevist (interview) realizada por el candidato tiene un score

PUT /candidates/:id/stage
Este endpoint actualizará la etapa del candidato movido. Permite modificar la fase actual del proceso de entrevista en la que se encuentra un
candidato específico." Para el prompt usa buenas practicas de prompting como asignación de rol y demas. Asegurate de en el prompt detallar toda
la ejecución tecnica.

# Prompt — Implementación de dos endpoints (GET candidates por posición / PUT stage de candidato)

## Rol

Actúa como **ingeniero backend senior especializado en Node.js, TypeScript, Express y Prisma**, con dominio de arquitectura por capas (routes → controllers → services → domain models) y buenas prácticas de API REST. Escribes código limpio, tipado en modo estricto y consistente con el estilo existente del proyecto.

## Contexto del proyecto

- **Stack:** TypeScript (strict), Express 4.19, Prisma 5.13 sobre PostgreSQL, Jest 29 (ts-jest).
- **Arquitectura por capas** (separación de responsabilidades):
  - `src/routes/*.ts` → routers de Express, parsing de request, manejo try/catch y códigos de estado.
  - `src/presentation/controllers/*.ts` → handlers, parseo/validación de params (`parseInt` + chequeo `NaN`), formato de respuesta.
  - `src/application/services/*.ts` → lógica de negocio, validaciones, manejo de errores Prisma (P2002, P2025).
  - `src/domain/models/*.ts` → clases de dominio con métodos `save()` / `findOne(id)` que encapsulan acceso a Prisma.
  - `src/application/validator.ts` → validadores reutilizables que lanzan `Error` con mensajes descriptivos.
- **Entrada principal:** `src/index.ts`. Las rutas se registran con `app.use('/recurso', recursoRoutes)` (ej. `app.use('/candidates', candidateRoutes)`).
- **Doc API:** `backend/api-spec.yaml` (OpenAPI 3.0).

### Modelos Prisma relevantes (`backend/prisma/schema.prisma`)

```prisma
model Candidate {
  id        Int    @id @default(autoincrement())
  firstName String @db.VarChar(100)
  lastName  String @db.VarChar(100)
  email     String @unique
  applications Application[]
}

model Application {
  id                   Int           @id @default(autoincrement())
  positionId           Int
  candidateId          Int
  applicationDate      DateTime
  currentInterviewStep Int
  notes                String?
  position             Position      @relation(fields: [positionId], references: [id])
  candidate            Candidate     @relation(fields: [candidateId], references: [id])
  interviewStep        InterviewStep @relation(fields: [currentInterviewStep], references: [id])
  interviews           Interview[]
}

model Interview {
  id              Int    @id @default(autoincrement())
  applicationId   Int
  interviewStepId Int
  employeeId      Int
  interviewDate   DateTime
  result          String?
  score           Int?
  notes           String?
}

model InterviewStep {
  id              Int    @id @default(autoincrement())
  interviewFlowId Int
  interviewTypeId Int
  name            String
  orderIndex      Int
}

model Position {
  id    Int    @id @default(autoincrement())
  title String
  applications Application[]
}
```

## Tarea

Implementa **dos endpoints nuevos** siguiendo exactamente la arquitectura por capas existente.

### Endpoint 1 — `GET /positions/:id/candidates`

Devuelve **todos los candidatos en proceso** para una posición (todas las `Application` con ese `positionId`). Por cada candidato/aplicación retorna:

| Campo                           | Origen                                                                                               |
| ------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `fullName`                      | `Candidate.firstName + " " + Candidate.lastName`                                                     |
| `currentInterviewStep`          | `Application.currentInterviewStep` (incluir también el `name` del step vía relación `interviewStep`) |
| `averageScore`                  | Media de `Interview.score` de las entrevistas de esa `Application`                                   |
| `candidateId` / `applicationId` | identificadores para poder consumir el segundo endpoint                                              |

Reglas:

- Calcular `averageScore` ignorando entrevistas con `score` null. Si no hay scores, devolver `0` o `null` (decide y documenta de forma consistente).
- Si la posición no existe → `404`.
- Si la posición existe sin aplicaciones → `200` con array vacío.

### Endpoint 2 — `PUT /candidates/:id/stage`

Actualiza la **fase actual** (`currentInterviewStep`) de la `Application` de un candidato.

- `:id` = `candidateId`. El body identifica la aplicación a actualizar mediante `applicationId`.
- **Request body (obligatorio):**
  ```json
  { "applicationId": 1, "currentInterviewStep": 3 }
  ```
- Validar que el candidato existe, que la `Application` con ese `applicationId` existe y **pertenece a ese `candidateId`** (si no, `404`), y que el `currentInterviewStep` referencia un `InterviewStep` válido.
- Devolver `200` con la `Application` actualizada.
- Errores: `400` (body inválido / step inexistente), `404` (candidato/application no encontrados), `500` (error inesperado).

## Ejecución técnica (paso a paso)

1. **Domain models**
   - Crea `src/domain/models/Position.ts` (si no expone lo necesario) con método estático para obtener aplicaciones de una posición incluyendo `candidate`, `interviewStep` e `interviews` (con `score`). Usa `prisma.position.findUnique` + `include`, o `prisma.application.findMany({ where: { positionId }, include: {...} })`.
   - Reutiliza/crea `src/domain/models/Application.ts` con un método `updateStage()` o `save()` que actualice `currentInterviewStep` vía `prisma.application.update`.
   - Sigue el patrón existente: capturar errores Prisma (`P2025` not found, `PrismaClientInitializationError`).

2. **Services** (`src/application/services/positionService.ts` nuevo, ampliar `candidateService.ts`)
   - `getCandidatesByPosition(positionId)`: obtiene aplicaciones, mapea al DTO `{ fullName, currentInterviewStep, stepName, averageScore, candidateId, applicationId }`, calcula la media de scores en código.
   - `updateCandidateStage(candidateId, { applicationId, currentInterviewStep })`: verifica que la `Application` existe y que su `candidateId` coincide con el del path, valida que el step existe (`prisma.interviewStep.findUnique`), ejecuta el update. Maneja P2025.

3. **Validación** (`src/application/validator.ts`)
   - Añade validador del body de `PUT /candidates/:id/stage` (tipos numéricos, campos requeridos). Lanza `Error` con mensaje descriptivo.

4. **Controllers**
   - `src/presentation/controllers/positionController.ts` (nuevo): `getCandidatesByPosition(req, res)` — parsea `:id` con `parseInt`, valida `NaN`, delega al service.
   - Amplía `candidateController.ts`: `updateCandidateStage(req, res)`.
   - Convención de respuestas: `200/201` éxito, `400` validación, `404` no encontrado, `500` inesperado, formato `{ message, error? }`.

5. **Routes**
   - `src/routes/positionRoutes.ts` (nuevo): `router.get('/:id/candidates', getCandidatesByPosition)`.
   - `src/routes/candidateRoutes.ts`: añade `router.put('/:id/stage', updateCandidateStage)`.
   - Registra el router de posiciones en `src/index.ts`: `app.use('/positions', positionRoutes)`.
   - Envuelve handlers en try/catch siguiendo el patrón existente.

6. **Documentación** (`backend/api-spec.yaml`)
   - Añade ambos endpoints con OpenAPI 3.0: parámetros de path, request body, schemas de respuesta y códigos `200/400/404/500`.

7. **Tests** (Jest + ts-jest)
   - Crea tests unitarios para los services (mockeando Prisma): cálculo correcto de `averageScore` (incluyendo caso sin scores y scores null), posición inexistente (404), update de stage exitoso y con step inválido.

## Restricciones y criterios de calidad

- **No romper** el estilo ni la estructura existentes; imita el patrón de `candidate*` end-to-end.
- TypeScript estricto, sin `any` salvo en handlers de error existentes.
- Tipa los DTOs de respuesta con `interface`.
- Mensajes de error descriptivos y consistentes.
- No exponer campos sensibles ni datos de más en las respuestas.
- Asegura que el proyecto **compila** (`tsc`) y que los tests pasan antes de dar por finalizada la tarea.

## Entregables

1. Archivos nuevos/modificados de los 5 puntos (models, services, validator, controllers, routes, index).
2. Entradas en `api-spec.yaml`.
3. Tests Jest.
4. Resumen breve de decisiones tomadas (manejo de `averageScore` sin scores).
