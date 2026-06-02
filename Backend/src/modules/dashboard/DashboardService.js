const { Sale, SaleItem, Product, Material, ProductionTask, Employee, sequelize } = require('../../models');
const { Op } = require('sequelize');

class DashboardService {
    static async getSummary() {
        // 💰 Ventas del día
        const salesToday = await sequelize.query(`
            SELECT COALESCE(SUM(total), 0) as total
            FROM sales
            WHERE DATE(created_at) = CURRENT_DATE
        `, { type: sequelize.QueryTypes.SELECT });

        // 📦 Pedidos activos
        const activeOrders = await sequelize.query(`
            SELECT COUNT(*) as count FROM sales
            WHERE status IN ('PENDIENTE', 'EN_PRODUCCION', 'LISTO_ENTREGA')
        `, { type: sequelize.QueryTypes.SELECT });

        // 🧵 Producción
        const production = await sequelize.query(`
            SELECT COUNT(*) as count FROM production_tasks
            WHERE status != 'DONE'
        `, { type: sequelize.QueryTypes.SELECT });

        // ⚠️ Pendientes
        const pending = await sequelize.query(`
            SELECT COUNT(*) as count FROM sales
            WHERE status = 'PENDIENTE'
        `, { type: sequelize.QueryTypes.SELECT });

        // 📊 Ventas últimos 7 días
        const weekly = await sequelize.query(`
            SELECT 
                TO_CHAR(created_at, 'Dy') as day,
                COALESCE(SUM(total), 0) as total
            FROM sales
            WHERE created_at >= NOW() - INTERVAL '7 days'
            GROUP BY day, DATE(created_at)
            ORDER BY DATE(created_at)
        `, { type: sequelize.QueryTypes.SELECT });

        return {
            kpis: {
                salesToday: parseFloat(salesToday[0].total).toFixed(2),
                activeOrders: parseInt(activeOrders[0].count),
                production: parseInt(production[0].count),
                pending: parseInt(pending[0].count),
            },
            weeklySales: weekly.map(w => ({ day: w.day, total: parseFloat(w.total) })),
        };
    }

    static async getAdvanced(range) {
        let interval = "7 days";
        if (range === "month") interval = "30 days";
        if (range === "today") interval = "1 day";

        // 💰 Ingresos
        const revenueResult = await sequelize.query(`
            SELECT COALESCE(SUM(total), 0) as total
            FROM sales
            WHERE created_at >= NOW() - INTERVAL '${interval}'
              AND deleted_at IS NULL
        `, { type: sequelize.QueryTypes.SELECT });
        const revenue = parseFloat(revenueResult[0].total) || 0;

        // 💸 Costos
        const costsResult = await sequelize.query(`
            SELECT COALESCE(SUM(price), 0) as total
            FROM production_tasks
            WHERE created_at >= NOW() - INTERVAL '${interval}'
        `, { type: sequelize.QueryTypes.SELECT });
        const costs = parseFloat(costsResult[0].total) || 0;

        // 🧮 Utilidad
        const profit = revenue - costs;
        const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

        // 📦 Top productos
        const topProductsResult = await sequelize.query(`
            SELECT p.name, COALESCE(SUM(si.quantity), 0) as total
            FROM sale_items si
            JOIN sales s ON si.sale_id = s.id
            JOIN products p ON si.product_id = p.id
            WHERE s.created_at >= NOW() - INTERVAL '${interval}'
              AND s.deleted_at IS NULL
            GROUP BY p.id, p.name
            ORDER BY total DESC
            LIMIT 5
        `, { type: sequelize.QueryTypes.SELECT });

        // 👤 Clientes
        const topClientsResult = await sequelize.query(`
            SELECT c.name as customer_name, COUNT(s.id) as orders
            FROM sales s
            JOIN clients c ON s.client_id = c.id
            WHERE s.created_at >= NOW() - INTERVAL '${interval}'
              AND s.deleted_at IS NULL
            GROUP BY c.id, c.name
            ORDER BY orders DESC
            LIMIT 5
        `, { type: sequelize.QueryTypes.SELECT });

        return {
            financials: {
                revenue: revenue.toFixed(2),
                costs: costs.toFixed(2),
                profit: profit.toFixed(2),
                margin: parseFloat(margin.toFixed(2))
            },
            topProducts: topProductsResult.map(p => ({
                name: p.name,
                total: parseInt(p.total)
            })),
            topClients: topClientsResult.map(c => ({
                customer_name: c.customer_name,
                orders: parseInt(c.orders)
            }))
        };
    }

    static async getTopProducts() {
        return await SaleItem.findAll({
            attributes: [
                'product_id',
                [sequelize.fn('SUM', sequelize.col('quantity')), 'total_sold']
            ],
            include: [{
                model: Product,
                as: 'product',
                attributes: ['name']
            }],
            group: ['product_id', 'product.id'],
            order: [[sequelize.literal('total_sold'), 'DESC']],
            limit: 5
        });
    }

    static async getSalesByMonth() {
        return await Sale.findAll({
            attributes: [
                [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('created_at')), 'month'],
                [sequelize.fn('SUM', sequelize.col('total')), 'total']
            ],
            group: ['month'],
            order: [[sequelize.literal('month'), 'ASC']]
        });
    }

    static async getLowStock() {
        return await Material.findAll({
            where: {
                current_stock: {
                    [Op.lt]: sequelize.col('min_stock')
                }
            }
        });
    }

    static async getEmployeeProductivity() {
        return await ProductionTask.findAll({
            attributes: [
                'employee_id',
                [sequelize.fn('COUNT', sequelize.col('id')), 'tasks_completed']
            ],
            where: {
                status: 'DONE'
            },
            include: [{
                model: Employee,
                as: 'employee',
                attributes: ['name']
            }],
            group: ['employee_id', 'employee.id'],
            order: [[sequelize.literal('tasks_completed'), 'DESC']]
        });
    }
}

module.exports = DashboardService;
