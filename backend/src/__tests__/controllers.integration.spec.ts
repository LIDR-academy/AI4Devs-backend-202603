/**
 * Integration tests — HTTP layer (controllers + routes)
 *
 * Prueban la capa HTTP end-to-end desde la petición hasta la respuesta,
 * mockeando únicamente la base de datos (prismaClient singleton).
 *
 * NOTA DE DISEÑO DESCUBIERTA:
 * POST /candidates usa un handler inline en candidateRoutes.ts que llama al
 * servicio directamente, NO usa addCandidateController. Por eso la respuesta
 * 201 es el objeto crudo del candidato (sin envelope { message, data }).
 * addCandidateController existe pero no está cableado a ninguna ruta.
 * Esta inconsistencia con api-spec.yaml queda documentada en los tests.
 */

jest.mock('../infrastructure/database/prismaClient', () => {
    const candidateCreate   = jest.fn();
    const candidateFindUnique = jest.fn();
    const educationCreateMany = jest.fn();
    const workExperienceCreateMany = jest.fn();
    const resumeCreate      = jest.fn();
    const applicationFindUnique = jest.fn();
    const applicationUpdate = jest.fn();
    const interviewStepFindUnique = jest.fn();
    const positionFindUnique = jest.fn();
    const applicationFindMany = jest.fn();

    return {
        __esModule: true,
        default: {
            candidate:     { create: candidateCreate, findUnique: candidateFindUnique },
            education:     { createMany: educationCreateMany },
            workExperience: { createMany: workExperienceCreateMany },
            resume:        { create: resumeCreate },
            application:   { findUnique: applicationFindUnique, update: applicationUpdate, findMany: applicationFindMany },
            interviewStep: { findUnique: interviewStepFindUnique },
            position:      { findUnique: positionFindUnique },
        },
        __mocks: {
            candidateCreate, candidateFindUnique, educationCreateMany,
            workExperienceCreateMany, resumeCreate, applicationFindUnique,
            applicationUpdate, interviewStepFindUnique, positionFindUnique,
            applicationFindMany,
        },
    };
});

import request from 'supertest';
import { app }  from '../index';

const { __mocks } = jest.requireMock('../infrastructure/database/prismaClient') as any;

beforeEach(() => jest.clearAllMocks());

// ---------------------------------------------------------------------------
// GET /
// ---------------------------------------------------------------------------

describe('GET /', () => {
    it('devuelve 200 con texto "Hola LTI!"', async () => {
        const res = await request(app).get('/');
        expect(res.status).toBe(200);
        expect(res.text).toBe('Hola LTI!');
    });
});

// ---------------------------------------------------------------------------
// POST /candidates
// NOTA: el handler usa el servicio directamente — respuesta 201 sin envelope
// ---------------------------------------------------------------------------

describe('POST /candidates', () => {
    const validPayload = {
        firstName: 'Ana',
        lastName: 'García',
        email: 'ana@test.com',
        phone: '612345678',
    };

    it('201 con el candidato creado (sin envelope { message, data })', async () => {
        const created = { id: 1, firstName: 'Ana', lastName: 'García', email: 'ana@test.com' };
        __mocks.candidateCreate.mockResolvedValue(created);

        const res = await request(app).post('/candidates').send(validPayload);

        expect(res.status).toBe(201);
        expect(res.body).toEqual(created);
        expect(res.body).not.toHaveProperty('message'); // sin envelope
    });

    it('400 cuando el email tiene formato inválido', async () => {
        const res = await request(app)
            .post('/candidates')
            .send({ ...validPayload, email: 'no-es-email' });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('message');
        expect(__mocks.candidateCreate).not.toHaveBeenCalled();
    });

    it('400 cuando el nombre contiene números', async () => {
        const res = await request(app)
            .post('/candidates')
            .send({ ...validPayload, firstName: '4na' });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Invalid name');
    });

    it('400 cuando el teléfono no cumple el formato español', async () => {
        const res = await request(app)
            .post('/candidates')
            .send({ ...validPayload, phone: '512345678' }); // empieza en 5

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Invalid phone');
    });

    it('400 cuando el email ya existe en BD (P2002)', async () => {
        __mocks.candidateCreate.mockRejectedValue({ code: 'P2002' });

        const res = await request(app).post('/candidates').send(validPayload);

        expect(res.status).toBe(400);
        expect(res.body.message).toContain('email already exists');
    });

    it('400 cuando firstName está ausente', async () => {
        const { firstName: _, ...withoutName } = validPayload;
        const res = await request(app).post('/candidates').send(withoutName);

        expect(res.status).toBe(400);
    });

    it('400 cuando se envía education con institution vacía', async () => {
        const res = await request(app).post('/candidates').send({
            ...validPayload,
            educations: [{ institution: '', title: 'CS', startDate: '2020-01-01' }],
        });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Invalid institution');
    });

    it('201 sin crear resume si cv es objeto vacío', async () => {
        const created = { id: 2, firstName: 'Ana', lastName: 'García', email: 'b@test.com' };
        __mocks.candidateCreate.mockResolvedValue(created);

        const res = await request(app)
            .post('/candidates')
            .send({ ...validPayload, email: 'b@test.com', cv: {} });

        expect(res.status).toBe(201);
        expect(__mocks.resumeCreate).not.toHaveBeenCalled();
    });

    it('201 y crea resume cuando cv tiene filePath y fileType', async () => {
        const created = { id: 3, firstName: 'Ana', lastName: 'García', email: 'c@test.com' };
        __mocks.candidateCreate.mockResolvedValue(created);
        __mocks.resumeCreate.mockResolvedValue({});

        const res = await request(app).post('/candidates').send({
            ...validPayload,
            email: 'c@test.com',
            cv: { filePath: 'uploads/cv.pdf', fileType: 'application/pdf' },
        });

        expect(res.status).toBe(201);
        expect(__mocks.resumeCreate).toHaveBeenCalledTimes(1);
    });
});

// ---------------------------------------------------------------------------
// GET /candidates/:id
// ---------------------------------------------------------------------------

describe('GET /candidates/:id', () => {
    const fullCandidate = {
        id: 1, firstName: 'Ana', lastName: 'García', email: 'ana@test.com',
        educations: [], workExperiences: [], resumes: [], applications: [],
    };

    it('200 con el candidato cuando existe', async () => {
        __mocks.candidateFindUnique.mockResolvedValue(fullCandidate);

        const res = await request(app).get('/candidates/1');

        expect(res.status).toBe(200);
        expect(res.body.email).toBe('ana@test.com');
        // NOTA: Candidate model almacena como 'education' y 'workExperience' (singular)
        // aunque Prisma devuelve 'educations' y 'workExperiences'. Inconsistencia de naming.
        expect(res.body).toHaveProperty('education');
        expect(res.body).toHaveProperty('workExperience');
        expect(res.body).toHaveProperty('resumes');
        expect(res.body).toHaveProperty('applications');
    });

    it('404 cuando el candidato no existe', async () => {
        __mocks.candidateFindUnique.mockResolvedValue(null);

        const res = await request(app).get('/candidates/999');

        expect(res.status).toBe(404);
        expect(res.body).toEqual({ error: 'Candidate not found' });
    });

    it('400 cuando el id no es numérico', async () => {
        const res = await request(app).get('/candidates/abc');

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: 'Invalid ID format' });
    });
});

// ---------------------------------------------------------------------------
// POST /candidates/:id/stage
// ---------------------------------------------------------------------------

describe('POST /candidates/:id/stage', () => {
    it('200 con mensaje de éxito cuando se actualiza la fase', async () => {
        const application = { id: 1, candidateId: 2, positionId: 3, currentInterviewStep: 2 };
        const step        = { id: 2, name: 'Técnica' };
        const updated     = { ...application, currentInterviewStep: 2 };

        __mocks.applicationFindUnique.mockResolvedValue(application);
        __mocks.interviewStepFindUnique.mockResolvedValue(step);
        __mocks.applicationUpdate.mockResolvedValue(updated);

        const res = await request(app)
            .post('/candidates/1/stage')
            .send({ currentInterviewStep: 2 });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Stage updated successfully');
        expect(res.body).toHaveProperty('data');
    });

    it('404 cuando la candidatura no existe', async () => {
        __mocks.applicationFindUnique.mockResolvedValue(null);

        const res = await request(app)
            .post('/candidates/999/stage')
            .send({ currentInterviewStep: 1 });

        expect(res.status).toBe(404);
        expect(res.body).toEqual({ error: 'Application not found' });
    });

    it('400 cuando el interviewStep no existe', async () => {
        __mocks.applicationFindUnique.mockResolvedValue({ id: 1 });
        __mocks.interviewStepFindUnique.mockResolvedValue(null);

        const res = await request(app)
            .post('/candidates/1/stage')
            .send({ currentInterviewStep: 99 });

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: 'Interview step not found' });
    });

    it('400 cuando el id de la candidatura no es numérico', async () => {
        const res = await request(app)
            .post('/candidates/abc/stage')
            .send({ currentInterviewStep: 1 });

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: 'Invalid ID format' });
    });
});

// ---------------------------------------------------------------------------
// GET /positions/:id/candidates
// ---------------------------------------------------------------------------

describe('GET /positions/:id/candidates', () => {
    it('200 con array de candidatos en proceso', async () => {
        __mocks.positionFindUnique.mockResolvedValue({ id: 1, title: 'Dev' });
        __mocks.applicationFindMany.mockResolvedValue([
            {
                candidate: { firstName: 'Ana', lastName: 'García' },
                interviewStep: { name: 'Técnica' },
                interviews: [{ score: 8 }, { score: 9 }],
            },
        ]);

        const res = await request(app).get('/positions/1/candidates');

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body[0]).toHaveProperty('fullName');
        expect(res.body[0]).toHaveProperty('currentInterviewStep');
        expect(res.body[0]).toHaveProperty('averageScore');
    });

    it('200 con array vacío si la posición no tiene candidaturas', async () => {
        __mocks.positionFindUnique.mockResolvedValue({ id: 1, title: 'Dev' });
        __mocks.applicationFindMany.mockResolvedValue([]);

        const res = await request(app).get('/positions/1/candidates');

        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });

    it('404 cuando la posición no existe', async () => {
        __mocks.positionFindUnique.mockResolvedValue(null);

        const res = await request(app).get('/positions/999/candidates');

        expect(res.status).toBe(404);
        expect(res.body).toEqual({ error: 'Position not found' });
    });

    it('400 cuando el id no es numérico', async () => {
        const res = await request(app).get('/positions/abc/candidates');

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: 'Invalid ID format' });
    });
});
