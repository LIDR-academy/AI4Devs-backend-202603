jest.mock('../infrastructure/database/prismaClient', () => {
    const candidateCreate = jest.fn();
    const candidateFindUnique = jest.fn();
    const educationCreateMany = jest.fn();
    const workExperienceCreateMany = jest.fn();
    const resumeCreate = jest.fn();

    return {
        __esModule: true,
        default: {
            candidate: { create: candidateCreate, findUnique: candidateFindUnique },
            education: { createMany: educationCreateMany },
            workExperience: { createMany: workExperienceCreateMany },
            resume: { create: resumeCreate },
        },
        __mocks: { candidateCreate, candidateFindUnique, educationCreateMany, workExperienceCreateMany, resumeCreate },
    };
});

import { addCandidate, findCandidateById } from '../application/services/candidateService';

const { __mocks } = jest.requireMock('../infrastructure/database/prismaClient') as any;

beforeEach(() => jest.clearAllMocks());

describe('addCandidate', () => {
    it('crea un candidato con datos mínimos válidos', async () => {
        const saved = { id: 1, firstName: 'Ana', lastName: 'García', email: 'ana@test.com' };
        __mocks.candidateCreate.mockResolvedValue(saved);

        const result = await addCandidate({ firstName: 'Ana', lastName: 'García', email: 'ana@test.com' });

        expect(result).toEqual(saved);
        expect(__mocks.candidateCreate).toHaveBeenCalledTimes(1);
    });

    it('lanza error si el email ya existe (P2002)', async () => {
        __mocks.candidateCreate.mockRejectedValue({ code: 'P2002' });

        await expect(
            addCandidate({ firstName: 'Ana', lastName: 'García', email: 'duplicado@test.com' })
        ).rejects.toThrow('The email already exists in the database');
    });

    it('lanza error de validación si el nombre contiene números', async () => {
        await expect(
            addCandidate({ firstName: '1nv4lid', lastName: 'García', email: 'ana@test.com' })
        ).rejects.toThrow();

        expect(__mocks.candidateCreate).not.toHaveBeenCalled();
    });

    it('lanza error de validación si el email tiene formato incorrecto', async () => {
        await expect(
            addCandidate({ firstName: 'Ana', lastName: 'García', email: 'no-es-un-email' })
        ).rejects.toThrow();

        expect(__mocks.candidateCreate).not.toHaveBeenCalled();
    });
});

describe('findCandidateById', () => {
    it('devuelve el candidato si existe', async () => {
        const candidateData = {
            id: 1, firstName: 'Ana', lastName: 'García', email: 'ana@test.com',
            educations: [], workExperiences: [], resumes: [], applications: [],
        };
        __mocks.candidateFindUnique.mockResolvedValue(candidateData);

        const result = await findCandidateById(1);
        expect(result).not.toBeNull();
        expect(result?.email).toBe('ana@test.com');
    });

    it('devuelve null si el candidato no existe', async () => {
        __mocks.candidateFindUnique.mockResolvedValue(null);

        const result = await findCandidateById(999);
        expect(result).toBeNull();
    });
});
