import request from 'supertest';
import { app } from '../index';
import * as positionService from '../application/services/positionService';

jest.mock('../application/services/positionService');

const mockedGetCandidates = positionService.getCandidatesByPositionId as jest.MockedFunction<
  typeof positionService.getCandidatesByPositionId
>;

describe('GET /positions/:id/candidates', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 200 with candidates array', async () => {
    mockedGetCandidates.mockResolvedValue([
      {
        fullName: 'John Doe',
        currentInterviewStep: 'Technical Interview',
        candidateId: 1,
        applicationId: 1,
        averageScore: 5,
      },
    ]);

    const response = await request(app).get('/positions/1/candidates');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject({
      fullName: 'John Doe',
      currentInterviewStep: 'Technical Interview',
      candidateId: 1,
      applicationId: 1,
      averageScore: 5,
    });
  });

  it('returns 200 with empty array when no applications', async () => {
    mockedGetCandidates.mockResolvedValue([]);

    const response = await request(app).get('/positions/1/candidates');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('returns 404 when position not found', async () => {
    mockedGetCandidates.mockResolvedValue(null);

    const response = await request(app).get('/positions/999/candidates');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Position not found' });
  });

  it('returns 400 for non-numeric id', async () => {
    const response = await request(app).get('/positions/abc/candidates');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Invalid ID format' });
    expect(mockedGetCandidates).not.toHaveBeenCalled();
  });

  it('returns 400 for negative id', async () => {
    const response = await request(app).get('/positions/-1/candidates');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Invalid ID format' });
    expect(mockedGetCandidates).not.toHaveBeenCalled();
  });
});
