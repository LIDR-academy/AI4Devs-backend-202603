import { Application } from '../domain/models/Application';
import { updateCandidateStage, NotFoundError } from '../application/services/candidateService';

// Mock del cliente Prisma usado en candidateService para validar el step.
// La jest.fn se crea dentro de la factory (estable entre instancias) porque
// candidateService llama a `new PrismaClient()` durante el import.
jest.mock('@prisma/client', () => {
    const findUnique = jest.fn();
    return {
        PrismaClient: jest.fn().mockImplementation(() => ({
            interviewStep: { findUnique },
        })),
        __interviewStepFindUnique: findUnique,
    };
});

jest.mock('../domain/models/Application');

const mockedApplication = Application as jest.Mocked<typeof Application>;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const interviewStepFindUnique = (require('@prisma/client') as any).__interviewStepFindUnique as jest.Mock;

describe('candidateService.updateCandidateStage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('throws 400 (Error) when the body is invalid', async () => {
        await expect(
            updateCandidateStage(1, { applicationId: 0, currentInterviewStep: 2 } as any)
        ).rejects.toThrow('Invalid applicationId');
    });

    it('throws NotFoundError when the application does not exist', async () => {
        mockedApplication.findOne.mockResolvedValue(null);

        await expect(
            updateCandidateStage(1, { applicationId: 10, currentInterviewStep: 2 })
        ).rejects.toBeInstanceOf(NotFoundError);
    });

    it('throws NotFoundError when the application belongs to another candidate', async () => {
        mockedApplication.findOne.mockResolvedValue({ candidateId: 99 } as any);

        await expect(
            updateCandidateStage(1, { applicationId: 10, currentInterviewStep: 2 })
        ).rejects.toBeInstanceOf(NotFoundError);
    });

    it('throws 400 (Error) when the interview step does not exist', async () => {
        mockedApplication.findOne.mockResolvedValue({ candidateId: 1, updateStage: jest.fn() } as any);
        interviewStepFindUnique.mockResolvedValue(null);

        await expect(
            updateCandidateStage(1, { applicationId: 10, currentInterviewStep: 999 })
        ).rejects.toThrow('Invalid currentInterviewStep: step does not exist');
    });

    it('updates the stage when candidate, application and step are valid', async () => {
        const updateStage = jest.fn().mockResolvedValue({ id: 10, currentInterviewStep: 3 });
        mockedApplication.findOne.mockResolvedValue({ candidateId: 1, updateStage } as any);
        interviewStepFindUnique.mockResolvedValue({ id: 3, name: 'Final' });

        const result = await updateCandidateStage(1, { applicationId: 10, currentInterviewStep: 3 });

        expect(updateStage).toHaveBeenCalledWith(3);
        expect(result).toEqual({ id: 10, currentInterviewStep: 3 });
    });
});
