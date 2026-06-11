# Data Model — PUT /candidates/:id/stage

## Cadena Prisma

```
Application (id)  ← el :id del path es Application.id
  ├── position: Position
  │     └── interviewFlowId: Int  ← para validar el step
  └── currentInterviewStep: Int   ← FK → InterviewStep.id (se actualiza)

InterviewStep (interviewStepId del body)
  └── interviewFlowId: Int  ← debe coincidir con position.interviewFlowId
```

## Query de lectura (validación)

```typescript
// 1. Leer la aplicación con su posición
const application = await prisma.application.findUnique({
  where: { id: applicationId },
  include: {
    position: {
      select: { interviewFlowId: true },
    },
  },
});
if (!application) throw { status: 404, message: 'Application not found' };

// 2. Leer el step solicitado
const step = await prisma.interviewStep.findUnique({
  where: { id: interviewStepId },
  select: { interviewFlowId: true },
});
if (!step) throw { status: 400, message: 'Interview step not found' };

// 3. Validar pertenencia al flow
if (step.interviewFlowId !== application.position.interviewFlowId) {
  throw { status: 409, message: "Interview step does not belong to the position's interview flow" };
}
```

## Query de actualización

```typescript
const updated = await prisma.application.update({
  where: { id: applicationId },
  data: { currentInterviewStep: interviewStepId },
});
return updated;
```

## Nombres exactos de campos en schema.prisma

| Modelo | Campo | Tipo | Notas |
|--------|-------|------|-------|
| `Application` | `id` | `Int @id` | — |
| `Application` | `positionId` | `Int` | FK → Position.id |
| `Application` | `candidateId` | `Int` | FK → Candidate.id |
| `Application` | `currentInterviewStep` | `Int` | FK → InterviewStep.id |
| `Application` | `position` | `Position` | relación de lectura |
| `Position` | `interviewFlowId` | `Int` | FK → InterviewFlow.id |
| `InterviewStep` | `id` | `Int @id` | — |
| `InterviewStep` | `interviewFlowId` | `Int` | FK → InterviewFlow.id |

## Invariante de negocio

**Un candidato sólo puede moverse a etapas del flujo de su posición.**

```
application.position.interviewFlowId === step.interviewFlowId
```

Si esta condición no se cumple → 409 Conflict.
