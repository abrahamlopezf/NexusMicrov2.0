const { verifyToken } = require('../../../src/utils/jwt');
const auth = require('../../../src/middlewares/auth.middleware');

jest.mock('../../../src/utils/jwt');

describe('Auth Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = { headers: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    it('debería rechazar si no hay token disponible', () => {
        auth(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Access denied. No token provided.' }));
    });

    it('debería rechazar si el token es inválido', () => {
        req.headers.authorization = 'Bearer invalid-token';
        verifyToken.mockImplementation(() => { throw new Error('Invalid signature'); });

        auth(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Invalid or expired token.' }));
    });

    it('debería llamar next si el token es válido', () => {
        req.headers.authorization = 'Bearer valid-token';
        const decoded = { id: 1, role: 'ADMIN' };
        verifyToken.mockReturnValue(decoded);

        auth(req, res, next);

        expect(verifyToken).toHaveBeenCalledWith('valid-token');
        expect(req.user).toEqual(decoded);
        expect(next).toHaveBeenCalled();
    });
});
