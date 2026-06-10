import request from 'supertest';
import { buildTestApp, bearer } from './testApp';

const recruiterToken = bearer({ userId: 1, role: 'recruiter' });

describe('GET /positions/:id/candidates', () => {
    let prismaMock: any;
    let app: any;

    beforeEach(() => {
        prismaMock = {
            position: { findUnique: jest.fn() },
            application: { findMany: jest.fn() },
            interview: { findMany: jest.fn() },
        };
        app = buildTestApp(prismaMock);
    });

    it('returns 401 when no auth token is provided', async () => {
        const res = await request(app).get('/positions/1/candidates');
        expect(res.status).toBe(401);
    });

    it('returns 400 for an invalid (non-numeric) id', async () => {
        const res = await request(app)
            .get('/positions/abc/candidates')
            .set('Authorization', recruiterToken);
        expect(res.status).toBe(400);
    });

    it('returns 404 when the position does not exist', async () => {
        prismaMock.position.findUnique.mockResolvedValue(null);

        const res = await request(app)
            .get('/positions/999/candidates')
            .set('Authorization', recruiterToken);

        expect(res.status).toBe(404);
        expect(prismaMock.application.findMany).not.toHaveBeenCalled();
    });

    it('returns 200 with step id + name and a per-candidate average', async () => {
        prismaMock.position.findUnique.mockResolvedValue({ id: 1 });
        prismaMock.application.findMany.mockResolvedValue([
            {
                id: 12,
                candidateId: 1,
                candidate: { firstName: 'John', lastName: 'Doe' },
                interviewStep: { id: 2, name: 'Technical Interview' },
            },
            {
                id: 14,
                candidateId: 3,
                candidate: { firstName: 'Carlos', lastName: 'García' },
                interviewStep: { id: 1, name: 'Initial Screening' },
            },
        ]);
        // Candidate 1 has scores 5 and 4; candidate 3 has none.
        prismaMock.interview.findMany.mockResolvedValue([
            { score: 5, application: { candidateId: 1 } },
            { score: 4, application: { candidateId: 1 } },
        ]);

        const res = await request(app)
            .get('/positions/1/candidates')
            .set('Authorization', recruiterToken);

        expect(res.status).toBe(200);
        expect(res.body).toEqual([
            {
                candidateId: 1,
                applicationId: 12,
                fullName: 'John Doe',
                currentInterviewStep: 2,
                currentInterviewStepName: 'Technical Interview',
                averageScore: 4.5,
            },
            {
                candidateId: 3,
                applicationId: 14,
                fullName: 'Carlos García',
                currentInterviewStep: 1,
                currentInterviewStepName: 'Initial Screening',
                averageScore: null,
            },
        ]);
    });

    it('averages across ALL of a candidate\'s applications, not just this position', async () => {
        // The candidate appears in position 1 once, but has interview scores from
        // applications to other positions too. The average must include them.
        prismaMock.position.findUnique.mockResolvedValue({ id: 1 });
        prismaMock.application.findMany.mockResolvedValue([
            {
                id: 12,
                candidateId: 1,
                candidate: { firstName: 'John', lastName: 'Doe' },
                interviewStep: { id: 2, name: 'Technical Interview' },
            },
        ]);
        // Scores: 2 from this position's application + 8 from another application.
        prismaMock.interview.findMany.mockResolvedValue([
            { score: 2, application: { candidateId: 1 } },
            { score: 8, application: { candidateId: 1 } },
        ]);

        const res = await request(app)
            .get('/positions/1/candidates')
            .set('Authorization', recruiterToken);

        expect(res.status).toBe(200);
        expect(res.body[0].averageScore).toBe(5); // (2 + 8) / 2, candidate-wide
        // The score query must filter by candidateId, not by positionId.
        expect(prismaMock.interview.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    application: { candidateId: { in: [1] } },
                }),
            }),
        );
    });

    it('rounds the average to two decimals', async () => {
        prismaMock.position.findUnique.mockResolvedValue({ id: 1 });
        prismaMock.application.findMany.mockResolvedValue([
            {
                id: 12,
                candidateId: 1,
                candidate: { firstName: 'John', lastName: 'Doe' },
                interviewStep: { id: 2, name: 'Technical Interview' },
            },
        ]);
        // 5, 4, 4 -> 4.333... -> 4.33
        prismaMock.interview.findMany.mockResolvedValue([
            { score: 5, application: { candidateId: 1 } },
            { score: 4, application: { candidateId: 1 } },
            { score: 4, application: { candidateId: 1 } },
        ]);

        const res = await request(app)
            .get('/positions/1/candidates')
            .set('Authorization', recruiterToken);

        expect(res.body[0].averageScore).toBe(4.33);
    });

    it('returns 200 with an empty array when the position has no candidates', async () => {
        prismaMock.position.findUnique.mockResolvedValue({ id: 2 });
        prismaMock.application.findMany.mockResolvedValue([]);

        const res = await request(app)
            .get('/positions/2/candidates')
            .set('Authorization', recruiterToken);

        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
        // No candidates -> no need to query interviews.
        expect(prismaMock.interview.findMany).not.toHaveBeenCalled();
    });
});
