# Diagrama de Flujo - Nuevos Endpoints

## 1️⃣ Flujo del Endpoint GET /positions/:id/candidates

```
┌─────────────────────────────────────────────────────────────────┐
│ CLIENT REQUEST: GET /positions/1/candidates                     │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ src/routes/positionRoutes.ts                                    │
│ router.get('/:id/candidates', getCandidatesByPositionController)│
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ src/presentation/controllers/candidateController.ts             │
│ getCandidatesByPositionController()                             │
│                                                                 │
│ 1. Extraer positionId del params                               │
│ 2. Validar que sea un número válido                            │
│ 3. Verificar que la posición existe                            │
│ 4. Llamar al servicio                                          │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ src/application/services/candidateService.ts                    │
│ getCandidatesByPosition(positionId)                             │
│                                                                 │
│ 1. Buscar aplicaciones para la posición                        │
│ 2. Incluir: candidate, interviewStep, interviews              │
│ 3. Para cada aplicación:                                       │
│    - Extraer nombre completo del candidato                    │
│    - Obtener nombre de la fase actual                         │
│    - Calcular promedio de scores de entrevistas              │
│ 4. Retornar array de candidatos                               │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ Prisma Queries:                                                 │
│                                                                 │
│ await prisma.application.findMany({                            │
│   where: { positionId },                                       │
│   include: {                                                   │
│     candidate: true,                                           │
│     interviewStep: true,                                       │
│     interviews: { include: { interviewStep: true } }          │
│   }                                                            │
│ })                                                             │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ DATABASE (PostgreSQL)                                           │
│                                                                 │
│ - Application records                                          │
│ - Related Candidate records                                    │
│ - Related InterviewStep records                                │
│ - Related Interview records with scores                        │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ RESPONSE (200 OK):                                              │
│                                                                 │
│ {                                                              │
│   "message": "Candidates retrieved successfully",              │
│   "data": [                                                    │
│     {                                                          │
│       "candidateId": 1,                                        │
│       "fullName": "Juan Pérez",                               │
│       "currentStage": "Technical Interview",                   │
│       "averageScore": 8.5,                                     │
│       "totalInterviews": 2                                     │
│     },                                                         │
│     ...                                                        │
│   ],                                                           │
│   "total": 5                                                   │
│ }                                                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2️⃣ Flujo del Endpoint PUT /candidates/:id/stage

```
┌─────────────────────────────────────────────────────────────────┐
│ CLIENT REQUEST: PUT /candidates/1/stage                         │
│ BODY: { "newStageId": 3 }                                       │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ src/routes/candidateRoutes.ts                                   │
│ router.put('/:id/stage', updateCandidateStageController)        │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ src/presentation/controllers/candidateController.ts             │
│ updateCandidateStageController()                                │
│                                                                 │
│ 1. Extraer candidateId del params                              │
│ 2. Extraer newStageId del body                                 │
│ 3. Validar que ambos sean números válidos                      │
│ 4. Verificar que el candidato existe                           │
│ 5. Llamar al servicio                                          │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ src/application/services/candidateService.ts                    │
│ updateCandidateStage(candidateId, newStageId)                  │
│                                                                 │
│ 1. Validar que la nueva fase (InterviewStep) existe           │
│ 2. Buscar la aplicación activa del candidato                   │
│ 3. Actualizar el campo currentInterviewStep                    │
│ 4. Retornar datos de confirmación                              │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ Prisma Queries:                                                 │
│                                                                 │
│ 1. await prisma.interviewStep.findUnique({                     │
│      where: { id: newStageId }                                 │
│    })                                                          │
│                                                                 │
│ 2. await prisma.application.findFirst({                        │
│      where: { candidateId }                                    │
│    })                                                          │
│                                                                 │
│ 3. await prisma.application.update({                           │
│      where: { id: application.id },                            │
│      data: { currentInterviewStep: newStageId },               │
│      include: {                                                │
│        candidate: true,                                        │
│        interviewStep: true,                                    │
│        position: true                                          │
│      }                                                         │
│    })                                                          │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ DATABASE (PostgreSQL)                                           │
│                                                                 │
│ UPDATE Application SET currentInterviewStep = 3                 │
│ WHERE id = <application.id>                                    │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ RESPONSE (200 OK):                                              │
│                                                                 │
│ {                                                              │
│   "message": "Candidate stage updated successfully",            │
│   "data": {                                                    │
│     "applicationId": 5,                                        │
│     "candidateId": 1,                                          │
│     "candidateName": "Juan Pérez",                            │
│     "positionTitle": "Senior Backend Developer",               │
│     "newStage": "Technical Interview",                         │
│     "newStageId": 3                                            │
│   }                                                            │
│ }                                                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3️⃣ Estructura de Carpetas Actualizada

```
backend/
├── src/
│   ├── index.ts (✏️ MODIFICADO - agregado positionRoutes)
│   ├── application/
│   │   ├── validator.ts
│   │   └── services/
│   │       └── candidateService.ts (✏️ MODIFICADO - 2 nuevas funciones)
│   ├── domain/
│   │   └── models/
│   │       ├── Application.ts
│   │       ├── Candidate.ts
│   │       └── ...
│   ├── presentation/
│   │   └── controllers/
│   │       └── candidateController.ts (✏️ MODIFICADO - 2 nuevos controladores)
│   └── routes/
│       ├── candidateRoutes.ts (✏️ MODIFICADO - agregada ruta PUT)
│       └── positionRoutes.ts (✨ NUEVO - creado para ruta GET)
│
├── prisma/
│   ├── schema.prisma (sin cambios)
│   └── migrations/
│
├── jest.config.js
├── package.json
└── tsconfig.json
```

---

## 4️⃣ Tabla Resumen de Cambios

| Componente | Operación | Detalle |
|------------|-----------|---------|
| **candidateService.ts** | Función Agregada | `getCandidatesByPosition()` |
| **candidateService.ts** | Función Agregada | `updateCandidateStage()` |
| **candidateController.ts** | Controlador Agregado | `getCandidatesByPositionController()` |
| **candidateController.ts** | Controlador Agregado | `updateCandidateStageController()` |
| **candidateRoutes.ts** | Ruta Agregada | `PUT /candidates/:id/stage` |
| **positionRoutes.ts** | Archivo Creado | Nuevo archivo con ruta `GET /positions/:id/candidates` |
| **index.ts** | Ruta Registrada | `app.use('/positions', positionRoutes)` |

---

## 5️⃣ Estadísticas del Código

```
Líneas de Código Agregadas:
- candidateService.ts: ~60 líneas (2 funciones nuevas)
- candidateController.ts: ~45 líneas (2 controladores nuevos)
- candidateRoutes.ts: +5 líneas (1 ruta nueva)
- positionRoutes.ts: 10 líneas (archivo nuevo)
- index.ts: +3 líneas (import y registro)

Total: ~120 líneas de código nuevo

Complejidad de Tiempo (Big O):
- GET /positions/:id/candidates: O(n*m) donde n=aplicaciones, m=entrevistas
- PUT /candidates/:id/stage: O(1) - operaciones diretas a BD
```
