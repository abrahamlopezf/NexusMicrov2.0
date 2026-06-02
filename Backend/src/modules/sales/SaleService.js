const {
    Sale,
    SaleItem,
    WorkOrder,
    ProductionTask,
    Product,
    ProductMaterial,
    GlobalSetting,
    User,
    Material,
    ClientGarment,
    GarmentMeasurement
} = require('../../models');
const AppError = require('../../utils/AppError');
const pricingEngine = require('../../core/pricingEngine');

class SaleService {
    static async resolveGarmentContext(item, clientId, t) {
        const clientGarmentId = item.client_garment_id || item.garment_id || null;
        const measurementId = item.measurement_id || null;

        if (!clientGarmentId && measurementId) {
            throw new AppError('measurement_id requires client_garment_id', 400);
        }

        if (!clientGarmentId) {
            return {
                client_garment_id: null,
                measurement_id: null,
                garment_snapshot: null,
                measurement_snapshot: null
            };
        }

        const garment = await ClientGarment.findByPk(clientGarmentId, {
            transaction: t,
            lock: t.LOCK.UPDATE
        });

        if (!garment) {
            throw new AppError(`Client garment ${clientGarmentId} not found`, 404);
        }

        if (Number(garment.client_id) !== Number(clientId)) {
            throw new AppError('Selected garment does not belong to sale client', 400);
        }

        if (garment.status !== 'ACTIVE') {
            throw new AppError('Selected garment is not active', 400);
        }

        let measurement = null;

        if (measurementId) {
            measurement = await GarmentMeasurement.findByPk(measurementId, {
                transaction: t,
                lock: t.LOCK.UPDATE
            });

            if (!measurement) {
                throw new AppError(`Measurement ${measurementId} not found`, 404);
            }

            if (Number(measurement.client_garment_id) !== Number(garment.id)) {
                throw new AppError('Selected measurement does not belong to selected garment', 400);
            }
        } else {
            measurement = await GarmentMeasurement.findOne({
                where: {
                    client_garment_id: garment.id,
                    is_active: true
                },
                order: [['version', 'DESC']],
                transaction: t
            });
        }

        return {
            client_garment_id: garment.id,
            measurement_id: measurement?.id || null,

            garment_snapshot: {
                id: garment.id,
                client_id: garment.client_id,
                garment_type: garment.garment_type,
                name: garment.name,
                description: garment.description,
                status: garment.status,
                notes: garment.notes,
                captured_at: new Date()
            },

            measurement_snapshot: measurement
                ? {
                      id: measurement.id,
                      client_garment_id: measurement.client_garment_id,
                      version: measurement.version,
                      measurement_data: measurement.measurement_data,
                      unit: measurement.unit,
                      notes: measurement.notes,
                      is_active: measurement.is_active,
                      taken_by: measurement.taken_by,
                      captured_at: new Date()
                  }
                : null
        };
    }

    static async generateSaleNumber(t = null) {
        const now = new Date();

        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');

        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');

        const random = Math.floor(1000 + Math.random() * 9000);

        const saleNumber = `V-${year}${month}${day}-${hours}${minutes}${seconds}-${random}`;

        const existingSale = await Sale.findOne({
            where: { sale_number: saleNumber },
            transaction: t
        });

        if (existingSale) {
            return this.generateSaleNumber(t);
        }

        return saleNumber;
    }

    static async createDraft(saleData, itemsData, userId, t) {
        if (!saleData || !saleData.client_id) {
            throw new AppError('Client ID is required', 400);
        }

        if (!Array.isArray(itemsData) || itemsData.length === 0) {
            throw new AppError('At least one item is required in the sale', 400);
        }

        const user = await User.findByPk(userId);
        if (!user) throw new AppError('User not found', 404);

        const settings = await GlobalSetting.findOne({ order: [['id', 'DESC']] });
        if (!settings) throw new AppError('Global settings not configured', 500);

        const pricingRules = {
            operation_margin: settings.operational_factor || 0.14,
            profit_margin: settings.profit_margin || 0.2
        };

        const costStructure = {
            labor_rate_sewing: settings.labor_rate_sewing || 44.38,
            labor_rate_pattern: settings.labor_rate_pattern || 50.5,
            fixed_supplies_costs: settings.fixed_supplies_costs || { SENCILLO: 30 }
        };

        const saleNumber = saleData.sale_number || (await this.generateSaleNumber(t));

        const sale = await Sale.create(
            {
                sale_number: saleNumber,
                client_id: saleData.client_id,
                quote_id: saleData.quote_id || null,
                type: saleData.type || 'NORMAL',
                is_urgent: saleData.is_urgent || false,
                financial_status: 'UNPAID',
                fulfillment_status: 'PENDING',
                total: 0,
                paid_amount: 0,
                balance: 0,
                notes: saleData.notes,
                created_by: userId
            },
            { transaction: t, userId }
        );

        const createdItems = [];
        let totalSaleAmount = 0;

        for (const item of itemsData) {
            if (item.quantity <= 0) {
                throw new AppError('Invalid item data: quantity must be positive', 400);
            }

            if (!item.product_id && !item.custom_description) {
                throw new AppError('Custom item requires description', 400);
            }

            // Security Check
            if (item.manual_price !== undefined && item.manual_price !== null) {
                if (!['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(user.role)) {
                    throw new AppError(
                        'Permission denied: Only Super Admin, Admin or Manager can override prices',
                        403
                    );
                }
            }

            let productTemplate = null;
            let extraMaterialsForEngine = [];
            let materialsEstimate = null;

            if (item.product_id) {
                const product = await Product.findByPk(item.product_id, {
                    transaction: t,
                    lock: t.LOCK.UPDATE
                });

                if (!product) {
                    throw new AppError(`Product ${item.product_id} not found`, 404);
                }

                const productMaterials = await ProductMaterial.findAll({
                    where: {
                        product_id: product.id,
                        active: true
                    },
                    include: [
                        {
                            model: Material,
                            as: 'material',
                            required: false
                        }
                    ],
                    transaction: t
                });

                productTemplate = {
                    hours_sewing:
                        item.hours_sewing !== undefined ? item.hours_sewing : product.hours_sewing,
                    hours_pattern:
                        item.hours_pattern !== undefined
                            ? item.hours_pattern
                            : product.hours_pattern,
                    fixed_supply_tier: item.supply_level || product.fixed_supply_tier
                };

                if (productMaterials && productMaterials.length > 0) {
                    const validProductMaterials = productMaterials.filter((pm) => {
                        const role = String(pm.material_role || '').toUpperCase();

                        // No incluir reglas seleccionables, como MAIN_FABRIC,
                        // porque Heka elegirá el material exacto después en POS.
                        if (!pm.material_id) return false;
                        if (pm.is_selectable === true) return false;
                        if (pm.auto_add === false) return false;
                        if (role === 'MAIN_FABRIC') return false;

                        // Si no viene material relacionado, tampoco se puede costear aquí.
                        if (!pm.material) return false;

                        return true;
                    });

                    materialsEstimate = validProductMaterials.map((pm) => ({
                        material_id: pm.material_id,
                        unit_price: pm.material?.cost || 0,
                        quantity: parseFloat(pm.quantity)
                    }));

                    extraMaterialsForEngine = extraMaterialsForEngine.concat(materialsEstimate);
                }
            } else {
                productTemplate = {
                    hours_sewing: item.hours_sewing || 0,
                    hours_pattern: item.hours_pattern || 0,
                    fixed_supply_tier: item.supply_level || 'SENCILLO'
                };
            }

            // Allow dynamic extra materials from front
            if (item.extra_materials && Array.isArray(item.extra_materials)) {
                // Must convert and validate each extra material
                for (const em of item.extra_materials) {
                    const matDB = await Material.findByPk(em.material_id, { transaction: t });
                    if (!matDB) throw new AppError(`Material ${em.material_id} not found`, 404);
                    extraMaterialsForEngine.push({
                        material_id: matDB.id,
                        quantity: parseFloat(em.quantity),
                        unit_price: matDB.cost
                    });
                }

                // Merge extra materials into materialsEstimate to save the complete recipe
                materialsEstimate = (materialsEstimate || []).concat(
                    item.extra_materials.map((em) => ({
                        material_id: em.material_id,
                        quantity: parseFloat(em.quantity),
                        unit_price: em.unit_price || 0 // Assuming backend overrides price? Just rely on engine calculate
                    }))
                );
            }

            const calculationResult = pricingEngine.calculateSaleItem({
                productTemplate,
                extraMaterials: extraMaterialsForEngine,
                costStructure,
                pricingRules,
                manualPrice: item.manual_price,
                quantity: item.quantity
            });

            totalSaleAmount += calculationResult.total;

            const garmentContext = await this.resolveGarmentContext(item, sale.client_id, t);

            const saleItem = await SaleItem.create(
                {
                    sale_id: sale.id,
                    product_id: item.product_id || null,
                    product_variant_id: item.product_variant_id || null,
                    client_garment_id: garmentContext.client_garment_id,
                    measurement_id: garmentContext.measurement_id,
                    garment_snapshot: garmentContext.garment_snapshot,
                    measurement_snapshot: garmentContext.measurement_snapshot,
                    custom_description: item.custom_description || null,
                    quantity: calculationResult.quantity,
                    unit_price: calculationResult.unit_price,
                    unit_cost: calculationResult.unit_cost,
                    total: calculationResult.total,
                    cost_breakdown: calculationResult.cost_breakdown,
                    materials_estimate: materialsEstimate,
                    original_price: calculationResult.original_price,
                    was_price_overridden: calculationResult.was_price_overridden,
                    created_by: userId
                },
                { transaction: t, userId }
            );

            createdItems.push({
                ...item,
                saleItemId: saleItem.id,
                materials_estimate: materialsEstimate,
                client_garment_id: garmentContext.client_garment_id,
                measurement_id: garmentContext.measurement_id,
                garment_snapshot: garmentContext.garment_snapshot,
                measurement_snapshot: garmentContext.measurement_snapshot
            });
        }

        sale.total = totalSaleAmount;
        sale.balance = totalSaleAmount;
        await sale.save({ transaction: t, userId });

        return { sale, createdItems };
    }

    static async spawnWorkOrders(saleId, createdItems, userId, t) {
        const createdWorkOrders = [];
        for (const item of createdItems) {
            // ═════════════════════════════════════════════════════
            // CREATE ONE WORK ORDER PER SALE ITEM
            // ═════════════════════════════════════════════════════
            const workOrder = await WorkOrder.create(
                {
                    sale_id: saleId,
                    sale_item_id: item.saleItemId,
                    status: 'PENDING',
                    created_by: userId
                },
                { transaction: t, userId }
            );

            // ═════════════════════════════════════════════════════
            // CREATE PRODUCTION TASK
            // ═════════════════════════════════════════════════════
            await ProductionTask.create(
                {
                    work_order_id: workOrder.id,
                    product_id: item.product_id || null,
                    task_name:
                        item.custom_description ||
                        item.garment_snapshot?.name ||
                        item.garment_snapshot?.garment_type ||
                        'General Production Task',
                    quantity: item.quantity,
                    status: 'PENDING',
                    created_by: userId
                },
                { transaction: t, userId }
            );

            createdWorkOrders.push(workOrder);
        }
        return createdWorkOrders;
    }
}

module.exports = SaleService;
