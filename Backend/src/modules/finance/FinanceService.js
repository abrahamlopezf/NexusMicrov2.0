const accountRepository = require('../../repositories/account.repository');
const saleRepository = require('../../repositories/sale.repository');
const sequelize = require('../../config/database');
const AppError = require('../../utils/AppError');

/**
 * FinanceService
 * Gestión contable, cuentas por cobrar, pagos y movimientos financieros.
 */
class FinanceService {
  
  /**
   * Registra oficialmente una deuda (Cuenta por Cobrar) cuando se cierra una Venta.
   * En este esquema dual, la Venta (Sale) actúa como el libro auxiliar de CxC.
   */
  static async generateReceivable({ saleId, clientId, amount, reference }, { transaction = null } = {}) {
    // Si la empresa llevara un catálogo contable estricto (Mayor General), 
    // aquí se insertaría el asiento contable (Ej: Cargo a Clientes, Abono a Ventas).
    // Dado que el balance vivo lo lleva la Venta, este método sirve como *hook* 
    // auditable para integraciones futuras con sistemas de facturación externa (Ej: SAP o Facturación Electrónica).
    return {
      status: 'RECEIVABLE_REGISTERED',
      saleId,
      expectedAmount: amount,
      recordedAt: new Date()
    };
  }

  /**
   * Registra un pago relacionado a una venta, ingresa dinero a una cuenta financiera
   * y salda el balance de la venta de forma atómica.
   * 
   * @param {Object} payload 
   * @param {number} payload.saleId 
   * @param {number} payload.accountId - ID de cuenta origen (Ej. CAJA o BANCO)
   * @param {number} payload.amount - Monto pagado
   * @param {string} payload.paymentMethod - 'EFECTIVO', 'TARJETA', 'TRANSFERENCIA'
   * @param {Object} [transaction] 
   */
  static async registerPayment({ saleId, accountId, amount, paymentMethod }, transaction = null) {
    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      throw new AppError('El monto del pago debe ser mayor a 0', 400);
    }

    const executeTransaction = async (t) => {
      // 1. Verificamos y bloqueamos la venta para no tener pagos concurrentes fantasma
      const sale = await saleRepository.findById(saleId, { transaction: t, lock: t.LOCK.UPDATE });
      if (!sale) throw new AppError(`Venta con ID ${saleId} no encontrada`, 404);

      const currentBalance = parseFloat(sale.balance || 0);

      if (currentBalance <= 0) {
        throw new AppError('Esta venta ya se encuentra totalmente pagada (Balance 0)', 409);
      }
      if (paymentAmount > currentBalance) {
        throw new AppError(`El pago excede el balance restante. Deuda actual: $${currentBalance}`, 400);
      }

      // 2. Comprobar cuenta destino
      const account = await accountRepository.findById(accountId, { transaction: t });
      if (!account) throw new AppError(`Cuenta financiera [${accountId}] no encontrada`, 404);

      // 3. Crear el recibo de Pago (Payment)
      const payment = await accountRepository.createPayment({
        sale_id: saleId,
        account_id: accountId,
        amount: paymentAmount,
        payment_method: paymentMethod
      }, t);

      // 4. Registrar el Movimiento Financiero (Auditoría inmutable de ingresos)
      await accountRepository.createMovement({
        account_id: accountId,
        type: 'INGRESO',
        concept: `Abono/Pago a Venta #${sale.sale_number}`,
        amount: paymentAmount,
        reference_type: 'PAYMENT',
        reference_id: payment.id
      }, t);

      // 5. Acumular saldo en la Cuenta Bancaria/Caja
      await accountRepository.incrementBalance(accountId, paymentAmount, t);

      // 6. Actualizar balance de la Venta
      sale.paid_amount = parseFloat(sale.paid_amount || 0) + paymentAmount;
      sale.balance = currentBalance - paymentAmount;

      // Si se saldó por completo, actualizar estado comercial a PAGADO
      if (sale.balance === 0) {
        sale.status = 'PAGADO';
      }

      await sale.save({ transaction: t });

      return {
        success: true,
        payment,
        saleCurrentBalance: sale.balance,
        saleStatus: sale.status
      };
    };

    return transaction ? executeTransaction(transaction) : sequelize.transaction(executeTransaction);
  }
}

module.exports = FinanceService;
