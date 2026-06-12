# Skill: typescript-backend

Referencia TypeScript 4.9.5 específica para este repositorio. Extraída del código fuente real de `backend/src/`. Usar siempre al escribir código nuevo en `backend/src/`.

## Configuración del compilador (`backend/tsconfig.json`)

- `strict: true` — todos los checks estrictos activados
- `target: "es5"`, `module: "commonjs"` — sin path aliases, sin ESM
- Output en `dist/` — compilar con `npm run build` (tsc completo, con type-check)
- Dev con `npm run dev` — ts-node-dev transpile-only, sin type-check

| Comando | Type-check | Velocidad |
|---------|-----------|-----------|
| `npm run dev` | No | Rápido |
| `npm run build` | Sí | Lento |
| `npm test` | Via ts-jest | Por fichero |

**Regla**: ejecutar `npm run build` después de cada fichero nuevo para detectar errores de tipos antes del commit.

## Patrón de domain model

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class Position {
  id?: number;
  // ... campos

  constructor(data: any) {
    this.id = data.id;
    // ...
  }

  // Métodos estáticos — acceden a prisma del módulo
  static async findWithCandidates(id: number) {
    return prisma.position.findUnique({
      where: { id },
      include: { ... }
    });
  }
}
```

## Patrón de service

```typescript
// Funciones exportadas async — NO clases
export const getPositionCandidates = async (id: number): Promise<CandidateRow[]> => {
  if (!Number.isInteger(id) || id <= 0) {
    throw { status: 400, message: 'Invalid position id' };
  }
  const position = await Position.findWithCandidates(id);
  if (!position) {
    throw { status: 404, message: 'Position not found' };
  }
  return position.applications.map(app => {
    const scores = app.interviews
      .map(i => i.score)
      .filter((s): s is number => s !== null);  // type predicate
    const averageScore = scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : null;
    return {
      fullName: `${app.candidate.firstName} ${app.candidate.lastName}`,
      currentInterviewStep: app.interviewStep.name,
      averageScore,
    };
  });
};
```

## Patrón de controller

```typescript
import { Request, Response } from 'express';

export const getPositionCandidatesController = async (
  req: Request<{ id: string }>,  // path params siempre son string en Express
  res: Response
) => {
  try {
    const id = parseInt(req.params.id, 10);
    const candidates = await getPositionCandidates(id);
    res.json(candidates);
  } catch (error: any) {  // catch (error: any) — patrón establecido en el proyecto
    if (error.status === 404) return res.status(404).json({ message: error.message });
    if (error.status === 400) return res.status(400).json({ message: error.message });
    if (error.status === 409) return res.status(409).json({ message: error.message });
    res.status(500).json({ message: 'Internal server error' });
  }
};
```

## Type predicate para filter de nulls

```typescript
// Con type predicate — TypeScript infiere scores: number[]
const scores = interviews
  .map(i => i.score)
  .filter((s): s is number => s !== null);

// Sin type predicate — TypeScript infiere scores: (number | null)[]  ← error
const scores = interviews
  .map(i => i.score)
  .filter(s => s !== null);
```

## Errores comunes con strict mode y sus fixes

| Error | Fix |
|-------|-----|
| `Object is possibly 'null'` | Añadir guard `if (!x) throw { status: 404, ... }` |
| `Argument of type 'string' is not assignable to type 'number'` | `parseInt(req.params.id, 10)` |
| `catch` variable requires annotation | `catch (error: any)` |
| `Property X does not exist on type Y` | Leer el tipo Prisma con `Prisma.PositionGetPayload<{ include: ... }>` |
| `Type '(number \| null)[]' is not assignable to 'number[]'` | Usar type predicate `(s): s is number` |

## Typing avanzado — Prisma payload types

Para evitar `any` en resultados de queries complejas:

```typescript
import { Prisma } from '@prisma/client';

type PositionWithCandidates = Prisma.PositionGetPayload<{
  include: {
    applications: {
      include: {
        candidate: { select: { firstName: true; lastName: true } };
        interviewStep: { select: { name: true } };
        interviews: { select: { score: true } };
      };
    };
  };
}>;
```
