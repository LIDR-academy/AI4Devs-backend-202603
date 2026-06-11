import { Candidate } from '../../domain/models/Candidate';
import { Position } from '../../domain/models/Position';
import { Application } from '../../domain/models/Application';
import { InterviewStep } from '../../domain/models/InterviewStep';
import { updateCandidateStage } from './candidateService';

jest.mock('../../domain/models/Candidate');
jest.mock('../../domain/models/Position');
jest.mock('../../domain/models/Application');
jest.mock('../../domain/models/InterviewStep');

const mockCandidateFindOne = Candidate.findOne as jest.Mock;
const mockPositionFindOne = Position.findOne as jest.Mock;
const mockApplicationFindByCandidateAndPosition = Application.findByCandidateAndPosition as jest.Mock;
const mockInterviewStepFindOne = InterviewStep.findOne as jest.Mock;

describe('updateCandidateStage', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('actualiza currentInterviewStep y devuelve la respuesta actualizada', async () => {
        const mockSave = jest.fn().mockResolvedValue({ id: 5 });

        mockCandidateFindOne.mockResolvedValue({ id: 10 });
        mockPositionFindOne.mockResolvedValue({ id: 1, interviewFlowId: 1 });
        mockApplicationFindByCandidateAndPosition.mockResolvedValue({
            id: 5,
            currentInterviewStep: 1,
            save: mockSave,
        });
        mockInterviewStepFindOne.mockResolvedValue({
            id: 2,
            interviewFlowId: 1,
            name: 'Technical Interview',
            orderIndex: 2,
        });

        const result = await updateCandidateStage(10, {
            positionId: 1,
            interviewStepId: 2,
        });

        expect(mockSave).toHaveBeenCalled();
        expect(result).toEqual({
            applicationId: 5,
            candidateId: 10,
            positionId: 1,
            currentInterviewStep: {
                id: 2,
                name: 'Technical Interview',
                orderIndex: 2,
            },
        });
    });

    it('falla si el candidato no existe', async () => {
        mockCandidateFindOne.mockResolvedValue(null);

        await expect(
            updateCandidateStage(9999, { positionId: 1, interviewStepId: 2 })
        ).rejects.toThrow('Candidate not found');
    });
});
