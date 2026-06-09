# Backend — LTI Talent Tracking System

## Stack

Express 4 + TypeScript 4.9 + Prisma 5 + PostgreSQL 16

## First-time setup

From the project root:

1. `docker-compose up -d` — start PostgreSQL
2. `cd backend && npm install`
3. `npm run prisma:generate` — generate Prisma client
4. `npx prisma migrate dev` — apply migrations
5. `npm run dev` — start dev server at http://localhost:3010

## Dev workflow

- `npm run dev` — hot-reload dev server
- `npm test` — run Jest tests
- `npm run build` — compile TypeScript to `dist/`
- `npx eslint src/` — lint check (uses Prettier rules)
- Always run lint and tests before committing

## Code conventions

- **TypeScript**: strict mode, target es5 (legacy — keep for now)
- **Formatting**: single quotes, trailing commas (enforced by ESLint + Prettier)
- **Naming**: PascalCase for model files (`Candidate.ts`), camelCase for services/routes/controllers
- **Async**: always `async/await`, never raw `.then()`
- **Error handling**: use `instanceof Error` guard; catch Prisma-specific codes (`P2002` for unique constraint, `P2025` for not found)
- **Imports**: relative paths within `src/`

## Architecture

```
src/
├── index.ts                     Express app, middleware, composition root
├── application/
│   ├── validator.ts             Input validation helpers
│   └── services/                Business orchestration layer
├── domain/models/               Active Record models wrapping Prisma
├── presentation/controllers/    Express request handlers
└── routes/                      Route → controller mappings
```

**Key rule**: `src/index.ts` creates a single `PrismaClient` and attaches it to `req.prisma`. Do NOT create `new PrismaClient()` in model files — import the shared instance instead.

**Active Record pattern**: Each model class has:
- `constructor(data: any)` — maps raw data to properties
- `save()` — creates or updates via Prisma (checks `this.id`)
- `static findOne(id)` — fetches by id, returns instance

## Environment variables

Loaded from `../.env` at the project root:
- `DATABASE_URL` — full Prisma connection string
- `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT` — PostgreSQL connection parts

## API

- REST API, documented in `api-spec.yaml` (OpenAPI 3.0)
- Swagger UI (`swagger-ui-express`) is installed but NOT wired up — do not add it without asking

## Known gotchas

- `schema.prisma` has a hardcoded DATABASE_URL instead of `env("DATABASE_URL")` — prefer the env var pattern for new config
- `uploads/` directory for multer doesn't exist — create it if adding file upload features
- `src/infrastructure/` and `src/tests/` are documented in README but don't actually exist
- Multiple models create their own `PrismaClient` — this is an anti-pattern; consolidate to the shared instance
- `tsconfig.json` targets ES5 — this limits modern JS features; don't use ES2020+ syntax without confirming

## Commit guidelines

- Format: `backend: <description>` or `feat(backend): <description>`
- Run `npx eslint src/` and `npm test` before committing
