import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

jest.mock('../../infrastructure/prismaClient', () => ({
    __esModule: true,
    default: mockDeep<PrismaClient>(),
}));

import prisma from '../../infrastructure/prismaClient';
import { getCandidatesByPosition } from '../../application/services/positionService';

const prismaMock = prisma as DeepMockProxy<PrismaClient>;

describe('getCandidatesByPosition', () => {
    it('returns mapped candidates with averageScore', async () => {
        prismaMock.position.findUnique.mockResolvedValue({ id: 1 } as any);
        prismaMock.application.findMany.mockResolvedValue([
            {
                id: 10,
                candidateId: 1,
                positionId: 1,
                applicationDate: new Date(),
                currentInterviewStep: 2,
                notes: null,
                candidate: { id: 1, firstName: 'John', lastName: 'Doe' },
                interviewStep: { id: 2, name: 'Technical Interview' },
                interviews: [{ score: 8 }, { score: 6 }],
            },
        ] as any);

        const result = await getCandidatesByPosition(1);

        expect(result).toHaveLength(1);
        expect(result[0].candidateId).toBe(1);
        expect(result[0].fullName).toBe('John Doe');
        expect(result[0].currentInterviewStep).toEqual({ id: 2, name: 'Technical Interview' });
        expect(result[0].averageScore).toBe(7);
    });

    it('returns averageScore null when no interviews have score', async () => {
        prismaMock.position.findUnique.mockResolvedValue({ id: 1 } as any);
        prismaMock.application.findMany.mockResolvedValue([
            {
                id: 11,
                candidateId: 2,
                positionId: 1,
                applicationDate: new Date(),
                currentInterviewStep: 1,
                notes: null,
                candidate: { id: 2, firstName: 'Jane', lastName: 'Smith' },
                interviewStep: { id: 1, name: 'HR Interview' },
                interviews: [],
            },
        ] as any);

        const result = await getCandidatesByPosition(1);

        expect(result[0].averageScore).toBeNull();
    });

    it('returns empty array when position has no applications', async () => {
        prismaMock.position.findUnique.mockResolvedValue({ id: 1 } as any);
        prismaMock.application.findMany.mockResolvedValue([] as any);

        const result = await getCandidatesByPosition(1);

        expect(result).toEqual([]);
    });

    it('throws error when position does not exist', async () => {
        prismaMock.position.findUnique.mockResolvedValue(null);

        await expect(getCandidatesByPosition(999)).rejects.toThrow('Position not found');
    });

    it('calculates averageScore ignoring null scores', async () => {
        prismaMock.position.findUnique.mockResolvedValue({ id: 1 } as any);
        prismaMock.application.findMany.mockResolvedValue([
            {
                id: 12,
                candidateId: 3,
                positionId: 1,
                applicationDate: new Date(),
                currentInterviewStep: 3,
                notes: null,
                candidate: { id: 3, firstName: 'Carlos', lastName: 'García' },
                interviewStep: { id: 3, name: 'Manager Interview' },
                interviews: [{ score: 9 }, { score: null }, { score: 7 }],
            },
        ] as any);

        const result = await getCandidatesByPosition(1);

        expect(result[0].averageScore).toBe(8);
    });
});
