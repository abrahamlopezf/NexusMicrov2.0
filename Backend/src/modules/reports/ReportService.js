const { sequelize } = require('../../models');
const { Sale, SaleItem, Product } = require('../../models');
const { Op } = require('sequelize');

class ReportService {
    // RF-27: Reporte de Ventas por periodo y cliente
    static async getSalesReport(startDate, endDate) {
        const sales = await Sale.findAll({
            where: {
                created_at: {
                    [Op.between]: [startDate, endDate]
                },
                status: { [Op.ne]: 'CANCELADA' }
            },
            attributes: [
                [sequelize.fn('date_trunc', 'day', sequelize.col('created_at')), 'date'],
                [sequelize.fn('sum', sequelize.col('total')), 'daily_total'],
                [sequelize.fn('count', sequelize.col('id')), 'sales_count']
            ],
            group: [sequelize.fn('date_trunc', 'day', sequelize.col('created_at'))],
            order: [[sequelize.fn('date_trunc', 'day', sequelize.col('created_at')), 'ASC']]
        });
        return sales;
    }

    // RF-28: Reporte de Rentabilidad por Producto
    static async getProductProfitability(startDate, endDate) {
        const query = `
            SELECT 
                p.id as product_id,
                p.name as product_name,
                SUM(si.quantity) as items_sold,
                SUM(si.total) as revenue,
                SUM(CAST(si.quantity AS DECIMAL) * COALESCE(p.base_cost, 0)) as total_cost,
                SUM(si.total) - SUM(CAST(si.quantity AS DECIMAL) * COALESCE(p.base_cost, 0)) as gross_profit
            FROM sale_items si
            JOIN sales s ON si.sale_id = s.id
            JOIN products p ON si.product_id = p.id
            WHERE s.created_at >= :startDate AND s.created_at <= :endDate
            AND s.status != 'CANCELADA'
            GROUP BY p.id, p.name
            ORDER BY gross_profit DESC
        `;

        const profitability = await sequelize.query(query, {
            replacements: { startDate, endDate },
            type: sequelize.QueryTypes.SELECT
        });

        return profitability;
    }
}

module.exports = ReportService;
