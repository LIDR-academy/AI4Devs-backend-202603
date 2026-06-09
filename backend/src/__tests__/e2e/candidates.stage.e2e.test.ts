import request from 'supertest';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

jest.mock('../../infrastructure/prismaClient', () => ({
    __esModule: true,
    default: mockDeep<PrismaClient>(),
}));

import prisma from '../../infrastructure/prismaClient';
import { app } from '../../index';

const prismaMock = prisma as DeepMockProxy<PrismaClient>;

const mockCandidate = { id: 1, firstName: 'John', lastName: 'Doe' } as any;
const mockApplication = {
    id: 10,
    candidateId: 1,
    positionId: 5,
    currentInterviewStep: 1,
    position: { interviewFlowId: 3 },
} as any;
const mockStep = { id: 2, name: 'Technical Interview', interviewFlowId: 3 } as any;

describe('PUT /candidates/:id/stage', () => {
    it('returns 200 when stage updated successfully', async () => {
        prismaMock.candidate.findUnique.mockResolvedValue(mockCandidate);
        prismaMock.application.findFirst.mockResolvedValue(mockApplication);
        prismaMock.interviewStep.findFirst.mockResolvedValue(mockStep);
        prismaMock.application.update.mockResolvedValue({
            ...mockApplication,
            currentInterviewStep: 2,
            interviewStep: { id: 2, name: 'Technical Interview' },
        } as any);

        const res = await request(app)
            .put('/candidates/1/stage')
            .send({ applicationId: 10, currentInterviewStep: 2 });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Stage updated successfully');
        expect(res.body.data).toBeDefined();
    });

    it('returns 404 when candidate not found', async () => {
        prismaMock.candidate.findUnique.mockResolvedValue(null);

        const res = await request(app)
            .put('/candidates/999/stage')
            .send({ applicationId: 10, currentInterviewStep: 2 });

        expect(res.status).toBe(404);
        expect(res.body.error).toBe('Candidate not found');
    });

    it('returns 404 when application does not belong to candidate', async () => {
        prismaMock.candidate.findUnique.mockResolvedValue(mockCandidate);
        prismaMock.application.findFirst.mockResolvedValue(null);

        const res = await request(app)
            .put('/candidates/1/stage')
            .send({ applicationId: 99, currentInterviewStep: 2 });

        expect(res.status).toBe(404);
        expect(res.body.error).toBe('Application not found or does not belong to this candidate');
    });

    it('returns 400 when interview step does not belong to position flow', async () => {
        prismaMock.candidate.findUnique.mockResolvedValue(mockCandidate);
        prismaMock.application.findFirst.mockResolvedValue(mockApplication);
        prismaMock.interviewStep.findFirst.mockResolvedValue(null);

        const res = await request(app)
            .put('/candidates/1/stage')
            .send({ applicationId: 10, currentInterviewStep: 99 });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain("does not belong to this position's interview flow");
    });

    it('returns 400 when body is missing required fields', async () => {
        const res = await request(app)
            .put('/candidates/1/stage')
            .send({});

        expect(res.status).toBe(400);
        expect(res.body.error).toBeDefined();
    });

    it('returns 400 for invalid candidate id', async () => {
        const res = await request(app)
            .put('/candidates/abc/stage')
            .send({ applicationId: 10, currentInterviewStep: 2 });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Invalid candidate ID');
    });
});
