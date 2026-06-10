import jwt from 'jsonwebtoken';

process.env.JWT_SECRET = 'test-secret';

import { authenticate, authorize } from '../presentation/middleware/authMiddleware';

const mockRes = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const sign = (payload: any, secret = 'test-secret') => `Bearer ${jwt.sign(payload, secret)}`;

describe('authenticate', () => {
    it('rejects requests without an Authorization header', () => {
        const req: any = { headers: {} };
        const res = mockRes();
        const next = jest.fn();

        authenticate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('rejects malformed (non-JWT) tokens', () => {
        const req: any = { headers: { authorization: 'Bearer not-a-valid-token' } };
        const res = mockRes();
        const next = jest.fn();

        authenticate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('rejects tokens signed with the wrong secret (forged/tampered)', () => {
        const req: any = {
            headers: { authorization: sign({ userId: 1, role: 'admin' }, 'attacker-secret') },
        };
        const res = mockRes();
        const next = jest.fn();

        authenticate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('attaches req.user and calls next for a valid signed token', () => {
        const req: any = { headers: { authorization: sign({ userId: 7, role: 'admin' }) } };
        const res = mockRes();
        const next = jest.fn();

        authenticate(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.user).toEqual({ userId: 7, role: 'admin' });
    });
});

describe('authorize', () => {
    it('returns 403 when the role is not allowed', () => {
        const req: any = { user: { userId: 1, role: 'interviewer' } };
        const res = mockRes();
        const next = jest.fn();

        authorize('recruiter', 'admin')(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    it('calls next when the role is allowed', () => {
        const req: any = { user: { userId: 1, role: 'recruiter' } };
        const res = mockRes();
        const next = jest.fn();

        authorize('recruiter', 'admin')(req, res, next);

        expect(next).toHaveBeenCalled();
    });
});
