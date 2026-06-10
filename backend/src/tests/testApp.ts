import express from 'express';
import jwt from 'jsonwebtoken';
import candidateRoutes from '../routes/candidateRoutes';
import positionRoutes from '../routes/positionRoutes';

// Keep a stable secret for the whole test run so signed tokens verify.
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

/**
 * Builds a minimal Express app wired with the real routes/controllers/middleware
 * but a mocked Prisma client injected onto `req.prisma`, mirroring the
 * production middleware in index.ts. Lets us integration-test the full HTTP
 * pipeline without a database and without starting a listening server.
 */
export const buildTestApp = (prismaMock: any) => {
    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
        req.prisma = prismaMock;
        next();
    });
    app.use('/candidates', candidateRoutes);
    app.use('/positions', positionRoutes);
    return app;
};

/** Signs an auth payload into a Bearer JWT using the test secret. */
export const bearer = (payload: { userId: number; role: string }) =>
    `Bearer ${jwt.sign(payload, process.env.JWT_SECRET || 'test-secret')}`;
