const { Op } = require('sequelize');
const {
    Material,
    MaterialCategory,
    MaterialSubcategory,
    MaterialCostHistory,
    MaterialLot,
    sequelize
} = require('../../models');
const AppError = require('../../utils/AppError');

class MaterialService {
    static normalizeCode(value) {
        return String(value || '')
            .trim()
            .toUpperCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^A-Z0-9]/g, '')
            .slice(0, 12);
    }

    static normalizeText(value) {
        if (value === undefined) return undefined;
        if (value === null) return null;

        const text = String(value).trim();
        return text || null;
    }

    static toNumber(value) {
        return Number(parseFloat(value || 0).toFixed(4));
    }

    static buildInventorySummary(lots = []) {
        const summary = {
            total_stock: 0,
            general_stock: 0,
            assigned_stock: 0,
            available_for_new_orders: 0,
            by_scope: {
                GENERAL: 0,
                SALE: 0,
                SALE_ITEM: 0
            }
        };

        for (const lot of lots || []) {
            if (lot.status && lot.status !== 'ACTIVE') continue;

            const scope = String(lot.scope_type || 'GENERAL').toUpperCase();
            const quantity = this.toNumber(lot.stock_quantity || 0);

            summary.total_stock += quantity;

            if (!summary.by_scope[scope]) {
                summary.by_scope[scope] = 0;
            }

            summary.by_scope[scope] += quantity;

            if (scope === 'GENERAL') {
                summary.general_stock += quantity;
            } else {
                summary.assigned_stock += quantity;
            }
        }

        summary.available_for_new_orders = summary.general_stock;

        return {
            total_stock: this.toNumber(summary.total_stock),
            general_stock: this.toNumber(summary.general_stock),
            assigned_stock: this.toNumber(summary.assigned_stock),
            available_for_new_orders: this.toNumber(summary.available_for_new_orders),
            by_scope: {
                GENERAL: this.toNumber(summary.by_scope.GENERAL || 0),
                SALE: this.toNumber(summary.by_scope.SALE || 0),
                SALE_ITEM: this.toNumber(summary.by_scope.SALE_ITEM || 0)
            }
        };
    }

    static getDefaultsByInventoryType(inventoryType) {
        const type = String(inventoryType || 'CONSUMABLE').toUpperCase();

        const defaults = {
            CONSUMABLE: {
                tracking_method: 'STOCK',
                affects_product_cost: true,
                costing_method: 'LAST_COST'
            },
            FABRIC: {
                tracking_method: 'STOCK',
                affects_product_cost: true,
                costing_method: 'LAST_COST'
            },
            TOOL: {
                tracking_method: 'ASSET',
                affects_product_cost: false,
                costing_method: 'NONE'
            },
            OFFICE_SUPPLY: {
                tracking_method: 'EXPENSE_ONLY',
                affects_product_cost: false,
                costing_method: 'NONE'
            },
            MACHINE: {
                tracking_method: 'ASSET',
                affects_product_cost: false,
                costing_method: 'NONE'
            },
            SPARE_PART: {
                tracking_method: 'STOCK',
                affects_product_cost: false,
                costing_method: 'LAST_COST'
            },
            SERVICE: {
                tracking_method: 'EXPENSE_ONLY',
                affects_product_cost: false,
                costing_method: 'NONE'
            }
        };

        return defaults[type] || defaults.CONSUMABLE;
    }

    static async createCategory(data = {}) {
        const name = this.normalizeText(data.name);

        if (!name) {
            throw new AppError('Category name is required', 400);
        }

        const code = this.normalizeCode(data.code || name);

        if (!code) {
            throw new AppError('Category code is required', 400);
        }

        return MaterialCategory.create({
            name,
            code,
            description: data.description || null,
            active: data.active !== undefined ? Boolean(data.active) : true
        });
    }

    static async createSubcategory(data = {}) {
        const name = this.normalizeText(data.name);

        if (!name) {
            throw new AppError('Subcategory name is required', 400);
        }

        const category = await MaterialCategory.findByPk(data.category_id);

        if (!category) {
            throw new AppError('Category not found', 404);
        }

        const code = this.normalizeCode(data.code || name);

        return MaterialSubcategory.create({
            category_id: category.id,
            name,
            code,
            description: data.description || null,
            active: data.active !== undefined ? Boolean(data.active) : true
        });
    }

    static async getCategories() {
        return MaterialCategory.findAll({
            include: [
                {
                    model: MaterialSubcategory,
                    as: 'subcategories',
                    required: false
                }
            ],
            order: [
                ['name', 'ASC'],
                [{ model: MaterialSubcategory, as: 'subcategories' }, 'name', 'ASC']
            ]
        });
    }

    static async generateSku({ category, subcategory, color, size }) {
        const categoryCode = this.normalizeCode(category?.code || 'MAT').slice(0, 4);
        const subcategoryCode = this.normalizeCode(subcategory?.code || 'GEN').slice(0, 4);
        const colorCode = this.normalizeCode(color || 'NA').slice(0, 4);
        const sizeCode = this.normalizeCode(size || '').slice(0, 6);

        const base = [categoryCode, subcategoryCode, colorCode, sizeCode].filter(Boolean).join('-');

        const count = await Material.count({
            where: {
                sku: {
                    [Op.like]: `${base}-%`
                }
            }
        });

        const consecutive = String(count + 1).padStart(3, '0');
        return `${base}-${consecutive}`;
    }

    static async createMaterial(data = {}, actor = null) {
        return sequelize.transaction(async (t) => {
            const name = this.normalizeText(data.name);

            if (!name) {
                throw new AppError('Material name is required', 400);
            }

            const inventoryType = String(data.inventory_type || 'CONSUMABLE').toUpperCase();
            const defaults = this.getDefaultsByInventoryType(inventoryType);

            let category = null;
            let subcategory = null;

            if (data.category_id) {
                category = await MaterialCategory.findByPk(data.category_id, {
                    transaction: t
                });

                if (!category) {
                    throw new AppError('Category not found', 404);
                }
            }

            if (data.subcategory_id) {
                subcategory = await MaterialSubcategory.findByPk(data.subcategory_id, {
                    transaction: t
                });

                if (!subcategory) {
                    throw new AppError('Subcategory not found', 404);
                }

                if (category && Number(subcategory.category_id) !== Number(category.id)) {
                    throw new AppError('Subcategory does not belong to selected category', 400);
                }
            }

            const cost =
                data.cost !== undefined && data.cost !== null ? this.toNumber(data.cost) : null;

            const sku =
                data.sku ||
                (await this.generateSku({
                    category,
                    subcategory,
                    color: data.color,
                    size: data.size
                }));

            const material = await Material.create(
                {
                    sku,
                    name,
                    description: data.description || null,
                    category_id: category?.id || null,
                    subcategory_id: subcategory?.id || null,
                    color: this.normalizeText(data.color),
                    size: this.normalizeText(data.size),
                    brand: this.normalizeText(data.brand),
                    unit: this.normalizeText(data.unit) || 'PZA',

                    inventory_type: inventoryType,
                    tracking_method: data.tracking_method || defaults.tracking_method,
                    affects_product_cost:
                        data.affects_product_cost !== undefined
                            ? Boolean(data.affects_product_cost)
                            : defaults.affects_product_cost,
                    costing_method: data.costing_method || defaults.costing_method,

                    current_stock: this.toNumber(data.current_stock || 0),
                    reserved_stock: 0,
                    min_stock: this.toNumber(data.min_stock || 0),

                    cost,
                    cost_updated_at: cost !== null ? new Date() : null,
                    status: String(data.status || 'ACTIVE').toUpperCase(),

                    supplier_id: data.supplier_id || null,
                    created_by: actor?.id || null
                },
                {
                    transaction: t,
                    userId: actor?.id || null
                }
            );

            if (cost !== null) {
                await MaterialCostHistory.create(
                    {
                        material_id: material.id,
                        previous_cost: null,
                        new_cost: cost,
                        reason: data.cost_reason || 'Costo inicial del material',
                        source: 'CREATE',
                        created_by: actor?.id || null
                    },
                    {
                        transaction: t,
                        userId: actor?.id || null
                    }
                );
            }

            return material;
        });
    }

    static async updateMaterial(id, data = {}, actor = null) {
        const material = await Material.findByPk(id);

        if (!material) {
            throw new AppError('Material not found', 404);
        }

        const payload = {};

        ['name', 'description', 'color', 'size', 'brand', 'unit', 'status'].forEach((field) => {
            if (data[field] !== undefined) {
                payload[field] = this.normalizeText(data[field]);
            }
        });

        if (data.min_stock !== undefined) {
            payload.min_stock = this.toNumber(data.min_stock);
        }

        if (data.supplier_id !== undefined) {
            payload.supplier_id = data.supplier_id || null;
        }

        if (data.affects_product_cost !== undefined) {
            payload.affects_product_cost = Boolean(data.affects_product_cost);
        }

        payload.updated_by = actor?.id || null;

        await material.update(payload, {
            userId: actor?.id || null
        });

        return material;
    }

    static async updateMaterialCost(id, data = {}, actor = null) {
        return sequelize.transaction(async (t) => {
            const material = await Material.findByPk(id, {
                transaction: t,
                lock: t.LOCK.UPDATE
            });

            if (!material) {
                throw new AppError('Material not found', 404);
            }

            const newCost = this.toNumber(data.cost);

            if (newCost < 0) {
                throw new AppError('Cost cannot be negative', 400);
            }

            const previousCost =
                material.cost !== null && material.cost !== undefined
                    ? this.toNumber(material.cost)
                    : null;

            await material.update(
                {
                    cost: newCost,
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
                    new_cost: newCost,
                    reason: data.reason || 'Actualización manual de costo',
                    source: data.source || 'MANUAL',
                    created_by: actor?.id || null
                },
                {
                    transaction: t,
                    userId: actor?.id || null
                }
            );

            return material;
        });
    }

    static async getMaterials(query = {}) {
        const where = {};

        if (query.search) {
            const search = `%${String(query.search).trim()}%`;

            where[Op.or] = [
                { name: { [Op.iLike]: search } },
                { sku: { [Op.iLike]: search } },
                { color: { [Op.iLike]: search } },
                { size: { [Op.iLike]: search } }
            ];
        }

        if (query.category_id) where.category_id = query.category_id;
        if (query.subcategory_id) where.subcategory_id = query.subcategory_id;
        if (query.inventory_type) where.inventory_type = String(query.inventory_type).toUpperCase();
        if (query.status) where.status = String(query.status).toUpperCase();

        const limit = Math.min(parseInt(query.limit, 10) || 50, 100);
        const page = Math.max(parseInt(query.page, 10) || 1, 1);
        const offset = (page - 1) * limit;

        const result = await Material.findAndCountAll({
            where,
            include: [
                {
                    model: MaterialCategory,
                    as: 'category',
                    required: false
                },
                {
                    model: MaterialSubcategory,
                    as: 'subcategory',
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

    static async getMaterialById(id) {
        const material = await Material.findByPk(id, {
            include: [
                {
                    model: MaterialCategory,
                    as: 'category',
                    required: false
                },
                {
                    model: MaterialSubcategory,
                    as: 'subcategory',
                    required: false
                },
                {
                    model: MaterialLot,
                    as: 'lots',
                    required: false
                },
                {
                    model: MaterialCostHistory,
                    as: 'cost_history',
                    required: false,
                    limit: 20,
                    order: [['created_at', 'DESC']]
                }
            ]
        });

        if (!material) {
            throw new AppError('Material not found', 404);
        }

        const materialPlain = material.get({ plain: true });

        materialPlain.inventory_summary = this.buildInventorySummary(materialPlain.lots || []);

        return materialPlain;
    }

    static async getLowStockMaterials() {
        const materials = await Material.findAll({
            where: {
                tracking_method: 'STOCK',
                status: 'ACTIVE'
            },
            include: [
                {
                    model: MaterialCategory,
                    as: 'category',
                    required: false
                },
                {
                    model: MaterialSubcategory,
                    as: 'subcategory',
                    required: false
                }
            ],
            order: [['name', 'ASC']]
        });

        return materials.filter((material) => {
            const available = parseFloat(material.available_stock || 0);
            const minStock = parseFloat(material.min_stock || 0);

            return available <= minStock;
        });
    }
}

module.exports = MaterialService;
