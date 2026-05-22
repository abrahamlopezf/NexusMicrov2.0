const { Product, ProductMaterial, ProductCostConfig, GlobalSetting, Material } = require('../../models');
const pricingEngine = require('../../core/pricingEngine');
const sequelize = require('../../config/database');
const AppError = require('../../utils/AppError');

class CostCalculationService {
    static async calculateProductPrice(productId, transaction = null) {
        const product = await Product.findByPk(productId, {
            include: [
                { model: ProductMaterial, as: 'materials', include: [{ model: Material, as: 'material' }] },
                { model: ProductCostConfig, as: 'cost_config' }
            ],
            transaction
        });

        if (!product) throw new AppError('Producto no encontrado', 404);

        // Fetch Global Settings as fallback
        const settings = await GlobalSetting.findOne({ order: [['id', 'DESC']] });
        if (!settings) throw new AppError('Configuración global faltante', 500);

        const config = product.cost_config || {};

        // Prepare Pricing Engine arguments
        const productTemplate = {
            hours_sewing: config.sewing_hours || 0,
            hours_pattern: config.pattern_hours || 0,
            fixed_supply_tier: 'CUSTOM' // Forcing override to use fixed_supply_cost directly
        };

        const costStructure = {
            labor_rate_sewing: settings.labor_rate_sewing || 44.38,
            labor_rate_pattern: settings.labor_rate_pattern || 50.50,
            fixed_supplies_costs: {
                'CUSTOM': config.fixed_supply_cost || 0
            }
        };

        const pricingRules = {
            operation_margin: config.operation_margin ?? settings.operational_factor,
            profit_margin: config.profit_margin ?? settings.profit_margin
        };

        const engineMaterials = product.materials ? product.materials.map(pm => ({
            material_id: pm.material_id,
            unit_price: pm.material.cost,
            quantity: parseFloat(pm.quantity),
            waste_percentage: parseFloat(pm.waste_percentage || 0)
        })) : [];

        // Run Pure Function
        const result = pricingEngine.calculateSaleItem({
            productTemplate,
            extraMaterials: engineMaterials,
            costStructure,
            pricingRules,
            quantity: 1
        });

        return {
            base_cost: result.cost_breakdown.subtotal_cost,
            operational_cost: result.cost_breakdown.operational_cost,
            final_price: result.unit_price,
            cost_breakdown: result.cost_breakdown,
            snapshot: {
                materials: engineMaterials,
                margins: pricingRules,
                hours: { sewing: productTemplate.hours_sewing, pattern: productTemplate.hours_pattern },
                cost_config: config
            }
        };
    }
}

class ProductService {
    static async createProduct(data, materials, costConfig, userId) {
        return await sequelize.transaction(async (t) => {
            // 1. Create Product
            const product = await Product.create({
                name: data.name,
                category: data.category,
                description: data.description,
                is_custom: data.is_custom || false,
                attributes: data.attributes || {},
                created_by: userId
            }, { transaction: t });

            // 2. Create Cost Config
            await ProductCostConfig.create({
                ...costConfig,
                product_id: product.id,
                version: 1,
                created_by: userId
            }, { transaction: t });

            // 3. Attach Materials
            if (materials && materials.length > 0) {
                const materialsPayload = materials.map(m => ({
                    product_id: product.id,
                    material_id: m.material_id,
                    quantity: m.quantity,
                    waste_percentage: m.waste_percentage || 0
                }));
                await ProductMaterial.bulkCreate(materialsPayload, { transaction: t });
            }

            // 4. Calculate price and persist it
            const priceResult = await CostCalculationService.calculateProductPrice(product.id, t);
            await product.update({ base_price: priceResult.final_price }, { transaction: t });

            return product;
        });
    }

    static async updateProduct(id, data, materials, costConfig, userId) {
        return await sequelize.transaction(async (t) => {
            const product = await Product.findByPk(id, { transaction: t });
            if (!product) throw new AppError('Producto no encontrado', 404);

            // Update product basic fields
            await product.update({
                name: data.name,
                category: data.category,
                description: data.description,
                is_custom: data.is_custom,
                attributes: data.attributes,
                updated_by: userId
            }, { transaction: t });



            if (costConfig) {
                const oldConfig = await ProductCostConfig.findOne({ where: { product_id: product.id }, transaction: t });
                if (oldConfig) {
                    await oldConfig.update({
                        ...costConfig,
                        version: oldConfig.version + 1
                    }, { transaction: t });
                } else {
                    await ProductCostConfig.create({
                        ...costConfig,
                        product_id: product.id,
                        version: 1,
                        created_by: userId
                    }, { transaction: t });
                }
            }

            if (materials) {
                await ProductMaterial.destroy({ where: { product_id: product.id }, transaction: t });
                if (materials.length > 0) {
                    const materialsPayload = materials.map(m => ({
                        product_id: product.id,
                        material_id: m.material_id,
                        quantity: m.quantity,
                        waste_percentage: m.waste_percentage || 0
                    }));
                    await ProductMaterial.bulkCreate(materialsPayload, { transaction: t });
                }
            }

            // After handling cost config and materials, recalculate price
            const finalPriceResult = await CostCalculationService.calculateProductPrice(product.id, t);
            await product.update({ base_price: finalPriceResult.final_price }, { transaction: t });

            return product;
        });
    }

    static async getProductWithCost(id) {
        return await CostCalculationService.calculateProductPrice(id);
    }
}

module.exports = { ProductService, CostCalculationService };
