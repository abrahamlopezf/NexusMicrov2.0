const { Payment, Sale, Account, sequelize } = require('../models');
const AppError = require('../utils/AppError');

class PaymentService {
    static async registerPayment(paymentData, parentTransaction = null) {
        
        // Función interna transaccional abstracta
        const executeLogic = async (t) => {
            const { sale_id, account_id, amount, payment_method, type, reference, notes, created_by } = paymentData;
            const parsedAmount = parseFloat(amount);

            if (!parsedAmount || parsedAmount <= 0) throw new AppError('Payment amount must be greater than 0', 400);

            const allowedMethods = ['EFECTIVO', 'TRANSFERENCIA', 'TARJETA'];
            if (!allowedMethods.includes(payment_method)) throw new AppError('Invalid payment method', 400);

            const sale = await Sale.findByPk(sale_id, {
                transaction: t,
                lock: t.LOCK.UPDATE
            });

            if (!sale) throw new AppError("Sale not found", 404);
            if (['CANCELLED', 'REFUNDED'].includes(sale.status)) {
                throw new AppError(`Cannot register payment for sale with status ${sale.status}`, 400);
            }

            if (parsedAmount > parseFloat(sale.balance) + 0.01) {
                throw new AppError('Payment exceeds remaining balance', 400);
            }

            const payment = await Payment.create({
                sale_id,
                account_id,
                amount: parsedAmount,
                payment_method,
                type: type || 'PARCIAL',
                reference,
                notes,
                payment_date: new Date(),
                created_by
            }, { transaction: t });

            const targetAccount = await Account.findByPk(account_id, { transaction: t, lock: t.LOCK.UPDATE });
            if (targetAccount) {
                targetAccount.balance = parseFloat(targetAccount.balance) + parsedAmount;
                await targetAccount.save({ transaction: t });
            }

            const newPaidAmount = parseFloat(sale.paid_amount) + parsedAmount;
            const newBalance = parseFloat(sale.total) - newPaidAmount;

            sale.paid_amount = newPaidAmount;
            sale.balance = newBalance;

            if (newBalance <= 0) {
                sale.is_paid = true;
                sale.financial_status = 'PAID';
            } else if (newPaidAmount > 0) {
                sale.financial_status = 'PARTIAL';
            } else {
                sale.financial_status = 'UNPAID';
            }

            sale.updated_by = created_by;
            await sale.save({ transaction: t });

            return payment;
        };

        // Si existe un padre orquestador, adhiere a la suya
        if (parentTransaction) {
            return await executeLogic(parentTransaction);
        }
        
        // Si no existe, crea una nueva manejada y protegida auto-commit
        return await sequelize.transaction(async (t) => {
            return await executeLogic(t);
        });
    }
}

module.exports = PaymentService;
