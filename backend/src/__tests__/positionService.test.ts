jest.mock('../infrastructure/database/prismaClient', () => {
    const positionFindUnique  = jest.fn();
    const applicationFindMany = jest.fn();

    return {
        __esModule: true,
        default: {
            position:    { findUnique: positionFindUnique },
            application: { findMany: applicationFindMany },
        },
        __mocks: { positionFindUnique, applicationFindMany },
    };
});

import { calculateAverageScore, getCandidatesByPosition } from '../application/services/positionService';

const { __mocks } = jest.requireMock('../infrastructure/database/prismaClient') as any;

beforeEach(() => jest.clearAllMocks());

// ---------------------------------------------------------------------------
// calculateAverageScore — lógica pura, sin BD
// ---------------------------------------------------------------------------

describe('calculateAverageScore', () => {
    it('calcula la media ignorando valores null', () => {
        expect(calculateAverageScore([8, 10, null, 6])).toBeCloseTo(8);
    });

    it('devuelve null si todos los scores son null', () => {
        expect(calculateAverageScore([null, null])).toBeNull();
    });

    it('devuelve null si el array está vacío', () => {
        expect(calculateAverageScore([])).toBeNull();
    });

    it('devuelve 0 si todos los scores válidos son 0 (0 ≠ null)', () => {
        // Regla de negocio: score = 0 es una puntuación válida, no un valor ausente
        expect(calculateAverageScore([0, 0])).toBe(0);
    });

    it('devuelve el único valor si solo hay un score válido', () => {
        expect(calculateAverageScore([null, 7, null])).toBe(7);
    });
});

// ---------------------------------------------------------------------------
// getCandidatesByPosition — flujo completo con BD mockeada
// ---------------------------------------------------------------------------

describe('getCandidatesByPosition', () => {
    it('devuelve candidatos con fullName, currentInterviewStep y averageScore (api-spec)', async () => {
        __mocks.positionFindUnique.mockResolvedValue({ id: 1, title: 'Dev' });
        __mocks.applicationFindMany.mockResolvedValue([
            {
                candidate:     { firstName: 'Ana', lastName: 'García' },
                interviewStep: { name: 'Entrevista técnica' },
                interviews:    [{ score: 8 }, { score: 10 }],
            },
        ]);

        const result = await getCandidatesByPosition(1);

        expect(result).toEqual([
            { fullName: 'Ana García', currentInterviewStep: 'Entrevista técnica', averageScore: 9 },
        ]);
    });

    it('construye fullName como "firstName lastName" separados por espacio', async () => {
        __mocks.positionFindUnique.mockResolvedValue({ id: 1 });
        __mocks.applicationFindMany.mockResolvedValue([
            {
                candidate:     { firstName: 'José', lastName: 'Martínez López' },
                interviewStep: { name: 'HR' },
                interviews:    [],
            },
        ]);

        const result = await getCandidatesByPosition(1);

        expect(result[0].fullName).toBe('José Martínez López');
    });

    it('devuelve array vacío si la posición no tiene candidaturas activas', async () => {
        __mocks.positionFindUnique.mockResolvedValue({ id: 2, title: 'QA' });
        __mocks.applicationFindMany.mockResolvedValue([]);

        const result = await getCandidatesByPosition(2);

        expect(result).toEqual([]);
    });

    it('devuelve averageScore null cuando todas las entrevistas tienen score null', async () => {
        __mocks.positionFindUnique.mockResolvedValue({ id: 3 });
        __mocks.applicationFindMany.mockResolvedValue([
            {
                candidate:     { firstName: 'Luis', lastName: 'Pérez' },
                interviewStep: { name: 'Revisión de CV' },
                interviews:    [{ score: null }],
            },
        ]);

        const result = await getCandidatesByPosition(3);

        expect(result[0].averageScore).toBeNull();
    });

    it('devuelve averageScore null cuando el candidato no tiene entrevistas registradas', async () => {
        __mocks.positionFindUnique.mockResolvedValue({ id: 4 });
        __mocks.applicationFindMany.mockResolvedValue([
            {
                candidate:     { firstName: 'Marta', lastName: 'Ruiz' },
                interviewStep: { name: 'Técnica' },
                interviews:    [],
            },
        ]);

        const result = await getCandidatesByPosition(4);

        expect(result[0].averageScore).toBeNull();
    });

    it('devuelve múltiples candidatos correctamente mapeados', async () => {
        __mocks.positionFindUnique.mockResolvedValue({ id: 5 });
        __mocks.applicationFindMany.mockResolvedValue([
            {
                candidate:     { firstName: 'Ana', lastName: 'García' },
                interviewStep: { name: 'Técnica' },
                interviews:    [{ score: 8 }, { score: 9 }],
            },
            {
                candidate:     { firstName: 'Luis', lastName: 'Pérez' },
                interviewStep: { name: 'Revisión de CV' },
                interviews:    [],
            },
        ]);

        const result = await getCandidatesByPosition(5);

        expect(result).toHaveLength(2);
        expect(result[0].averageScore).toBeCloseTo(8.5);
        expect(result[1].averageScore).toBeNull();
    });

    it('lanza "Position not found" cuando la posición no existe (→ 404 en controller)', async () => {
        __mocks.positionFindUnique.mockResolvedValue(null);

        await expect(getCandidatesByPosition(999)).rejects.toThrow('Position not found');

        expect(__mocks.applicationFindMany).not.toHaveBeenCalled();
    });

    it('no busca candidaturas si la posición no existe', async () => {
        __mocks.positionFindUnique.mockResolvedValue(null);

        await expect(getCandidatesByPosition(999)).rejects.toThrow();

        expect(__mocks.applicationFindMany).not.toHaveBeenCalled();
    });

    it('propaga errores inesperados de Prisma sin envolverlos', async () => {
        __mocks.positionFindUnique.mockRejectedValue(new Error('Timeout'));

        await expect(getCandidatesByPosition(1)).rejects.toThrow('Timeout');
    });
});
