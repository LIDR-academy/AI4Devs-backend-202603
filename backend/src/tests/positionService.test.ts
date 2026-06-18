import { getCandidatesByPosition } from '../application/services/positionService';
import { Application } from '../domain/models/Application';

jest.mock('@prisma/client', () => {
    const mockFindUnique = jest.fn();
    return {
        PrismaClient: jest.fn().mockImplementation(() => ({
            position: { findUnique: mockFindUnique },
        })),
        __mockFindUnique: mockFindUnique,
    };
});

jest.mock('../domain/models/Application');

const { PrismaClient, __mockFindUnique } = jest.requireMock('@prisma/client') as any;
const mockPrismaInstance = new PrismaClient();

const mockApplications = [
    {
        id: 1,
        candidateId: 3,
        positionId: 1,
        candidate: { firstName: 'Ana', lastName: 'García' },
        interviewStep: { id: 2, name: 'Entrevista Técnica', orderIndex: 2 },
        interviews: [{ score: 8 }, { score: 7 }],
    },
    {
        id: 2,
        candidateId: 7,
        positionId: 1,
        candidate: { firstName: 'Carlos', lastName: 'López' },
        interviewStep: { id: 1, name: 'Entrevista RRHH', orderIndex: 1 },
        interviews: [],
    },
    {
        id: 3,
        candidateId: 9,
        positionId: 1,
        candidate: { firstName: 'María', lastName: 'Ruiz' },
        interviewStep: { id: 1, name: 'Entrevista RRHH', orderIndex: 1 },
        interviews: [{ score: null }, { score: null }],
    },
];

describe('positionService - getCandidatesByPosition', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('givenValidPositionId_whenGetCandidates_thenReturnCandidateList', async () => {
        mockPrismaInstance.position.findUnique.mockResolvedValue({ id: 1, title: 'Dev' });
        (Application.findByPositionId as jest.Mock).mockResolvedValue(mockApplications);

        const result = await getCandidatesByPosition(1);

        expect(result).toHaveLength(3);
        expect(result[0]).toMatchObject({
            applicationId: 1,
            candidateId: 3,
            fullName: 'Ana García',
            currentInterviewStep: { id: 2, name: 'Entrevista Técnica', orderIndex: 2 },
            averageScore: 7.5,
        });
    });

    it('givenPositionWithNoApplications_whenGetCandidates_thenReturnEmptyArray', async () => {
        mockPrismaInstance.position.findUnique.mockResolvedValue({ id: 1, title: 'Dev' });
        (Application.findByPositionId as jest.Mock).mockResolvedValue([]);

        const result = await getCandidatesByPosition(1);

        expect(result).toEqual([]);
    });

    it('givenInterviewsWithNullScore_whenGetCandidates_thenAverageScoreIsNull', async () => {
        mockPrismaInstance.position.findUnique.mockResolvedValue({ id: 1, title: 'Dev' });
        (Application.findByPositionId as jest.Mock).mockResolvedValue([mockApplications[2]]);

        const result = await getCandidatesByPosition(1);

        expect(result[0].averageScore).toBeNull();
    });

    it('givenInterviewsWithoutScores_whenGetCandidates_thenAverageScoreIsNull', async () => {
        mockPrismaInstance.position.findUnique.mockResolvedValue({ id: 1, title: 'Dev' });
        (Application.findByPositionId as jest.Mock).mockResolvedValue([mockApplications[1]]);

        const result = await getCandidatesByPosition(1);

        expect(result[0].averageScore).toBeNull();
    });

    it('givenNonExistentPositionId_whenGetCandidates_thenThrowNotFoundError', async () => {
        mockPrismaInstance.position.findUnique.mockResolvedValue(null);

        await expect(getCandidatesByPosition(999)).rejects.toMatchObject({
            message: 'Posición no encontrada',
            code: 'NOT_FOUND',
        });
    });

    it('givenValidScores_whenGetCandidates_thenAverageScoreIsRoundedToTwoDecimals', async () => {
        const appWithDecimalScores = {
            ...mockApplications[0],
            interviews: [{ score: 7 }, { score: 8 }, { score: 9 }],
        };
        mockPrismaInstance.position.findUnique.mockResolvedValue({ id: 1 });
        (Application.findByPositionId as jest.Mock).mockResolvedValue([appWithDecimalScores]);

        const result = await getCandidatesByPosition(1);

        expect(result[0].averageScore).toBe(8);
    });
});
