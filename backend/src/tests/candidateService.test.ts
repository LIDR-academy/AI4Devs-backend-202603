import { updateApplicationStage } from '../application/services/candidateService';
import { Application } from '../domain/models/Application';

jest.mock('@prisma/client', () => {
    const mockFindUnique = jest.fn();
    return {
        PrismaClient: jest.fn().mockImplementation(() => ({
            interviewStep: { findUnique: mockFindUnique },
        })),
        __mockFindUnique: mockFindUnique,
    };
});

jest.mock('../domain/models/Application');
jest.mock('../domain/models/Candidate');
jest.mock('../domain/models/Education');
jest.mock('../domain/models/WorkExperience');
jest.mock('../domain/models/Resume');

const { PrismaClient } = jest.requireMock('@prisma/client') as any;
const mockPrismaInstance = new PrismaClient();

const mockApplication = {
    id: 1,
    candidateId: 3,
    positionId: 1,
    currentInterviewStep: 1,
    position: { interviewFlowId: 10 },
};

const mockStep = {
    id: 3,
    name: 'Entrevista Final',
    orderIndex: 3,
    interviewFlowId: 10,
};

const mockUpdated = {
    id: 1,
    candidateId: 3,
    currentInterviewStep: 3,
    interviewStep: { id: 3, name: 'Entrevista Final', orderIndex: 3 },
};

describe('candidateService - updateApplicationStage', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('givenValidApplicationAndStep_whenUpdateStage_thenReturnUpdatedData', async () => {
        (Application.findWithPosition as jest.Mock).mockResolvedValue(mockApplication);
        mockPrismaInstance.interviewStep.findUnique.mockResolvedValue(mockStep);
        (Application.updateStage as jest.Mock).mockResolvedValue(mockUpdated);

        const result = await updateApplicationStage(1, 3);

        expect(result).toMatchObject({
            applicationId: 1,
            candidateId: 3,
            newInterviewStep: { id: 3, name: 'Entrevista Final', orderIndex: 3 },
        });
        expect(Application.updateStage).toHaveBeenCalledWith(1, 3);
    });

    it('givenNonExistentApplication_whenUpdateStage_thenThrowNotFoundError', async () => {
        (Application.findWithPosition as jest.Mock).mockResolvedValue(null);

        await expect(updateApplicationStage(999, 3)).rejects.toMatchObject({
            message: 'Postulación no encontrada',
            code: 'NOT_FOUND',
        });
    });

    it('givenNonExistentStep_whenUpdateStage_thenThrowNotFoundError', async () => {
        (Application.findWithPosition as jest.Mock).mockResolvedValue(mockApplication);
        mockPrismaInstance.interviewStep.findUnique.mockResolvedValue(null);

        await expect(updateApplicationStage(1, 999)).rejects.toMatchObject({
            message: 'Etapa de entrevista no encontrada',
            code: 'NOT_FOUND',
        });
    });

    it('givenStepFromDifferentFlow_whenUpdateStage_thenThrowValidationError', async () => {
        (Application.findWithPosition as jest.Mock).mockResolvedValue(mockApplication);
        mockPrismaInstance.interviewStep.findUnique.mockResolvedValue({
            ...mockStep,
            interviewFlowId: 99,
        });

        await expect(updateApplicationStage(1, 3)).rejects.toMatchObject({
            message: 'La etapa indicada no pertenece al flujo de entrevistas de esta posición',
            code: 'VALIDATION_ERROR',
        });
    });

    it('givenValidUpdate_whenUpdateStage_thenApplicationUpdateStageIsCalledOnce', async () => {
        (Application.findWithPosition as jest.Mock).mockResolvedValue(mockApplication);
        mockPrismaInstance.interviewStep.findUnique.mockResolvedValue(mockStep);
        (Application.updateStage as jest.Mock).mockResolvedValue(mockUpdated);

        await updateApplicationStage(1, 3);

        expect(Application.updateStage).toHaveBeenCalledTimes(1);
        expect(Application.updateStage).toHaveBeenCalledWith(1, 3);
    });
});
