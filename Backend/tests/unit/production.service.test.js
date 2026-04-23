const ProductionService = require('../../src/services/production.service');
const db = require('../../src/models');
const inventoryService = require('../../src/services/inventory.service');

jest.mock('../../src/models', () => ({
    Sale: {
        findByPk: jest.fn()
    },
    WorkOrder: {
        findOne: jest.fn(),
        create: jest.fn(),
        findByPk: jest.fn(),
        update: jest.fn()
    },
    ProductionTask: {
        bulkCreate: jest.fn(),
        findByPk: jest.fn(),
        findAll: jest.fn()
    },
    ProductMaterial: {
        findAll: jest.fn()
    },
    Material: {
        findByPk: jest.fn()
    },
    sequelize: {
        transaction: jest.fn().mockResolvedValue({
            commit: jest.fn(),
            rollback: jest.fn()
        })
    }
}));

jest.mock('../../src/services/inventory.service', () => ({
    consumeMaterialStock: jest.fn(),
    addMaterialStock: jest.fn()
}));

describe('Production Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createWorkOrderFromSale', () => {
        it('should create a work order if one does not exist', async () => {
            const mockSale = { id: 1, items: [{ product_id: 10, description: 'Chair', quantity: 2 }] };
            db.Sale.findByPk.mockResolvedValue(mockSale);
            db.WorkOrder.findOne.mockResolvedValue(null);
            db.WorkOrder.create.mockResolvedValue({ id: 100 });
            db.WorkOrder.findByPk.mockResolvedValue({ id: 100 });

            const wo = await ProductionService.createWorkOrderFromSale(1);

            expect(db.WorkOrder.create).toHaveBeenCalled();
            expect(db.ProductionTask.bulkCreate).toHaveBeenCalled();
            expect(wo.id).toBe(100);
        });
    });

    describe('completeProductionTask', () => {
        it('should successfully complete task, consume raw materials and output product', async () => {
            const mockTask = { id: 1, product_id: 10, quantity: 2, status: 'PENDIENTE', work_order_id: 100, save: jest.fn() };
            const mockBOM = [{ material_id: 5, quantity: 3 }];
            const mockMaterial = { id: 5, name: 'Wood', current_stock: 100 };

            db.ProductionTask.findByPk.mockResolvedValue(mockTask);
            db.ProductMaterial.findAll.mockResolvedValue(mockBOM);
            db.Material.findByPk.mockResolvedValue(mockMaterial);
            db.ProductionTask.findAll.mockResolvedValue([
                { status: 'COMPLETADA' }
            ]);

            await ProductionService.completeProductionTask(1);

            expect(mockTask.save).toHaveBeenCalled();
            expect(mockTask.status).toBe('COMPLETADA');
            
            // 3 units of material per product * 2 products = 6 units consumed
            expect(inventoryService.consumeMaterialStock).toHaveBeenCalledWith(5, 6, 'PRODUCTION', 100, expect.anything());
            
            // Output of final product
            expect(inventoryService.addMaterialStock).toHaveBeenCalledWith(10, 2, 'PRODUCTION_OUTPUT', 100, expect.anything());

            // Since it's the only task and completed, it should autocomplete WO
            expect(db.WorkOrder.update).toHaveBeenCalled();
        });
    });
});
