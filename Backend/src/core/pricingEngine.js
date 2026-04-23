/**
 * pricingEngine.js
 * Motor de Cálculo Puro
 * Cero Base de Datos - Cero Efectos Secundarios - 100% Determinístico
 */

/**
 * Calcula el costo base del producto basado en la plantilla y la estructura de costos fijos
 * @param {Object} template - Objeto del producto { hours_sewing, hours_pattern, fixed_supply_tier }
 * @param {Object} costStructure - Tarifas { labor_rate_sewing, labor_rate_pattern, fixed_supplies_costs }
 * @returns {Number} Costo base
 */
function calculateBaseCost(template, costStructure) {
    const hoursSewing = parseFloat(template.hours_sewing) || 0;
    const hoursPattern = parseFloat(template.hours_pattern) || 0;
    
    const laborCost = (hoursSewing * parseFloat(costStructure.labor_rate_sewing)) + 
                      (hoursPattern * parseFloat(costStructure.labor_rate_pattern));

    const tier = template.fixed_supply_tier || 'SENCILLO';
    const supplyCost = parseFloat(costStructure.fixed_supplies_costs[tier] || 0);

    return laborCost + supplyCost;
}

/**
 * Calcula el costo de materiales adicionales o base
 * @param {Array} materials - Lista de materiales [{ quantity, unit_price, waste_percentage }]
 * @returns {Number} Costo total de materiales
 */
function calculateMaterialsCost(materials = []) {
    if (!Array.isArray(materials)) return 0;
    return materials.reduce((acc, mat) => {
        const qty = parseFloat(mat.quantity) || 0;
        const waste = parseFloat(mat.waste_percentage) || 0;
        const effectiveQty = qty * (1 + waste);
        const price = parseFloat(mat.unit_price) || 0;
        return acc + (effectiveQty * price);
    }, 0);
}

/**
 * Calcula una línea de venta (SaleItem)
 * @param {Object} params - { productTemplate, extraMaterials, costStructure, pricingRules, manualPrice, quantity }
 * @returns {Object} { unit_cost, unit_price, total, cost_breakdown, original_price, was_price_overridden }
 */
function calculateSaleItem({ productTemplate, extraMaterials, costStructure, pricingRules, manualPrice, quantity = 1 }) {
    // 1. Costs
    const baseProductCost = productTemplate ? calculateBaseCost(productTemplate, costStructure) : 0;
    const materialsCost = calculateMaterialsCost(extraMaterials);
    
    // 2. Operativo total: Todo material + costo base recibe margen operativo (regla ODS)
    const subtotalCost = baseProductCost + materialsCost;
    const operationMargin = parseFloat(pricingRules.operation_margin) || 0.14;
    const operationalCost = subtotalCost * operationMargin;

    const totalUnitCost = subtotalCost + operationalCost;

    // 3. Margin & Price
    const profitMargin = parseFloat(pricingRules.profit_margin) || 0.20;
    const unitPriceCalculated = totalUnitCost * (1 + profitMargin);
    
    let finalUnitPrice = unitPriceCalculated;
    let wasPriceOverridden = false;
    
    if (manualPrice !== undefined && manualPrice !== null) {
        finalUnitPrice = parseFloat(manualPrice);
        wasPriceOverridden = true;
    }

    // 4. Breakdown
    const laborCost = productTemplate ? (
        (parseFloat(productTemplate.hours_sewing || 0) * parseFloat(costStructure.labor_rate_sewing || 0)) + 
        (parseFloat(productTemplate.hours_pattern || 0) * parseFloat(costStructure.labor_rate_pattern || 0))
    ) : 0;

    const costBreakdown = {
        labor_cost: parseFloat(laborCost.toFixed(2)),
        material_cost: parseFloat(materialsCost.toFixed(2)),
        supply_cost: parseFloat((baseProductCost - laborCost).toFixed(2)),
        subtotal_cost: parseFloat(subtotalCost.toFixed(2)),
        operational_cost: parseFloat(operationalCost.toFixed(2)),
        total_unit_cost: parseFloat(totalUnitCost.toFixed(2)),
        suggested_margin: parseFloat((unitPriceCalculated - totalUnitCost).toFixed(2)),
        real_margin: parseFloat((finalUnitPrice - totalUnitCost).toFixed(2)),
        system_calculated_price: parseFloat(unitPriceCalculated.toFixed(2))
    };

    return {
        unit_cost: parseFloat(totalUnitCost.toFixed(2)),
        unit_price: parseFloat(finalUnitPrice.toFixed(2)),
        total: parseFloat((finalUnitPrice * quantity).toFixed(2)),
        cost_breakdown: costBreakdown,
        original_price: wasPriceOverridden ? parseFloat(unitPriceCalculated.toFixed(2)) : null,
        was_price_overridden: wasPriceOverridden,
        quantity: parseInt(quantity, 10)
    };
}

/**
 * Calcula los totales de una cotización/venta basada en sus items
 * @param {Array} saleItemsData - Resultados de calculateSaleItem
 * @returns {Object} { subtotal, tax_amount, total }
 */
function calculateQuote(saleItemsData) {
    if (!Array.isArray(saleItemsData)) return { subtotal: 0, total: 0 };
    
    const subtotal = saleItemsData.reduce((acc, item) => acc + (parseFloat(item.total) || 0), 0);
    
    // If tax logic comes purely from some rules, we assume 0 for now as tax wasn't explicitly defined for quote total beyond unit price
    // But we setup the structure
    
    return {
        subtotal: parseFloat(subtotal.toFixed(2)),
        total: parseFloat(subtotal.toFixed(2))
    };
}

module.exports = {
    calculateBaseCost,
    calculateMaterialsCost,
    calculateSaleItem,
    calculateQuote
};
