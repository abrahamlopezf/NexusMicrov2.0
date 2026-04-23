const SaleService = require('../../src/services/sale.service');
const db = require('../../src/models');
const eventBus = require('../../src/events/eventBus');

jest.mock('../../src/models', () => ({
    Sale: {
        create: jest.fn(),
        findOne: jest.fn(),
        findByPk: jest.fn()
    },
    SaleItem: {
        bulkCreate: jest.fn()
    },
    Product: {
        findAll: jest.fn()
    },
    InventoryMovement: {
        bulkCreate: jest.fn()
    },
    sequelize: {
        transaction: jest.fn().mockResolvedValue({
            commit: jest.fn(),
            rollback: jest.fn()
        })
    }
}));

jest.mock('../../src/events/eventBus', () => ({
    emitEvent: jest.fn()
}));

const EVENTS = require('../../src/events/events');

describe('Sale Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createSale', () => {
        it('should create sale, saleItems, inventory movements and emit event', async () => {
            const mockSale = { id: 1, save: jest.fn() };
            const mockProduct = { id: 10, name: 'Chair', base_price: 100 };

            db.Sale.findOne.mockResolvedValue(null);
            db.Sale.create.mockResolvedValue(mockSale);
            db.Product.findAll.mockResolvedValue([mockProduct]);
            db.Sale.findByPk.mockResolvedValue(mockSale); // getSaleById mock

            const items = [{ productId: 10, quantity: 2 }];
            await SaleService.createSale(100, items);

            expect(db.SaleItem.bulkCreate).toHaveBeenCalled();
            expect(db.InventoryMovement.bulkCreate).toHaveBeenCalled();
            expect(mockSale.save).toHaveBeenCalled();
            expect(eventBus.emitEvent).toHaveBeenCalledWith(EVENTS.SALE_CREATED, mockSale);
            expect(mockSale.total).toBe(200);
            expect(mockSale.balance).toBe(200);
        });

        it('should rollback transaction on error', async () => {
            db.Sale.findOne.mockRejectedValue(new Error('DB Error'));
            await expect(SaleService.createSale(100, [])).rejects.toThrow('DB Error');
        });
    });
});
