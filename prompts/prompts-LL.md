# Prompts - LL

---

# Prompt 1:
- Model: Codex 5.5 Medium plan-mode

# Role:
You are an expert software engineer specialized in AI agents and Prompt Engineering.

# Context:
This repository contains backend and frontend folders. I want to create some endpoints on the backend side.
The README.md file contains project information.
The @instructions.md file contains information related to the task I want to complete.
The @concepts.md file contains useful information about backend development

# Task:
Read the base repository and its README.md to understand its current structure without modifying anything.

Generate a complete prompt to run in an AI agent in order to complete the task of creating new endpoints based on the @instructions.md file.

You must use and implement backend best practices as a Senior Developer, and you must consider the information, best practices, and recommendations described in the @concepts.md file.

Do not modify any files.

Everything must be done in English.

Do not make any assumptions. If you need additional information, you must ask me.

The prompt must instruct the agent to first generate a plan that must be approved before modifying any files.

Also include in the prompt that, when creating the plan, the agent must not make any assumptions either and must ask questions if needed.

---





# Prompt 2:
- Model: Claude auto-mode

## Role:
You are a senior backend software engineer specialized in AI-assisted development and prompt-driven implementation.

## Context:
This repository is an AI4Devs backend exercise for the LTI Talent Tracking System. The project is a full-stack app with:
- Backend: Node.js, Express, TypeScript, Prisma, PostgreSQL.
- Frontend: React.
- Backend entrypoint: backend/src/index.ts
- Existing candidate route: backend/src/routes/candidateRoutes.ts
- Existing candidate controller: backend/src/presentation/controllers/candidateController.ts
- Existing candidate service: backend/src/application/services/candidateService.ts
- Prisma schema: backend/prisma/schema.prisma
- OpenAPI file: backend/api-spec.yaml

## Exercise goal:
Implement two backend endpoints for manipulating candidates in a Kanban-style recruiting process:

1. GET /positions/:id/candidates
   Returns all candidates in process for a given position, meaning all applications for the given positionId.
   Required information:
   - Candidate full name, from the Candidate table.
   - current_interview_step, from the Application table.
   - Average candidate score, based on Interview.score values.

2. PUT /candidates/:id/stage
   Updates the interview stage of a specific candidate.

## Important repository facts:
- Existing backend uses Express routes, controller/service layers, Prisma, and TypeScript strict mode.
- Existing Prisma models include Candidate, Position, Application, Interview, InterviewStep, InterviewFlow, and related entities.
- Application.currentInterviewStep references InterviewStep.id.
- Candidate can have multiple Applications, so updating a candidate stage may be ambiguous without a positionId or applicationId.
- Existing tests are not currently present under backend/src, but Jest and ts-jest are configured.
- The repo includes backend/api-spec.yaml and it should be updated if API behavior changes.

## Mandatory workflow:
1. First, inspect the repository and read:
   - README.md
   - instructions.md
   - concepts.md
   - backend/package.json
   - backend/src/index.ts
   - backend/src/routes/candidateRoutes.ts
   - backend/src/presentation/controllers/candidateController.ts
   - backend/src/application/services/candidateService.ts
   - backend/prisma/schema.prisma
   - backend/api-spec.yaml
2. Do not modify any file during the initial inspection.
3. Generate a detailed implementation plan before changing any file.
4. The plan must be approved by the user before any file is modified.
5. While creating the plan, do not make assumptions. If any required behavior is ambiguous, ask the user before finalizing the plan.
6. Do not proceed to implementation until the user explicitly approves the plan.

## Ambiguities you must resolve before implementation:
- Exact response shape for GET /positions/:id/candidates.
- Whether current_interview_step should return only the step ID, the step name, or both.
- Whether the average score should be calculated from:
  - all interviews for the candidate across all applications, or
  - only interviews belonging to the application for the requested position.
- What value to return when a candidate/application has no scored interviews: null, 0, or omitted.
- Request body for PUT /candidates/:id/stage.
- How to identify the correct Application when a candidate has multiple applications:
  - require positionId,
  - require applicationId,
  - or update all applications for the candidate.
- Whether the new stage must be validated against the position’s interviewFlow.
- Expected error responses and status codes for invalid IDs, missing records, invalid stages, and ambiguous candidate applications.

## Backend engineering requirements:
- Follow the existing project structure unless the plan justifies a small improvement.
- Keep changes focused on the exercise.
- Use TypeScript types for request bodies and service return values.
- Keep route handlers thin; place business logic in the application/service layer.
- Use Prisma queries with explicit select/include shapes.
- Validate route params and request bodies.
- Return clear HTTP status codes:
  - 400 for invalid input.
  - 404 for missing candidate, position, application, or stage.
  - 409 if the request is ambiguous, unless the final approved API design avoids ambiguity.
  - 500 only for unexpected errors.
- Avoid introducing new dependencies unless absolutely necessary and explicitly approved.
- Do not change database schema unless the approved plan requires it.
- Do not break existing candidate creation or GET /candidates/:id behavior.
- Update backend/api-spec.yaml if endpoint contracts are added.
- Add tests if feasible using the existing Jest setup.
- Run verification commands after implementation:
  - npm run build from backend
  - npm test from backend, if tests are added or already available

## Plan requirements:
Your plan must include:
- Summary of the implementation approach.
- Exact API contracts for both endpoints, including paths, request body, response body, and error responses.
- Files to modify.
- Service/controller/route responsibilities.
- Prisma query/update strategy.
- Validation and edge-case behavior.
- Test scenarios.
- Any assumptions explicitly confirmed by the user.

Do not implement anything until the user approves the plan.

---





# Prompt 3:
- Model: Claude auto-mode

## Role:
You are an expert QA engineer specialized in backend systems, REST APIs, TypeScript, Express, Prisma, PostgreSQL, and AI-assisted code review.

## Context:
This repository is an AI4Devs backend exercise for the LTI Talent Tracking System.
The exercise requirements are described in instructions.md.
The repository information and setup instructions are described in README.md.
The backend theory, best practices, and recommendations are described in concepts.md.

The implementation under review is the last Git commit. That commit should implement the following two endpoints:
1. GET /positions/:id/candidates
   Retrieves all candidates in process for a given position.
2. PUT /candidates/:id/stage
   Updates the interview stage of a specific candidate.

## Task:
Without modifying any files, perform a complete QA audit of the last commit.

You must verify whether the implementation correctly satisfies instructions.md, follows the repository architecture, and respects backend best practices from concepts.md.

You must produce a final audit report with findings that will later be reviewed and fixed by a software engineer agent.

## Mandatory workflow:

1. Do not modify, create, delete, format, or rewrite any file.
2. Inspect the repository before drawing conclusions.
3. Read at minimum:
   - README.md
   - instructions.md
   - concepts.md
   - backend/package.json
   - backend/src/index.ts
   - backend/prisma/schema.prisma
   - Relevant route, controller, service, model, and test files.
4. Inspect the last commit using Git.
   - Review the changed files.
   - Review the diff against the previous commit.
   - Focus the audit on the last commit, but use the existing codebase as context.
5. Run non-mutating verification commands when useful, such as:
   - npm run build
   - npm test
   - npx prisma validate
   Only run commands that do not intentionally modify repository files.
6. If a command cannot be run, explain why in the report.
7. Do not make assumptions. If any requirement, API contract, expected behavior, or test expectation is unclear and cannot be resolved from README.md, instructions.md, concepts.md, or the codebase, ask the user before completing the audit.
8. Do not propose or implement code changes. Only report findings and recommendations.

## Audit scope:
Verify the following areas:

### Functional correctness:
- GET /positions/:id/candidates exists at the expected path.
- GET endpoint returns candidates for only the requested position.
- Returned data includes the candidate full name.
- Returned data includes the current interview step from the application.
- Returned data includes the candidate average score.
- Average score is calculated from the correct interview records according to the implemented API contract.
- Candidates with no interview scores are handled consistently and safely.
- PUT /candidates/:id/stage exists at the expected path.
- PUT endpoint updates the intended application stage.
- The implementation handles candidates with multiple applications correctly.
- The implementation validates whether the new stage is valid for the relevant interview flow, if required by the chosen contract.
- The implementation returns correct results after update.

### API behavior:
- Request params are validated.
- Request body is validated.
- Error responses are clear and consistent.
- Status codes are appropriate:
  - 200 or 204 for successful updates.
  - 400 for invalid input.
  - 404 for missing candidate, position, application, or interview step.
  - 409 for ambiguous updates, if applicable.
  - 500 only for unexpected errors.
- Response shapes are consistent, documented, and usable by a frontend Kanban UI.
- backend/api-spec.yaml is updated if API contracts changed.

### Architecture and maintainability:
- The implementation follows the existing Express/TypeScript/Prisma structure.
- Route handlers remain thin.
- Business logic belongs in the service/application layer.
- Prisma access is clear, efficient, and type-safe.
- No unnecessary dependencies were introduced.
- No unrelated refactors or behavioral changes were included.
- Existing endpoints continue to work.
- TypeScript strict mode issues are avoided.
- Error handling does not leak internal details unnecessarily.
- Naming is clear and consistent.

### Database and Prisma:
- Prisma schema changes, if any, are necessary and valid.
- Relations between Candidate, Application, Position, Interview, and InterviewStep are used correctly.
- Queries avoid fetching unnecessary data.
- Updates target the correct record.
- Edge cases involving missing or duplicate records are handled.

### Testing:
- Tests exist for the new endpoints, or the report explicitly identifies missing test coverage.
- Tests cover success cases.
- Tests cover invalid IDs.
- Tests cover missing records.
- Tests cover candidates with multiple applications.
- Tests cover candidates/applications with no interview scores.
- Tests cover invalid stage updates.
- Existing tests still pass.
- Build and Prisma validation pass, or failures are reported clearly.


## Final report format:

Produce the report in English using this structure:

1. Executive Summary
   - Briefly state whether the implementation appears correct, partially correct, or incorrect.

2. Verification Performed
   - List files inspected.
   - List Git commands or diffs reviewed.
   - List commands run and their results.

3. Findings
   - Sort findings by severity: Critical, High, Medium, Low.
   - For each finding include:
     - Severity
     - File and line reference when possible
     - Description
     - Why it matters
     - Expected behavior
     - Recommendation
   - If there are no findings, state that clearly.

4. Test Coverage Assessment
   - Explain what is covered.
   - Explain what is missing.
   - Mention any risks that remain untested.

5. API Contract Assessment
   - Document the observed request and response shapes.
   - Note any mismatch with instructions.md or backend best practices.

6. Final QA Verdict
   - State whether the implementation is ready, needs minor fixes, or needs significant fixes.
   - Do not implement fixes.

## Important constraints:

- Do not modify any file.
- Do not commit anything.
- Do not run formatters or code generators that rewrite files.
- Do not apply migrations.
- Do not seed or reset the database unless explicitly approved by the user.
- Do not make assumptions. Ask the user when a decision cannot be verified from the repository.
- The output must be an audit report only.

---





# Prompt 4:
- Model: Claude auto-mode

## Role:

You are an expert senior software engineer specialized in backend systems, TypeScript, Express, Prisma, PostgreSQL, REST API design, testing strategy, and AI-assisted implementation planning.

## Context:

This repository is an AI4Devs backend exercise for the LTI Talent Tracking System.

The exercise requirements are described in instructions.md.

The repository information and setup instructions are described in README.md.

The backend theory, best practices, and recommendations are described in concepts.md.

A QA agent has already audited the last implementation commit and produced findings in qa-audit.md.

The implementation under review added two endpoints:

1. GET /positions/:id/candidates
   Retrieves candidates in process for a given position.

2. PUT /candidates/:id/stage
   Updates a candidate's interview stage during the interview process.

## Task:

Without modifying any files, review qa-audit.md and the repository codebase, evaluate each QA finding, and produce a detailed remediation plan.

The plan will later be reviewed and approved by the user before another software engineer agent performs the implementation.

## Mandatory constraints:

1. Do not modify, create, delete, format, or rewrite any file.
2. Do not commit anything.
3. Do not run formatters, migrations, seed scripts, or code generators that modify files or database state.
4. You may run non-mutating inspection and verification commands if useful.
5. Do not implement fixes yet.
6. Do not make assumptions.
7. If any decision cannot be resolved from qa-audit.md, README.md, instructions.md, concepts.md, or the codebase, ask the user before finalizing the plan.
8. The output must be a remediation plan only.

## Mandatory workflow:

1. Read the following files before producing the plan:
   - qa-audit.md
   - README.md
   - instructions.md
   - concepts.md
   - backend/package.json
   - backend/src/index.ts
   - backend/prisma/schema.prisma
   - backend/api-spec.yaml
   - Relevant route, controller, service, model, and test files mentioned in qa-audit.md.

2. Inspect the last commit and current working tree:
   - Review the changed files in the last commit.
   - Review the diff against the previous commit.
   - Check whether there are uncommitted changes.
   - Do not modify anything.

3. Evaluate each QA finding:
   - Confirm whether the finding is valid.
   - Identify whether it belongs to the exercise scope or is pre-existing technical debt.
   - Determine whether it should be fixed now, deferred, or explicitly excluded.
   - Assess risk, implementation impact, and test impact.

4. Generate a remediation plan.
   The plan must be detailed enough for another software engineer agent to implement without making decisions.

## Findings to evaluate from qa-audit.md:

HIGH:
- H1: GET /positions/:id/candidates response missing applicationId, while PUT /candidates/:id/stage requires applicationId.
- H2: No controller/HTTP-layer tests.

MEDIUM:
- M1: positionService.ts uses two Prisma queries where one query would suffice.
- M2: index.ts logging middleware is registered after route registrations.
- M3: candidateController.ts re-exports a service function and candidateRoutes.ts calls the service directly.

LOW:
- L1: Hardcoded database credentials in backend/prisma/schema.prisma.
- L2: Multiple PrismaClient instances.
- L3: GET /candidates/:id missing from backend/api-spec.yaml.

## Plan requirements:

Your remediation plan must include:

1. Executive Summary
   - State which findings should be fixed now and why.
   - Separate exercise-critical fixes from optional/pre-existing cleanup.

2. Finding-by-Finding Decision
   For each finding, include:
   - Validity: confirmed, partially confirmed, rejected, or needs user decision.
   - Scope: exercise scope, related cleanup, or pre-existing debt.
   - Recommended action: fix now, defer, or exclude.
   - Rationale.
   - Risk if not fixed.

3. Proposed Implementation Plan
   - Describe the exact backend changes to make.
   - Identify files likely to be modified.
   - Describe expected API contract changes.
   - Describe service/controller/route responsibilities.
   - Describe Prisma query/update strategy.
   - Describe error-handling behavior.
   - Describe whether backend/api-spec.yaml should be updated.

4. Testing Plan
   - List tests to add or update.
   - Include service-level tests.
   - Include controller or HTTP-level tests if recommended.
   - Cover success and failure cases.
   - Include regression tests for existing endpoints if needed.

5. Verification Plan
   - List commands to run after implementation, such as:
     - npm run build
     - npm test
     - npx prisma validate
   - Mention any manual API checks if useful.

6. Questions for the User
   - Only include questions that are truly necessary before implementation.
   - Do not ask questions that can be answered by inspecting the repository.
   - If no questions are needed, explicitly state that no user decisions are required before implementation.

## Important planning rules:

- Do not assume whether pre-existing technical debt should be fixed unless the scope is clear.
- If fixing pre-existing issues could increase risk or expand scope, call that out.
- Prefer a focused plan that fixes exercise-critical issues first.
- Keep changes minimal, maintainable, and consistent with the current architecture.
- Do not introduce new dependencies unless the plan explicitly justifies them.
- Do not propose database schema changes unless strictly necessary.
- Do not propose behavior that conflicts with instructions.md.
- Do not implement anything.

---


