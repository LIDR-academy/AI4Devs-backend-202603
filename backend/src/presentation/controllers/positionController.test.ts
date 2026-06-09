import { Request, Response } from 'express';
import { getPositionCandidatesController } from './positionController';
import * as positionService from '../../application/services/positionService';

// Builds a mocked Express Response with chainable status().json().
const createMockResponse = () => {
    const res: Partial<Response> = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res as Response;
};

const createMockRequest = (id: string): Request =>
    ({
        params: { id },
        prisma: {} as any,
    } as unknown as Request);

describe('getPositionCandidatesController', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('returns 200 with the list of candidates (happy path)', async () => {
        const candidates = [
            {
                fullName: 'John Doe',
                currentInterviewStep: 'Technical Interview',
                candidateId: 1,
                applicationId: 5,
                averageScore: 4.5,
            },
        ];
        jest
            .spyOn(positionService, 'getPositionCandidates')
            .mockResolvedValue(candidates);

        const req = createMockRequest('1');
        const res = createMockResponse();

        await getPositionCandidatesController(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(candidates);
    });

    it('returns 400 when the id is not a valid integer', async () => {
        const spy = jest.spyOn(positionService, 'getPositionCandidates');

        const req = createMockRequest('abc');
        const res = createMockResponse();

        await getPositionCandidatesController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'Invalid position ID' });
        expect(spy).not.toHaveBeenCalled();
    });

    it('returns 404 when the position does not exist', async () => {
        jest
            .spyOn(positionService, 'getPositionCandidates')
            .mockRejectedValue(positionService.positionNotFoundError());

        const req = createMockRequest('999');
        const res = createMockResponse();

        await getPositionCandidatesController(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: 'Position not found' });
    });

    it('returns 500 on unexpected errors', async () => {
        jest
            .spyOn(positionService, 'getPositionCandidates')
            .mockRejectedValue(new Error('db down'));

        const req = createMockRequest('1');
        const res = createMockResponse();

        await getPositionCandidatesController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
});
