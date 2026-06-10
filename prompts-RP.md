# Prompts Log - RP

This file tracks each prompt sent during development interactions.

---

## Prompt 1

From now on, keep updated a prompts-RP.md file in the root of this project with each prompt I send to you in this interaction.

In addition consider the following request and context:

> You are an expert backend developer with experience in ATS (Applicant Tracking System) systems. In this existing ATS project, we need to create TWO new endpoints to manipulate the list of candidates for an application in a Kanban-style interface.
>
> ### ENDPOINT 1: GET /positions/:id/candidates
> Retrieve all candidates in process for a specific position. Must return array of objects with `fullName`, `currentInterviewStep`, and `averageScore`. Validate position exists (404 if not), efficient JOINs, averageScore null/0 if no interviews.
>
> ### ENDPOINT 2: PUT /candidates/:id/stage
> Update the candidate's stage when moved in the Kanban. Accept JSON body `{ "newStage": "string" }`. Validate candidate exists (404), validate newStage (400), update `current_interview_step` in application table. Return 200 with updated candidate.
>
> Requirements: authentication middleware, role/permission validation (recruiter/admin), unit + integration tests, Swagger docs, clean code following project architecture (controllers/services/repositories), TypeScript types, consistent error handling, logging, input validation, SQL injection prevention.
>
> Steps: analyze project structure, identify pattern, create routes, implement business logic, add auth/validation, tests, docs, verify with CURL/Postman.

---

## Prompt 2

Using a devil's advocate and adversarial approach, review if the implementation has any gap compared with the original request.

---

## Prompt 3

Fix all the gaps found in the analysis.
The average is expected per-candidate across all applications (as the request said).

---
