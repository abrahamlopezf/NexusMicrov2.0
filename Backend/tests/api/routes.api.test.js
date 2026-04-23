// tests/api/routes.api.test.js
const request = require('supertest');
const app = require('../../src/app');

describe('API Route Validation', () => {
    
    describe('GET Endpoints Formatting', () => {
        const endpointsToTest = [
            '/api/health',
            '/api/system/metrics',
            '/api/users',
            '/api/products',
            '/api/inventory'
        ];

        test.each(endpointsToTest)('GET %s should return standardized format', async (route) => {
            const res = await request(app).get(route);
            
            // Allow 200 (Success) or 401 (Unauthorized if auth is on)
            expect([200, 401, 503]).toContain(res.status);

            // Our defined standard API format
            expect(res.body).toHaveProperty('success');
            expect(res.body).toHaveProperty('message');
            
            if (res.body.success) {
                expect(res.body).toHaveProperty('data');
            }
        });
    });

    describe('Global Error Handling', () => {
        it('should return safe 404 formatted error on missing route', async () => {
            const res = await request(app).get('/api/does-not-exist-route');
            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Route Not Found');
        });

        it('should handle invalid POST payloads with a 400 error cleanly (SQL/Sequelize error masking)', async () => {
            const res = await request(app)
                .post('/api/users')
                .send({ broken_payload: true });
            
            // Expected 400 Bad Request if validation triggers, or 401 if blocked.
            expect([400, 401]).toContain(res.status);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBeDefined();
        });
    });

    describe('Middleware Checks', () => {
        it('should apply security headers (Helmet)', async () => {
            const res = await request(app).get('/api/health');
            expect(res.headers['x-dns-prefetch-control']).toBe('off');
            expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
        });

        it('should inject traceId via Tracer Middleware', async () => {
            const res = await request(app).get('/api/health');
            expect(res.headers['x-trace-id']).toBeDefined();
            expect(res.headers['x-trace-id']).toMatch(/req-[0-9a-fA-F-]+/);
        });
    });
});
