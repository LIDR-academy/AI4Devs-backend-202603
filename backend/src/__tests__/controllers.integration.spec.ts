// ---------------------------------------------------------------------------
// Mock del singleton PrismaClient ANTES de cualquier import de la app
// ---------------------------------------------------------------------------

jest.mock('../infrastructure/database/prismaClient', () => {
    const candidateCreate      = jest.fn();
    const candidateFindUnique  = jest.fn();
    const educationCreateMany  = jest.fn();
    const workExperienceCreateMany = jest.fn();
    const resumeCreate         = jest.fn();
    const applicationFindUnique = jest.fn();
    const applicationUpdate    = jest.fn();
    const interviewStepFindUnique = jest.fn();

    return {
        __esModule: true,
        default: {
            candidate:     { create: candidateCreate, findUnique: candidateFindUnique },
            education:     { createMany: educationCreateMany },
            workExperience: { createMany: workExperienceCreateMany },
            resume:        { create: resumeCreate },
            application:   { findUnique: applicationFindUnique, update: applicationUpdate },
            interviewStep: { findUnique: interviewStepFindUnique },
        },
        __mocks: {
            candidateCreate,
            candidateFindUnique,
            educationCreateMany,
            workExperienceCreateMany,
            resumeCreate,
            applicationFindUnique,
            applicationUpdate,
            interviewStepFindUnique,
        },
    };
});

import request from 'supertest';
import { app } from '../index';

const { __mocks } = jest.requireMock('../infrastructure/database/prismaClient') as any;

beforeEach(() => jest.clearAllMocks());

// ---------------------------------------------------------------------------
// POST /candidates
// NOTA: La ruta usa un handler inline que envía el resultado directamente
//       (sin envelope { message, data }). El error se envía como { message }.
// ---------------------------------------------------------------------------

describe('POST /candidates', () => {
    it('201 — crea candidato con datos mínimos válidos', async () => {
        const saved = { id: 1, firstName: 'Ana', lastName: 'García', email: 'ana@test.com' };
        __mocks.candidateCreate.mockResolvedValue(saved);

        const res = await request(app)
            .post('/candidates')
            .send({ firstName: 'Ana', lastName: 'García', email: 'ana@test.com' });

        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({ id: 1, email: 'ana@test.com' });
    });

    it('400 — nombre con números → "Invalid name"', async () => {
        const res = await request(app)
            .post('/candidates')
            .send({ firstName: '1nv4lid', lastName: 'García', email: 'ana@test.com' });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Invalid name');
        expect(__mocks.candidateCreate).not.toHaveBeenCalled();
    });

    it('400 — email sin @ → "Invalid email"', async () => {
        const res = await request(app)
            .post('/candidates')
            .send({ firstName: 'Ana', lastName: 'García', email: 'no-es-email' });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Invalid email');
    });

    it('400 — teléfono con formato internacional → "Invalid phone"', async () => {
        const res = await request(app)
            .post('/candidates')
            .send({ firstName: 'Ana', lastName: 'García', email: 'ana@test.com', phone: '+34612345678' });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Invalid phone');
    });

    it('400 — email duplicado (P2002) → "The email already exists in the database"', async () => {
        __mocks.candidateCreate.mockRejectedValue({ code: 'P2002' });

        const res = await request(app)
            .post('/candidates')
            .send({ firstName: 'Ana', lastName: 'García', email: 'duplicado@test.com' });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('The email already exists in the database');
    });

    it('201 — candidato con educación válida', async () => {
        const saved = { id: 2, firstName: 'Ana', lastName: 'García', email: 'ana@test.com' };
        __mocks.candidateCreate.mockResolvedValue(saved);
        __mocks.educationCreateMany.mockResolvedValue({ count: 1 });

        const res = await request(app)
            .post('/candidates')
            .send({
                firstName: 'Ana', lastName: 'García', email: 'ana@test.com',
                educations: [{ institution: 'UCM', title: 'Informática', startDate: '2018-09-01' }],
            });

        expect(res.status).toBe(201);
        expect(__mocks.educationCreateMany).toHaveBeenCalledTimes(1);
    });

    it('400 — educación con institution vacía → "Invalid institution"', async () => {
        const res = await request(app)
            .post('/candidates')
            .send({
                firstName: 'Ana', lastName: 'García', email: 'ana@test.com',
                educations: [{ institution: '', title: 'Informática', startDate: '2018-09-01' }],
            });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Invalid institution');
    });

    it('400 — cv con filePath pero sin fileType → "Invalid CV data"', async () => {
        __mocks.candidateCreate.mockResolvedValue({ id: 3, firstName: 'Ana', lastName: 'García', email: 'ana@test.com' });

        const res = await request(app)
            .post('/candidates')
            .send({
                firstName: 'Ana', lastName: 'García', email: 'ana@test.com',
                cv: { filePath: '/uploads/cv.pdf' },
            });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Invalid CV data');
    });
});

// ---------------------------------------------------------------------------
// GET /candidates/:id
// ---------------------------------------------------------------------------

describe('GET /candidates/:id', () => {
    it('200 — devuelve el candidato cuando existe', async () => {
        const candidateData = {
            id: 1,
            firstName: 'Ana', lastName: 'García', email: 'ana@test.com',
            education: [], workExperience: [], resumes: [], applications: [],
        };
        __mocks.candidateFindUnique.mockResolvedValue(candidateData);

        const res = await request(app).get('/candidates/1');

        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ id: 1, email: 'ana@test.com' });
    });

    it('404 — candidato no encontrado', async () => {
        __mocks.candidateFindUnique.mockResolvedValue(null);

        const res = await request(app).get('/candidates/999');

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error');
    });

    it('400 — id no numérico', async () => {
        const res = await request(app).get('/candidates/abc');

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Invalid ID format');
    });
});

// ---------------------------------------------------------------------------
// POST /candidates/:id/stage
// ---------------------------------------------------------------------------

describe('POST /candidates/:id/stage', () => {
    const updatedApp = { id: 1, candidateId: 2, positionId: 4, currentInterviewStep: 3 };

    it('200 — actualiza la fase correctamente', async () => {
        __mocks.applicationFindUnique.mockResolvedValue({ id: 1 });
        __mocks.interviewStepFindUnique.mockResolvedValue({ id: 3 });
        __mocks.applicationUpdate.mockResolvedValue(updatedApp);

        const res = await request(app)
            .post('/candidates/1/stage')
            .send({ currentInterviewStep: 3 });

        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ message: 'Stage updated successfully', data: updatedApp });
    });

    it('404 — candidatura no encontrada', async () => {
        __mocks.applicationFindUnique.mockResolvedValue(null);

        const res = await request(app)
            .post('/candidates/999/stage')
            .send({ currentInterviewStep: 1 });

        expect(res.status).toBe(404);
        expect(res.body.error).toBe('Application not found');
    });

    it('400 — interview step no encontrado', async () => {
        __mocks.applicationFindUnique.mockResolvedValue({ id: 1 });
        __mocks.interviewStepFindUnique.mockResolvedValue(null);

        const res = await request(app)
            .post('/candidates/1/stage')
            .send({ currentInterviewStep: 999 });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Interview step not found');
    });

    it('400 — currentInterviewStep no numérico', async () => {
        const res = await request(app)
            .post('/candidates/1/stage')
            .send({ currentInterviewStep: 'abc' });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Invalid ID format');
    });
});
