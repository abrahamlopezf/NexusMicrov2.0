const { PayrollAdvance } = require('../../models');

class PayrollService {
    static async registerAdvanceForTask(task, transaction = null) {
        if (!task.employee_id || !task.price) return null;

        return await PayrollAdvance.create({
            employee_id: task.employee_id,
            amount: task.price,
            reason: `Pago generado por tarea de producción completada: ${task.task_name || 'Sin nombre'} (ID: ${task.id})`,
            status: 'PENDIENTE'
        }, { transaction });
    }
}

module.exports = PayrollService;
