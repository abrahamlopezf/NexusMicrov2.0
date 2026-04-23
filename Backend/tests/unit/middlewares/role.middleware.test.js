const authorizeRoles = require('../../../src/middlewares/role.middleware');

describe('Role Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = { user: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        next = jest.fn();
    });

    it('debería rechazar si no hay rol identificado', () => {
        const middleware = authorizeRoles('ADMIN');
        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Forbidden. No role identified.' }));
    });

    it('debería llamar next si el usuario tiene el rol requerido', () => {
        req.user.role = 'ADMIN';
        const middleware = authorizeRoles('ADMIN', 'SUPERADMIN');

        middleware(req, res, next);

        expect(next).toHaveBeenCalled();
    });

    it('debería rechazar con 403 si el usuario no tiene el rol', () => {
        req.user.role = 'USER';
        const middleware = authorizeRoles('ADMIN');

        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Forbidden. Role 'USER' is not authorized to access this resource." }));
    });
});
