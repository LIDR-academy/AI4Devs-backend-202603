import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

/**
 * Authenticated user attached to the request by the `authenticate` middleware.
 */
export interface AuthUser {
    userId: number;
    role: string;
}

/**
 * Secret used to verify JWT signatures. Read lazily so tests/deployments can set
 * `JWT_SECRET` in the environment before requests are handled. The insecure
 * development fallback should never be relied on in production.
 */
const getJwtSecret = (): string => process.env.JWT_SECRET || 'dev-secret-change-me';

// Extend the Express Request to carry the authenticated user, mirroring how
// `req.prisma` is declared in index.ts.
declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Express {
        interface Request {
            user?: AuthUser;
        }
    }
}

/**
 * JWT authentication middleware.
 *
 * Expects a signed JSON Web Token:
 *
 *   Authorization: Bearer <jwt signed with JWT_SECRET, payload { userId, role }>
 *
 * The signature is verified against `JWT_SECRET`, so forged/tampered tokens are
 * rejected. On success the decoded `{ userId, role }` is attached to `req.user`.
 */
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const token = header.slice('Bearer '.length).trim();

    try {
        const decoded = jwt.verify(token, getJwtSecret());

        if (
            typeof decoded !== 'object' ||
            decoded === null ||
            typeof (decoded as jwt.JwtPayload).role !== 'string' ||
            typeof (decoded as jwt.JwtPayload).userId !== 'number'
        ) {
            return res.status(401).json({ error: 'Invalid authentication token' });
        }

        const payload = decoded as jwt.JwtPayload;
        req.user = { userId: payload.userId, role: payload.role };
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid authentication token' });
    }
};

/**
 * Role-based authorization middleware factory. Must run after `authenticate`.
 * Returns 403 when the authenticated user's role is not in `allowedRoles`.
 */
export const authorize = (...allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        next();
    };
};
