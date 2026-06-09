## Role
You are a senior TypeScript backend developer working on the AI4Devs ATS project (Express + Prisma + PostgreSQL).

## Objective
Implement `GET /positions/:id/candidates` to return all candidates in process for a given position, enabling a kanban-style UI.

## Context
- Repository: `/Users/gosp/Documents/IA4Devs/AI4Devs-db-2603`
- Stack: Express 4, TypeScript, Prisma 5, PostgreSQL (port 3010)
- Architecture: `routes/` → `presentation/controllers/` → `application/services/` → Prisma
- Existing patterns to follow:
  - `backend/src/presentation/controllers/candidateController.ts` (error handling: 400/404/500 with `{ message }`)
  - `backend/src/routes/candidateRoutes.ts` (route wiring)
  - `backend/src/index.ts` (mount routes)
- API contract reference: `AI4Devs-lab-ides-202603/docs/api-spec.yml` → schema `PositionCandidate`
- Prisma schema: `backend/prisma/schema.prisma`

## Prerequisite (schema gap)
`Application` currently lacks `currentInterviewStep`. Before implementing the endpoint:
1. Add `currentInterviewStep Int` FK → `InterviewStep` on `Application` (align with `AI4Devs-backend-202603/backend/prisma/schema.prisma`).
2. Create and apply a Prisma migration.
3. Add relation on `InterviewStep` if needed.

## Endpoint contract
- **Route:** `GET /positions/:id/candidates`
- **Path param:** `id` — position ID (integer)
- **Response 200:** JSON array of objects:
  ```json
  {
    "fullName": "John Doe",
    "currentInterviewStep": "Technical Interview",
    "candidateId": 1,
    "applicationId": 5,
    "averageScore": 4.5
  }

Field rules:
fullName: candidate.firstName + " " + candidate.lastName
currentInterviewStep: name of the InterviewStep linked via application.currentInterviewStep (not the numeric ID)
candidateId: from candidate.id
applicationId: from application.id
averageScore: arithmetic mean of interview.score for that application where score IS NOT NULL; return 0 if no scored interviews exist
Scope: all Application records where positionId = :id (one row per application)
Errors:
400 if :id is not a valid integer → { message: "Invalid position ID" }
404 if position does not exist → { message: "Position not found" }
500 on unexpected errors → { message: "Internal server error" }

Implementation constraints
Create positionRoutes.ts, positionController.ts, positionService.ts (or equivalent) following existing naming conventions.
Mount routes in index.ts at /positions.
Use req.prisma (already attached in middleware) instead of instantiating new PrismaClient instances.
Do NOT add pagination.
Do NOT change unrelated endpoints.
Update backend/api-spec.yaml with this endpoint and PositionCandidate schema.
Add Jest tests (controller or service level) mirroring candidateController.test.ts — cover happy path, invalid ID, position not found, averageScore calculation (with and without scores).

Output format
Deliver:
Unit Test completed  with 100% coverage related this chenge and based in TDD
List of files created/modified with a one-line description each.
Full code for every new/changed file.
Migration SQL or Prisma migration steps for currentInterviewStep.
Example curl request and sample JSON response.
Commands to run tests and verify (npm test, manual curl).
Guardrails
Do not speculate about business rules not stated here.
Do not implement frontend changes.
Do not refactor existing candidate endpoints unless required for consistency.
Match existing error response shape { message: string }.
All code, comments, and test names in English.

###########################################
Role
You are a senior TypeScript backend developer working on the AI4Devs ATS project (Express + Prisma + PostgreSQL).

Objective
Implement PUT /candidates/:id/stage to update the current interview stage of a candidate's application, supporting drag-and-drop in a kanban UI.

Context
Repository: /Users/gosp/Documents/IA4Devs/AI4Devs-db-2603
Stack: Express 4, TypeScript, Prisma 5, PostgreSQL (port 3010)
Architecture: routes/ → presentation/controllers/ → application/services/ → Prisma
Existing patterns:
backend/src/presentation/controllers/candidateController.ts
backend/src/routes/candidateRoutes.ts
API contract reference: AI4Devs-lab-ides-202603/docs/api-spec.yml → UpdateCandidateStageRequest / UpdateCandidateStageResponse
Prisma schema: backend/prisma/schema.prisma
Assumes currentInterviewStep already exists on Application (see Prompt 1 prerequisite).
Endpoint contract
Route: PUT /candidates/:id/stage
Path param: id — candidate ID (integer)
Request body (required):
{
  "applicationId": 5,
  "currentInterviewStep": 3
}
applicationId: identifies which application to update (a candidate may have multiple applications across positions)
currentInterviewStep: target InterviewStep.id (integer)
Response 200:
{
  "message": "Candidate stage updated successfully",
  "data": { /* updated Application object */ }
}
Business rules:
applicationId must belong to candidate :id → else 404 { message: "Application not found" }
Target InterviewStep must belong to the same interviewFlowId as the application's position → else 400 { message: "Interview step does not belong to this position's flow" }
Update only application.currentInterviewStep (do not auto-create Interview records)
Errors:
400 invalid candidate ID → { message: "Invalid candidate ID" }
400 missing/invalid body fields → { message: "..." } (descriptive)
404 candidate not found → { message: "Candidate not found" }
404 application not found or not linked to candidate → { message: "Application not found" }
500 unexpected → { message: "Internal server error" }
Implementation constraints
Add route to candidateRoutes.ts (or dedicated route file if cleaner).
Implement controller + service layer following existing patterns.
Validate inputs before hitting the database.
Use req.prisma; do not create standalone PrismaClient instances.
Update backend/api-spec.yaml with this endpoint and request/response schemas.
Add Jest tests covering:
Happy path: stage updated successfully
Invalid candidate ID
Application not belonging to candidate
Interview step from a different flow (validation failure)
Missing request body fields
Output format
Deliver:

List of files created/modified.
Full code for every new/changed file.
Example curl request and sample JSON response.
Test file with all cases above.
Commands to run tests.
Guardrails
Do not change the endpoint path — must be exactly PUT /candidates/:id/stage.
Do not use Application.status as a substitute for currentInterviewStep.
Do not implement frontend changes.
Do not refactor unrelated code.
All artifacts in English.
Unit Test completed  with 100% coverage related this chenge and based in TDD