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

describe('GET /positions/:id/candidates', () => {
    it('returns 200 with candidate list', async () => {
        prismaMock.position.findUnique.mockResolvedValue({ id: 1 } as any);
        prismaMock.application.findMany.mockResolvedValue([
            {
                id: 10,
                candidateId: 1,
                positionId: 1,
                applicationDate: new Date(),
                currentInterviewStep: 2,
                notes: null,
                candidate: { id: 1, firstName: 'John', lastName: 'Doe' },
                interviewStep: { id: 2, name: 'Technical Interview' },
                interviews: [{ score: 8 }, { score: 6 }],
            },
        ] as any);

        const res = await request(app).get('/positions/1/candidates');

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0].fullName).toBe('John Doe');
        expect(res.body[0].currentInterviewStep).toEqual({ id: 2, name: 'Technical Interview' });
        expect(res.body[0].averageScore).toBe(7);
    });

    it('returns 200 with empty array when no applications', async () => {
        prismaMock.position.findUnique.mockResolvedValue({ id: 2 } as any);
        prismaMock.application.findMany.mockResolvedValue([] as any);

        const res = await request(app).get('/positions/2/candidates');

        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });

    it('returns 404 when position does not exist', async () => {
        prismaMock.position.findUnique.mockResolvedValue(null);

        const res = await request(app).get('/positions/999/candidates');

        expect(res.status).toBe(404);
        expect(res.body.error).toBe('Position not found');
    });

    it('returns 400 for invalid id', async () => {
        const res = await request(app).get('/positions/abc/candidates');

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Invalid position ID');
    });
});
