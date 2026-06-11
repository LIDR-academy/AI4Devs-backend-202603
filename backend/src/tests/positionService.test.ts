import { PrismaClient } from '@prisma/client';
import {
  calculateAverageScore,
  mapApplicationToDto,
  getCandidatesByPositionId,
} from '../application/services/positionService';

describe('calculateAverageScore', () => {
  it('returns average of multiple scores rounded to one decimal', () => {
    expect(calculateAverageScore([5, 4])).toBe(4.5);
  });

  it('returns single score', () => {
    expect(calculateAverageScore([5])).toBe(5);
  });

  it('returns null when all scores are null', () => {
    expect(calculateAverageScore([null, null])).toBeNull();
  });

  it('ignores null scores in average', () => {
    expect(calculateAverageScore([5, null, 3])).toBe(4);
  });

  it('returns null for empty array', () => {
    expect(calculateAverageScore([])).toBeNull();
  });

  it('rounds to one decimal place', () => {
    expect(calculateAverageScore([5, 4, 4])).toBe(4.3);
  });
});

describe('mapApplicationToDto', () => {
  it('maps application to PositionCandidateDto', () => {
    const result = mapApplicationToDto({
      id: 1,
      candidate: { id: 10, firstName: 'John', lastName: 'Doe' },
      interviewStep: { name: 'Technical Interview' },
      interviews: [{ score: 5 }, { score: 4 }],
    });

    expect(result).toEqual({
      fullName: 'John Doe',
      currentInterviewStep: 'Technical Interview',
      candidateId: 10,
      applicationId: 1,
      averageScore: 4.5,
    });
  });

  it('trims full name whitespace', () => {
    const result = mapApplicationToDto({
      id: 2,
      candidate: { id: 11, firstName: ' John ', lastName: 'Doe ' },
      interviewStep: { name: 'Initial Screening' },
      interviews: [],
    });

    expect(result.fullName).toBe('John Doe');
    expect(result.averageScore).toBeNull();
  });
});

describe('getCandidatesByPositionId', () => {
  const mockPrisma = {
    position: { findUnique: jest.fn() },
    application: { findMany: jest.fn() },
  } as unknown as PrismaClient;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null when position does not exist', async () => {
    (mockPrisma.position.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await getCandidatesByPositionId(999, mockPrisma);

    expect(result).toBeNull();
  });

  it('returns empty array when position has no applications', async () => {
    (mockPrisma.position.findUnique as jest.Mock).mockResolvedValue({ id: 1 });
    (mockPrisma.application.findMany as jest.Mock).mockResolvedValue([]);

    const result = await getCandidatesByPositionId(1, mockPrisma);

    expect(result).toEqual([]);
  });

  it('returns mapped candidates ordered by applicationDate asc', async () => {
    (mockPrisma.position.findUnique as jest.Mock).mockResolvedValue({ id: 1 });
    (mockPrisma.application.findMany as jest.Mock).mockResolvedValue([
      {
        id: 1,
        candidate: { id: 10, firstName: 'John', lastName: 'Doe' },
        interviewStep: { name: 'Technical Interview' },
        interviews: [{ score: 5 }],
      },
    ]);

    const result = await getCandidatesByPositionId(1, mockPrisma);

    expect(mockPrisma.application.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { positionId: 1 },
        orderBy: { applicationDate: 'asc' },
      }),
    );
    expect(result).toHaveLength(1);
    expect(result![0].fullName).toBe('John Doe');
    expect(result![0].averageScore).toBe(5);
  });
});
