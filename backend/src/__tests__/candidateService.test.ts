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

    it('[mutation M17+M16] educationCreateMany recibe candidateId del candidato creado y startDate como Date', async () => {
        // Detecta mutaciones:
        //   M16 — candidateId: 0 hardcoded en vez de created.id
        //   M17 — startDate: string en vez de new Date(edu.startDate)
        const created = { id: 42, firstName: 'Ana', lastName: 'García', email: 'ana@test.com' };
        __mocks.candidateCreate.mockResolvedValue(created);
        __mocks.educationCreateMany.mockResolvedValue({ count: 1 });

        await addCandidate({
            firstName: 'Ana', lastName: 'García', email: 'ana@test.com',
            educations: [{ institution: 'UCM', title: 'Informática', startDate: '2018-09-01' }],
        });

        expect(__mocks.educationCreateMany).toHaveBeenCalledWith({
            data: [expect.objectContaining({
                candidateId: 42,
                startDate:   expect.any(Date),
            })],
        });
    });

    it('[mutation M17] endDate también se convierte a Date cuando está presente', async () => {
        const created = { id: 5, firstName: 'Ana', lastName: 'García', email: 'a@b.com' };
        __mocks.candidateCreate.mockResolvedValue(created);
        __mocks.educationCreateMany.mockResolvedValue({ count: 1 });

        await addCandidate({
            firstName: 'Ana', lastName: 'García', email: 'a@b.com',
            educations: [{
                institution: 'UCM', title: 'CS',
                startDate: '2018-09-01', endDate: '2022-06-30',
            }],
        });

        expect(__mocks.educationCreateMany).toHaveBeenCalledWith({
            data: [expect.objectContaining({
                endDate: expect.any(Date),
            })],
        });
    });

    it('[mutation M15] endDate null se preserva como null cuando no está presente', async () => {
        const created = { id: 6, firstName: 'Ana', lastName: 'García', email: 'c@d.com' };
        __mocks.candidateCreate.mockResolvedValue(created);
        __mocks.educationCreateMany.mockResolvedValue({ count: 1 });

        await addCandidate({
            firstName: 'Ana', lastName: 'García', email: 'c@d.com',
            educations: [{ institution: 'UCM', title: 'CS', startDate: '2018-09-01' }],
        });

        expect(__mocks.educationCreateMany).toHaveBeenCalledWith({
            data: [expect.objectContaining({ endDate: null })],
        });
    });

    it('[mutation M17] workExperienceCreateMany recibe startDate como Date', async () => {
        const created = { id: 7, firstName: 'Ana', lastName: 'García', email: 'e@f.com' };
        __mocks.candidateCreate.mockResolvedValue(created);
        __mocks.workExperienceCreateMany.mockResolvedValue({ count: 1 });

        await addCandidate({
            firstName: 'Ana', lastName: 'García', email: 'e@f.com',
            workExperiences: [{
                company: 'Acme', position: 'Dev',
                startDate: '2020-01-01', endDate: '2023-12-31',
            }],
        });

        expect(__mocks.workExperienceCreateMany).toHaveBeenCalledWith({
            data: [expect.objectContaining({
                candidateId: 7,
                startDate:   expect.any(Date),
                endDate:     expect.any(Date),
            })],
        });
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
