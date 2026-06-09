import {
    updateCandidateStage,
    CANDIDATE_NOT_FOUND,
    APPLICATION_NOT_FOUND,
    STEP_FLOW_MISMATCH,
} from './candidateService';

// Minimal mocked Prisma client exposing only the methods the service uses.
const createPrismaMock = () => ({
    candidate: { findUnique: jest.fn() },
    application: { findUnique: jest.fn(), update: jest.fn() },
    interviewStep: { findUnique: jest.fn() },
});

describe('candidateService.updateCandidateStage', () => {
    let prisma: ReturnType<typeof createPrismaMock>;

    beforeEach(() => {
        prisma = createPrismaMock();
    });

    it('updates the application stage on the happy path', async () => {
        prisma.candidate.findUnique.mockResolvedValue({ id: 1 });
        prisma.application.findUnique.mockResolvedValue({
            id: 5,
            candidateId: 1,
            position: { interviewFlowId: 10 },
        });
        prisma.interviewStep.findUnique.mockResolvedValue({
            id: 3,
            interviewFlowId: 10,
        });
        const updated = { id: 5, candidateId: 1, currentInterviewStep: 3 };
        prisma.application.update.mockResolvedValue(updated);

        const result = await updateCandidateStage(prisma as any, 1, 5, 3);

        expect(result).toEqual(updated);
        expect(prisma.application.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: 5 },
                data: { currentInterviewStep: 3 },
            })
        );
    });

    it('throws CANDIDATE_NOT_FOUND when the candidate does not exist', async () => {
        prisma.candidate.findUnique.mockResolvedValue(null);

        await expect(
            updateCandidateStage(prisma as any, 999, 5, 3)
        ).rejects.toMatchObject({ code: CANDIDATE_NOT_FOUND });
        expect(prisma.application.update).not.toHaveBeenCalled();
    });

    it('throws APPLICATION_NOT_FOUND when the application does not exist', async () => {
        prisma.candidate.findUnique.mockResolvedValue({ id: 1 });
        prisma.application.findUnique.mockResolvedValue(null);

        await expect(
            updateCandidateStage(prisma as any, 1, 5, 3)
        ).rejects.toMatchObject({ code: APPLICATION_NOT_FOUND });
    });

    it('throws APPLICATION_NOT_FOUND when the application belongs to another candidate', async () => {
        prisma.candidate.findUnique.mockResolvedValue({ id: 1 });
        prisma.application.findUnique.mockResolvedValue({
            id: 5,
            candidateId: 2, // different candidate
            position: { interviewFlowId: 10 },
        });

        await expect(
            updateCandidateStage(prisma as any, 1, 5, 3)
        ).rejects.toMatchObject({ code: APPLICATION_NOT_FOUND });
    });

    it('throws STEP_FLOW_MISMATCH when the step does not exist', async () => {
        prisma.candidate.findUnique.mockResolvedValue({ id: 1 });
        prisma.application.findUnique.mockResolvedValue({
            id: 5,
            candidateId: 1,
            position: { interviewFlowId: 10 },
        });
        prisma.interviewStep.findUnique.mockResolvedValue(null);

        await expect(
            updateCandidateStage(prisma as any, 1, 5, 999)
        ).rejects.toMatchObject({ code: STEP_FLOW_MISMATCH });
    });

    it('throws STEP_FLOW_MISMATCH when the step belongs to a different flow', async () => {
        prisma.candidate.findUnique.mockResolvedValue({ id: 1 });
        prisma.application.findUnique.mockResolvedValue({
            id: 5,
            candidateId: 1,
            position: { interviewFlowId: 10 },
        });
        prisma.interviewStep.findUnique.mockResolvedValue({
            id: 3,
            interviewFlowId: 99, // different flow
        });

        await expect(
            updateCandidateStage(prisma as any, 1, 5, 3)
        ).rejects.toMatchObject({ code: STEP_FLOW_MISMATCH });
        expect(prisma.application.update).not.toHaveBeenCalled();
    });
});
