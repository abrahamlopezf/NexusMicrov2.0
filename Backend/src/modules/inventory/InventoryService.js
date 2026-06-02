const { Op } = require('sequelize');
const {
    Material,
    MaterialLot,
    InventoryMovement,
    MaterialCostHistory,
    Sale,
    SaleItem,
    ProductMaterial,
    SaleMaterialRequirement,
    sequelize
} = require('../../models');

const AppError = require('../../utils/AppError');

class InventoryService {
    static toNumber(value) {
        return Number(parseFloat(value || 0).toFixed(4));
    }

    static normalizeCode(value) {
        return String(value || '')
            .trim()
            .toUpperCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^A-Z0-9]/g, '')
            .slice(0, 20);
    }

    static async generateLotCode(material, scopeType = 'GENERAL') {
        const baseSku = material.sku || `MAT${material.id}`;
        const base = `LOT-${this.normalizeCode(baseSku)}-${this.normalizeCode(scopeType).slice(0, 4)}`;

        const count = await MaterialLot.count({
            where: {
                material_id: material.id
            }
        });

        const consecutive = String(count + 1).padStart(3, '0');

        return `${base}-${consecutive}`;
    }

    static getEntryTypes() {
        return ['ENTRADA_COMPRA', 'ENTRADA_MANUAL', 'ENTRADA_REUTILIZABLE', 'DEVOLUCION'];
    }

    static getOutputTypes() {
        return ['SALIDA_PRODUCCION', 'SALIDA_VENTA', 'SALIDA_MANUAL'];
    }

    static async getConsumableLots(materialId, saleId = null, saleItemId = null, t = null) {
        return MaterialLot.findAll({
            where: {
                material_id: materialId,
                status: 'ACTIVE',
                stock_quantity: {
                    [Op.gt]: 0
                },
                [Op.and]: [
                    {
                        [Op.or]: [
                            {
                                scope_type: 'GENERAL'
                            },
                            {
                                scope_type: 'SALE',
                                sale_id: saleId
                            },
                            {
                                scope_type: 'SALE_ITEM',
                                sale_item_id: saleItemId
                            }
                        ]
                    },
                    {
                        [Op.or]: [
                            {
                                lot_origin: {
                                    [Op.ne]: 'REUSABLE'
                                }
                            },
                            {
                                lot_origin: null
                            }
                        ]
                    }
                ]
            },
            order: [
                ['created_at', 'ASC'],
                ['id', 'ASC']
            ],
            transaction: t,
            lock: t ? t.LOCK.UPDATE : undefined
        });
    }

    static inferLotOrigin(type) {
        const normalizedType = String(type || '').toUpperCase();

        if (normalizedType === 'ENTRADA_COMPRA') return 'PURCHASE';
        if (normalizedType === 'ENTRADA_REUTILIZABLE') return 'REUSABLE';
        if (normalizedType === 'ENTRADA_MANUAL') return 'MANUAL';

        return 'MANUAL';
    }

    static async createLot(material, data = {}, actor = null, t) {
        const scopeType = String(data.scope_type || 'GENERAL').toUpperCase();

        if (!['GENERAL', 'SALE', 'SALE_ITEM'].includes(scopeType)) {
            throw new AppError('Invalid lot scope_type', 400);
        }

        if (scopeType === 'SALE' && !data.sale_id) {
            throw new AppError('sale_id is required for SALE scoped lots', 400);
        }

        if (scopeType === 'SALE_ITEM' && !data.sale_item_id) {
            throw new AppError('sale_item_id is required for SALE_ITEM scoped lots', 400);
        }

        const lotCode = data.lot_code || (await this.generateLotCode(material, scopeType));

        return MaterialLot.create(
            {
                material_id: material.id,
                lot_code: lotCode,
                stock_quantity: 0,
                unit_cost:
                    data.unit_cost !== undefined && data.unit_cost !== null
                        ? this.toNumber(data.unit_cost)
                        : this.toNumber(material.cost || 0),
                scope_type: scopeType,
                sale_id: data.sale_id || null,
                sale_item_id: data.sale_item_id || null,

                lot_origin: data.lot_origin || this.inferLotOrigin(data.type),
                origin_sale_id: data.origin_sale_id || data.sale_id || null,
                origin_sale_item_id: data.origin_sale_item_id || data.sale_item_id || null,
                origin_movement_id: data.origin_movement_id || null,

                status: 'ACTIVE',
                notes: data.lot_notes || data.notes || null,
                created_by: actor?.id || null
            },
            {
                transaction: t,
                userId: actor?.id || null
            }
        );
    }

    static async createMovement(data = {}, actor = null, parentTransaction = null) {
        const execute = async (t) => {
            const material = await Material.findByPk(data.material_id, {
                transaction: t,
                lock: t.LOCK.UPDATE
            });

            if (!material) {
                throw new AppError('Material not found', 404);
            }

            if (material.status !== 'ACTIVE') {
                throw new AppError('Material is not active', 400);
            }

            if (material.tracking_method !== 'STOCK') {
                throw new AppError('This material does not use stock tracking', 400);
            }

            const type = String(data.type || '').toUpperCase();
            const quantity = this.toNumber(data.quantity);

            if (!InventoryMovement.TYPES.includes(type)) {
                throw new AppError('Invalid inventory movement type', 400);
            }

            if (quantity <= 0 && type !== 'AJUSTE') {
                throw new AppError('Quantity must be greater than 0', 400);
            }

            if (type === 'AJUSTE' && quantity === 0) {
                throw new AppError('Adjustment quantity cannot be zero', 400);
            }

            const previousMaterialStock = this.toNumber(material.current_stock);
            let newMaterialStock = previousMaterialStock;

            let lot = null;

            const isEntry = this.getEntryTypes().includes(type);
            const isOutput = this.getOutputTypes().includes(type);

            if (isEntry) {
                if (data.material_lot_id) {
                    lot = await MaterialLot.findByPk(data.material_lot_id, {
                        transaction: t,
                        lock: t.LOCK.UPDATE
                    });

                    if (!lot) {
                        throw new AppError('Material lot not found', 404);
                    }

                    if (Number(lot.material_id) !== Number(material.id)) {
                        throw new AppError(
                            'Material lot does not belong to selected material',
                            400
                        );
                    }
                } else {
                    lot = await this.createLot(material, data, actor, t);
                }
            }

            if (isOutput || type === 'AJUSTE') {
                if (!data.material_lot_id) {
                    throw new AppError(
                        'material_lot_id is required for output or adjustment movements',
                        400
                    );
                }

                lot = await MaterialLot.findByPk(data.material_lot_id, {
                    transaction: t,
                    lock: t.LOCK.UPDATE
                });

                if (!lot) {
                    throw new AppError('Material lot not found', 404);
                }

                if (Number(lot.material_id) !== Number(material.id)) {
                    throw new AppError('Material lot does not belong to selected material', 400);
                }
            }

            const previousLotStock = this.toNumber(lot?.stock_quantity || 0);
            let newLotStock = previousLotStock;

            if (isEntry) {
                newLotStock = previousLotStock + quantity;
                newMaterialStock = previousMaterialStock + quantity;
            }

            if (isOutput) {
                if (previousLotStock < quantity) {
                    throw new AppError('Insufficient stock in selected lot', 400);
                }

                if (previousMaterialStock < quantity) {
                    throw new AppError('Insufficient material stock', 400);
                }

                newLotStock = previousLotStock - quantity;
                newMaterialStock = previousMaterialStock - quantity;
            }

            if (type === 'AJUSTE') {
                newLotStock = previousLotStock + quantity;
                newMaterialStock = previousMaterialStock + quantity;

                if (newLotStock < 0) {
                    throw new AppError('Adjusted lot stock cannot be negative', 400);
                }

                if (newMaterialStock < 0) {
                    throw new AppError('Adjusted material stock cannot be negative', 400);
                }
            }

            const unitCost =
                data.unit_cost !== undefined && data.unit_cost !== null
                    ? this.toNumber(data.unit_cost)
                    : this.toNumber(lot?.unit_cost || material.cost || 0);

            const totalCost = this.toNumber(Math.abs(quantity) * unitCost);

            await lot.update(
                {
                    stock_quantity: newLotStock,
                    unit_cost: unitCost,
                    updated_by: actor?.id || null
                },
                {
                    transaction: t,
                    userId: actor?.id || null
                }
            );

            await material.update(
                {
                    current_stock: newMaterialStock,
                    updated_by: actor?.id || null
                },
                {
                    transaction: t,
                    userId: actor?.id || null
                }
            );

            if (
                data.update_material_cost === true &&
                data.unit_cost !== undefined &&
                data.unit_cost !== null
            ) {
                const previousCost =
                    material.cost !== null && material.cost !== undefined
                        ? this.toNumber(material.cost)
                        : null;

                await material.update(
                    {
                        cost: unitCost,
                        cost_updated_at: new Date(),
                        updated_by: actor?.id || null
                    },
                    {
                        transaction: t,
                        userId: actor?.id || null
                    }
                );

                await MaterialCostHistory.create(
                    {
                        material_id: material.id,
                        previous_cost: previousCost,
                        new_cost: unitCost,
                        reason: data.cost_reason || `Actualización por movimiento ${type}`,
                        source: type,
                        created_by: actor?.id || null
                    },
                    {
                        transaction: t,
                        userId: actor?.id || null
                    }
                );
            }

            const movement = await InventoryMovement.create(
                {
                    material_id: material.id,
                    material_lot_id: lot.id,
                    type,
                    quantity,
                    previous_stock: previousMaterialStock,
                    new_stock: newMaterialStock,
                    previous_lot_stock: previousLotStock,
                    new_lot_stock: newLotStock,
                    unit_cost: unitCost,
                    total_cost: totalCost,
                    reference_type: data.reference_type || null,
                    reference_id: data.reference_id || null,
                    notes: data.notes || null,
                    status: 'ACTIVE',
                    created_by: actor?.id || null,
                    metadata: {
                        ...(data.metadata || {}),
                        scope_type: lot.scope_type,
                        sale_id: lot.sale_id,
                        sale_item_id: lot.sale_item_id
                    }
                },
                {
                    transaction: t,
                    userId: actor?.id || null
                }
            );

            if (isEntry && !data.material_lot_id && lot) {
                await lot.update(
                    {
                        origin_movement_id: movement.id,
                        updated_by: actor?.id || null
                    },
                    {
                        transaction: t,
                        userId: actor?.id || null
                    }
                );
            }

            return movement;
        };

        if (parentTransaction) {
            return execute(parentTransaction);
        }

        return sequelize.transaction(execute);
    }

    static async getLots(query = {}) {
        const where = {};

        if (query.material_id) where.material_id = query.material_id;
        if (query.scope_type) where.scope_type = String(query.scope_type).toUpperCase();
        if (query.sale_id) where.sale_id = query.sale_id;
        if (query.sale_item_id) where.sale_item_id = query.sale_item_id;
        if (query.status) where.status = String(query.status).toUpperCase();

        const result = await MaterialLot.findAll({
            where,
            include: [
                {
                    model: Material,
                    as: 'material',
                    required: false
                }
            ],
            order: [['created_at', 'DESC']]
        });

        return result;
    }

    static async getMovements(query = {}) {
        const where = {};

        if (query.material_id) where.material_id = query.material_id;
        if (query.material_lot_id) where.material_lot_id = query.material_lot_id;
        if (query.type) where.type = String(query.type).toUpperCase();
        if (query.status) where.status = String(query.status).toUpperCase();

        const limit = Math.min(parseInt(query.limit, 10) || 50, 100);
        const page = Math.max(parseInt(query.page, 10) || 1, 1);
        const offset = (page - 1) * limit;

        const result = await InventoryMovement.findAndCountAll({
            where,
            include: [
                {
                    model: Material,
                    as: 'material',
                    required: false
                },
                {
                    model: MaterialLot,
                    as: 'lot',
                    required: false
                }
            ],
            order: [['created_at', 'DESC']],
            limit,
            offset
        });

        return {
            count: result.count,
            page,
            limit,
            data: result.rows
        };
    }

    static async getMovementsByMaterial(materialId) {
        const material = await Material.findByPk(materialId);

        if (!material) {
            throw new AppError('Material not found', 404);
        }

        return InventoryMovement.findAll({
            where: {
                material_id: materialId
            },
            include: [
                {
                    model: MaterialLot,
                    as: 'lot',
                    required: false
                }
            ],
            order: [['created_at', 'DESC']]
        });
    }

    static async getReusableSuggestions(query = {}) {
        const materialWhere = {
            status: 'ACTIVE',
            tracking_method: 'STOCK'
        };

        if (query.material_id) {
            materialWhere.id = query.material_id;
        }

        if (query.category_id) {
            materialWhere.category_id = query.category_id;
        }

        if (query.subcategory_id) {
            materialWhere.subcategory_id = query.subcategory_id;
        }

        if (query.color) {
            materialWhere.color = {
                [Op.iLike]: `%${String(query.color).trim()}%`
            };
        }

        const minQuantity = this.toNumber(query.min_quantity || 0.0001);

        const lots = await MaterialLot.findAll({
            where: {
                scope_type: 'GENERAL',
                lot_origin: 'REUSABLE',
                status: 'ACTIVE',
                stock_quantity: {
                    [Op.gte]: minQuantity
                }
            },
            include: [
                {
                    model: Material,
                    as: 'material',
                    required: true,
                    where: materialWhere
                }
            ],
            order: [['created_at', 'DESC']]
        });

        return lots.map((lot) => ({
            lot_id: lot.id,
            lot_code: lot.lot_code,
            material_id: lot.material_id,
            material_name: lot.material?.name || null,
            sku: lot.material?.sku || null,
            category_id: lot.material?.category_id || null,
            subcategory_id: lot.material?.subcategory_id || null,
            color: lot.material?.color || null,
            unit: lot.material?.unit || null,
            available_quantity: this.toNumber(lot.stock_quantity),
            unit_cost: this.toNumber(lot.unit_cost),
            origin_sale_id: lot.origin_sale_id,
            origin_sale_item_id: lot.origin_sale_item_id,
            notes: lot.notes
        }));
    }

    static async registerReusableReturn(data = {}, actor = null) {
        return sequelize.transaction(async (t) => {
            const quantity = this.toNumber(data.quantity);

            if (!data.material_id) {
                throw new AppError('material_id is required', 400);
            }

            if (quantity <= 0) {
                throw new AppError('quantity must be greater than 0', 400);
            }

            let sourceLot = null;

            if (data.source_lot_id) {
                sourceLot = await MaterialLot.findByPk(data.source_lot_id, {
                    transaction: t,
                    lock: t.LOCK.UPDATE
                });

                if (!sourceLot) {
                    throw new AppError('Source lot not found', 404);
                }

                if (Number(sourceLot.material_id) !== Number(data.material_id)) {
                    throw new AppError('Source lot does not belong to selected material', 400);
                }

                await this.createMovement(
                    {
                        material_id: data.material_id,
                        material_lot_id: sourceLot.id,
                        type: 'SALIDA_MANUAL',
                        quantity,
                        reference_type: 'ReusableReturn',
                        reference_id: data.sale_item_id || data.sale_id || null,
                        notes: `Transferencia a reutilizable: ${data.notes || 'Sobrante reutilizable'}`,
                        metadata: {
                            reusable_return_transfer: true,
                            source_lot_id: sourceLot.id,
                            origin_sale_id: data.sale_id || sourceLot.sale_id || null,
                            origin_sale_item_id: data.sale_item_id || sourceLot.sale_item_id || null
                        }
                    },
                    actor,
                    t
                );
            }

            const entryMovement = await this.createMovement(
                {
                    material_id: data.material_id,
                    type: 'ENTRADA_REUTILIZABLE',
                    quantity,
                    unit_cost:
                        data.unit_cost !== undefined && data.unit_cost !== null
                            ? data.unit_cost
                            : sourceLot?.unit_cost || null,
                    scope_type: 'GENERAL',
                    lot_origin: 'REUSABLE',
                    origin_sale_id: data.sale_id || sourceLot?.sale_id || null,
                    origin_sale_item_id: data.sale_item_id || sourceLot?.sale_item_id || null,
                    notes: data.notes || 'Sobrante reutilizable regresado a inventario',
                    metadata: {
                        reusable_return: true,
                        source_lot_id: sourceLot?.id || null,
                        origin_sale_id: data.sale_id || sourceLot?.sale_id || null,
                        origin_sale_item_id: data.sale_item_id || sourceLot?.sale_item_id || null
                    }
                },
                actor,
                t
            );

            return entryMovement;
        });
    }

    static async createMaterialRequirement(saleId, data = {}, actor = null) {
        return sequelize.transaction(async (t) => {
            const sale = await Sale.findByPk(saleId, {
                transaction: t
            });

            if (!sale) {
                throw new AppError('Sale not found', 404);
            }

            const material = await Material.findByPk(data.material_id, {
                transaction: t
            });

            if (!material) {
                throw new AppError('Material not found', 404);
            }

            let saleItem = null;

            if (data.sale_item_id) {
                saleItem = await SaleItem.findByPk(data.sale_item_id, {
                    transaction: t
                });

                if (!saleItem) {
                    throw new AppError('Sale item not found', 404);
                }

                if (Number(saleItem.sale_id) !== Number(sale.id)) {
                    throw new AppError('Sale item does not belong to selected sale', 400);
                }
            }

            let lot = null;

            if (data.material_lot_id) {
                lot = await MaterialLot.findByPk(data.material_lot_id, {
                    transaction: t
                });

                if (!lot) {
                    throw new AppError('Material lot not found', 404);
                }

                if (Number(lot.material_id) !== Number(material.id)) {
                    throw new AppError('Material lot does not belong to selected material', 400);
                }
            }

            const source = String(data.source || 'MANUAL_EXTRA').toUpperCase();

            const duplicateControlledSources = [
                'FABRIC_SELECTED',
                'REUSABLE_SELECTED',
                'AUTO_BASE_MATERIAL'
            ];

            if (duplicateControlledSources.includes(source)) {
                const duplicateWhere = {
                    sale_id: sale.id,
                    sale_item_id: saleItem?.id || null,
                    material_id: material.id,
                    source,
                    status: {
                        [Op.notIn]: ['CANCELLED']
                    }
                };

                // Para reutilizables, el duplicado real es mismo lote reutilizable.
                if (source === 'REUSABLE_SELECTED') {
                    duplicateWhere.material_lot_id = lot?.id || null;
                }

                const existingRequirement = await SaleMaterialRequirement.findOne({
                    where: duplicateWhere,
                    transaction: t
                });

                if (existingRequirement) {
                    throw new AppError(
                        `Material requirement already exists for source ${source}`,
                        409
                    );
                }
            }

            const itemQuantity = this.toNumber(data.item_quantity || saleItem?.quantity || 1);

            const quantityPerUnit =
                data.quantity_per_unit !== undefined && data.quantity_per_unit !== null
                    ? this.toNumber(data.quantity_per_unit)
                    : null;

            let estimatedQuantity =
                data.estimated_quantity !== undefined && data.estimated_quantity !== null
                    ? this.toNumber(data.estimated_quantity)
                    : null;

            if (estimatedQuantity === null && quantityPerUnit !== null) {
                estimatedQuantity = this.toNumber(quantityPerUnit * itemQuantity);
            }

            if (estimatedQuantity === null || estimatedQuantity <= 0) {
                throw new AppError('estimated_quantity or quantity_per_unit is required', 400);
            }

            const defaultMargin = itemQuantity > 1 ? 7 : 10;

            const marginPercentage =
                data.margin_percentage !== undefined && data.margin_percentage !== null
                    ? this.toNumber(data.margin_percentage)
                    : defaultMargin;

            const plannedQuantity = this.toNumber(
                estimatedQuantity + (estimatedQuantity * marginPercentage) / 100
            );

            const estimatedWaste = this.toNumber(plannedQuantity - estimatedQuantity);

            return SaleMaterialRequirement.create(
                {
                    sale_id: sale.id,
                    sale_item_id: saleItem?.id || null,
                    material_id: material.id,
                    material_lot_id: lot?.id || null,
                    source,
                    quantity_per_unit: quantityPerUnit,
                    item_quantity: itemQuantity,
                    estimated_quantity: estimatedQuantity,
                    margin_percentage: marginPercentage,
                    planned_quantity: plannedQuantity,
                    estimated_waste: estimatedWaste,
                    unit: data.unit || material.unit || null,
                    status: 'PLANNED',
                    notes: data.notes || null,
                    metadata: data.metadata || null,
                    created_by: actor?.id || null
                },
                {
                    transaction: t,
                    userId: actor?.id || null
                }
            );
        });
    }

    static addToUnitTotals(container, unit, values = {}) {
        const normalizedUnit = unit || 'SIN_UNIDAD';

        if (!container[normalizedUnit]) {
            container[normalizedUnit] = {
                estimated_quantity: 0,
                planned_quantity: 0,
                estimated_waste: 0,
                reusable_quantity: 0,
                count: 0
            };
        }

        container[normalizedUnit].estimated_quantity += this.toNumber(
            values.estimated_quantity || 0
        );
        container[normalizedUnit].planned_quantity += this.toNumber(values.planned_quantity || 0);
        container[normalizedUnit].estimated_waste += this.toNumber(values.estimated_waste || 0);
        container[normalizedUnit].reusable_quantity += this.toNumber(values.reusable_quantity || 0);
        container[normalizedUnit].count += 1;
    }

    static roundSummaryObject(obj) {
        for (const key of Object.keys(obj)) {
            if (typeof obj[key] === 'number') {
                obj[key] = this.toNumber(obj[key]);
            } else if (obj[key] && typeof obj[key] === 'object') {
                this.roundSummaryObject(obj[key]);
            }
        }

        return obj;
    }

    static async getSaleMaterialRequirements(saleId) {
        const requirements = await SaleMaterialRequirement.findAll({
            where: {
                sale_id: saleId
            },
            include: [
                {
                    model: Material,
                    as: 'material',
                    required: false
                },
                {
                    model: MaterialLot,
                    as: 'lot',
                    required: false
                },
                {
                    model: SaleItem,
                    as: 'saleItem',
                    required: false
                }
            ],
            order: [['created_at', 'DESC']]
        });

        const rows = requirements.map((requirement) => requirement.get({ plain: true }));

        const summary = {
            sale_id: Number(saleId),
            requirements_count: rows.length,

            totals_by_unit: {},

            by_source: {},
            by_status: {},
            by_material: {},

            reusable: {
                selected_count: 0,
                selected_by_unit: {},
                selected_lots: []
            },

            planning: {
                planned_count: 0,
                approved_count: 0,
                consumed_count: 0,
                closed_count: 0,
                cancelled_count: 0
            }
        };

        for (const row of rows) {
            const unit = row.unit || row.material?.unit || 'SIN_UNIDAD';
            const source = String(row.source || 'UNKNOWN').toUpperCase();
            const status = String(row.status || 'UNKNOWN').toUpperCase();

            const estimatedQuantity = this.toNumber(row.estimated_quantity);
            const plannedQuantity = this.toNumber(row.planned_quantity);
            const estimatedWaste = this.toNumber(row.estimated_waste);

            // Totales por unidad
            this.addToUnitTotals(summary.totals_by_unit, unit, {
                estimated_quantity: estimatedQuantity,
                planned_quantity: plannedQuantity,
                estimated_waste: estimatedWaste
            });

            // Totales por source
            if (!summary.by_source[source]) {
                summary.by_source[source] = {
                    count: 0,
                    totals_by_unit: {}
                };
            }

            summary.by_source[source].count += 1;

            this.addToUnitTotals(summary.by_source[source].totals_by_unit, unit, {
                estimated_quantity: estimatedQuantity,
                planned_quantity: plannedQuantity,
                estimated_waste: estimatedWaste,
                reusable_quantity: source === 'REUSABLE_SELECTED' ? plannedQuantity : 0
            });

            // Totales por status
            if (!summary.by_status[status]) {
                summary.by_status[status] = {
                    count: 0,
                    totals_by_unit: {}
                };
            }

            summary.by_status[status].count += 1;

            this.addToUnitTotals(summary.by_status[status].totals_by_unit, unit, {
                estimated_quantity: estimatedQuantity,
                planned_quantity: plannedQuantity,
                estimated_waste: estimatedWaste
            });

            // Totales por material
            const materialKey = String(row.material_id);

            if (!summary.by_material[materialKey]) {
                summary.by_material[materialKey] = {
                    material_id: row.material_id,
                    material_name: row.material?.name || null,
                    sku: row.material?.sku || null,
                    unit,
                    count: 0,
                    estimated_quantity: 0,
                    planned_quantity: 0,
                    estimated_waste: 0,
                    reusable_quantity: 0,
                    sources: {}
                };
            }

            summary.by_material[materialKey].count += 1;
            summary.by_material[materialKey].estimated_quantity += estimatedQuantity;
            summary.by_material[materialKey].planned_quantity += plannedQuantity;
            summary.by_material[materialKey].estimated_waste += estimatedWaste;

            if (!summary.by_material[materialKey].sources[source]) {
                summary.by_material[materialKey].sources[source] = {
                    count: 0,
                    planned_quantity: 0
                };
            }

            summary.by_material[materialKey].sources[source].count += 1;
            summary.by_material[materialKey].sources[source].planned_quantity += plannedQuantity;

            if (source === 'REUSABLE_SELECTED') {
                summary.by_material[materialKey].reusable_quantity += plannedQuantity;

                summary.reusable.selected_count += 1;

                this.addToUnitTotals(summary.reusable.selected_by_unit, unit, {
                    reusable_quantity: plannedQuantity,
                    estimated_quantity: estimatedQuantity,
                    planned_quantity: plannedQuantity,
                    estimated_waste: estimatedWaste
                });

                summary.reusable.selected_lots.push({
                    requirement_id: row.id,
                    material_id: row.material_id,
                    material_name: row.material?.name || null,
                    material_lot_id: row.material_lot_id,
                    lot_code: row.lot?.lot_code || null,
                    quantity: plannedQuantity,
                    unit,
                    origin_sale_id: row.lot?.origin_sale_id || null,
                    origin_sale_item_id: row.lot?.origin_sale_item_id || null,
                    notes: row.notes || null
                });
            }

            // Contadores de estado
            if (status === 'PLANNED') summary.planning.planned_count += 1;
            if (status === 'APPROVED') summary.planning.approved_count += 1;
            if (status === 'CONSUMED') summary.planning.consumed_count += 1;
            if (status === 'CLOSED') summary.planning.closed_count += 1;
            if (status === 'CANCELLED') summary.planning.cancelled_count += 1;
        }

        summary.by_material = Object.values(summary.by_material).map((material) => {
            material.estimated_quantity = this.toNumber(material.estimated_quantity);
            material.planned_quantity = this.toNumber(material.planned_quantity);
            material.estimated_waste = this.toNumber(material.estimated_waste);
            material.reusable_quantity = this.toNumber(material.reusable_quantity);

            for (const source of Object.keys(material.sources)) {
                material.sources[source].planned_quantity = this.toNumber(
                    material.sources[source].planned_quantity
                );
            }

            return material;
        });

        this.roundSummaryObject(summary);

        return {
            count: rows.length,
            summary,
            data: rows
        };
    }

    static async generateAutoBaseRequirementsForSale(saleId, actor = null) {
        const sale = await Sale.findByPk(saleId, {
            include: [
                {
                    model: SaleItem,
                    as: 'items',
                    required: false
                }
            ]
        });

        if (!sale) {
            throw new AppError('Sale not found', 404);
        }

        const created = [];
        const skipped = [];

        for (const item of sale.items || []) {
            if (!item.product_id) continue;

            const recipe = await ProductMaterial.findAll({
                where: {
                    product_id: item.product_id,
                    active: true,
                    auto_add: true,
                    is_selectable: false
                },
                include: [
                    {
                        model: Material,
                        as: 'material',
                        required: true
                    }
                ]
            });

            for (const recipeItem of recipe) {
                const material = recipeItem.material;

                if (!material) continue;

                const materialRole = String(recipeItem.material_role || '').toUpperCase();

                // La tela principal la selecciona Heka manualmente.
                if (materialRole === 'MAIN_FABRIC') continue;
                if (material.inventory_type === 'FABRIC') continue;

                const quantityPerUnit = this.toNumber(recipeItem.quantity || 0);

                if (quantityPerUnit <= 0) continue;

                // Evitar duplicados activos para la misma venta, prenda, material y source.
                const existingRequirement = await SaleMaterialRequirement.findOne({
                    where: {
                        sale_id: sale.id,
                        sale_item_id: item.id,
                        material_id: material.id,
                        source: 'AUTO_BASE_MATERIAL',
                        status: {
                            [Op.notIn]: ['CANCELLED']
                        }
                    }
                });

                if (existingRequirement) {
                    skipped.push({
                        reason: 'AUTO_BASE_REQUIREMENT_ALREADY_EXISTS',
                        existing_requirement_id: existingRequirement.id,
                        sale_id: sale.id,
                        sale_item_id: item.id,
                        product_id: item.product_id,
                        material_id: material.id,
                        material_name: material.name,
                        material_role: materialRole,
                        source: 'AUTO_BASE_MATERIAL',
                        status: existingRequirement.status
                    });

                    continue;
                }

                const requirement = await this.createMaterialRequirement(
                    sale.id,
                    {
                        sale_item_id: item.id,
                        material_id: material.id,
                        source: 'AUTO_BASE_MATERIAL',
                        quantity_per_unit: quantityPerUnit,
                        item_quantity: item.quantity || 1,
                        margin_percentage: this.toNumber(recipeItem.waste_percentage || 5),
                        notes: 'Material base cargado automáticamente desde receta del producto',
                        metadata: {
                            recipe_rule_id: recipeItem.id,
                            material_role: materialRole,
                            product_id: item.product_id,
                            auto_generated: true
                        }
                    },
                    actor
                );

                created.push(requirement);
            }
        }

        return {
            created_count: created.length,
            skipped_count: skipped.length,
            created,
            skipped
        };
    }

    static async findActiveRequirement(where, t = null) {
        return SaleMaterialRequirement.findOne({
            where: {
                ...where,
                status: {
                    [Op.notIn]: ['CANCELLED']
                }
            },
            transaction: t
        });
    }

    static async selectRecipeMaterialForSaleItem(saleId, saleItemId, data = {}, actor = null) {
        return sequelize.transaction(async (t) => {
            if (!data.recipe_rule_id) {
                throw new AppError('recipe_rule_id is required', 400);
            }

            if (!data.material_id) {
                throw new AppError('material_id is required', 400);
            }

            const sale = await Sale.findByPk(saleId, { transaction: t });

            if (!sale) {
                throw new AppError('Sale not found', 404);
            }

            const saleItem = await SaleItem.findByPk(saleItemId, { transaction: t });

            if (!saleItem) {
                throw new AppError('Sale item not found', 404);
            }

            if (Number(saleItem.sale_id) !== Number(sale.id)) {
                throw new AppError('Sale item does not belong to selected sale', 400);
            }

            if (!saleItem.product_id) {
                throw new AppError('Sale item does not have a product_id', 400);
            }

            const rule = await ProductMaterial.findOne({
                where: {
                    id: data.recipe_rule_id,
                    product_id: saleItem.product_id,
                    active: true
                },
                transaction: t
            });

            if (!rule) {
                throw new AppError('Product material rule not found', 404);
            }

            if (!rule.is_selectable) {
                throw new AppError('This recipe rule is not selectable', 400);
            }

            const material = await Material.findByPk(data.material_id, {
                transaction: t
            });

            if (!material) {
                throw new AppError('Material not found', 404);
            }

            if (material.status !== 'ACTIVE') {
                throw new AppError('Material is not active', 400);
            }

            if (rule.material_id && Number(rule.material_id) !== Number(material.id)) {
                throw new AppError('Selected material does not match recipe rule material', 400);
            }

            if (
                rule.required_category_id &&
                Number(material.category_id) !== Number(rule.required_category_id)
            ) {
                throw new AppError('Selected material does not match required category', 400);
            }

            if (
                rule.required_subcategory_id &&
                Number(material.subcategory_id) !== Number(rule.required_subcategory_id)
            ) {
                throw new AppError('Selected material does not match required subcategory', 400);
            }

            const materialRole = String(rule.material_role || 'SUPPLY').toUpperCase();

            const source = data.source
                ? String(data.source).toUpperCase()
                : materialRole === 'MAIN_FABRIC'
                  ? 'FABRIC_SELECTED'
                  : 'MATERIAL_SELECTED';

            const itemQuantity = this.toNumber(data.item_quantity || saleItem.quantity || 1);

            const quantityPerUnit = this.toNumber(rule.quantity || 0);

            if (quantityPerUnit <= 0) {
                throw new AppError('Recipe rule quantity must be greater than 0', 400);
            }

            const marginPercentage =
                data.margin_percentage !== undefined && data.margin_percentage !== null
                    ? this.toNumber(data.margin_percentage)
                    : this.toNumber(rule.waste_percentage || 0);

            const estimatedQuantity = this.toNumber(quantityPerUnit * itemQuantity);
            const plannedQuantity = this.toNumber(
                estimatedQuantity + (estimatedQuantity * marginPercentage) / 100
            );
            const estimatedWaste = this.toNumber(plannedQuantity - estimatedQuantity);

            const result = {
                created_count: 0,
                skipped_count: 0,
                created: [],
                skipped: [],
                recipe_rule: {
                    id: rule.id,
                    material_role: materialRole,
                    quantity_per_unit: quantityPerUnit,
                    margin_percentage: marginPercentage,
                    is_selectable: rule.is_selectable,
                    auto_add: rule.auto_add
                },
                selected_material: {
                    id: material.id,
                    name: material.name,
                    sku: material.sku,
                    unit: material.unit,
                    color: material.color
                },
                selected_lot: null
            };

            const existingDemand = await this.findActiveRequirement(
                {
                    sale_id: sale.id,
                    sale_item_id: saleItem.id,
                    material_id: material.id,
                    source
                },
                t
            );

            let demandRequirement = null;

            if (existingDemand) {
                result.skipped_count += 1;
                result.skipped.push({
                    reason: 'MATERIAL_REQUIREMENT_ALREADY_EXISTS',
                    existing_requirement_id: existingDemand.id,
                    sale_id: sale.id,
                    sale_item_id: saleItem.id,
                    material_id: material.id,
                    source,
                    status: existingDemand.status
                });
            } else {
                demandRequirement = await SaleMaterialRequirement.create(
                    {
                        sale_id: sale.id,
                        sale_item_id: saleItem.id,
                        material_id: material.id,
                        material_lot_id: null,
                        source,
                        quantity_per_unit: quantityPerUnit,
                        item_quantity: itemQuantity,
                        estimated_quantity: estimatedQuantity,
                        margin_percentage: marginPercentage,
                        planned_quantity: plannedQuantity,
                        estimated_waste: estimatedWaste,
                        unit: material.unit || null,
                        status: 'PLANNED',
                        notes: data.notes || `Material seleccionado desde receta: ${materialRole}`,
                        metadata: {
                            ...(data.metadata || {}),
                            recipe_rule_id: rule.id,
                            material_role: materialRole,
                            product_id: saleItem.product_id,
                            selected_from_pos: true
                        },
                        created_by: actor?.id || null
                    },
                    {
                        transaction: t,
                        userId: actor?.id || null
                    }
                );

                result.created_count += 1;
                result.created.push(demandRequirement);
            }

            if (data.material_lot_id) {
                const lot = await MaterialLot.findByPk(data.material_lot_id, {
                    transaction: t,
                    lock: t.LOCK.UPDATE
                });

                if (!lot) {
                    throw new AppError('Material lot not found', 404);
                }

                if (Number(lot.material_id) !== Number(material.id)) {
                    throw new AppError('Selected lot does not belong to selected material', 400);
                }

                result.selected_lot = {
                    id: lot.id,
                    lot_code: lot.lot_code,
                    stock_quantity: this.toNumber(lot.stock_quantity),
                    lot_origin: lot.lot_origin,
                    scope_type: lot.scope_type
                };

                const shouldUseReusable =
                    data.use_reusable === true ||
                    String(lot.lot_origin || '').toUpperCase() === 'REUSABLE';

                if (shouldUseReusable) {
                    if (String(lot.lot_origin || '').toUpperCase() !== 'REUSABLE') {
                        throw new AppError('Selected lot is not reusable', 400);
                    }

                    const availableReusable = this.toNumber(lot.stock_quantity || 0);

                    if (availableReusable <= 0) {
                        throw new AppError('Reusable lot has no available stock', 400);
                    }

                    const reusableQuantity =
                        data.reusable_quantity !== undefined && data.reusable_quantity !== null
                            ? this.toNumber(data.reusable_quantity)
                            : this.toNumber(Math.min(availableReusable, plannedQuantity));

                    if (reusableQuantity <= 0) {
                        throw new AppError('Reusable quantity must be greater than 0', 400);
                    }

                    if (reusableQuantity > availableReusable) {
                        throw new AppError('Reusable quantity exceeds lot stock', 400);
                    }

                    const existingReusable = await this.findActiveRequirement(
                        {
                            sale_id: sale.id,
                            sale_item_id: saleItem.id,
                            material_id: material.id,
                            material_lot_id: lot.id,
                            source: 'REUSABLE_SELECTED'
                        },
                        t
                    );

                    if (existingReusable) {
                        result.skipped_count += 1;
                        result.skipped.push({
                            reason: 'REUSABLE_REQUIREMENT_ALREADY_EXISTS',
                            existing_requirement_id: existingReusable.id,
                            sale_id: sale.id,
                            sale_item_id: saleItem.id,
                            material_id: material.id,
                            material_lot_id: lot.id,
                            source: 'REUSABLE_SELECTED',
                            status: existingReusable.status
                        });
                    } else {
                        const reusableRequirement = await SaleMaterialRequirement.create(
                            {
                                sale_id: sale.id,
                                sale_item_id: saleItem.id,
                                material_id: material.id,
                                material_lot_id: lot.id,
                                source: 'REUSABLE_SELECTED',
                                quantity_per_unit: null,
                                item_quantity: itemQuantity,
                                estimated_quantity: reusableQuantity,
                                margin_percentage: 0,
                                planned_quantity: reusableQuantity,
                                estimated_waste: 0,
                                unit: material.unit || null,
                                status: 'PLANNED',
                                notes:
                                    data.reusable_notes || `Uso de reutilizable: ${material.name}`,
                                metadata: {
                                    ...(data.metadata || {}),
                                    recipe_rule_id: rule.id,
                                    material_role: materialRole,
                                    product_id: saleItem.product_id,
                                    selected_from_pos: true,
                                    reusable_selected: true,
                                    reusable_lot_id: lot.id
                                },
                                created_by: actor?.id || null
                            },
                            {
                                transaction: t,
                                userId: actor?.id || null
                            }
                        );

                        result.created_count += 1;
                        result.created.push(reusableRequirement);
                    }
                }
            }

            return result;
        });
    }

    static async consumePlannedMaterialsForSaleItem(saleId, saleItemId, data = {}, actor = null) {
        return sequelize.transaction(async (t) => {
            const sale = await Sale.findByPk(saleId, {
                transaction: t,
                lock: t.LOCK.UPDATE
            });

            if (!sale) {
                throw new AppError('Sale not found', 404);
            }

            const saleItem = await SaleItem.findByPk(saleItemId, {
                transaction: t,
                lock: t.LOCK.UPDATE
            });

            if (!saleItem) {
                throw new AppError('Sale item not found', 404);
            }

            if (Number(saleItem.sale_id) !== Number(sale.id)) {
                throw new AppError('Sale item does not belong to selected sale', 400);
            }

            const requirements = await SaleMaterialRequirement.findAll({
                where: {
                    sale_id: sale.id,
                    sale_item_id: saleItem.id,
                    status: 'PLANNED'
                },
                include: [
                    {
                        model: Material,
                        as: 'material',
                        required: true
                    }
                ],
                order: [['id', 'ASC']],
                transaction: t,
                lock: {
                    level: t.LOCK.UPDATE,
                    of: SaleMaterialRequirement
                }
            });

            if (!requirements.length) {
                return {
                    sale_id: sale.id,
                    sale_item_id: saleItem.id,
                    consumed_count: 0,
                    skipped_count: 0,
                    movements: [],
                    message: 'No planned material requirements found'
                };
            }

            const quantityOverrides = data.quantities || {};
            const consumed = [];
            const skipped = [];
            const movements = [];

            const reusableCoverageByMaterial = {};

            const reusableRequirements = requirements.filter(
                (req) => String(req.source || '').toUpperCase() === 'REUSABLE_SELECTED'
            );

            const demandRequirements = requirements.filter(
                (req) => String(req.source || '').toUpperCase() !== 'REUSABLE_SELECTED'
            );

            // 1. Consumir reutilizables seleccionados
            for (const req of reusableRequirements) {
                const plannedQty = this.toNumber(req.planned_quantity);
                const overrideQty = quantityOverrides[req.id];

                const qtyToConsume =
                    overrideQty !== undefined && overrideQty !== null
                        ? this.toNumber(overrideQty)
                        : plannedQty;

                if (qtyToConsume <= 0) {
                    skipped.push({
                        requirement_id: req.id,
                        reason: 'ZERO_REUSABLE_CONSUMPTION'
                    });
                    continue;
                }

                if (!req.material_lot_id) {
                    throw new AppError(
                        `Reusable requirement ${req.id} requires material_lot_id`,
                        400
                    );
                }

                const lot = await MaterialLot.findByPk(req.material_lot_id, {
                    transaction: t,
                    lock: t.LOCK.UPDATE
                });

                if (!lot) {
                    throw new AppError(`Lot ${req.material_lot_id} not found`, 404);
                }

                if (String(lot.lot_origin || '').toUpperCase() !== 'REUSABLE') {
                    throw new AppError(`Lot ${lot.lot_code} is not reusable`, 400);
                }

                const movement = await this.consumeFromSpecificLot({
                    sale,
                    saleItem,
                    requirement: req,
                    lot,
                    quantity: qtyToConsume,
                    actor,
                    transaction: t
                });

                movements.push(movement);

                const materialKey = String(req.material_id);
                reusableCoverageByMaterial[materialKey] = this.toNumber(
                    (reusableCoverageByMaterial[materialKey] || 0) + qtyToConsume
                );

                await req.update(
                    {
                        status: 'CONSUMED',
                        consumed_quantity: qtyToConsume,
                        consumed_at: new Date(),
                        consumed_by: actor?.id || null,
                        consumption_metadata: {
                            movement_ids: [movement.id],
                            consumed_from_reusable: true,
                            lot_id: lot.id,
                            lot_code: lot.lot_code
                        },
                        updated_by: actor?.id || null
                    },
                    {
                        transaction: t,
                        userId: actor?.id || null
                    }
                );

                consumed.push({
                    requirement_id: req.id,
                    material_id: req.material_id,
                    material_name: req.material?.name || null,
                    source: req.source,
                    consumed_quantity: qtyToConsume,
                    movement_ids: [movement.id],
                    covered_by_reusable: 0
                });
            }

            // 2. Consumir demanda neta
            for (const req of demandRequirements) {
                const plannedQty = this.toNumber(req.planned_quantity);
                const overrideQty = quantityOverrides[req.id];

                const requestedQty =
                    overrideQty !== undefined && overrideQty !== null
                        ? this.toNumber(overrideQty)
                        : plannedQty;

                if (requestedQty <= 0) {
                    skipped.push({
                        requirement_id: req.id,
                        reason: 'ZERO_DEMAND_CONSUMPTION'
                    });
                    continue;
                }

                const materialKey = String(req.material_id);
                const availableReusableCoverage = this.toNumber(
                    reusableCoverageByMaterial[materialKey] || 0
                );

                const coveredByReusable = this.toNumber(
                    Math.min(availableReusableCoverage, requestedQty)
                );

                reusableCoverageByMaterial[materialKey] = this.toNumber(
                    availableReusableCoverage - coveredByReusable
                );

                const netToConsume = this.toNumber(requestedQty - coveredByReusable);

                let reqMovements = [];

                if (netToConsume > 0) {
                    if (req.material_lot_id) {
                        const lot = await MaterialLot.findByPk(req.material_lot_id, {
                            transaction: t,
                            lock: t.LOCK.UPDATE
                        });

                        if (!lot) {
                            throw new AppError(`Lot ${req.material_lot_id} not found`, 404);
                        }

                        const movement = await this.consumeFromSpecificLot({
                            sale,
                            saleItem,
                            requirement: req,
                            lot,
                            quantity: netToConsume,
                            actor,
                            transaction: t
                        });

                        reqMovements = [movement];
                    } else {
                        reqMovements = await this.consumeFromAvailableLots({
                            sale,
                            saleItem,
                            requirement: req,
                            quantity: netToConsume,
                            actor,
                            transaction: t
                        });
                    }

                    movements.push(...reqMovements);
                }

                await req.update(
                    {
                        status: 'CONSUMED',
                        consumed_quantity: netToConsume,
                        consumed_at: new Date(),
                        consumed_by: actor?.id || null,
                        consumption_metadata: {
                            movement_ids: reqMovements.map((m) => m.id),
                            requested_quantity: requestedQty,
                            covered_by_reusable: coveredByReusable,
                            net_consumed_from_stock: netToConsume
                        },
                        updated_by: actor?.id || null
                    },
                    {
                        transaction: t,
                        userId: actor?.id || null
                    }
                );

                consumed.push({
                    requirement_id: req.id,
                    material_id: req.material_id,
                    material_name: req.material?.name || null,
                    source: req.source,
                    requested_quantity: requestedQty,
                    covered_by_reusable: coveredByReusable,
                    consumed_quantity: netToConsume,
                    movement_ids: reqMovements.map((m) => m.id)
                });
            }

            const realMaterialsUsed = {
                consumed_at: new Date(),
                consumed_by: actor?.id || null,
                source: 'PLANNED_REQUIREMENTS',
                consumed,
                skipped,
                movement_ids: movements.map((m) => m.id)
            };

            await saleItem.update(
                {
                    real_materials_used: realMaterialsUsed,
                    updated_by: actor?.id || null
                },
                {
                    transaction: t,
                    userId: actor?.id || null
                }
            );

            return {
                sale_id: sale.id,
                sale_item_id: saleItem.id,
                consumed_count: consumed.length,
                skipped_count: skipped.length,
                movements_count: movements.length,
                movement_ids: movements.map((m) => m.id),
                consumed,
                skipped,
                real_materials_used: realMaterialsUsed
            };
        });
    }

    static async consumeFromSpecificLot({
        sale,
        saleItem,
        requirement,
        lot,
        quantity,
        actor,
        transaction
    }) {
        const qty = this.toNumber(quantity);

        if (qty <= 0) {
            throw new AppError('Consumption quantity must be greater than 0', 400);
        }

        if (!lot) {
            throw new AppError('Material lot is required for specific lot consumption', 400);
        }

        const available = this.toNumber(lot.stock_quantity);

        if (available < qty) {
            throw new AppError(
                `Insufficient stock in lot ${lot.lot_code}. Available: ${available}, required: ${qty}`,
                400
            );
        }

        const movement = await this.createMovement(
            {
                material_id: requirement.material_id,
                material_lot_id: lot.id,
                type: 'SALIDA_PRODUCCION',
                quantity: qty,
                scope_type: 'SALE_ITEM',
                sale_id: sale.id,
                sale_item_id: saleItem.id,
                reference_type: 'SaleItem',
                reference_id: saleItem.id,
                notes: `Consumo real de producción para venta ${sale.sale_number || sale.id}`,
                metadata: {
                    sale_id: sale.id,
                    sale_item_id: saleItem.id,
                    requirement_id: requirement.id,
                    source: requirement.source,
                    consumed_from: 'SPECIFIC_LOT',
                    source_lot_id: lot.id,
                    source_lot_code: lot.lot_code,
                    source_lot_scope_type: lot.scope_type,
                    source_lot_sale_id: lot.sale_id,
                    source_lot_sale_item_id: lot.sale_item_id
                }
            },
            actor,
            transaction
        );

        return movement;
    }

    static async consumeFromAvailableLots({
        sale,
        saleItem,
        requirement,
        quantity,
        actor,
        transaction
    }) {
        let remaining = this.toNumber(quantity);
        const movements = [];

        if (remaining <= 0) {
            return movements;
        }

        const lots = await this.getConsumableLots(
            requirement.material_id,
            sale.id,
            saleItem.id,
            transaction
        );

        for (const lot of lots) {
            if (remaining <= 0) break;

            const available = this.toNumber(lot.stock_quantity);
            if (available <= 0) continue;

            const qtyToConsume = this.toNumber(Math.min(available, remaining));

            const movement = await this.createMovement(
                {
                    material_id: requirement.material_id,
                    material_lot_id: lot.id,
                    type: 'SALIDA_PRODUCCION',
                    quantity: qtyToConsume,
                    scope_type: 'SALE_ITEM',
                    sale_id: sale.id,
                    sale_item_id: saleItem.id,
                    reference_type: 'SaleItem',
                    reference_id: saleItem.id,
                    notes: `Consumo real de producción para venta ${sale.sale_number || sale.id}`,
                    metadata: {
                        sale_id: sale.id,
                        sale_item_id: saleItem.id,
                        requirement_id: requirement.id,
                        source: requirement.source,
                        consumed_from: 'AVAILABLE_LOTS',
                        source_lot_id: lot.id,
                        source_lot_code: lot.lot_code,
                        source_lot_scope_type: lot.scope_type,
                        source_lot_sale_id: lot.sale_id,
                        source_lot_sale_item_id: lot.sale_item_id
                    }
                },
                actor,
                transaction
            );

            movements.push(movement);
            remaining = this.toNumber(remaining - qtyToConsume);
        }

        if (remaining > 0) {
            const material = await Material.findByPk(requirement.material_id, {
                transaction
            });

            throw new AppError(
                `Insufficient stock for material ${material?.name || requirement.material_id}. Missing: ${remaining}`,
                400
            );
        }

        return movements;
    }
}

module.exports = InventoryService;
