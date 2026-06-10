import request from 'supertest';
import { buildTestApp, bearer } from './testApp';

const recruiterToken = bearer({ userId: 1, role: 'recruiter' });
const interviewerToken = bearer({ userId: 2, role: 'interviewer' });

const flowSteps = [
    { id: 1, name: 'Initial Screening' },
    { id: 2, name: 'Technical Interview' },
    { id: 3, name: 'Manager Interview' },
];

const applicationWithFlow = (overrides: any = {}) => ({
    id: 12,
    positionId: 1,
    candidateId: 1,
    currentInterviewStep: 1,
    position: { interviewFlow: { interviewSteps: flowSteps } },
    ...overrides,
});

describe('PUT /candidates/:id/stage', () => {
    let prismaMock: any;
    let app: any;

    beforeEach(() => {
        prismaMock = {
            candidate: { findUnique: jest.fn() },
            application: { findMany: jest.fn(), update: jest.fn() },
        };
        app = buildTestApp(prismaMock);
    });

    it('returns 401 when unauthenticated', async () => {
        const res = await request(app).put('/candidates/1/stage').send({ newStage: 'Technical Interview' });
        expect(res.status).toBe(401);
    });

    it('returns 403 when the role lacks permission', async () => {
        const res = await request(app)
            .put('/candidates/1/stage')
            .set('Authorization', interviewerToken)
            .send({ newStage: 'Technical Interview' });
        expect(res.status).toBe(403);
    });

    it('returns 400 when newStage is missing', async () => {
        const res = await request(app)
            .put('/candidates/1/stage')
            .set('Authorization', recruiterToken)
            .send({});
        expect(res.status).toBe(400);
    });

    const fullCandidate = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@gmail.com',
        phone: '1234567890',
        address: '123 Main St',
    };

    it('returns 404 when the candidate does not exist', async () => {
        prismaMock.candidate.findUnique.mockResolvedValue(null);

        const res = await request(app)
            .put('/candidates/999/stage')
            .set('Authorization', recruiterToken)
            .send({ newStage: 'Technical Interview' });

        expect(res.status).toBe(404);
    });

    it('returns 400 when newStage is not a valid step of the flow', async () => {
        prismaMock.candidate.findUnique.mockResolvedValue(fullCandidate);
        prismaMock.application.findMany.mockResolvedValue([applicationWithFlow()]);

        const res = await request(app)
            .put('/candidates/1/stage')
            .set('Authorization', recruiterToken)
            .send({ newStage: 'NonExistentStage' });

        expect(res.status).toBe(400);
        expect(res.body.validStages).toEqual([
            'Initial Screening',
            'Technical Interview',
            'Manager Interview',
        ]);
        expect(prismaMock.application.update).not.toHaveBeenCalled();
    });

    it('returns 400 when the candidate has multiple applications and no positionId', async () => {
        prismaMock.candidate.findUnique.mockResolvedValue(fullCandidate);
        prismaMock.application.findMany.mockResolvedValue([
            applicationWithFlow({ id: 12, positionId: 1 }),
            applicationWithFlow({ id: 13, positionId: 2 }),
        ]);

        const res = await request(app)
            .put('/candidates/1/stage')
            .set('Authorization', recruiterToken)
            .send({ newStage: 'Technical Interview' });

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/multiple applications/i);
    });

    it('returns 200 with the full candidate object and updates the stage (case-insensitive)', async () => {
        prismaMock.candidate.findUnique.mockResolvedValue(fullCandidate);
        prismaMock.application.findMany.mockResolvedValue([applicationWithFlow()]);
        prismaMock.application.update.mockResolvedValue({ id: 12, positionId: 1, currentInterviewStep: 2 });

        const res = await request(app)
            .put('/candidates/1/stage')
            .set('Authorization', recruiterToken)
            .send({ newStage: 'technical interview' });

        expect(res.status).toBe(200);
        expect(prismaMock.application.update).toHaveBeenCalledWith({
            where: { id: 12 },
            data: { currentInterviewStep: 2 },
        });
        expect(res.body.data).toEqual({
            id: 1,
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@gmail.com',
            phone: '1234567890',
            address: '123 Main St',
            applicationId: 12,
            positionId: 1,
            currentInterviewStep: 2,
            currentInterviewStepName: 'Technical Interview',
        });
    });

    it('uses positionId to disambiguate when multiple applications exist', async () => {
        prismaMock.candidate.findUnique.mockResolvedValue(fullCandidate);
        // Service filters by positionId, so only the matching application is returned.
        prismaMock.application.findMany.mockResolvedValue([applicationWithFlow({ id: 13, positionId: 2 })]);
        prismaMock.application.update.mockResolvedValue({ id: 13, positionId: 2, currentInterviewStep: 3 });

        const res = await request(app)
            .put('/candidates/1/stage')
            .set('Authorization', recruiterToken)
            .send({ newStage: 'Manager Interview', positionId: 2 });

        expect(res.status).toBe(200);
        expect(prismaMock.application.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ where: { candidateId: 1, positionId: 2 } }),
        );
        expect(res.body.data.applicationId).toBe(13);
    });
});
