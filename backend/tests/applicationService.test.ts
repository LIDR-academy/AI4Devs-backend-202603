import { updateCandidateStage } from '../src/application/services/applicationService';

// ---------------------------------------------------------------------------
// Mock PrismaClient — Application model instantiates it at module load
// ---------------------------------------------------------------------------
const mockApplicationFindUnique = jest.fn();
const mockInterviewStepFindUnique = jest.fn();
const mockApplicationUpdate = jest.fn();

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    application: {
      findUnique: mockApplicationFindUnique,
      update: mockApplicationUpdate,
    },
    interviewStep: {
      findUnique: mockInterviewStepFindUnique,
    },
  })),
}));

// ---------------------------------------------------------------------------
// Helpers — build minimal Prisma-shaped objects
// ---------------------------------------------------------------------------
function makeApplication(overrides: {
  position?: { interviewFlowId: number };
} = {}) {
  return {
    id: 1,
    positionId: 2,
    candidateId: 5,
    applicationDate: new Date('2024-01-15T10:00:00.000Z'),
    currentInterviewStep: 1,
    notes: null,
    position: overrides.position ?? { interviewFlowId: 10 },
  };
}

function makeStep(overrides: { interviewFlowId?: number } = {}) {
  return {
    id: 3,
    interviewFlowId: overrides.interviewFlowId ?? 10,
  };
}

function makeUpdatedApplication(interviewStepId: number) {
  return {
    id: 1,
    positionId: 2,
    candidateId: 5,
    applicationDate: new Date('2024-01-15T10:00:00.000Z'),
    currentInterviewStep: interviewStepId,
    notes: null,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
beforeEach(() => {
  jest.clearAllMocks();
});

describe('updateCandidateStage', () => {

  // 1. Happy path ─────────────────────────────────────────────────────────
  it('returns updated application when step belongs to the position flow', async () => {
    const FLOW_ID = 10;
    const NEW_STEP_ID = 3;

    mockApplicationFindUnique.mockResolvedValue(
      makeApplication({ position: { interviewFlowId: FLOW_ID } })
    );
    mockInterviewStepFindUnique.mockResolvedValue(
      makeStep({ interviewFlowId: FLOW_ID })
    );
    mockApplicationUpdate.mockResolvedValue(makeUpdatedApplication(NEW_STEP_ID));

    const result = await updateCandidateStage(1, NEW_STEP_ID);

    expect(result.currentInterviewStep).toBe(NEW_STEP_ID);
    expect(mockApplicationUpdate).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { currentInterviewStep: NEW_STEP_ID },
    });
  });

  // 2. 404 — application not found ────────────────────────────────────────
  it('throws { status: 404 } when the application does not exist', async () => {
    mockApplicationFindUnique.mockResolvedValue(null);

    await expect(updateCandidateStage(999, 3)).rejects.toMatchObject({
      status: 404,
      message: 'Application not found',
    });

    expect(mockApplicationUpdate).not.toHaveBeenCalled();
  });

  // 3. 400 — invalid applicationId ────────────────────────────────────────
  it('throws { status: 400 } when applicationId is NaN', async () => {
    await expect(updateCandidateStage(NaN, 3)).rejects.toMatchObject({
      status: 400,
      message: 'Invalid application id',
    });
  });

  it('throws { status: 400 } when applicationId is 0 or negative', async () => {
    await expect(updateCandidateStage(0, 3)).rejects.toMatchObject({
      status: 400,
      message: 'Invalid application id',
    });

    await expect(updateCandidateStage(-1, 3)).rejects.toMatchObject({
      status: 400,
      message: 'Invalid application id',
    });
  });

  // 4. 400 — invalid interviewStepId ──────────────────────────────────────
  it('throws { status: 400 } when interviewStepId is not a positive integer', async () => {
    await expect(updateCandidateStage(1, NaN)).rejects.toMatchObject({
      status: 400,
      message: 'interviewStepId must be a positive integer',
    });

    await expect(updateCandidateStage(1, 0)).rejects.toMatchObject({
      status: 400,
      message: 'interviewStepId must be a positive integer',
    });
  });

  // 5. 400 — interview step not found ─────────────────────────────────────
  it('throws { status: 400 } when the interview step does not exist', async () => {
    mockApplicationFindUnique.mockResolvedValue(makeApplication());
    mockInterviewStepFindUnique.mockResolvedValue(null);

    await expect(updateCandidateStage(1, 999)).rejects.toMatchObject({
      status: 400,
      message: 'Interview step not found',
    });

    expect(mockApplicationUpdate).not.toHaveBeenCalled();
  });

  // 6. 409 — step belongs to a different flow ─────────────────────────────
  it('throws { status: 409 } when the step does not belong to the position flow', async () => {
    mockApplicationFindUnique.mockResolvedValue(
      makeApplication({ position: { interviewFlowId: 10 } })
    );
    mockInterviewStepFindUnique.mockResolvedValue(
      makeStep({ interviewFlowId: 99 })  // different flow
    );

    await expect(updateCandidateStage(1, 3)).rejects.toMatchObject({
      status: 409,
      message: "Interview step does not belong to the position's interview flow",
    });

    expect(mockApplicationUpdate).not.toHaveBeenCalled();
  });

});
