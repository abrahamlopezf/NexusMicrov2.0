const { Product, GlobalSetting } = require('../../models');

const getGlobalSettings = async () => {
    let settings = await GlobalSetting.findOne({ order: [['id', 'DESC']] });
    if (!settings) {
        settings = await GlobalSetting.create({}); 
    }
    return settings;
};

exports.calculatePrice = async (req, res, next) => {
    try {
        const { product_id, custom_hours_pattern, custom_hours_sewing, custom_fixed_supply_tier } = req.body;
        
        let hours_pattern = custom_hours_pattern || 0;
        let hours_sewing = custom_hours_sewing || 0;
        let fixed_supply_tier = custom_fixed_supply_tier || "SENCILLO";
        
        const settings = await getGlobalSettings();
        
        if (product_id) {
            const product = await Product.findByPk(product_id);
            if (!product) return res.status(404).json({ success: false, message: 'Producto no encontrado' });
            
            // Sistema mixto: Si el producto NO tiene horas asignadas, usamos el base_price directo
            if (product.hours_pattern === null && product.hours_sewing === null) {
                const base_price = parseFloat(product.base_price || 0);
                const operational_cost = base_price * parseFloat(settings.operational_factor);
                const suggested_price = (base_price + operational_cost) * (1 + parseFloat(settings.profit_margin));

                if (req.user && req.user.role === 'EMPLOYEE') {
                    return res.json({ success: true, data: { suggested_price: suggested_price.toFixed(2) } });
                }

                return res.json({
                    success: true,
                    data: {
                        is_mixed_legacy: true,
                        gross_cost: base_price.toFixed(2),
                        operational_cost: operational_cost.toFixed(2),
                        suggested_price: suggested_price.toFixed(2)
                    }
                });
            }
            
            hours_pattern = parseFloat(product.hours_pattern || 0);
            hours_sewing = parseFloat(product.hours_sewing || 0);
            fixed_supply_tier = product.fixed_supply_tier || "SENCILLO";
        }
        
        const tierCosts = settings.fixed_supplies_costs || {};
        const supply_cost = parseFloat(tierCosts[fixed_supply_tier] || tierCosts["SENCILLO"] || 30.0);
        
        const labor_cost_pattern = hours_pattern * parseFloat(settings.labor_rate_pattern);
        const labor_cost_sewing = hours_sewing * parseFloat(settings.labor_rate_sewing);
        const total_labor_cost = labor_cost_pattern + labor_cost_sewing;
        
        const gross_cost = supply_cost + total_labor_cost;
        const operational_cost = gross_cost * parseFloat(settings.operational_factor);
        const suggested_price = (gross_cost + operational_cost) * (1 + parseFloat(settings.profit_margin));
        
        // Hide details if user is just EMPLOYEE
        if (req.user && req.user.role === 'EMPLOYEE') {
            return res.json({
                success: true,
                data: { suggested_price: suggested_price.toFixed(2) }
            });
        }
        
        res.json({
            success: true,
            data: {
                breakdown: {
                    supply_cost: supply_cost.toFixed(2),
                    hours_pattern: hours_pattern,
                    labor_cost_pattern: labor_cost_pattern.toFixed(2),
                    hours_sewing: hours_sewing,
                    labor_cost_sewing: labor_cost_sewing.toFixed(2),
                },
                gross_cost: gross_cost.toFixed(2),
                operational_cost: operational_cost.toFixed(2),
                suggested_price: suggested_price.toFixed(2),
                settings_used: {
                    operational_factor: settings.operational_factor,
                    profit_margin: settings.profit_margin,
                    labor_rate_pattern: settings.labor_rate_pattern,
                    labor_rate_sewing: settings.labor_rate_sewing
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.getSettings = async (req, res, next) => {
    try {
        const settings = await getGlobalSettings();
        res.json({ success: true, data: settings });
    } catch (err) {
        next(err);
    }
};

exports.updateSettings = async (req, res, next) => {
    try {
        const settings = await getGlobalSettings();
        await settings.update({ ...req.body, updated_by: req.user ? req.user.id : null });
        res.json({ success: true, data: settings });
    } catch (err) {
        next(err);
    }
};
