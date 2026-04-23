const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/models');
const { signToken } = require('../../src/utils/jwt');

describe('Sales Integration Flow', () => {
    let token;
    let client;
    let product;

    beforeAll(async () => {
        // 1. Crear admin
        const user = await db.User.create({
            name: 'Admin Sales',
            email: 'admin_sales@test.com',
            password: 'test',
            role: 'ADMIN',
            active: true
        });
        token = signToken({ id: user.id, role: user.role });

        // 2. Crear cliente
        client = await db.Client.create({
            name: 'Cliente Prueba',
            email: 'cliente@prueba.com',
            document_number: '123456789',
            active: true
        });

        // 3. Crear producto
        product = await db.Product.create({
            sku: 'SKU-SALE',
            name: 'Producto para venta',
            base_price: 500,
            requires_production: true,
            active: true
        });

        // Crear el material relacionado
        await db.Material.create({
            id: product.id,
            sku: `MAT-${product.id}`,
            name: product.name,
            stock: 10,
            min_stock: 5,
            type: 'PRODUCTO_TERMINADO',
            unit_cost: 200
        });
    });

    describe('POST /api/v1/sales', () => {
        it('debería simular flujo completo de venta (crear venta y descontar inventario)', async () => {
            const res = await request(app)
                .post('/api/v1/sales')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    client_id: client.id,
                    items: [
                        { productId: product.id, quantity: 2 }
                    ]
                });

            // Validar creación de venta
            expect(res.statusCode).toEqual(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.client_id).toBe(client.id);
            expect(res.body.data.total).toBe(1000); // 2 * 500
            expect(res.body.data.items.length).toBe(1);

            // Validar inventario descontado (Simulando la integración)
            const move = await db.InventoryMovement.findOne({ where: { material_id: product.id } });
            expect(move).toBeDefined();
            expect(move.type).toBe('SALIDA_PRODUCCION');
            expect(move.quantity).toBe(2);
        });
    });

    describe('GET /api/v1/sales', () => {
        it('debería obtener las ventas', async () => {
            const res = await request(app)
                .get('/api/v1/sales')
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.data.length).toBeGreaterThan(0);
        });
    });
});
