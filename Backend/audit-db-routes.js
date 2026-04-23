const db = require("./src/models");
const app = require("./src/app");
const http = require("http");

async function runAudit() {
    console.log("=== PHASE 3: DATABASE VALIDATION ===");
    try {
        await db.sequelize.authenticate();
        console.log("✅ Database authentication successful");
        
        const models = Object.keys(db).filter(key => key !== 'sequelize' && key !== 'Sequelize');
        console.log(`✅ Loaded ${models.length} models: ${models.join(', ')}`);
        
    } catch (error) {
        console.error("❌ Database validation failed:", error);
        process.exit(1);
    }

    console.log("\n=== PHASE 4: ROUTE VALIDATION ===");
    // Extract routes from Express app
    const routes = [];
    const extractRoutes = (router, prefix = '') => {
        if (!router) return;
        if (router.name === 'router' && router.handle.stack) {
            router.handle.stack.forEach(layer => {
                if (layer.route) {
                    const path = prefix + layer.route.path;
                    const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
                    routes.push({ method: methods, path });
                } else if (layer.name === 'router') {
                    // It's a nested router
                    // The path is inside layer.regexp, but it's hard to extract cleanly in Express 4
                    // Let's just do a basic extraction based on the known prefix
                }
            });
        }
    };
    
    // Express 4 doesn't easily expose the full registered path tree.
    // We already know the routes from routes/index.js. Let's just start the server and ping a few known endpoints.
    
    const server = http.createServer(app);
    server.listen(0, async () => {
        const port = server.address().port;
        console.log(`✅ Server started for testing on port ${port}`);
        
        const testRoute = async (method, path) => {
            return new Promise((resolve) => {
                const options = {
                    hostname: 'localhost',
                    port: port,
                    path: path,
                    method: method,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                };
                
                const req = http.request(options, (res) => {
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => {
                        console.log(`[${method}] ${path} -> Status: ${res.statusCode}`);
                        try {
                            const json = JSON.parse(data);
                            if (json.success === undefined) {
                                console.log(`   ⚠️ WARNING: Response missing 'success' field`);
                            }
                        } catch(e) {}
                        resolve(res.statusCode);
                    });
                });
                
                req.on('error', (e) => {
                    console.error(`❌ Request failed: ${e.message}`);
                    resolve(500);
                });
                
                req.end();
            });
        };

        await testRoute('GET', '/api/health'); // Assuming health route exists
        await testRoute('GET', '/api/users');
        await testRoute('GET', '/api/products');
        await testRoute('GET', '/api/nonexistent'); // Should 404 cleanly
        
        server.close();
        console.log("\nAudit script finished.");
        process.exit(0);
    });
}

runAudit();
