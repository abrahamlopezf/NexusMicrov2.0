const db = require('../../../src/models');
const saleService = require('../../../src/services/sale.service');
const erpEngine = require('../../../src/services/erp.engine');

jest.mock('../../../src/models', () => {
    const mTransaction = {
        commit: jest.fn(),
        rollback: jest.fn()
    };
    return {
        sequelize: {
            transaction: jest.fn(() => Promise.resolve(mTransaction))
        },
        Sale: {
            create: jest.fn(),
            findOne: jest.fn(),
            findByPk: jest.fn(),
            findAll: jest.fn(),
        },
        Product: {
            findAll: jest.fn(),
            findByPk: jest.fn(),
        },
        SaleItem: {
            bulkCreate: jest.fn(),
            create: jest.fn(),
            sum: jest.fn(),
        },
        InventoryMovement: {
            bulkCreate: jest.fn(),
            create: jest.fn(),
        },
        Payment: {
            sum: jest.fn(),
            create: jest.fn(),
        },
        Client: {},
        WorkOrder: {},
        Account: {},
        FinancialMovement: {}
    };
});

jest.mock('../../../src/services/erp.engine', () => ({
    handleSaleCreated: jest.fn()
}));

describe('SaleService Unit Tests', () => {
    let mockTransaction;

    beforeEach(async () => {
        jest.clearAllMocks();
        mockTransaction = await db.sequelize.transaction();
    });

    describe('createSale', () => {
        it('debería crear una venta con items exitosamente (manejo de transacciones)', async () => {
            // Setup mocks
            db.Sale.findOne.mockResolvedValue({ id: 99 });
            db.Sale.create.mockResolvedValue({
                id: 100,
                sale_number: 'S-2026-00100',
                save: jest.fn()
            });
            db.Product.findAll.mockResolvedValue([
                { id: 1, base_price: 15.0, name: 'Product A' }
            ]);
            db.Sale.findByPk.mockResolvedValue({ id: 100 }); // Mock getSaleById internals si es usado internamente,
            // but getSaleById is called at the end without mocking its full response for now

            const clientId = 1;
            const items = [{ productId: 1, quantity: 2 }];

            try {
                await saleService.createSale(clientId, items);
            } catch (e) {
                // Ignorar el error del getSaleById para este test aislando la creación
            }

            // Assertions
            expect(db.sequelize.transaction).toHaveBeenCalled();
            expect(db.Sale.create).toHaveBeenCalled();
            expect(db.SaleItem.bulkCreate).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({ product_id: 1, quantity: 2, unit_price: 15, total: 30 })
                ]),
                { transaction: mockTransaction }
            );
            expect(db.InventoryMovement.bulkCreate).toHaveBeenCalled();
            expect(mockTransaction.commit).toHaveBeenCalled(); // Verifica que se confirme la transacción
            expect(erpEngine.handleSaleCreated).toHaveBeenCalledWith(100);
        });

        it('debería hacer rollback si un producto no existe', async () => {
            db.Sale.findOne.mockResolvedValue(null);
            db.Sale.create.mockResolvedValue({ id: 1, save: jest.fn() });
            db.Product.findAll.mockResolvedValue([]); // Producto no encontrado

            const clientId = 1;
            const items = [{ productId: 999, quantity: 1 }];

            await expect(saleService.createSale(clientId, items)).rejects.toThrow('Product with ID 999 not found');

            expect(mockTransaction.rollback).toHaveBeenCalled();
            expect(mockTransaction.commit).not.toHaveBeenCalled();
        });
    });
});
