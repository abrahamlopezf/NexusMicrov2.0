// tests/stress/stress.test.js
const http = require('http');
const app = require('../../src/app');

// Port finding and closing helper to launch real server instance
let server;
let PORT;

beforeAll((done) => {
    // Start the server on an ephemeral port
    server = http.createServer(app);
    server.listen(0, () => {
        PORT = server.address().port;
        done();
    });
});

afterAll((done) => {
    server.close(done);
});

describe('Stress Validation tests', () => {

    const simulateRequests = async (concurrentCount) => {
        const promises = [];
        const start = Date.now();
        let errorCount = 0;

        for (let i = 0; i < concurrentCount; i++) {
            promises.push(new Promise((resolve) => {
                const req = http.get(`http://localhost:${PORT}/api/system/metrics`, (res) => {
                    // Consume response data to free up memory
                    res.on('data', () => {});
                    res.on('end', () => resolve(res.statusCode));
                });
                
                req.on('error', () => {
                    errorCount++;
                    resolve(500);
                });
            }));
        }

        const stats = await Promise.all(promises);
        const end = Date.now();
        const duration = end - start;

        errorCount += stats.filter(status => status !== 200).length;

        return {
            duration,
            errorCount,
            errorRate: (errorCount / concurrentCount) * 100
        };
    };

    it('should successfully serve 100 concurrent requests without crashing or dropping packets', async () => {
        const { duration, errorRate, errorCount } = await simulateRequests(100);
        
        console.log(`[STRESS TEST] 100 Requests completed in ${duration}ms with ${errorCount} errors`);

        // We expect less than 1% failure rate theoretically, hopefully 0.
        expect(errorRate).toBeLessThan(1);
    });

    it('should correctly handle 500 concurrent requests burst', async () => {
        const { duration, errorRate, errorCount } = await simulateRequests(500);

        console.log(`[STRESS TEST] 500 Requests completed in ${duration}ms with ${errorCount} errors`);

        expect(errorRate).toBeLessThan(5); // Allowing up to 5% failure under high stress if pool exhausts temporarily
    });
});
