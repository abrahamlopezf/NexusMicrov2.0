const { Op } = require('sequelize');

const {
    Product,
    ProductMaterial,
    Material,
    MaterialCategory,
    MaterialSubcategory,
    MaterialLot,
    sequelize
} = require('../../models');

const AppError = require('../../utils/AppError');

class ProductRecipeService {
    static toNumber(value) {
        return Number(parseFloat(value || 0).toFixed(4));
    }

    static normalizeRole(value) {
        return String(value || 'SUPPLY').trim().toUpperCase();
    }

    static async validateCategoryAndSubcategory(categoryId, subcategoryId, t) {
        if (!categoryId) return { category: null, subcategory: null };

        const category = await MaterialCategory.findByPk(categoryId, { transaction: t });

        if (!category) {
            throw new AppError('Material category not found', 404);
        }

        let subcategory = null;

        if (subcategoryId) {
            subcategory = await MaterialSubcategory.findByPk(subcategoryId, {
                transaction: t
            });

            if (!subcategory) {
                throw new AppError('Material subcategory not found', 404);
            }

            if (Number(subcategory.category_id) !== Number(category.id)) {
                throw new AppError('Subcategory does not belong to selected category', 400);
            }
        }

        return { category, subcategory };
    }

    static async createMaterialRule(productId, data = {}, actor = null) {
        return sequelize.transaction(async (t) => {
            const product = await Product.findByPk(productId, { transaction: t });

            if (!product) {
                throw new AppError('Product not found', 404);
            }

            const materialRole = this.normalizeRole(data.material_role);

            let isSelectable = Boolean(data.is_selectable);
            let autoAdd = data.auto_add !== undefined ? Boolean(data.auto_add) : true;

            if (materialRole === 'MAIN_FABRIC') {
                isSelectable = true;
                autoAdd = false;
            }

            const quantity = this.toNumber(data.quantity);

            if (quantity <= 0) {
                throw new AppError('quantity must be greater than 0', 400);
            }

            let material = null;

            if (data.material_id) {
                material = await Material.findByPk(data.material_id, {
                    transaction: t
                });

                if (!material) {
                    throw new AppError('Material not found', 404);
                }
            }

            await this.validateCategoryAndSubcategory(
                data.required_category_id || null,
                data.required_subcategory_id || null,
                t
            );

            if (autoAdd && !material) {
                throw new AppError('material_id is required when auto_add is true', 400);
            }

            if (isSelectable && !data.required_category_id && !material) {
                throw new AppError('required_category_id or material_id is required for selectable rules', 400);
            }

            return ProductMaterial.create({
                product_id: product.id,
                material_id: material?.id || null,
                required_category_id: data.required_category_id || material?.category_id || null,
                required_subcategory_id: data.required_subcategory_id || material?.subcategory_id || null,
                material_role: materialRole,
                quantity,
                waste_percentage: this.toNumber(data.waste_percentage || 0),
                is_required: data.is_required !== undefined ? Boolean(data.is_required) : true,
                is_selectable: isSelectable,
                auto_add: autoAdd,
                active: data.active !== undefined ? Boolean(data.active) : true,
                notes: data.notes || null
            }, {
                transaction: t,
                userId: actor?.id || null
            });
        });
    }

    static async getProductRecipe(productId) {
        const product = await Product.findByPk(productId, {
            include: [
                {
                    model: ProductMaterial,
                    as: 'materials',
                    required: false,
                    where: { active: true },
                    include: [
                        {
                            model: Material,
                            as: 'material',
                            required: false
                        },
                        {
                            model: MaterialCategory,
                            as: 'requiredCategory',
                            required: false
                        },
                        {
                            model: MaterialSubcategory,
                            as: 'requiredSubcategory',
                            required: false
                        }
                    ]
                }
            ],
            order: [
                [{ model: ProductMaterial, as: 'materials' }, 'id', 'ASC']
            ]
        });

        if (!product) {
            throw new AppError('Product not found', 404);
        }

        return product;
    }

    static async updateMaterialRule(productId, ruleId, data = {}, actor = null) {
        return sequelize.transaction(async (t) => {
            const rule = await ProductMaterial.findOne({
                where: {
                    id: ruleId,
                    product_id: productId
                },
                transaction: t
            });

            if (!rule) {
                throw new AppError('Product material rule not found', 404);
            }

            const payload = {};

            if (data.material_role !== undefined) {
                payload.material_role = this.normalizeRole(data.material_role);
            }

            if (data.quantity !== undefined) {
                const quantity = this.toNumber(data.quantity);

                if (quantity <= 0) {
                    throw new AppError('quantity must be greater than 0', 400);
                }

                payload.quantity = quantity;
            }

            if (data.waste_percentage !== undefined) {
                payload.waste_percentage = this.toNumber(data.waste_percentage);
            }

            if (data.is_required !== undefined) {
                payload.is_required = Boolean(data.is_required);
            }

            if (data.is_selectable !== undefined) {
                payload.is_selectable = Boolean(data.is_selectable);
            }

            if (data.auto_add !== undefined) {
                payload.auto_add = Boolean(data.auto_add);
            }

            if (data.active !== undefined) {
                payload.active = Boolean(data.active);
            }

            if (data.notes !== undefined) {
                payload.notes = data.notes || null;
            }

            if (data.material_id !== undefined) {
                if (data.material_id === null || data.material_id === '') {
                    payload.material_id = null;
                } else {
                    const material = await Material.findByPk(data.material_id, {
                        transaction: t
                    });

                    if (!material) {
                        throw new AppError('Material not found', 404);
                    }

                    payload.material_id = material.id;
                }
            }

            if (
                data.required_category_id !== undefined ||
                data.required_subcategory_id !== undefined
            ) {
                await this.validateCategoryAndSubcategory(
                    data.required_category_id || rule.required_category_id || null,
                    data.required_subcategory_id || rule.required_subcategory_id || null,
                    t
                );

                if (data.required_category_id !== undefined) {
                    payload.required_category_id = data.required_category_id || null;
                }

                if (data.required_subcategory_id !== undefined) {
                    payload.required_subcategory_id = data.required_subcategory_id || null;
                }
            }

            await rule.update(payload, {
                transaction: t,
                userId: actor?.id || null
            });

            return ProductMaterial.findByPk(rule.id, {
                include: [
                    { model: Material, as: 'material', required: false },
                    { model: MaterialCategory, as: 'requiredCategory', required: false },
                    { model: MaterialSubcategory, as: 'requiredSubcategory', required: false }
                ],
                transaction: t
            });
        });
    }

    static async deleteMaterialRule(productId, ruleId) {
        const rule = await ProductMaterial.findOne({
            where: {
                id: ruleId,
                product_id: productId
            }
        });

        if (!rule) {
            throw new AppError('Product material rule not found', 404);
        }

        await rule.update({ active: false });

        return true;
    }

    static buildInventorySummary(lots = []) {
        const summary = {
            total_stock: 0,
            general_stock: 0,
            reusable_stock: 0,
            assigned_stock: 0,
            available_for_new_orders: 0
        };

        for (const lot of lots || []) {
            if (lot.status !== 'ACTIVE') continue;

            const qty = this.toNumber(lot.stock_quantity);
            const scope = String(lot.scope_type || 'GENERAL').toUpperCase();
            const origin = String(lot.lot_origin || '').toUpperCase();

            summary.total_stock += qty;

            if (scope === 'GENERAL') {
                summary.general_stock += qty;
                summary.available_for_new_orders += qty;
            } else {
                summary.assigned_stock += qty;
            }

            if (origin === 'REUSABLE') {
                summary.reusable_stock += qty;
            }
        }

        return {
            total_stock: this.toNumber(summary.total_stock),
            general_stock: this.toNumber(summary.general_stock),
            reusable_stock: this.toNumber(summary.reusable_stock),
            assigned_stock: this.toNumber(summary.assigned_stock),
            available_for_new_orders: this.toNumber(summary.available_for_new_orders)
        };
    }

    static async getSelectableMaterialOptions(productId, ruleId, query = {}) {
        const rule = await ProductMaterial.findOne({
            where: {
                id: ruleId,
                product_id: productId,
                active: true
            },
            include: [
                { model: MaterialCategory, as: 'requiredCategory', required: false },
                { model: MaterialSubcategory, as: 'requiredSubcategory', required: false }
            ]
        });

        if (!rule) {
            throw new AppError('Product material rule not found', 404);
        }

        if (!rule.is_selectable) {
            throw new AppError('This material rule is not selectable', 400);
        }

        const where = {
            status: 'ACTIVE',
            tracking_method: 'STOCK'
        };

        if (rule.required_category_id) {
            where.category_id = rule.required_category_id;
        }

        if (rule.required_subcategory_id) {
            where.subcategory_id = rule.required_subcategory_id;
        }

        if (query.color) {
            where.color = {
                [Op.iLike]: `%${String(query.color).trim()}%`
            };
        }

        const materials = await Material.findAll({
            where,
            include: [
                {
                    model: MaterialLot,
                    as: 'lots',
                    required: false,
                    where: {
                        status: 'ACTIVE'
                    }
                }
            ],
            order: [['name', 'ASC']]
        });

        return materials.map(material => {
            const plain = material.get({ plain: true });
            const lots = plain.lots || [];
            const reusableLots = lots
                .filter(lot => lot.lot_origin === 'REUSABLE' && Number(lot.stock_quantity) > 0)
                .map(lot => ({
                    lot_id: lot.id,
                    lot_code: lot.lot_code,
                    quantity: this.toNumber(lot.stock_quantity),
                    unit_cost: this.toNumber(lot.unit_cost),
                    origin_sale_id: lot.origin_sale_id,
                    origin_sale_item_id: lot.origin_sale_item_id,
                    notes: lot.notes
                }));

            return {
                material_id: plain.id,
                sku: plain.sku,
                name: plain.name,
                color: plain.color,
                unit: plain.unit,
                cost: this.toNumber(plain.cost),
                inventory_summary: this.buildInventorySummary(lots),
                reusable_lots: reusableLots
            };
        });
    }
}

module.exports = ProductRecipeService;