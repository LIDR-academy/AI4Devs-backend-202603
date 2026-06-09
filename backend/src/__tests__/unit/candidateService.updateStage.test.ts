import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

jest.mock('../../infrastructure/prismaClient', () => ({
    __esModule: true,
    default: mockDeep<PrismaClient>(),
}));

import prisma from '../../infrastructure/prismaClient';
import { updateCandidateStage } from '../../application/services/candidateService';

const prismaMock = prisma as DeepMockProxy<PrismaClient>;

const mockCandidate = { id: 1, firstName: 'John', lastName: 'Doe' } as any;
const mockApplication = {
    id: 10,
    candidateId: 1,
    positionId: 5,
    currentInterviewStep: 1,
    position: { interviewFlowId: 3 },
} as any;
const mockStep = { id: 2, name: 'Technical Interview', interviewFlowId: 3 } as any;

describe('updateCandidateStage', () => {
    it('updates currentInterviewStep and returns updated application', async () => {
        prismaMock.candidate.findUnique.mockResolvedValue(mockCandidate);
        prismaMock.application.findFirst.mockResolvedValue(mockApplication);
        prismaMock.interviewStep.findFirst.mockResolvedValue(mockStep);
        prismaMock.application.update.mockResolvedValue({
            ...mockApplication,
            currentInterviewStep: 2,
            interviewStep: { id: 2, name: 'Technical Interview' },
        } as any);

        const result = await updateCandidateStage(1, 10, 2);

        expect(prismaMock.application.update).toHaveBeenCalledWith(
            expect.objectContaining({ where: { id: 10 }, data: { currentInterviewStep: 2 } })
        );
        expect(result).toBeDefined();
    });

    it('is idempotent when updating to same step', async () => {
        prismaMock.candidate.findUnique.mockResolvedValue(mockCandidate);
        prismaMock.application.findFirst.mockResolvedValue(mockApplication);
        prismaMock.interviewStep.findFirst.mockResolvedValue({ ...mockStep, id: 1 });
        prismaMock.application.update.mockResolvedValue({
            ...mockApplication,
            interviewStep: { id: 1, name: 'HR Interview' },
        } as any);

        await expect(updateCandidateStage(1, 10, 1)).resolves.toBeDefined();
    });

    it('throws error when candidate does not exist', async () => {
        prismaMock.candidate.findUnique.mockResolvedValue(null);

        await expect(updateCandidateStage(999, 10, 2)).rejects.toThrow('Candidate not found');
    });

    it('throws error when application does not belong to candidate', async () => {
        prismaMock.candidate.findUnique.mockResolvedValue(mockCandidate);
        prismaMock.application.findFirst.mockResolvedValue(null);

        await expect(updateCandidateStage(1, 99, 2)).rejects.toThrow(
            'Application not found or does not belong to this candidate'
        );
    });

    it('throws error when interview step does not belong to position flow', async () => {
        prismaMock.candidate.findUnique.mockResolvedValue(mockCandidate);
        prismaMock.application.findFirst.mockResolvedValue(mockApplication);
        prismaMock.interviewStep.findFirst.mockResolvedValue(null);

        await expect(updateCandidateStage(1, 10, 99)).rejects.toThrow(
            "Interview step does not belong to this position's interview flow"
        );
    });
});
