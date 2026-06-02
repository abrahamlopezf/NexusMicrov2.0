const { SaleItem, Sale, Client, Product } = require('../../models');

function buildQueue(items) {
    const map = new Map();

    for (const item of items) {
        const sale = item.sale;

        if (!map.has(sale.id)) {
            map.set(sale.id, {
                sale_id: sale.id,
                sale_number: sale.sale_number,
                status: sale.status,
                financial_status: sale.financial_status,
                fulfillment_status: sale.fulfillment_status,

                total: sale.total,
                paid_amount: sale.paid_amount,
                retained_amount: sale.retained_amount,
                balance: sale.balance,

                createdAt: sale.createdAt,
                client: sale.client,
                priority: getPriority(sale),
                items: []
            });
        }

        const entry = map.get(sale.id);

        entry.items.push({
            sale_item_id: item.id,
            product_id: item.product_id,
            product_name: item.product?.name || item.product?.title || null,
            quantity: item.quantity,
            production_status: item.production_status,
            delivery_status: item.delivery_status,
            garment_type: item.garment_type,
            client_garment_id: item.client_garment_id,
            measurement_id: item.measurement_id,
            garment_snapshot: item.garment_snapshot,
            measurement_snapshot: item.measurement_snapshot,
        });
    }

    return Array.from(map.values()).sort((a, b) => {
        return a.priority - b.priority;
    });
}

// 🔥 Prioridad de producción (clave del sistema)
function getPriority(sale) {
    // ═════════════════════════════════════════════════════
    // LEGACY OPERATIONAL STATES FIRST
    // Mientras migramos datos viejos, status todavía contiene
    // información operativa importante.
    // ═════════════════════════════════════════════════════
    if (sale.status === 'EN_PRODUCCION') return 1;
    if (sale.status === 'LISTO_ENTREGA') return 4;

    // ═════════════════════════════════════════════════════
    // NEW FULFILLMENT STATES
    // ═════════════════════════════════════════════════════
    if (sale.fulfillment_status === 'IN_PRODUCTION') return 1;
    if (sale.fulfillment_status === 'READY_FOR_DELIVERY') return 4;
    if (sale.fulfillment_status === 'DELIVERED') return 5;

    // ═════════════════════════════════════════════════════
    // FINANCIAL PRIORITY
    // ═════════════════════════════════════════════════════
    if (sale.financial_status === 'PAID') return 2;
    if (sale.financial_status === 'PARTIAL') return 3;
    if (sale.financial_status === 'UNPAID') return 6;

    // ═════════════════════════════════════════════════════
    // LEGACY FINANCIAL FALLBACK
    // ═════════════════════════════════════════════════════
    if (sale.status === 'PAGADO') return 2;
    if (sale.status === 'PENDIENTE') return 3;

    return 9;
}

class ProductionQueueService {
    static async getQueue() {
        const items = await SaleItem.findAll({
            where: {
                production_status: 'PENDING'
            },
            include: [
                {
                    model: Sale,
                    as: 'sale',
                    include: [
                        {
                            model: Client,
                            as: 'client'
                        }
                    ]
                },
                {
                    model: Product,
                    as: 'product'
                }
            ],
            order: [
                [{ model: Sale, as: 'sale' }, 'createdAt', 'ASC'],
                ['createdAt', 'ASC']
            ]
        });
        return buildQueue(items);
    }
}

module.exports = ProductionQueueService;