const db = require('../../../src/models');
const userService = require('../../../src/services/user.service');

// Mockear el objeto db completo
jest.mock('../../../src/models', () => ({
    User: {
        create: jest.fn(),
        findOne: jest.fn(),
        findByPk: jest.fn(),
        findAll: jest.fn(),
    }
}));

describe('UserService Unit Tests', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('createUser', () => {
        it('debería crear un usuario exitosamente', async () => {
            const mockData = { name: 'Test', email: 'test@example.com' };
            const expectedUser = { id: 1, ...mockData };

            db.User.create.mockResolvedValue(expectedUser);

            const result = await userService.createUser(mockData);

            expect(db.User.create).toHaveBeenCalledWith(mockData);
            expect(result).toEqual(expectedUser);
        });
    });

    describe('authenticate', () => {
        it('debería fallar si el correo no existe', async () => {
            db.User.findOne.mockResolvedValue(null);

            await expect(userService.authenticate('bad@example.com', '123')).rejects.toThrow('Invalid credentials');
        });

        it('debería fallar si la contraseña es incorrecta', async () => {
            const mockUser = { id: 1, email: 'test@example.com', password: 'password123', active: true };
            db.User.findOne.mockResolvedValue(mockUser);

            await expect(userService.authenticate('test@example.com', 'wrongpassword')).rejects.toThrow('Invalid credentials');
        });

        it('debería lanzar error si el usuario está inactivo', async () => {
            const mockUser = { id: 1, email: 'test@example.com', password: 'password123', active: false };
            db.User.findOne.mockResolvedValue(mockUser);

            await expect(userService.authenticate('test@example.com', 'password123')).rejects.toThrow('User is inactive');
        });

        it('debería autenticar exitosamente y actualizar last_login', async () => {
            const mockUser = {
                id: 1,
                email: 'test@example.com',
                password: 'password123',
                active: true,
                save: jest.fn().mockResolvedValue(true)
            };

            db.User.findOne.mockResolvedValue(mockUser);

            const result = await userService.authenticate('test@example.com', 'password123');

            expect(mockUser.save).toHaveBeenCalled();
            expect(result.last_login).toBeDefined();
            expect(result.id).toBe(1);
        });
    });
});
