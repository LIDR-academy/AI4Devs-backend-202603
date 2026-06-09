jest.mock('../application/services/positionService');

import { Request, Response } from 'express';
import { getPositionCandidatesController } from '../presentation/controllers/positionController';
import { getPositionCandidates } from '../application/services/positionService';

const mockGetPositionCandidates = getPositionCandidates as jest.Mock;

const makeRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => jest.clearAllMocks());

describe('getPositionCandidatesController', () => {
  test('returns 400 for NaN position id', async () => {
    const req = { params: { id: 'abc' } } as unknown as Request;
    const res = makeRes();
    await getPositionCandidatesController(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid position ID format' });
    expect(mockGetPositionCandidates).not.toHaveBeenCalled();
  });

  test('returns 400 for partially numeric id "1abc"', async () => {
    const req = { params: { id: '1abc' } } as unknown as Request;
    const res = makeRes();
    await getPositionCandidatesController(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid position ID format' });
    expect(mockGetPositionCandidates).not.toHaveBeenCalled();
  });

  test('returns 200 with candidate list including applicationId', async () => {
    const mockResult = [
      {
        applicationId: 1,
        candidateId: 10,
        fullName: 'John Doe',
        currentInterviewStep: { id: 3, name: 'Technical Interview' },
        averageScore: 7.5,
      },
    ];
    mockGetPositionCandidates.mockResolvedValue(mockResult);

    const req = { params: { id: '1' } } as unknown as Request;
    const res = makeRes();
    await getPositionCandidatesController(req, res);

    expect(mockGetPositionCandidates).toHaveBeenCalledWith(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockResult);
  });

  test('returns 200 with empty array when position has no candidates', async () => {
    mockGetPositionCandidates.mockResolvedValue([]);

    const req = { params: { id: '1' } } as unknown as Request;
    const res = makeRes();
    await getPositionCandidatesController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([]);
  });

  test('returns 404 when service throws error with status 404', async () => {
    const err: any = new Error('Position not found');
    err.status = 404;
    mockGetPositionCandidates.mockRejectedValue(err);

    const req = { params: { id: '999' } } as unknown as Request;
    const res = makeRes();
    await getPositionCandidatesController(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Position not found' });
  });

  test('returns 500 for unexpected errors', async () => {
    mockGetPositionCandidates.mockRejectedValue(new Error('Unexpected DB error'));

    const req = { params: { id: '1' } } as unknown as Request;
    const res = makeRes();
    await getPositionCandidatesController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
  });
});
