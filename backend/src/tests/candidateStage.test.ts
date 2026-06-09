// mockPrisma prefix is required so Jest allows this variable in the hoisted jest.mock factory
const mockPrismaCandidate = { findUnique: jest.fn() };
const mockPrismaApplication = { findFirst: jest.fn(), update: jest.fn() };
const mockPrismaInterviewStep = { findFirst: jest.fn() };

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    candidate: mockPrismaCandidate,
    application: mockPrismaApplication,
    interviewStep: mockPrismaInterviewStep,
  })),
}));

import { updateCandidateStage } from '../application/services/candidateService';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('updateCandidateStage', () => {
  const candidateId = 1;
  const applicationId = 5;
  const newStepId = 4;

  const mockCandidate = { id: 1, firstName: 'John', lastName: 'Doe' };
  const mockApplication = {
    id: 5,
    candidateId: 1,
    positionId: 2,
    position: { interviewFlowId: 10 },
  };
  const mockStep = { id: 4, name: 'HR Interview', interviewFlowId: 10 };
  const mockUpdated = {
    id: 5,
    candidateId: 1,
    positionId: 2,
    interviewStep: { id: 4, name: 'HR Interview' },
  };

  test('updates stage and returns updated application with step object', async () => {
    mockPrismaCandidate.findUnique.mockResolvedValue(mockCandidate);
    mockPrismaApplication.findFirst.mockResolvedValue(mockApplication);
    mockPrismaInterviewStep.findFirst.mockResolvedValue(mockStep);
    mockPrismaApplication.update.mockResolvedValue(mockUpdated);

    const result = await updateCandidateStage(candidateId, applicationId, newStepId);

    expect(result).toEqual({
      id: 5,
      candidateId: 1,
      positionId: 2,
      currentInterviewStep: { id: 4, name: 'HR Interview' },
    });
    expect(mockPrismaApplication.update).toHaveBeenCalledWith({
      where: { id: applicationId },
      data: { currentInterviewStep: newStepId },
      select: expect.objectContaining({ id: true, candidateId: true, positionId: true }),
    });
  });

  test('throws 404 when candidate does not exist', async () => {
    mockPrismaCandidate.findUnique.mockResolvedValue(null);

    await expect(updateCandidateStage(candidateId, applicationId, newStepId)).rejects.toMatchObject({
      message: 'Candidate not found',
      status: 404,
    });
    expect(mockPrismaApplication.findFirst).not.toHaveBeenCalled();
  });

  test('throws 404 when application does not belong to the candidate', async () => {
    mockPrismaCandidate.findUnique.mockResolvedValue(mockCandidate);
    mockPrismaApplication.findFirst.mockResolvedValue(null);

    await expect(updateCandidateStage(candidateId, applicationId, newStepId)).rejects.toMatchObject({
      message: 'Application not found',
      status: 404,
    });
    expect(mockPrismaInterviewStep.findFirst).not.toHaveBeenCalled();
  });

  test('throws 400 when step is not in the position interviewFlow', async () => {
    mockPrismaCandidate.findUnique.mockResolvedValue(mockCandidate);
    mockPrismaApplication.findFirst.mockResolvedValue(mockApplication);
    mockPrismaInterviewStep.findFirst.mockResolvedValue(null);

    await expect(updateCandidateStage(candidateId, applicationId, newStepId)).rejects.toMatchObject({
      message: 'Interview step is not valid for this position',
      status: 400,
    });
    expect(mockPrismaApplication.update).not.toHaveBeenCalled();
  });

  test('updates only the specified application when candidate has multiple applications', async () => {
    mockPrismaCandidate.findUnique.mockResolvedValue(mockCandidate);
    mockPrismaApplication.findFirst.mockResolvedValue(mockApplication);
    mockPrismaInterviewStep.findFirst.mockResolvedValue(mockStep);
    mockPrismaApplication.update.mockResolvedValue(mockUpdated);

    const result = await updateCandidateStage(candidateId, applicationId, newStepId);

    expect(result).toEqual({
      id: 5,
      candidateId: 1,
      positionId: 2,
      currentInterviewStep: { id: 4, name: 'HR Interview' },
    });
    // Verifies the DB update targets exactly the requested applicationId
    expect(mockPrismaApplication.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: applicationId } })
    );
    // Verifies findFirst was scoped to the candidateId (multi-application isolation)
    expect(mockPrismaApplication.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: applicationId, candidateId }),
      })
    );
  });
});
