import { updateCandidateStage } from '../application/services/applicationService';

jest.mock('@prisma/client', () => {
    const applicationFindUnique = jest.fn();
    const applicationUpdate = jest.fn();
    const interviewStepFindUnique = jest.fn();

    return {
        PrismaClient: jest.fn().mockImplementation(() => ({
            application: { findUnique: applicationFindUnique, update: applicationUpdate },
            interviewStep: { findUnique: interviewStepFindUnique },
        })),
        __mocks: { applicationFindUnique, applicationUpdate, interviewStepFindUnique },
    };
});

const { __mocks } = jest.requireMock('@prisma/client') as any;

beforeEach(() => {
    jest.clearAllMocks();
});

describe('updateCandidateStage', () => {
    it('actualiza la fase y devuelve la candidatura actualizada', async () => {
        __mocks.applicationFindUnique.mockResolvedValue({ id: 1 });
        __mocks.interviewStepFindUnique.mockResolvedValue({ id: 3, name: 'Entrevista técnica' });
        __mocks.applicationUpdate.mockResolvedValue({
            id: 1,
            candidateId: 2,
            positionId: 4,
            currentInterviewStep: 3,
        });

        const result = await updateCandidateStage(1, 3);

        expect(result).toEqual({ id: 1, candidateId: 2, positionId: 4, currentInterviewStep: 3 });
        expect(__mocks.applicationUpdate).toHaveBeenCalledWith({
            where: { id: 1 },
            data: { currentInterviewStep: 3 },
            select: { id: true, candidateId: true, positionId: true, currentInterviewStep: true },
        });
    });

    it('lanza error si la candidatura no existe', async () => {
        __mocks.applicationFindUnique.mockResolvedValue(null);

        await expect(updateCandidateStage(999, 1)).rejects.toThrow('Application not found');
        expect(__mocks.interviewStepFindUnique).not.toHaveBeenCalled();
    });

    it('lanza error si el interviewStep no existe', async () => {
        __mocks.applicationFindUnique.mockResolvedValue({ id: 1 });
        __mocks.interviewStepFindUnique.mockResolvedValue(null);

        await expect(updateCandidateStage(1, 999)).rejects.toThrow('Interview step not found');
        expect(__mocks.applicationUpdate).not.toHaveBeenCalled();
    });
});
