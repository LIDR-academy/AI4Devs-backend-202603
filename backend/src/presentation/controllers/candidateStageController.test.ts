import { Request, Response } from 'express';
import { updateCandidateStageController } from './candidateController';
import * as candidateService from '../../application/services/candidateService';

const {
    CANDIDATE_NOT_FOUND,
    APPLICATION_NOT_FOUND,
    STEP_FLOW_MISMATCH,
} = candidateService;

// Builds a coded Error mirroring what the service throws.
const codedError = (code: string): Error => {
    const error = new Error(code);
    (error as Error & { code?: string }).code = code;
    return error;
};

const createMockResponse = () => {
    const res: Partial<Response> = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res as Response;
};

const createMockRequest = (id: string, body: unknown): Request =>
    ({
        params: { id },
        body,
        prisma: {} as any,
    } as unknown as Request);

describe('updateCandidateStageController', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('returns 200 with the updated application (happy path)', async () => {
        const updated = { id: 5, candidateId: 1, currentInterviewStep: 3 };
        jest
            .spyOn(candidateService, 'updateCandidateStage')
            .mockResolvedValue(updated as any);

        const req = createMockRequest('1', { applicationId: 5, currentInterviewStep: 3 });
        const res = createMockResponse();

        await updateCandidateStageController(req, res);

        expect(candidateService.updateCandidateStage).toHaveBeenCalledWith({}, 1, 5, 3);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Candidate stage updated successfully',
            data: updated,
        });
    });

    it('returns 400 when the candidate id is not a valid integer', async () => {
        const spy = jest.spyOn(candidateService, 'updateCandidateStage');
        const req = createMockRequest('abc', { applicationId: 5, currentInterviewStep: 3 });
        const res = createMockResponse();

        await updateCandidateStageController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'Invalid candidate ID' });
        expect(spy).not.toHaveBeenCalled();
    });

    it('returns 400 when applicationId is missing or not an integer', async () => {
        const req = createMockRequest('1', { currentInterviewStep: 3 });
        const res = createMockResponse();

        await updateCandidateStageController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            message: 'applicationId is required and must be an integer',
        });
    });

    it('returns 400 when currentInterviewStep is missing or not an integer', async () => {
        const req = createMockRequest('1', { applicationId: 5 });
        const res = createMockResponse();

        await updateCandidateStageController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            message: 'currentInterviewStep is required and must be an integer',
        });
    });

    it('returns 404 when the candidate does not exist', async () => {
        jest
            .spyOn(candidateService, 'updateCandidateStage')
            .mockRejectedValue(codedError(CANDIDATE_NOT_FOUND));
        const req = createMockRequest('1', { applicationId: 5, currentInterviewStep: 3 });
        const res = createMockResponse();

        await updateCandidateStageController(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: 'Candidate not found' });
    });

    it('returns 404 when the application is not linked to the candidate', async () => {
        jest
            .spyOn(candidateService, 'updateCandidateStage')
            .mockRejectedValue(codedError(APPLICATION_NOT_FOUND));
        const req = createMockRequest('1', { applicationId: 5, currentInterviewStep: 3 });
        const res = createMockResponse();

        await updateCandidateStageController(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: 'Application not found' });
    });

    it('returns 400 when the interview step belongs to a different flow', async () => {
        jest
            .spyOn(candidateService, 'updateCandidateStage')
            .mockRejectedValue(codedError(STEP_FLOW_MISMATCH));
        const req = createMockRequest('1', { applicationId: 5, currentInterviewStep: 3 });
        const res = createMockResponse();

        await updateCandidateStageController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            message: "Interview step does not belong to this position's flow",
        });
    });

    it('returns 500 on unexpected errors', async () => {
        jest
            .spyOn(candidateService, 'updateCandidateStage')
            .mockRejectedValue(new Error('db down'));
        const req = createMockRequest('1', { applicationId: 5, currentInterviewStep: 3 });
        const res = createMockResponse();

        await updateCandidateStageController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
});
