const InventoryService = require('../../src/services/inventory.service');
const db = require('../../src/models');

jest.mock('../../src/models', () => ({
    Material: {
        findByPk: jest.fn()
    },
    InventoryMovement: {
        create: jest.fn(),
        findAll: jest.fn()
    },
    sequelize: {
        transaction: jest.fn().mockResolvedValue({
            commit: jest.fn(),
            rollback: jest.fn(),
            LOCK: { UPDATE: 'UPDATE' }
        })
    }
}));

describe('Inventory Service', () => {
    let transaction;

    beforeEach(async () => {
        jest.clearAllMocks();
        transaction = await db.sequelize.transaction();
    });

    describe('addMaterialStock', () => {
        it('should add stock up correctly', async () => {
            const mockMaterial = { id: 1, name: 'Wood', current_stock: 10, save: jest.fn() };
            db.Material.findByPk.mockResolvedValue(mockMaterial);
            db.InventoryMovement.create.mockResolvedValue(true);

            const result = await InventoryService.addMaterialStock(1, 5, 'PURCHASE', 99);

            expect(mockMaterial.current_stock).toBe(15);
            expect(mockMaterial.save).toHaveBeenCalled();
            expect(db.InventoryMovement.create).toHaveBeenCalledWith(expect.objectContaining({
                type: 'ENTRADA_COMPRA',
                quantity: 5
            }), expect.any(Object));
            expect(result.current_stock).toBe(15);
        });

        it('should fail if quantity is zero or less', async () => {
            db.Material.findByPk.mockResolvedValue({});
            await expect(InventoryService.addMaterialStock(1, 0, 'PURCHASE', 99)).rejects.toThrow('Quantity to add must be greater than zero');
        });
    });

    describe('consumeMaterialStock', () => {
        it('should consume stock if enough available', async () => {
            const mockMaterial = { id: 1, name: 'Wood', current_stock: 10, save: jest.fn() };
            db.Material.findByPk.mockResolvedValue(mockMaterial);

            await InventoryService.consumeMaterialStock(1, 5, 'PRODUCTION', 10);

            expect(mockMaterial.current_stock).toBe(5);
            expect(mockMaterial.save).toHaveBeenCalled();
            expect(db.InventoryMovement.create).toHaveBeenCalledWith(expect.objectContaining({
                type: 'SALIDA_PRODUCCION'
            }), expect.any(Object));
        });

        it('should throw error if insufficient stock', async () => {
            const mockMaterial = { id: 1, name: 'Wood', current_stock: 2, save: jest.fn() };
            db.Material.findByPk.mockResolvedValue(mockMaterial);

            await expect(InventoryService.consumeMaterialStock(1, 5, 'PRODUCTION', 10)).rejects.toThrow('Insufficient stock');
        });
    });
});
