const { Sale, SaleItem, WorkOrder, ProductionTask, Product, ProductMaterial, GlobalSetting, User, Material, Client } = require('../models');
const AppError = require('../utils/AppError');
const pricingEngine = require('../core/pricingEngine');
const LoyaltyService = require('./LoyaltyService');

class SaleService {
    static async createDraft(saleData, itemsData, userId, t) {
        
        const user = await User.findByPk(userId);
        if (!user) throw new AppError('User not found', 404);

        const settings = await GlobalSetting.findOne({ order: [['id', 'DESC']] });
        if (!settings) throw new AppError('Global settings not configured', 500);

        const pricingRules = {
            operation_margin: settings.operational_factor || 0.14,
            profit_margin: settings.profit_margin || 0.20
        };

        const costStructure = {
            labor_rate_sewing: settings.labor_rate_sewing || 44.38,
            labor_rate_pattern: settings.labor_rate_pattern || 50.50,
            fixed_supplies_costs: settings.fixed_supplies_costs || { "SENCILLO": 30 }
        };

        const sale = await Sale.create({
            sale_number: saleData.sale_number,
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
            delivery_date: saleData.delivery_date || null,
            loyalty_applied: saleData.loyalty_applied || false,
            created_by: userId
        }, { transaction: t, userId });

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
                if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
                    throw new AppError('Permission denied: Only Admin or Manager can override prices', 403);
                }
            }

            let productTemplate = null;
            let extraMaterialsForEngine = [];
            let materialsEstimate = null;

            if (item.product_id) {
                const product = await Product.findByPk(item.product_id, {
                    include: [{ model: ProductMaterial, as: 'materials', include: ['material'] }],
                    transaction: t
                });

                if (!product) throw new AppError(`Product ${item.product_id} not found`, 404);

                productTemplate = {
                    hours_sewing: parseFloat(product.hours_sewing) || 0,
                    hours_pattern: parseFloat(product.hours_pattern) || 0,
                    fixed_supply_tier: product.fixed_supply_tier || 'SENCILLO'
                };

                if (product.materials && product.materials.length > 0) {
                    materialsEstimate = product.materials.map(pm => ({
                        material_id: pm.material_id,
                        unit_price: pm.material.cost,
                        quantity: parseFloat(pm.quantity) // Base usage per unit
                    }));
                    // Calculate per unit base materials for the engine
                    extraMaterialsForEngine = extraMaterialsForEngine.concat(materialsEstimate);
                }
            }
            
            // Allow dynamic extra materials from front
            if (item.extra_materials && Array.isArray(item.extra_materials)) {
                // Must convert and validate each extra material
                for (const em of item.extra_materials) {
                     const matDB = await Material.findByPk(em.material_id, { transaction: t });
                     if(!matDB) throw new AppError(`Material ${em.material_id} not found`, 404);
                     extraMaterialsForEngine.push({
                         material_id: matDB.id,
                         quantity: parseFloat(em.quantity),
                         unit_price: matDB.cost
                     });
                }
                
                // Merge extra materials into materialsEstimate to save the complete recipe
                materialsEstimate = (materialsEstimate || []).concat(item.extra_materials.map(em => ({
                    material_id: em.material_id,
                    quantity: parseFloat(em.quantity),
                    unit_price: em.unit_price || 0 // Assuming backend overrides price? Just rely on engine calculate
                })));
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

            const saleItem = await SaleItem.create({
                sale_id: sale.id,
                product_id: item.product_id || null,
                product_variant_id: item.product_variant_id || null,
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
            }, { transaction: t, userId });
            
            createdItems.push({ ...item, saleItemId: saleItem.id, materials_estimate: materialsEstimate });
        }

        // Priorizamos el total manual si el front lo envió, de lo contrario usamos el calculado por el motor
        const finalTotal = (saleData.total !== undefined && saleData.total !== null) 
            ? parseFloat(saleData.total) 
            : totalSaleAmount;

        sale.total = finalTotal;
        sale.balance = finalTotal;
        await sale.save({ transaction: t, userId });

        // ══════════════════════════════════════════════════════════════════════
        // LOYALTY PROCESSING
        // ══════════════════════════════════════════════════════════════════════
        if (sale.client_id) {
            const totalItems = itemsData.reduce((sum, item) => sum + parseFloat(item.quantity), 0);
            
            if (sale.loyalty_applied) {
                // If they used their reward, we reset points (LoyaltyService will handle it)
                await LoyaltyService.redeemReward(sale.client_id, t);
            }
            
            // Add points for the new items
            await LoyaltyService.processSaleLoyalty(sale.client_id, sale.id, totalItems, t);
        }

        return { sale, createdItems };
    }

    static async spawnWorkOrders(saleId, createdItems, userId, t) {
        const workOrder = await WorkOrder.create({
            sale_id: saleId,
            status: 'PENDING',
            created_by: userId
        }, { transaction: t, userId });

        for (const item of createdItems) {
            await ProductionTask.create({
                work_order_id: workOrder.id,
                product_id: item.product_id || null,
                task_name: item.custom_description || 'General Production Task',
                quantity: item.quantity,
                status: 'PENDING',
                created_by: userId
            }, { transaction: t, userId });
        }
        return workOrder;
    }
}

module.exports = SaleService;
