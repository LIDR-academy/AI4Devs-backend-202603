jest.mock('../application/services/candidateService');

import { Request, Response } from 'express';
import { updateCandidateStageController } from '../presentation/controllers/candidateController';
import { updateCandidateStage } from '../application/services/candidateService';

const mockUpdateCandidateStage = updateCandidateStage as jest.Mock;

const makeRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const validBody = { applicationId: 5, currentInterviewStep: 3 };

beforeEach(() => jest.clearAllMocks());

describe('updateCandidateStageController', () => {
  test('returns 400 for NaN candidate id', async () => {
    const req = { params: { id: 'abc' }, body: validBody } as unknown as Request;
    const res = makeRes();
    await updateCandidateStageController(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid candidate ID format' });
    expect(mockUpdateCandidateStage).not.toHaveBeenCalled();
  });

  test('returns 400 for partially numeric candidate id "1abc"', async () => {
    const req = { params: { id: '1abc' }, body: validBody } as unknown as Request;
    const res = makeRes();
    await updateCandidateStageController(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid candidate ID format' });
    expect(mockUpdateCandidateStage).not.toHaveBeenCalled();
  });

  test('returns 400 when applicationId is missing from body', async () => {
    const req = { params: { id: '1' }, body: { currentInterviewStep: 3 } } as unknown as Request;
    const res = makeRes();
    await updateCandidateStageController(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockUpdateCandidateStage).not.toHaveBeenCalled();
  });

  test('returns 400 when currentInterviewStep is missing from body', async () => {
    const req = { params: { id: '1' }, body: { applicationId: 5 } } as unknown as Request;
    const res = makeRes();
    await updateCandidateStageController(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockUpdateCandidateStage).not.toHaveBeenCalled();
  });

  test('returns 400 when applicationId is not an integer (string)', async () => {
    const req = { params: { id: '1' }, body: { applicationId: 'abc', currentInterviewStep: 3 } } as unknown as Request;
    const res = makeRes();
    await updateCandidateStageController(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockUpdateCandidateStage).not.toHaveBeenCalled();
  });

  test('returns 400 when currentInterviewStep is not an integer (float)', async () => {
    const req = { params: { id: '1' }, body: { applicationId: 5, currentInterviewStep: 2.5 } } as unknown as Request;
    const res = makeRes();
    await updateCandidateStageController(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockUpdateCandidateStage).not.toHaveBeenCalled();
  });

  test('returns 200 on valid request', async () => {
    const mockResult = {
      id: 5,
      candidateId: 1,
      positionId: 2,
      currentInterviewStep: { id: 3, name: 'HR Interview' },
    };
    mockUpdateCandidateStage.mockResolvedValue(mockResult);

    const req = { params: { id: '1' }, body: validBody } as unknown as Request;
    const res = makeRes();
    await updateCandidateStageController(req, res);

    expect(mockUpdateCandidateStage).toHaveBeenCalledWith(1, 5, 3);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockResult);
  });

  test('returns 404 when service throws error with status 404', async () => {
    const err: any = new Error('Candidate not found');
    err.status = 404;
    mockUpdateCandidateStage.mockRejectedValue(err);

    const req = { params: { id: '999' }, body: validBody } as unknown as Request;
    const res = makeRes();
    await updateCandidateStageController(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Candidate not found' });
  });

  test('returns 400 when service throws error with status 400', async () => {
    const err: any = new Error('Interview step is not valid for this position');
    err.status = 400;
    mockUpdateCandidateStage.mockRejectedValue(err);

    const req = { params: { id: '1' }, body: validBody } as unknown as Request;
    const res = makeRes();
    await updateCandidateStageController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Interview step is not valid for this position' });
  });

  test('returns 500 for unexpected errors', async () => {
    mockUpdateCandidateStage.mockRejectedValue(new Error('Unexpected DB error'));

    const req = { params: { id: '1' }, body: validBody } as unknown as Request;
    const res = makeRes();
    await updateCandidateStageController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
  });
});
