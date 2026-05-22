const { User, Client, GlobalSetting } = require('../src/models');
const SaleOrchestrator = require('../src/modules/sales/SaleOrchestrator');
const db = require('../src/models');

async function run() {
    try {
        console.log("Iniciando simulación de Venta POS...");
        await db.sequelize.authenticate();

        // Obtener un usuario
        const user = await User.findOne({ where: { role: 'ADMIN' } }) || await User.findOne();
        if (!user) {
            console.log("No hay usuarios en la DB. Abortando.");
            process.exit(1);
        }
        console.log(`Usuario autenticado simulado: ${user.email} (ID: ${user.id})`);

        // Obtener o crear un cliente
        let client = await Client.findOne();
        if (!client) {
            client = await Client.create({ name: 'Cliente Simulado', email: 'test@cliente.com', created_by: user.id });
        }
        console.log(`Cliente seleccionado: ${client.name} (ID: ${client.id})`);

        // Obtener settings para el motor de precios
        const settings = await GlobalSetting.findOne();
        if (!settings) {
             await GlobalSetting.create({
                 operational_factor: 0.14,
                 profit_margin: 0.20,
                 labor_rate_sewing: 44.38,
                 labor_rate_pattern: 50.50,
                 fixed_supplies_costs: { "SENCILLO": 30 }
             });
        }

        // Simular Payload tal como lo envía el Frontend POSPage.jsx
        // POSPage mapea el payload de la UI y envía esto a /api/sales
        const frontendPayload = {
            saleData: {
                client_id: client.id,
                type: 'NORMAL',
                notes: 'Venta simulada por testing',
                sale_number: `POS-${Date.now().toString().slice(-6)}`
            },
            itemsData: [
                {
                    product_id: null,
                    custom_description: 'Traje a Medida Test',
                    quantity: 1,
                    manual_price: null,
                    hours_sewing: 2,
                    hours_pattern: 2,
                    supply_level: 'SENCILLO',
                    extra_materials: []
                }
            ],
            paymentData: {
                amount: 150,
                type: 'ANTICIPO'
            }
        };

        console.log("\n==================== PAYLOAD ENVIADO DESDE EL FRONTEND ====================");
        console.log(JSON.stringify(frontendPayload, null, 2));

        console.log("\n==================== ORQUESTANDO LA VENTA... ====================");
        
        // Llamar a la lógica del backend exactamente como lo hace el SaleController
        const result = await SaleOrchestrator.createSale(
            frontendPayload.saleData, 
            frontendPayload.itemsData, 
            frontendPayload.paymentData, 
            user.id
        );

        console.log("\n✅ Venta procesada y almacenada con éxito en la Base de Datos!");
        console.log(`ID de Venta: ${result.sale.id}`);
        console.log(`Total Calculado por Motor de Precios: $${result.sale.total}`);
        console.log(`Estado: ${result.sale.fulfillment_status}`);
        console.log(`Job ID (Cola Asíncrona): ${result.processing.jobId}`);
        
        process.exit(0);
    } catch (err) {
        console.error("\n❌ Error en la simulación:", err);
        process.exit(1);
    }
}

run();
