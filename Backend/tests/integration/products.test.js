const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/models');
const { signToken } = require('../../src/utils/jwt');

describe('Products Endpoints', () => {
    let token;
    let testProduct;

    beforeAll(async () => {
        // 1. Crear usuario y token para autorización
        const user = await db.User.create({
            name: 'Admin Test',
            email: 'admin_products@test.com',
            password: 'testpassword',
            role: 'ADMIN',
            active: true
        });
        token = signToken({ id: user.id, role: user.role });
    });

    describe('POST /api/v1/products', () => {
        it('debería crear un producto exitosamente', async () => {
            const res = await request(app)
                .post('/api/v1/products')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    sku: 'PROD-001',
                    name: 'Producto de Prueba',
                    description: 'Descripción de prueba',
                    base_price: 100.50,
                    requires_production: false,
                    active: true
                });

            expect(res.statusCode).toEqual(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.sku).toBe('PROD-001');
            testProduct = res.body.data;
        });

        it('debería fallar sin token ruteado', async () => {
            const res = await request(app)
                .post('/api/v1/products')
                .send({
                    sku: 'PROD-002',
                    name: 'Otro Producto',
                    base_price: 50.0
                });

            expect(res.statusCode).toEqual(401);
        });
    });

    describe('GET /api/v1/products', () => {
        it('debería obtener la lista de productos', async () => {
            const res = await request(app)
                .get('/api/v1/products')
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.data.length).toBeGreaterThan(0);
        });
    });
});
