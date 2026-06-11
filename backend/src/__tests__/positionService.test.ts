import { calculateAverageScore, getCandidatesByPosition } from '../application/services/positionService';
import { PrismaClient } from '@prisma/client';

jest.mock('@prisma/client', () => {
    const positionFindUnique = jest.fn();
    const applicationFindMany = jest.fn();

    return {
        PrismaClient: jest.fn().mockImplementation(() => ({
            position: { findUnique: positionFindUnique },
            application: { findMany: applicationFindMany },
        })),
        __mocks: { positionFindUnique, applicationFindMany },
    };
});

const { __mocks } = jest.requireMock('@prisma/client') as any;

beforeEach(() => {
    jest.clearAllMocks();
});

describe('calculateAverageScore', () => {
    it('calcula la media de scores no nulos', () => {
        expect(calculateAverageScore([8, 10, null, 6])).toBeCloseTo(8);
    });

    it('devuelve null si todos los scores son nulos', () => {
        expect(calculateAverageScore([null, null])).toBeNull();
    });

    it('devuelve null si el array está vacío', () => {
        expect(calculateAverageScore([])).toBeNull();
    });
});

describe('getCandidatesByPosition', () => {
    it('devuelve candidatos con averageScore calculado correctamente', async () => {
        __mocks.positionFindUnique.mockResolvedValue({ id: 1, title: 'Dev' });
        __mocks.applicationFindMany.mockResolvedValue([
            {
                candidate: { firstName: 'Ana', lastName: 'García' },
                interviewStep: { name: 'Entrevista técnica' },
                interviews: [{ score: 8 }, { score: 10 }],
            },
        ]);

        const result = await getCandidatesByPosition(1);

        expect(result).toEqual([
            { fullName: 'Ana García', currentInterviewStep: 'Entrevista técnica', averageScore: 9 },
        ]);
    });

    it('devuelve array vacío si la posición no tiene candidaturas', async () => {
        __mocks.positionFindUnique.mockResolvedValue({ id: 2, title: 'QA' });
        __mocks.applicationFindMany.mockResolvedValue([]);

        const result = await getCandidatesByPosition(2);
        expect(result).toEqual([]);
    });

    it('devuelve averageScore null si el candidato no tiene scores registrados', async () => {
        __mocks.positionFindUnique.mockResolvedValue({ id: 3, title: 'PM' });
        __mocks.applicationFindMany.mockResolvedValue([
            {
                candidate: { firstName: 'Luis', lastName: 'Pérez' },
                interviewStep: { name: 'Revisión de CV' },
                interviews: [{ score: null }],
            },
        ]);

        const result = await getCandidatesByPosition(3);
        expect(result[0].averageScore).toBeNull();
    });

    it('lanza error si la posición no existe', async () => {
        __mocks.positionFindUnique.mockResolvedValue(null);

        await expect(getCandidatesByPosition(999)).rejects.toThrow('Position not found');
    });
});
