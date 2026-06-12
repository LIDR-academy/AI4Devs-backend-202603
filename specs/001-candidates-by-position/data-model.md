# Data Model — GET /positions/:id/candidates

## Cadena Prisma

```
Position (id)
  └── applications: Application[]
        ├── candidate: Candidate (firstName, lastName)
        ├── interviewStep: InterviewStep (name)  ← paso ACTUAL
        └── interviews: Interview[]
              └── score: Int?  ← NULLABLE
```

## Query Prisma exacta

```typescript
await prisma.position.findUnique({
  where: { id: positionId },
  include: {
    applications: {
      include: {
        candidate: {
          select: { firstName: true, lastName: true },
        },
        interviewStep: {
          select: { name: true },
        },
        interviews: {
          select: { score: true },
        },
      },
    },
  },
});
```

## Nombres exactos de campos en schema.prisma

| Modelo | Campo | Tipo | Relación |
|--------|-------|------|----------|
| `Position` | `id` | `Int @id` | — |
| `Position` | `applications` | `Application[]` | FK en Application.positionId |
| `Application` | `positionId` | `Int` | → Position.id |
| `Application` | `candidateId` | `Int` | → Candidate.id |
| `Application` | `currentInterviewStep` | `Int` | FK → InterviewStep.id |
| `Application` | `candidate` | `Candidate` | relación |
| `Application` | `interviewStep` | `InterviewStep` | relación (paso actual) |
| `Application` | `interviews` | `Interview[]` | FK en Interview.applicationId |
| `Candidate` | `firstName` | `String` | — |
| `Candidate` | `lastName` | `String` | — |
| `InterviewStep` | `name` | `String` | — |
| `Interview` | `score` | `Int?` | **NULLABLE** |

## Transformación de datos

```typescript
position.applications.map(app => {
  // 1. Construir fullName
  const fullName = `${app.candidate.firstName} ${app.candidate.lastName}`;

  // 2. Obtener nombre del paso actual
  const currentInterviewStep = app.interviewStep.name;

  // 3. Calcular media — SÓLO scores no-null
  const scores = app.interviews
    .map(i => i.score)
    .filter((s): s is number => s !== null);  // type predicate obligatorio
  const averageScore = scores.length > 0
    ? scores.reduce((a, b) => a + b, 0) / scores.length
    : null;  // null, no 0

  return { fullName, currentInterviewStep, averageScore };
});
```

## Invariante crítica

**`averageScore` debe ser `null` cuando no hay scores válidos.**

- Array vacío `[]` de interviews → `null`
- Array con todos scores `null` → `null`
- Array con mezcla: sólo se promedian los no-null

Esta invariante está testeada explícitamente en `backend/tests/positionService.test.ts`.
