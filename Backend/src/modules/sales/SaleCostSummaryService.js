const { Op } = require('sequelize');

const {
    Sale,
    SaleItem,
    Client,
    Product,
    InventoryMovement,
    Material,
    MaterialLot,
    SaleMaterialRequirement,
    ExternalServiceOrder,
    Supplier,
    GlobalSetting
} = require('../../models');

const AppError = require('../../utils/AppError');

class SaleCostSummaryService {
    static toNumber(value, decimals = 4) {
        return Number(parseFloat(value || 0).toFixed(decimals));
    }

    static money(value) {
        return Number(parseFloat(value || 0).toFixed(2));
    }

    static percent(value) {
        return Number(parseFloat(value || 0).toFixed(2));
    }

    static parseJson(value, fallback = {}) {
        if (!value) return fallback;

        if (typeof value === 'object') return value;

        try {
            return JSON.parse(value);
        } catch {
            return fallback;
        }
    }

    static groupBy(rows = [], keyGetter) {
        return rows.reduce((acc, row) => {
            const key = String(keyGetter(row));

            if (!acc[key]) acc[key] = [];

            acc[key].push(row);
            return acc;
        }, {});
    }

    static calculateProfitMetrics({ soldTotal, costTotal }) {
        const profit = this.money(soldTotal - costTotal);

        const marginPercentage = soldTotal > 0 ? this.percent((profit / soldTotal) * 100) : 0;

        const markupPercentage = costTotal > 0 ? this.percent((profit / costTotal) * 100) : 0;

        return {
            profit,
            margin_percentage: marginPercentage,
            markup_percentage: markupPercentage,
            is_profitable: profit >= 0
        };
    }

    static mapMovementCost(movement) {
        const quantity = this.toNumber(movement.quantity);
        const unitCost = this.toNumber(movement.unit_cost);
        const totalCost = this.money(movement.total_cost);

        return {
            id: movement.id,
            material_id: movement.material_id,
            material_name: movement.material?.name || null,
            material_sku: movement.material?.sku || null,
            material_lot_id: movement.material_lot_id,
            lot_code: movement.lot?.lot_code || null,
            lot_origin: movement.lot?.lot_origin || null,
            type: movement.type,
            quantity,
            unit_cost: unitCost,
            total_cost: totalCost,
            reference_type: movement.reference_type,
            reference_id: movement.reference_id,
            notes: movement.notes,
            metadata: movement.metadata,
            created_at: movement.createdAt
        };
    }

    static mapExternalServiceCost(service) {
        return {
            id: service.id,
            service_number: service.service_number,
            supplier_id: service.supplier_id,
            supplier_name: service.supplier?.name || null,
            sale_id: service.sale_id,
            sale_item_id: service.sale_item_id,
            work_order_id: service.work_order_id,
            service_type: service.service_type,
            description: service.description,
            quantity: this.toNumber(service.quantity),
            unit_cost: this.money(service.unit_cost),
            subtotal: this.money(service.subtotal),
            tax: this.money(service.tax),
            discount: this.money(service.discount),
            total_cost: this.money(service.total_cost),
            status: service.status,
            sent_at: service.sent_at,
            received_at: service.received_at,
            expected_return_at: service.expected_return_at,
            notes: service.notes,
            created_at: service.createdAt
        };
    }

    static mapRequirementEstimate(requirement) {
        const source = String(requirement.source || '').toUpperCase();
        const quantity = this.toNumber(requirement.planned_quantity);
        const isReusable = source === 'REUSABLE_SELECTED';

        const unitCostBasis = isReusable
            ? this.toNumber(requirement.lot?.unit_cost || requirement.material?.cost || 0)
            : this.toNumber(requirement.material?.cost || requirement.lot?.unit_cost || 0);

        return {
            id: requirement.id,
            sale_id: requirement.sale_id,
            sale_item_id: requirement.sale_item_id,
            material_id: requirement.material_id,
            material_name: requirement.material?.name || null,
            material_sku: requirement.material?.sku || null,
            material_lot_id: requirement.material_lot_id,
            lot_code: requirement.lot?.lot_code || null,
            source,
            status: requirement.status,
            quantity_per_unit:
                requirement.quantity_per_unit !== null
                    ? this.toNumber(requirement.quantity_per_unit)
                    : null,
            item_quantity:
                requirement.item_quantity !== null
                    ? this.toNumber(requirement.item_quantity)
                    : null,
            estimated_quantity: this.toNumber(requirement.estimated_quantity),
            planned_quantity: quantity,
            estimated_waste: this.toNumber(requirement.estimated_waste),
            consumed_quantity:
                requirement.consumed_quantity !== null
                    ? this.toNumber(requirement.consumed_quantity)
                    : null,
            unit: requirement.unit || requirement.material?.unit || null,
            unit_cost_basis: unitCostBasis,
            estimated_cost: this.money(quantity * unitCostBasis),
            notes: requirement.notes,
            metadata: requirement.metadata,
            consumption_metadata: requirement.consumption_metadata
        };
    }

    static buildItemCostSummary({
        item,
        materialMovements = [],
        materialRequirements = [],
        externalServices = [],
        pricingRules = {}
    }) {
        const costBreakdown = this.parseJson(item.cost_breakdown, {});

        const quantity = this.toNumber(item.quantity);
        const soldTotal = this.money(item.total);
        const unitPrice = this.money(item.unit_price);

        const materialRealCost = this.money(
            materialMovements.reduce((sum, movement) => {
                return sum + this.toNumber(movement.total_cost);
            }, 0)
        );

        const materialEstimatedCost = this.money(
            materialRequirements
                .filter((req) => String(req.source || '').toUpperCase() !== 'REUSABLE_SELECTED')
                .reduce((sum, req) => {
                    const mapped = this.mapRequirementEstimate(req);
                    return sum + mapped.estimated_cost;
                }, 0)
        );

        const reusableCoverageCost = this.money(
            materialRequirements
                .filter((req) => String(req.source || '').toUpperCase() === 'REUSABLE_SELECTED')
                .reduce((sum, req) => {
                    const mapped = this.mapRequirementEstimate(req);
                    return sum + mapped.estimated_cost;
                }, 0)
        );

        const externalServicesActive = externalServices.filter(
            (service) => String(service.status || '').toUpperCase() !== 'CANCELLED'
        );

        const externalServicesReceived = externalServices.filter(
            (service) => String(service.status || '').toUpperCase() === 'RECEIVED'
        );

        const externalServiceCommittedCost = this.money(
            externalServicesActive.reduce((sum, service) => {
                return sum + this.toNumber(service.total_cost);
            }, 0)
        );

        const externalServiceReceivedCost = this.money(
            externalServicesReceived.reduce((sum, service) => {
                return sum + this.toNumber(service.total_cost);
            }, 0)
        );

        const laborCost = this.money(costBreakdown.labor_cost || 0);
        const supplyCost = this.money(costBreakdown.supply_cost || 0);
        const operationalCost = this.money(costBreakdown.operational_cost || 0);

        const internalEstimatedCost = this.money(laborCost + supplyCost + operationalCost);

        const realCostWithCommittedServices = this.money(
            materialRealCost +
                laborCost +
                supplyCost +
                operationalCost +
                externalServiceCommittedCost
        );

        const realCostWithReceivedServices = this.money(
            materialRealCost +
                laborCost +
                supplyCost +
                operationalCost +
                externalServiceReceivedCost
        );

        const estimatedCostAtSaleCreation = this.money(item.unit_cost * quantity);

        const committedProfit = this.calculateProfitMetrics({
            soldTotal,
            costTotal: realCostWithCommittedServices
        });

        const receivedProfit = this.calculateProfitMetrics({
            soldTotal,
            costTotal: realCostWithReceivedServices
        });

        const suggestedProfitMargin = this.toNumber(pricingRules.profit_margin || 0.2);
        const suggestedPriceFromRealCost = this.money(
            realCostWithCommittedServices * (1 + suggestedProfitMargin)
        );

        return {
            sale_item_id: item.id,
            product_id: item.product_id,
            product_name:
                item.product?.name || item.product?.title || item.custom_description || null,
            quantity,
            unit_price: unitPrice,
            sold_total: soldTotal,

            costs: {
                material_estimated_cost: materialEstimatedCost,
                reusable_coverage_cost: reusableCoverageCost,
                material_real_cost: materialRealCost,

                labor_cost: laborCost,
                supply_cost: supplyCost,
                operational_cost: operationalCost,
                internal_estimated_cost: internalEstimatedCost,

                external_service_committed_cost: externalServiceCommittedCost,
                external_service_received_cost: externalServiceReceivedCost,

                estimated_cost_at_sale_creation: estimatedCostAtSaleCreation,
                real_cost_with_committed_services: realCostWithCommittedServices,
                real_cost_with_received_services: realCostWithReceivedServices
            },

            profitability: {
                committed_services_basis: committedProfit,
                received_services_basis: receivedProfit,
                suggested_profit_margin: suggestedProfitMargin,
                suggested_price_from_real_cost: suggestedPriceFromRealCost,
                price_difference_vs_sold: this.money(suggestedPriceFromRealCost - soldTotal)
            },

            material_movements: materialMovements.map((movement) => this.mapMovementCost(movement)),

            material_requirements: materialRequirements.map((req) =>
                this.mapRequirementEstimate(req)
            ),

            external_services: externalServices.map((service) =>
                this.mapExternalServiceCost(service)
            ),

            cost_breakdown: costBreakdown
        };
    }

    static async getSaleCostSummary(saleId) {
        const sale = await Sale.findByPk(saleId, {
            include: [
                {
                    model: Client,
                    as: 'client'
                },
                {
                    model: SaleItem,
                    as: 'items',
                    include: [
                        {
                            model: Product,
                            as: 'product',
                            required: false
                        }
                    ]
                }
            ],
            order: [[{ model: SaleItem, as: 'items' }, 'id', 'ASC']]
        });

        if (!sale) {
            throw new AppError('Sale not found', 404);
        }

        const items = sale.items || [];
        const saleItemIds = items.map((item) => item.id);

        const settings = await GlobalSetting.findOne({
            order: [['id', 'DESC']]
        });

        const pricingRules = {
            operation_margin: this.toNumber(settings?.operational_factor || 0.14),
            profit_margin: this.toNumber(settings?.profit_margin || 0.2)
        };

        const materialRequirements =
            saleItemIds.length > 0
                ? await SaleMaterialRequirement.findAll({
                      where: {
                          sale_id: sale.id,
                          sale_item_id: {
                              [Op.in]: saleItemIds
                          },
                          status: {
                              [Op.notIn]: ['CANCELLED']
                          }
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
                          }
                      ],
                      order: [['id', 'ASC']]
                  })
                : [];

        const materialMovements =
            saleItemIds.length > 0
                ? await InventoryMovement.findAll({
                      where: {
                          reference_type: 'SaleItem',
                          reference_id: {
                              [Op.in]: saleItemIds
                          },
                          type: 'SALIDA_PRODUCCION',
                          status: {
                              [Op.notIn]: ['CANCELLED']
                          }
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
                          }
                      ],
                      order: [['created_at', 'ASC']]
                  })
                : [];

        const externalServices = await ExternalServiceOrder.findAll({
            where: {
                sale_id: sale.id,
                status: {
                    [Op.notIn]: ['CANCELLED']
                }
            },
            include: [
                {
                    model: Supplier,
                    as: 'supplier',
                    required: false
                }
            ],
            order: [['created_at', 'ASC']]
        });

        const requirementsByItem = this.groupBy(
            materialRequirements,
            (req) => req.sale_item_id || 'SALE_LEVEL'
        );

        const movementsByItem = this.groupBy(
            materialMovements,
            (movement) => movement.reference_id || 'SALE_LEVEL'
        );

        const servicesByItem = this.groupBy(
            externalServices,
            (service) => service.sale_item_id || 'SALE_LEVEL'
        );

        const itemSummaries = items.map((item) => {
            const key = String(item.id);

            return this.buildItemCostSummary({
                item,
                materialMovements: movementsByItem[key] || [],
                materialRequirements: requirementsByItem[key] || [],
                externalServices: servicesByItem[key] || [],
                pricingRules
            });
        });

        const totals = itemSummaries.reduce(
            (acc, item) => {
                acc.sold_total += item.sold_total;

                acc.material_estimated_cost += item.costs.material_estimated_cost;
                acc.material_real_cost += item.costs.material_real_cost;
                acc.reusable_coverage_cost += item.costs.reusable_coverage_cost;

                acc.labor_cost += item.costs.labor_cost;
                acc.supply_cost += item.costs.supply_cost;
                acc.operational_cost += item.costs.operational_cost;

                acc.external_service_committed_cost += item.costs.external_service_committed_cost;
                acc.external_service_received_cost += item.costs.external_service_received_cost;

                acc.real_cost_with_committed_services +=
                    item.costs.real_cost_with_committed_services;
                acc.real_cost_with_received_services += item.costs.real_cost_with_received_services;

                acc.estimated_cost_at_sale_creation += item.costs.estimated_cost_at_sale_creation;

                return acc;
            },
            {
                sold_total: 0,
                material_estimated_cost: 0,
                reusable_coverage_cost: 0,
                material_real_cost: 0,
                labor_cost: 0,
                supply_cost: 0,
                operational_cost: 0,
                external_service_committed_cost: 0,
                external_service_received_cost: 0,
                real_cost_with_committed_services: 0,
                real_cost_with_received_services: 0,
                estimated_cost_at_sale_creation: 0
            }
        );

        for (const key of Object.keys(totals)) {
            totals[key] = this.money(totals[key]);
        }

        const committedProfitability = this.calculateProfitMetrics({
            soldTotal: totals.sold_total,
            costTotal: totals.real_cost_with_committed_services
        });

        const receivedProfitability = this.calculateProfitMetrics({
            soldTotal: totals.sold_total,
            costTotal: totals.real_cost_with_received_services
        });

        return {
            sale: {
                id: sale.id,
                sale_number: sale.sale_number,
                status: sale.status,
                financial_status: sale.financial_status,
                fulfillment_status: sale.fulfillment_status,
                total: this.money(sale.total),
                balance: this.money(sale.balance),
                created_at: sale.createdAt
            },

            client: sale.client
                ? {
                      id: sale.client.id,
                      name: sale.client.name,
                      phone: sale.client.phone,
                      email: sale.client.email
                  }
                : null,

            pricing_rules: pricingRules,

            totals: {
                ...totals,
                committed_services_profitability: committedProfitability,
                received_services_profitability: receivedProfitability
            },

            items: itemSummaries,

            notes: {
                committed_services_basis:
                    'Incluye servicios externos activos no cancelados, aunque estén pendientes.',
                received_services_basis: 'Incluye solo servicios externos recibidos.',
                material_real_cost: 'Se calcula desde movimientos SALIDA_PRODUCCION.',
                material_estimated_cost: 'Se calcula desde requerimientos planeados no cancelados.'
            }
        };
    }
}

module.exports = SaleCostSummaryService;
