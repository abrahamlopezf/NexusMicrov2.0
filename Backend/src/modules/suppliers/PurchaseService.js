const {
    sequelize,
    Supplier,
    Purchase,
    PurchaseItem,
    Material,
    MaterialCostHistory,
    Sale,
    SaleItem
} = require('../../models');

const AppError = require('../../utils/AppError');
const InventoryService = require('../inventory/InventoryService');

class PurchaseService {
    static toNumber(value) {
        return Number(parseFloat(value || 0).toFixed(4));
    }

    static money(value) {
        return Number(parseFloat(value || 0).toFixed(2));
    }

    static async generatePurchaseNumber() {
        const now = new Date();
        const date = now.toISOString().slice(0, 10).replace(/-/g, '');
        const random = Math.floor(1000 + Math.random() * 9000);
        return `PUR-${date}-${random}`;
    }

    static validateMaterialSupplier(supplier) {
        if (!['MATERIAL_SUPPLIER', 'MIXED'].includes(supplier.supplier_type)) {
            throw new AppError('Supplier is not allowed for material purchases', 400);
        }

        if (supplier.status !== 'ACTIVE') {
            throw new AppError('Supplier is not active', 400);
        }
    }

    static async createMaterialPurchase(data = {}, actor = null) {
        return sequelize.transaction(async (t) => {
            if (!data.supplier_id) {
                throw new AppError('supplier_id is required', 400);
            }

            if (!Array.isArray(data.items) || data.items.length === 0) {
                throw new AppError('At least one purchase item is required', 400);
            }

            const supplier = await Supplier.findByPk(data.supplier_id, {
                transaction: t
            });

            if (!supplier) {
                throw new AppError('Supplier not found', 404);
            }

            this.validateMaterialSupplier(supplier);

            let subtotal = 0;
            let tax = this.money(data.tax || 0);
            let discount = this.money(data.discount || 0);

            const purchase = await Purchase.create(
                {
                    purchase_number: data.purchase_number || (await this.generatePurchaseNumber()),
                    supplier_id: supplier.id,
                    purchase_type: data.purchase_type || 'MATERIAL_PURCHASE',
                    status: 'RECEIVED',
                    purchase_date: data.purchase_date || new Date(),
                    subtotal: 0,
                    tax,
                    discount,
                    total: 0,
                    reference: data.reference || null,
                    notes: data.notes || null,
                    created_by: actor?.id || null
                },
                {
                    transaction: t,
                    userId: actor?.id || null
                }
            );

            const createdItems = [];

            for (const item of data.items) {
                if (!item.material_id) {
                    throw new AppError('material_id is required in purchase item', 400);
                }

                const quantity = this.toNumber(item.quantity);
                const unitCost = this.toNumber(item.unit_cost);

                if (quantity <= 0) {
                    throw new AppError('Purchase item quantity must be greater than 0', 400);
                }

                if (unitCost < 0) {
                    throw new AppError('Purchase item unit_cost cannot be negative', 400);
                }

                const material = await Material.findByPk(item.material_id, {
                    transaction: t,
                    lock: t.LOCK.UPDATE
                });

                if (!material) {
                    throw new AppError(`Material ${item.material_id} not found`, 404);
                }

                const itemSubtotal = this.money(quantity * unitCost);
                const itemTax = this.money(item.tax || 0);
                const itemDiscount = this.money(item.discount || 0);
                const itemTotal = this.money(itemSubtotal + itemTax - itemDiscount);

                subtotal += itemSubtotal;

                const scopeType = String(item.scope_type || 'GENERAL').toUpperCase();

                if (!['GENERAL', 'SALE', 'SALE_ITEM'].includes(scopeType)) {
                    throw new AppError('Invalid purchase item scope_type', 400);
                }

                if (scopeType === 'SALE' && !item.sale_id) {
                    throw new AppError('sale_id is required for SALE scoped purchase item', 400);
                }

                if (scopeType === 'SALE_ITEM' && !item.sale_item_id) {
                    throw new AppError(
                        'sale_item_id is required for SALE_ITEM scoped purchase item',
                        400
                    );
                }

                if (item.sale_id) {
                    const sale = await Sale.findByPk(item.sale_id, { transaction: t });
                    if (!sale) throw new AppError('Sale not found for purchase item', 404);
                }

                if (item.sale_item_id) {
                    const saleItem = await SaleItem.findByPk(item.sale_item_id, { transaction: t });
                    if (!saleItem) throw new AppError('Sale item not found for purchase item', 404);
                }

                const purchaseItem = await PurchaseItem.create(
                    {
                        purchase_id: purchase.id,
                        material_id: material.id,
                        quantity,
                        unit_cost: unitCost,
                        subtotal: itemSubtotal,
                        tax: itemTax,
                        discount: itemDiscount,
                        total: itemTotal,
                        scope_type: scopeType,
                        sale_id: item.sale_id || null,
                        sale_item_id: item.sale_item_id || null,
                        notes: item.notes || null,
                        created_by: actor?.id || null
                    },
                    {
                        transaction: t,
                        userId: actor?.id || null
                    }
                );

                const movement = await InventoryService.createMovement(
                    {
                        material_id: material.id,
                        type: 'ENTRADA_COMPRA',
                        quantity,
                        unit_cost: unitCost,
                        scope_type: scopeType,
                        sale_id: item.sale_id || null,
                        sale_item_id: item.sale_item_id || null,
                        reference_type: 'PurchaseItem',
                        reference_id: purchaseItem.id,
                        notes: item.notes || `Compra ${purchase.purchase_number}`,
                        metadata: {
                            supplier_id: supplier.id,
                            purchase_id: purchase.id,
                            purchase_item_id: purchaseItem.id
                        }
                    },
                    actor,
                    t
                );
                const previousCost = this.toNumber(material.cost || 0);
                const shouldUpdateCost =
                    material.affects_product_cost !== false &&
                    String(material.costing_method || 'LAST_COST').toUpperCase() === 'LAST_COST';

                if (shouldUpdateCost && previousCost !== unitCost) {
                    await material.update(
                        {
                            cost: unitCost,
                            cost_updated_at: new Date(),
                            supplier_id: supplier.id,
                            updated_by: actor?.id || null
                        },
                        {
                            transaction: t,
                            userId: actor?.id || null
                        }
                    );

                    if (MaterialCostHistory) {
                        await MaterialCostHistory.create(
                            {
                                material_id: material.id,
                                previous_cost: previousCost,
                                new_cost: unitCost,
                                reason: `Actualización por compra ${purchase.purchase_number}`,
                                source: 'PURCHASE',
                                created_by: actor?.id || null
                            },
                            {
                                transaction: t,
                                userId: actor?.id || null
                            }
                        );
                    }
                }

                await purchaseItem.update(
                    {
                        material_lot_id: movement.material_lot_id || null,
                        inventory_movement_id: movement.id,
                        updated_by: actor?.id || null
                    },
                    {
                        transaction: t,
                        userId: actor?.id || null
                    }
                );

                createdItems.push(purchaseItem);
            }

            const total = this.money(subtotal + tax - discount);

            await purchase.update(
                {
                    subtotal: this.money(subtotal),
                    tax,
                    discount,
                    total,
                    updated_by: actor?.id || null
                },
                {
                    transaction: t,
                    userId: actor?.id || null
                }
            );

            return Purchase.findByPk(purchase.id, {
                include: [
                    'supplier',
                    {
                        association: 'items',
                        include: ['material', 'lot', 'inventory_movement']
                    }
                ],
                transaction: t
            });
        });
    }

    static async findAll(query = {}) {
        const where = {};

        if (query.supplier_id) {
            where.supplier_id = query.supplier_id;
        }

        if (query.status) {
            where.status = query.status;
        }

        return Purchase.findAll({
            where,
            include: [
                'supplier',
                {
                    association: 'items',
                    include: ['material']
                }
            ],
            order: [['created_at', 'DESC']]
        });
    }

    static async findById(id) {
        const purchase = await Purchase.findByPk(id, {
            include: [
                'supplier',
                {
                    association: 'items',
                    include: ['material', 'lot', 'inventory_movement']
                }
            ]
        });

        if (!purchase) {
            throw new AppError('Purchase not found', 404);
        }

        return purchase;
    }
}

module.exports = PurchaseService;
