jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    position: { findUnique: jest.fn() },
  })),
}));

import { PrismaClient } from '@prisma/client';
import { getPositionCandidates } from '../application/services/positionService';

const prisma = (PrismaClient as jest.Mock).mock.results[0].value;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getPositionCandidates', () => {
  const positionId = 1;

  const mockPosition = { id: 1, title: 'Software Engineer' };

  const mockApplications = [
    {
      id: 1,
      candidateId: 10,
      candidate: { firstName: 'John', lastName: 'Doe' },
      interviewStep: { id: 3, name: 'Technical Interview' },
      interviews: [{ score: 8 }, { score: 7 }],
    },
    {
      id: 2,
      candidateId: 11,
      candidate: { firstName: 'Jane', lastName: 'Smith' },
      interviewStep: { id: 2, name: 'Phone Screen' },
      interviews: [],
    },
  ];

  test('returns correctly shaped array with applicationId, full name, step, and average score', async () => {
    (prisma.position.findUnique as jest.Mock).mockResolvedValue({
      ...mockPosition,
      applications: mockApplications,
    });

    const result = await getPositionCandidates(positionId);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      applicationId: 1,
      candidateId: 10,
      fullName: 'John Doe',
      currentInterviewStep: { id: 3, name: 'Technical Interview' },
      averageScore: 7.5,
    });
    expect(result[1]).toEqual({
      applicationId: 2,
      candidateId: 11,
      fullName: 'Jane Smith',
      currentInterviewStep: { id: 2, name: 'Phone Screen' },
      averageScore: null,
    });
  });

  test('returns averageScore null when all interview scores are null', async () => {
    const appsWithNullScores = [
      {
        id: 3,
        candidateId: 10,
        candidate: { firstName: 'John', lastName: 'Doe' },
        interviewStep: { id: 3, name: 'Technical Interview' },
        interviews: [{ score: null }, { score: null }],
      },
    ];
    (prisma.position.findUnique as jest.Mock).mockResolvedValue({
      ...mockPosition,
      applications: appsWithNullScores,
    });

    const result = await getPositionCandidates(positionId);

    expect(result[0].averageScore).toBeNull();
  });

  test('returns empty array when position has no applications', async () => {
    (prisma.position.findUnique as jest.Mock).mockResolvedValue({
      ...mockPosition,
      applications: [],
    });

    const result = await getPositionCandidates(positionId);

    expect(result).toEqual([]);
  });

  test('throws 404 error when position does not exist', async () => {
    (prisma.position.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(getPositionCandidates(positionId)).rejects.toMatchObject({
      message: 'Position not found',
      status: 404,
    });
  });

  test('returns averageScore excluding null scores from mixed interviews', async () => {
    const appsWithMixedScores = [
      {
        id: 4,
        candidateId: 10,
        candidate: { firstName: 'John', lastName: 'Doe' },
        interviewStep: { id: 3, name: 'Technical Interview' },
        interviews: [{ score: 8 }, { score: null }, { score: 6 }],
      },
    ];
    (prisma.position.findUnique as jest.Mock).mockResolvedValue({
      ...mockPosition,
      applications: appsWithMixedScores,
    });

    const result = await getPositionCandidates(positionId);

    expect(result[0].averageScore).toBe(7);
  });
});
