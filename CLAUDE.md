# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack talent tracking/recruitment system (LTI) built with React frontend and Express.js backend, using PostgreSQL via Prisma ORM.

- **Backend port:** 3010
- **Frontend port:** 3000
- **Database:** PostgreSQL on localhost:5434 (Docker-managed, port remapped from 5432 to avoid conflicts)
- **Note:** `schema.prisma` hardcodes port 5432 in the `url` field — override via `DATABASE_URL` in `.env` which takes precedence at runtime.

## Commands

### Backend (`cd backend`)
```bash
npm run dev          # Hot-reload dev server (ts-node-dev)
npm run build        # TypeScript compilation → dist/
npm start            # Run compiled output
npm test             # Jest test suite
npx eslint .         # Lint
npx prettier --write . # Format
```

### Frontend (`cd frontend`)
```bash
npm start            # Dev server
npm run build        # Production build
npm test             # Jest (CRA config)
```

### Database
```bash
docker-compose up -d          # Start PostgreSQL
npx prisma generate           # Regenerate Prisma client
npx prisma migrate dev        # Apply schema migrations
ts-node seed.ts               # Seed sample data (run from backend/)
```

### Run a single test
```bash
cd backend && npx jest --testPathPattern="<filename>"
```

## Architecture

The backend follows Clean Architecture / layered DDD:

```
Request → Routes → Controller → Service → Domain Model → Prisma → DB
```

**Layer breakdown (`backend/src/`):**
- `routes/` — Express Router definitions
- `presentation/controllers/` — HTTP handlers, response shaping
- `application/services/` — Business logic orchestration; `validator.ts` runs input validation before processing; `fileUploadService.ts` configures Multer (PDF/DOCX, 10 MB limit)
- `domain/models/` — Entity classes; each model owns its own `.save()` and static `.findOne()` methods that call Prisma directly (no separate repository layer)

**Frontend (`frontend/src/`):**
- `components/` — React UI components (vanilla JS, not TypeScript)
- `services/candidateService.js` — All API calls to the backend

## Key Conventions

- Prisma client is injected into `req.prisma` via global middleware in `index.ts`; controllers and models consume it from there.
- Prettier config (single quotes, trailing commas) is enforced via ESLint's `plugin:prettier/recommended`.
- TypeScript strict mode is on; output targets ES5/CommonJS in `dist/`.
- CORS is configured to allow `localhost:3000` only.

## Implemented Endpoints

- `POST /candidates` — create candidate with nested education, work experience, and resume
- `GET /candidates/:id` — fetch candidate with full relations
- `POST /upload` — upload CV file; returns `{ filePath, fileType }`

The Prisma schema defines additional models (Company, Employee, Position, InterviewFlow, InterviewStep, InterviewType, Interview, Application) that have no endpoints yet.

---

## 9 Reglas de trabajo

1. **Lee antes de escribir** — ejecuta `/explorar` para mapear schema, patrones y estado de `api-spec.yaml` antes de proponer código.
2. **Contract first** — actualiza `backend/api-spec.yaml` y valida con `npx @redocly/cli lint` antes de escribir cualquier implementación.
3. **RED tests first** — escribe los tests que fallan antes de la implementación. Confirma que están en RED. El humano escribe "GREEN" para continuar.
4. **Implementa en capas** — siempre en este orden: domain model → service → controller → route → registro en `index.ts`.
5. **Build check por fichero** — ejecuta `cd backend && npm run build` después de escribir CADA fichero. Si falla, corrige antes de continuar.
6. **Semántica null** — `averageScore` (y cualquier agregación sobre datos opcionales) es `null` cuando no hay datos. Nunca `0`, nunca `NaN`.
7. **Sin scope creep** — no toques `frontend/` en tickets de backend. No ejecutes `prisma migrate dev` sin autorización explícita del humano.
8. **Tres HTTP codes** — implementa siempre los tres: 200/201, 400, 404. Añade 409 cuando la operación viola una regla de negocio (ej: step no pertenece al flow).
9. **Una feature por PR** — no mezcles cambios de tickets distintos en el mismo PR.

## Prohibidos

- `prisma migrate dev` sin autorización explícita del humano
- Cambios en `frontend/` en tickets de backend
- Saltarse la fase RED de tests
- Usar `0` o `NaN` para representar ausencia de datos en campos de agregación
- Mezclar cambios de múltiples tickets en un PR

## Flujo canónico

```
/explorar → /contrato [APROBADO] → /tdd [GREEN] → backend-developer → reviewer → commit → /log-prompt → /entregar
```

## Context Engineering scaffold

Ver `.claude/` para commands, agents y skills disponibles:
- **Commands**: `/explorar`, `/contrato`, `/tdd`, `/log-prompt`, `/entregar`, `/implementar`
- **Agents**: `db-analyst`, `reviewer`, `backend-developer`
- **Skills**: `openapi-contract`, `express-openapi-validator`, `typescript-backend`

Ver `specs/` para las especificaciones detalladas de cada feature:
- `specs/001-candidates-by-position/` — GET /positions/:id/candidates (L1DR-27)
- `specs/002-update-candidate-stage/` — PUT /candidates/:id/stage (L1DR-2)
