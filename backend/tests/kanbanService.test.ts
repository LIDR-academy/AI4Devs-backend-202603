import { PrismaClient } from '@prisma/client';
import { getCandidatesByPosition, updateCandidateStage } from '../src/application/services/kanbanService';

const createPrismaMock = () =>
    ({
        position: {
            findUnique: jest.fn(),
        },
        application: {
            findMany: jest.fn(),
            update: jest.fn(),
        },
        interviewStep: {
            findUnique: jest.fn(),
        },
    } as unknown as PrismaClient);

describe('kanbanService', () => {
    describe('getCandidatesByPosition', () => {
        it('returns candidates with application scoped average score', async () => {
            const prisma = createPrismaMock();

            (prisma.position.findUnique as jest.Mock).mockResolvedValue({ id: 1 });
            (prisma.application.findMany as jest.Mock).mockResolvedValue([
                {
                    id: 10,
                    candidate: {
                        id: 20,
                        firstName: 'Ada',
                        lastName: 'Lovelace',
                    },
                    interviewStep: {
                        id: 30,
                        name: 'Technical Interview',
                        orderIndex: 2,
                    },
                    interviews: [{ score: 4 }, { score: null }, { score: 5 }],
                },
            ]);

            const result = await getCandidatesByPosition(prisma, 1);

            expect(result).toEqual({
                position_id: 1,
                candidates: [
                    {
                        application_id: 10,
                        candidate_id: 20,
                        candidate_full_name: 'Ada Lovelace',
                        current_interview_step: {
                            id: 30,
                            name: 'Technical Interview',
                            orderIndex: 2,
                        },
                        average_score: 4.5,
                    },
                ],
            });
        });

        it('throws 404 when the position does not exist', async () => {
            const prisma = createPrismaMock();

            (prisma.position.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(getCandidatesByPosition(prisma, 999)).rejects.toMatchObject({
                statusCode: 404,
                message: 'Position not found',
            });
        });

        it('returns empty candidates list when position has no applications', async () => {
            const prisma = createPrismaMock();

            (prisma.position.findUnique as jest.Mock).mockResolvedValue({ id: 1 });
            (prisma.application.findMany as jest.Mock).mockResolvedValue([]);

            const result = await getCandidatesByPosition(prisma, 1);

            expect(result).toEqual({ position_id: 1, candidates: [] });
        });

        it('returns average_score null when all interview scores are null', async () => {
            const prisma = createPrismaMock();

            (prisma.position.findUnique as jest.Mock).mockResolvedValue({ id: 1 });
            (prisma.application.findMany as jest.Mock).mockResolvedValue([
                {
                    id: 10,
                    candidate: { id: 20, firstName: 'Alan', lastName: 'Turing' },
                    interviewStep: { id: 30, name: 'Initial Screening', orderIndex: 1 },
                    interviews: [{ score: null }, { score: null }],
                },
            ]);

            const result = await getCandidatesByPosition(prisma, 1);

            expect(result.candidates[0].average_score).toBeNull();
        });

        it('returns average_score null when there are no interviews', async () => {
            const prisma = createPrismaMock();

            (prisma.position.findUnique as jest.Mock).mockResolvedValue({ id: 1 });
            (prisma.application.findMany as jest.Mock).mockResolvedValue([
                {
                    id: 10,
                    candidate: { id: 20, firstName: 'Alan', lastName: 'Turing' },
                    interviewStep: { id: 30, name: 'Initial Screening', orderIndex: 1 },
                    interviews: [],
                },
            ]);

            const result = await getCandidatesByPosition(prisma, 1);

            expect(result.candidates[0].average_score).toBeNull();
        });
    });

    describe('updateCandidateStage', () => {
        it('updates the application current interview step when it belongs to the position flow', async () => {
            const prisma = createPrismaMock();

            (prisma.application.findMany as jest.Mock).mockResolvedValue([
                {
                    id: 10,
                    candidateId: 20,
                    positionId: 30,
                    position: {
                        interviewFlowId: 40,
                    },
                },
            ]);
            (prisma.interviewStep.findUnique as jest.Mock).mockResolvedValue({
                id: 50,
                name: 'Manager Interview',
                orderIndex: 3,
                interviewFlowId: 40,
            });
            (prisma.application.update as jest.Mock).mockResolvedValue({
                id: 10,
                candidateId: 20,
                positionId: 30,
                interviewStep: {
                    id: 50,
                    name: 'Manager Interview',
                    orderIndex: 3,
                },
            });

            const result = await updateCandidateStage(prisma, 20, 30, 50);

            expect(prisma.application.update).toHaveBeenCalledWith({
                where: { id: 10 },
                data: { currentInterviewStep: 50 },
                select: {
                    id: true,
                    candidateId: true,
                    positionId: true,
                    interviewStep: {
                        select: {
                            id: true,
                            name: true,
                            orderIndex: true,
                        },
                    },
                },
            });
            expect(result).toEqual({
                candidate_id: 20,
                position_id: 30,
                application_id: 10,
                current_interview_step: {
                    id: 50,
                    name: 'Manager Interview',
                    orderIndex: 3,
                },
            });
        });

        it('throws 404 when no application exists for the candidate and position', async () => {
            const prisma = createPrismaMock();

            (prisma.application.findMany as jest.Mock).mockResolvedValue([]);

            await expect(updateCandidateStage(prisma, 20, 30, 50)).rejects.toMatchObject({
                statusCode: 404,
                message: 'Application not found for candidate and position',
            });
        });

        it('throws 404 when the interview step does not exist', async () => {
            const prisma = createPrismaMock();

            (prisma.application.findMany as jest.Mock).mockResolvedValue([
                {
                    id: 10,
                    candidateId: 20,
                    positionId: 30,
                    position: { interviewFlowId: 40 },
                },
            ]);
            (prisma.interviewStep.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(updateCandidateStage(prisma, 20, 30, 999)).rejects.toMatchObject({
                statusCode: 404,
                message: 'Interview step not found',
            });
        });

        it('throws 409 when multiple applications exist for the same candidate and position', async () => {
            const prisma = createPrismaMock();

            (prisma.application.findMany as jest.Mock).mockResolvedValue([{ id: 1 }, { id: 2 }]);

            await expect(updateCandidateStage(prisma, 20, 30, 50)).rejects.toMatchObject({
                statusCode: 409,
                message: 'Multiple applications found for candidate and position',
            });
        });

        it('throws 422 when the interview step does not belong to the position flow', async () => {
            const prisma = createPrismaMock();

            (prisma.application.findMany as jest.Mock).mockResolvedValue([
                {
                    id: 10,
                    candidateId: 20,
                    positionId: 30,
                    position: {
                        interviewFlowId: 40,
                    },
                },
            ]);
            (prisma.interviewStep.findUnique as jest.Mock).mockResolvedValue({
                id: 50,
                name: 'Other Flow Step',
                orderIndex: 1,
                interviewFlowId: 999,
            });

            await expect(updateCandidateStage(prisma, 20, 30, 50)).rejects.toMatchObject({
                statusCode: 422,
                message: 'Interview step does not belong to the position interview flow',
            });
        });
    });
});
