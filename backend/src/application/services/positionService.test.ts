import { getPositionCandidates, POSITION_NOT_FOUND } from './positionService';

// Minimal mocked Prisma client exposing only the methods the service uses.
const createPrismaMock = () => ({
    position: {
        findUnique: jest.fn(),
    },
    application: {
        findMany: jest.fn(),
    },
});

describe('positionService.getPositionCandidates', () => {
    let prisma: ReturnType<typeof createPrismaMock>;

    beforeEach(() => {
        prisma = createPrismaMock();
    });

    it('throws a POSITION_NOT_FOUND error when the position does not exist', async () => {
        prisma.position.findUnique.mockResolvedValue(null);

        await expect(
            getPositionCandidates(prisma as any, 999)
        ).rejects.toMatchObject({ code: POSITION_NOT_FOUND });

        expect(prisma.position.findUnique).toHaveBeenCalledWith(
            expect.objectContaining({ where: { id: 999 } })
        );
        expect(prisma.application.findMany).not.toHaveBeenCalled();
    });

    it('maps applications and computes the average of non-null scores', async () => {
        prisma.position.findUnique.mockResolvedValue({ id: 1 });
        prisma.application.findMany.mockResolvedValue([
            {
                id: 5,
                candidate: { id: 1, firstName: 'John', lastName: 'Doe' },
                interviewStep: { name: 'Technical Interview' },
                interviews: [
                    { score: 4 },
                    { score: 5 },
                    { score: null }, // ignored
                ],
            },
        ]);

        const result = await getPositionCandidates(prisma as any, 1);

        expect(result).toEqual([
            {
                fullName: 'John Doe',
                currentInterviewStep: 'Technical Interview',
                candidateId: 1,
                applicationId: 5,
                averageScore: 4.5,
            },
        ]);
    });

    it('returns averageScore = 0 when there are no scored interviews', async () => {
        prisma.position.findUnique.mockResolvedValue({ id: 1 });
        prisma.application.findMany.mockResolvedValue([
            {
                id: 7,
                candidate: { id: 2, firstName: 'Jane', lastName: 'Roe' },
                interviewStep: { name: 'HR Interview' },
                interviews: [{ score: null }], // no scored interviews
            },
        ]);

        const result = await getPositionCandidates(prisma as any, 1);

        expect(result[0].averageScore).toBe(0);
    });

    it('returns averageScore = 0 when the application has no interviews', async () => {
        prisma.position.findUnique.mockResolvedValue({ id: 1 });
        prisma.application.findMany.mockResolvedValue([
            {
                id: 8,
                candidate: { id: 3, firstName: 'Sam', lastName: 'Smith' },
                interviewStep: { name: 'Initial Screening' },
                interviews: [],
            },
        ]);

        const result = await getPositionCandidates(prisma as any, 1);

        expect(result[0].averageScore).toBe(0);
    });

    it('returns an empty array when the position has no applications', async () => {
        prisma.position.findUnique.mockResolvedValue({ id: 1 });
        prisma.application.findMany.mockResolvedValue([]);

        const result = await getPositionCandidates(prisma as any, 1);

        expect(result).toEqual([]);
    });
});
