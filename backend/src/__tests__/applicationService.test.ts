jest.mock('../infrastructure/database/prismaClient', () => {
    const applicationFindUnique   = jest.fn();
    const applicationUpdate       = jest.fn();
    const interviewStepFindUnique = jest.fn();

    return {
        __esModule: true,
        default: {
            application:   { findUnique: applicationFindUnique, update: applicationUpdate },
            interviewStep: { findUnique: interviewStepFindUnique },
        },
        __mocks: { applicationFindUnique, applicationUpdate, interviewStepFindUnique },
    };
});

import { updateCandidateStage } from '../application/services/applicationService';

const { __mocks } = jest.requireMock('../infrastructure/database/prismaClient') as any;

beforeEach(() => jest.clearAllMocks());

describe('updateCandidateStage', () => {
    const updatedApplication = {
        id: 1,
        candidateId: 2,
        positionId: 4,
        currentInterviewStep: 3,
    };

    it('actualiza la fase y devuelve los campos documentados en api-spec', async () => {
        __mocks.applicationFindUnique.mockResolvedValue({ id: 1 });
        __mocks.interviewStepFindUnique.mockResolvedValue({ id: 3, name: 'Entrevista técnica' });
        __mocks.applicationUpdate.mockResolvedValue(updatedApplication);

        const result = await updateCandidateStage(1, 3);

        expect(result).toEqual(updatedApplication);
    });

    it('llama a update con el select correcto (id, candidateId, positionId, currentInterviewStep)', async () => {
        __mocks.applicationFindUnique.mockResolvedValue({ id: 1 });
        __mocks.interviewStepFindUnique.mockResolvedValue({ id: 3 });
        __mocks.applicationUpdate.mockResolvedValue(updatedApplication);

        await updateCandidateStage(1, 3);

        expect(__mocks.applicationUpdate).toHaveBeenCalledWith({
            where:  { id: 1 },
            data:   { currentInterviewStep: 3 },
            select: { id: true, candidateId: true, positionId: true, currentInterviewStep: true },
        });
    });

    it('[mutation M6] busca el interviewStep con interviewStepId, no con applicationId', async () => {
        // Detecta la mutación: interviewStepFindUnique({ where: { id: applicationId } })
        // Si se cruzan las variables, applicationId=1 se usaría en vez de interviewStepId=3.
        __mocks.applicationFindUnique.mockResolvedValue({ id: 1 });
        __mocks.interviewStepFindUnique.mockResolvedValue({ id: 3 });
        __mocks.applicationUpdate.mockResolvedValue(updatedApplication);

        await updateCandidateStage(1, 3);

        expect(__mocks.interviewStepFindUnique).toHaveBeenCalledWith({ where: { id: 3 } });
        expect(__mocks.interviewStepFindUnique).not.toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('verifica la candidatura antes de buscar el interviewStep', async () => {
        __mocks.applicationFindUnique.mockResolvedValue(null);

        await expect(updateCandidateStage(999, 1)).rejects.toThrow('Application not found');

        expect(__mocks.interviewStepFindUnique).not.toHaveBeenCalled();
        expect(__mocks.applicationUpdate).not.toHaveBeenCalled();
    });

    it('lanza "Application not found" cuando la candidatura no existe (→ 404 en controller)', async () => {
        __mocks.applicationFindUnique.mockResolvedValue(null);

        await expect(updateCandidateStage(999, 1)).rejects.toThrow('Application not found');
    });

    it('lanza "Interview step not found" cuando el step no existe (→ 400 en controller)', async () => {
        __mocks.applicationFindUnique.mockResolvedValue({ id: 1 });
        __mocks.interviewStepFindUnique.mockResolvedValue(null);

        await expect(updateCandidateStage(1, 999)).rejects.toThrow('Interview step not found');

        expect(__mocks.applicationUpdate).not.toHaveBeenCalled();
    });

    it('no llama a update si el interviewStep no existe', async () => {
        __mocks.applicationFindUnique.mockResolvedValue({ id: 1 });
        __mocks.interviewStepFindUnique.mockResolvedValue(null);

        await expect(updateCandidateStage(1, 99)).rejects.toThrow();

        expect(__mocks.applicationUpdate).not.toHaveBeenCalled();
    });

    it('propaga errores inesperados de Prisma sin envolverlos', async () => {
        const dbError = new Error('DB connection lost');
        __mocks.applicationFindUnique.mockRejectedValue(dbError);

        await expect(updateCandidateStage(1, 1)).rejects.toThrow('DB connection lost');
    });
});
