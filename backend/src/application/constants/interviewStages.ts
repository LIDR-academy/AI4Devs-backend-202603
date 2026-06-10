/**
 * Roles allowed to modify a candidate's stage in the Kanban board.
 */
export const STAGE_MODIFIER_ROLES = ['recruiter', 'admin'];

/**
 * NOTE ON STAGE VALIDATION
 * ------------------------
 * In this schema `Application.currentInterviewStep` is an integer FK to
 * `InterviewStep.id`, and the human-readable stage is `InterviewStep.name`.
 * A valid "stage" therefore depends on the interview flow attached to the
 * position the candidate applied to — it is NOT a fixed global list.
 *
 * For that reason there is intentionally no hardcoded `VALID_STAGES` constant:
 * the authoritative validation in `updateCandidateStage` resolves `newStage`
 * against the actual steps of the relevant application's interview flow in the
 * database. A static list would silently diverge from positions that use a
 * different flow.
 */
