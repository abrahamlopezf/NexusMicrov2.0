const { WorkOrder, ProductionTask, Product, ProductMaterial, Material, sequelize } = require('../models');
const AppError = require('../utils/AppError');

class WorkOrderService {
    static async createWorkOrder(data) {
        const { productId, quantity, notes, saleId } = data;

        return await sequelize.transaction(async (t) => {
            // 1. Create the main Work Order
            const workOrder = await WorkOrder.create({
                sale_id: saleId || null,
                status: 'PENDING',
                notes: notes || `Producción de ${quantity} unidades`,
            }, { transaction: t });

            // 2. Fetch product BOM to pre-calculate materials if needed
            // For now, we just create a task. The actual material deduction 
            // happens in ProductionService.completeTask using 'real_materials_used'
            
            const product = await Product.findByPk(productId, {
                include: [{ model: ProductMaterial, as: 'materials' }],
                transaction: t
            });

            if (!product) throw new AppError('Producto no encontrado', 404);

            // Pre-calculate suggested materials based on BOM
            const suggestedMaterials = (product.materials || []).map(pm => ({
                material_id: pm.material_id,
                consumedQty: parseFloat(pm.quantity) * quantity * (1 + parseFloat(pm.waste_percentage) / 100)
            }));

            // 3. Create the production task
            await ProductionTask.create({
                work_order_id: workOrder.id,
                product_id: productId,
                task_name: `Confección: ${product.name}`,
                quantity: quantity,
                status: 'PENDING',
                real_materials_used: suggestedMaterials, // Initialize with BOM suggestion
            }, { transaction: t });

            return workOrder;
        });
    }

    static async getWorkOrders(query = {}) {
        const { status } = query;
        const where = {};
        if (status) where.status = status;

        return await WorkOrder.findAll({
            where,
            include: [
                {
                    model: ProductionTask,
                    as: 'tasks',
                    include: [{ model: Product, as: 'product' }]
                }
            ],
            order: [['created_at', 'DESC']]
        });
    }

    static async getWorkOrderById(id) {
        const workOrder = await WorkOrder.findByPk(id, {
            include: [
                {
                    model: ProductionTask,
                    as: 'tasks',
                    include: [{ model: Product, as: 'product' }]
                }
            ]
        });
        if (!workOrder) throw new AppError('Orden de trabajo no encontrada', 404);
        return workOrder;
    }

    static async updateWorkOrderStatus(id, status) {
        const workOrder = await WorkOrder.findByPk(id);
        if (!workOrder) throw new AppError('Orden de trabajo no encontrada', 404);
        
        workOrder.status = status;
        await workOrder.save();
        return workOrder;
    }

    static async assignWorkOrder(id, employeeId) {
        // Assigning an order usually means assigning its tasks
        const tasks = await ProductionTask.findAll({ where: { work_order_id: id } });
        for (const task of tasks) {
            task.employee_id = employeeId;
            await task.save();
        }
        return { success: true, message: 'Tareas asignadas correctamente' };
    }
}

module.exports = WorkOrderService;
