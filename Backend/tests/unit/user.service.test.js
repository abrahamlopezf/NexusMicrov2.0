const UserService = require('../../src/services/User.service');
const db = require('../../src/models');

jest.mock('../../src/models', () => ({
    User: {
        create: jest.fn(),
        findOne: jest.fn(),
        findByPk: jest.fn(),
        findAll: jest.fn()
    }
}));

describe('User Service', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('createUser', () => {
        it('should create a valid user', async () => {
            const userData = { email: 'test@example.com', password: 'password123' };
            db.User.create.mockResolvedValue({ id: 1, ...userData });
            
            const result = await UserService.createUser(userData);
            expect(db.User.create).toHaveBeenCalledWith(userData);
            expect(result.id).toBe(1);
        });
    });

    describe('authenticate', () => {
        it('should authenticate a valid active user', async () => {
            const mockUser = { id: 1, email: 'test@test.com', password: 'password', active: true, save: jest.fn() };
            db.User.findOne.mockResolvedValue(mockUser);

            const result = await UserService.authenticate('test@test.com', 'password');
            expect(result).toBeDefined();
            expect(mockUser.save).toHaveBeenCalled();
        });

        it('should throw error for invalid email', async () => {
            db.User.findOne.mockResolvedValue(null);
            await expect(UserService.authenticate('wrong@test.com', 'pw')).rejects.toThrow('Invalid credentials');
        });

        it('should throw error for invalid password', async () => {
            db.User.findOne.mockResolvedValue({ email: 'test@test.com', password: 'realpassword' });
            await expect(UserService.authenticate('test@test.com', 'wrongpassword')).rejects.toThrow('Invalid credentials');
        });

        it('should throw error if user is inactive', async () => {
            db.User.findOne.mockResolvedValue({ email: 'test@test.com', password: 'pw', active: false });
            await expect(UserService.authenticate('test@test.com', 'pw')).rejects.toThrow('User is inactive');
        });
    });

    describe('getUserById', () => {
        it('should return user without password', async () => {
            db.User.findByPk.mockResolvedValue({ id: 1, email: 'test@test.com' });
            const result = await UserService.getUserById(1);
            expect(result.id).toBe(1);
        });

        it('should throw error if not found', async () => {
            db.User.findByPk.mockResolvedValue(null);
            await expect(UserService.getUserById(99)).rejects.toThrow('User not found');
        });
    });
});
