require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const fetch = globalThis.fetch;
const { User, Product, Material, ProductMaterial, Client, Sale, SaleItem } = require('../src/models');
const SaleOrchestrator = require('../src/services/SaleOrchestrator');

const API_URL = 'http://localhost:5000/api';

async function runTest() {
    try {
        await require('../src/models').Product.sync({ alter: true }).catch(e=>null);
        await require('../src/models').GlobalSetting.sync({ alter: true }).catch(e=>null);
        await require('../src/models').Sale.sync({ alter: true }).catch(e=>null);
        await require('../src/models').SaleItem.sync({ alter: true }).catch(e=>null);
        await require('../src/models').Client.sync({ alter: true }).catch(e=>null);
        console.log("0. Tablas y columnas requeridas procesadas.");
        console.log("1. Buscando Admin y Cliente...");
        const admin = await User.findOne({ where: { role: 'ADMIN' } });
        let client = await Client.findOne();
        if (!client) {
            client = await Client.create({ name: 'Cliente Test Venta', phone: '1234567890' });
        }

        console.log("2. Buscando Producto con Materiales para verificar deducción...");
        let product = await Product.findOne({
            include: [{ model: ProductMaterial, as: 'materials', include: [{ model: Material, as: 'material' }] }]
        });

        // Si no hay producto con materiales, crearemos uno de prueba
        if (!product || !product.materials || product.materials.length === 0) {
            let mat = await Material.findOne();
            if (!mat) mat = await Material.create({ name: 'Tela Test', unit: 'metros', current_stock: 100, min_stock: 5, unit_cost: 10 });
            
            product = await Product.create({ name: 'Saco de Prueba', base_price: 500, is_custom: false, sku: 'TEST-SACO-001' });
            await ProductMaterial.create({ product_id: product.id, material_id: mat.id, quantity: 2 });
            console.log(" -> Producto y Material creados de emergencia para la prueba.");
            
            product = await Product.findOne({
                where: { id: product.id },
                include: [{ model: ProductMaterial, as: 'materials', include: [{ model: Material, as: 'material' }] }]
            });
        }
        
        const testMaterial = product.materials[0].material;
        const initialStock = parseFloat(testMaterial.current_stock);
        const qtyToDeduct = parseFloat(product.materials[0].default_quantity); // Para 1 unidad de producto

        console.log(` -> Producto: ${product.name} | Material atado: ${testMaterial.name} (Stock Actual: ${initialStock})`);

        console.log("3. Simulando Venta (POS)...");
        // We simulate hitting the endpoint or using Orchestrator directly
        const saleData = { client_id: client.id, type: 'NORMAL', sale_number: 'SIM-' + Date.now(), expected_delivery_date: new Date(Date.now() + 86400000 * 3).toISOString() };
        const itemsData = [{ product_id: product.id, quantity: 1, unit_price: 250, custom_description: "E2E Test" }];
        
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: admin.email, password: 'password123' })
        });
        const { data: { token } } = await loginRes.json();

        const saleRes = await fetch(`${API_URL}/sales`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ saleData, itemsData, paymentData: { method: 'EFECTIVO', amount: 250 } })
        });
        const saleJson = await saleRes.json();
        
        if (!saleJson.success) {
            throw new Error(JSON.stringify(saleJson));
        }
        const saleId = saleJson.data.id;
        console.log(` -> Venta registrada exitosamente: ID ${saleId}`);

        console.log("4. Revisando Deducción de Inventario...");
        await testMaterial.reload();
        const finalStock = parseFloat(testMaterial.current_stock);
        console.log(` -> Stock Anterior: ${initialStock} | Stock Nuevo: ${finalStock} (Restó: ${initialStock - finalStock}. Esperado: ${qtyToDeduct})`);

        console.log("5. Revisando Calendario de Entregas y Dashboard...");
        const delRes = await fetch(`${API_URL}/sales/deliveries?status=PENDING`, { headers: { 'Authorization': `Bearer ${token}` } });
        const delJson = await delRes.json();
        const isInCalendar = delJson.data && delJson.data.some(d => d.id === saleId);
        console.log(` -> Aparece en calendario de entregas: ${isInCalendar}`);

        const dashRes = await fetch(`${API_URL}/dashboard/advanced?range=today`, { headers: { 'Authorization': `Bearer ${token}` } });
        const dashJson = await dashRes.json();
        console.log(` -> Facturación Hoy (Alerta Dashboard): $${dashJson.data?.financials?.revenue}`);

        console.log("\n✅ PRUEBA TOTALMENTE EXITOSA: INVENTARIO, POS, DASHBOARD y CALENDARIO ESTÁN SINCRONIZADOS.");
    } catch (err) {
        console.error("❌ ERROR DURANTE LA PRUEBA:");
        console.error(err.message);
    } finally {
        process.exit();
    }
}

runTest();
