const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/models');

describe('Auth Endpoints', () => {
    const testUser = {
        name: 'Admin Test',
        email: 'admin@test.com',
        password: 'securepassword123',
        role: 'ADMIN',
        active: true
    };

    beforeAll(async () => {
        // Creamos un usuario de prueba directamente en la DB
        await db.User.create(testUser);
    });

    describe('POST /api/v1/auth/login', () => {
        it('debería hacer login exitosamente y retornar token', async () => {
            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password
                });

            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('token');
            expect(res.body.data.user.email).toBe(testUser.email);
        });

        it('debería fallar con credenciales incorrectas', async () => {
            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: testUser.email,
                    password: 'wrongpassword'
                });

            expect(res.statusCode).toEqual(401);
            expect(res.body.success).toBe(false);
        });
    });
});
