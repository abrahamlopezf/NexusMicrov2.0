const { Account, Payment, Sale, User, Client } = require('../models');
const sequelize = require('../config/database');

class FinanceController {
    // Obtener todas las cuentas (Caja, Bancos, etc)
    static async getAccounts(req, res, next) {
        try {
            const accounts = await Account.findAll({
                order: [['id', 'ASC']]
            });
            res.json({ success: true, data: accounts });
        } catch (error) {
            next(error);
        }
    }

    // Obtener el historial de pagos recientes
    static async getPayments(req, res, next) {
        try {
            const payments = await Payment.findAll({
                include: [
                    {
                        model: Sale,
                        as: 'sale',
                        attributes: ['sale_number', 'status', 'total', 'client_id'],
                        include: [{ model: sequelize.models.Client, as: 'client', attributes: ['name'] }]
                    },
                    {
                        model: Account,
                        as: 'account',
                        attributes: ['name', 'type']
                    }
                ],
                order: [['payment_date', 'DESC']],
                limit: 100 // Solo traer los 100 más recientes por ahora
            });
            res.json({ success: true, data: payments });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = FinanceController;
