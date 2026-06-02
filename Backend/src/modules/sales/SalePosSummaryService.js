const { Op } = require('sequelize');

const {
    Sale,
    SaleItem,
    Client,
    Product,
    Payment,
    Account,
    SaleTicket,
    SaleMaterialRequirement,
    Material,
    MaterialLot,
    ProductMaterial,
    MaterialCategory,
    MaterialSubcategory,
    ExternalServiceOrder,
    Supplier
} = require('../../models');

const AppError = require('../../utils/AppError');
const SaleStatusService = require('./SaleStatusService');

class SalePosSummaryService {
    static toNumber(value) {
        return Number(parseFloat(value || 0).toFixed(2));
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

    static roundNestedNumbers(obj) {
        if (!obj || typeof obj !== 'object') return obj;

        for (const key of Object.keys(obj)) {
            if (typeof obj[key] === 'number') {
                obj[key] = this.toNumber(obj[key]);
            } else if (obj[key] && typeof obj[key] === 'object') {
                this.roundNestedNumbers(obj[key]);
            }
        }

        return obj;
    }

    static mapMaterialRequirement(row) {
        const source = String(row.source || 'UNKNOWN').toUpperCase();

        return {
            id: row.id,
            sale_id: row.sale_id,
            sale_item_id: row.sale_item_id,
            material_id: row.material_id,
            material_lot_id: row.material_lot_id,
            source,
            quantity_per_unit:
                row.quantity_per_unit !== null ? this.toNumber(row.quantity_per_unit) : null,
            item_quantity: row.item_quantity !== null ? this.toNumber(row.item_quantity) : null,
            estimated_quantity: this.toNumber(row.estimated_quantity),
            margin_percentage: this.toNumber(row.margin_percentage),
            planned_quantity: this.toNumber(row.planned_quantity),
            estimated_waste: this.toNumber(row.estimated_waste),
            unit: row.unit || row.material?.unit || null,
            status: row.status,
            notes: row.notes,
            metadata: row.metadata,
            created_by: row.created_by,
            created_at: row.createdAt,
            updated_at: row.updatedAt,

            material: row.material
                ? {
                      id: row.material.id,
                      sku: row.material.sku,
                      name: row.material.name,
                      unit: row.material.unit,
                      color: row.material.color,
                      size: row.material.size,
                      brand: row.material.brand,
                      category_id: row.material.category_id,
                      subcategory_id: row.material.subcategory_id,
                      inventory_type: row.material.inventory_type,
                      tracking_method: row.material.tracking_method,
                      cost: this.toNumber(row.material.cost),
                      current_stock: this.toNumber(row.material.current_stock),
                      available_stock: this.toNumber(row.material.available_stock)
                  }
                : null,

            lot: row.lot
                ? {
                      id: row.lot.id,
                      lot_code: row.lot.lot_code,
                      stock_quantity: this.toNumber(row.lot.stock_quantity),
                      unit_cost: this.toNumber(row.lot.unit_cost),
                      scope_type: row.lot.scope_type,
                      lot_origin: row.lot.lot_origin,
                      sale_id: row.lot.sale_id,
                      sale_item_id: row.lot.sale_item_id,
                      origin_sale_id: row.lot.origin_sale_id,
                      origin_sale_item_id: row.lot.origin_sale_item_id,
                      notes: row.lot.notes
                  }
                : null
        };
    }

    static buildMaterialRequirementsSummary(requirements = []) {
        const summary = {
            requirements_count: requirements.length,

            // Suma cruda de todos los requerimientos, incluyendo reutilizables.
            raw_totals_by_unit: {},

            // Demanda real: materiales requeridos sin contar REUSABLE_SELECTED como extra.
            demand_totals_by_unit: {},

            // Reutilizable seleccionado como cobertura de la demanda.
            reusable_selected_by_unit: {},

            // Lo que falta cubrir después de reutilizables.
            net_to_cover_by_unit: {},

            by_source: {},
            by_status: {},
            by_material: {},

            reusable: {
                selected_count: 0,
                selected_lots: []
            }
        };

        for (const row of requirements) {
            const unit = row.unit || row.material?.unit || 'SIN_UNIDAD';
            const source = String(row.source || 'UNKNOWN').toUpperCase();
            const status = String(row.status || 'UNKNOWN').toUpperCase();

            const estimatedQuantity = this.toNumber(row.estimated_quantity);
            const plannedQuantity = this.toNumber(row.planned_quantity);
            const estimatedWaste = this.toNumber(row.estimated_waste);
            const isReusableSelected = source === 'REUSABLE_SELECTED';

            this.addToUnitTotals(summary.raw_totals_by_unit, unit, {
                estimated_quantity: estimatedQuantity,
                planned_quantity: plannedQuantity,
                estimated_waste: estimatedWaste,
                reusable_quantity: isReusableSelected ? plannedQuantity : 0
            });

            if (!isReusableSelected) {
                this.addToUnitTotals(summary.demand_totals_by_unit, unit, {
                    estimated_quantity: estimatedQuantity,
                    planned_quantity: plannedQuantity,
                    estimated_waste: estimatedWaste
                });
            } else {
                this.addToUnitTotals(summary.reusable_selected_by_unit, unit, {
                    estimated_quantity: estimatedQuantity,
                    planned_quantity: plannedQuantity,
                    estimated_waste: estimatedWaste,
                    reusable_quantity: plannedQuantity
                });
            }

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
                reusable_quantity: isReusableSelected ? plannedQuantity : 0
            });

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

            const materialKey = String(row.material_id);

            if (!summary.by_material[materialKey]) {
                summary.by_material[materialKey] = {
                    material_id: row.material_id,
                    material_name: row.material?.name || null,
                    sku: row.material?.sku || null,
                    unit,
                    count: 0,
                    demand_planned_quantity: 0,
                    reusable_quantity: 0,
                    net_to_cover_quantity: 0,
                    estimated_waste: 0,
                    sources: {}
                };
            }

            summary.by_material[materialKey].count += 1;

            if (isReusableSelected) {
                summary.by_material[materialKey].reusable_quantity += plannedQuantity;
            } else {
                summary.by_material[materialKey].demand_planned_quantity += plannedQuantity;
                summary.by_material[materialKey].estimated_waste += estimatedWaste;
            }

            if (!summary.by_material[materialKey].sources[source]) {
                summary.by_material[materialKey].sources[source] = {
                    count: 0,
                    planned_quantity: 0
                };
            }

            summary.by_material[materialKey].sources[source].count += 1;
            summary.by_material[materialKey].sources[source].planned_quantity += plannedQuantity;

            if (isReusableSelected) {
                summary.reusable.selected_count += 1;

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
        }

        const allUnits = new Set([
            ...Object.keys(summary.demand_totals_by_unit),
            ...Object.keys(summary.reusable_selected_by_unit)
        ]);

        for (const unit of allUnits) {
            const demand = summary.demand_totals_by_unit[unit]?.planned_quantity || 0;
            const reusable = summary.reusable_selected_by_unit[unit]?.reusable_quantity || 0;

            summary.net_to_cover_by_unit[unit] = {
                demand_planned_quantity: this.toNumber(demand),
                reusable_selected_quantity: this.toNumber(reusable),
                net_to_cover_quantity: this.toNumber(Math.max(demand - reusable, 0))
            };
        }

        summary.by_material = Object.values(summary.by_material).map((material) => {
            material.demand_planned_quantity = this.toNumber(material.demand_planned_quantity);
            material.reusable_quantity = this.toNumber(material.reusable_quantity);
            material.net_to_cover_quantity = this.toNumber(
                Math.max(material.demand_planned_quantity - material.reusable_quantity, 0)
            );
            material.estimated_waste = this.toNumber(material.estimated_waste);

            for (const source of Object.keys(material.sources)) {
                material.sources[source].planned_quantity = this.toNumber(
                    material.sources[source].planned_quantity
                );
            }

            return material;
        });

        return this.roundNestedNumbers(summary);
    }

    static buildItemMaterialPlanning(items = [], requirements = [], productRules = []) {
        const requirementsByItem = {};
        const rulesByProduct = {};

        for (const requirement of requirements) {
            const key = requirement.sale_item_id ? String(requirement.sale_item_id) : 'SALE_LEVEL';

            if (!requirementsByItem[key]) {
                requirementsByItem[key] = [];
            }

            requirementsByItem[key].push(requirement);
        }

        for (const rule of productRules) {
            const key = String(rule.product_id);

            if (!rulesByProduct[key]) {
                rulesByProduct[key] = [];
            }

            rulesByProduct[key].push(rule);
        }

        const result = {};

        for (const item of items || []) {
            const itemId = String(item.id);
            const productId = item.product_id ? String(item.product_id) : null;

            const itemRequirements = requirementsByItem[itemId] || [];
            const itemRules = productId ? rulesByProduct[productId] || [] : [];

            const selectableRules = itemRules.filter(
                (rule) => rule.active !== false && rule.is_selectable === true
            );

            const pendingSelectableRules = selectableRules.filter((rule) => {
                return !itemRequirements.some((requirement) => {
                    const source = String(requirement.source || '').toUpperCase();

                    if (
                        !['FABRIC_SELECTED', 'REUSABLE_SELECTED', 'MATERIAL_SELECTED'].includes(
                            source
                        )
                    ) {
                        return false;
                    }

                    if (
                        requirement.metadata?.recipe_rule_id &&
                        Number(requirement.metadata.recipe_rule_id) === Number(rule.id)
                    ) {
                        return true;
                    }

                    const material = requirement.material || {};

                    if (
                        rule.required_category_id &&
                        Number(material.category_id) !== Number(rule.required_category_id)
                    ) {
                        return false;
                    }

                    if (
                        rule.required_subcategory_id &&
                        Number(material.subcategory_id) !== Number(rule.required_subcategory_id)
                    ) {
                        return false;
                    }

                    return true;
                });
            });

            const mappedRequirements = itemRequirements.map((req) =>
                this.mapMaterialRequirement(req)
            );
            const itemSummary = this.buildMaterialRequirementsSummary(itemRequirements);

            result[itemId] = {
                sale_item_id: item.id,
                product_id: item.product_id,
                product_name:
                    item.product?.name || item.product?.title || item.custom_description || null,

                requirements_count: itemRequirements.length,
                requirements: mappedRequirements,
                summary: itemSummary,

                recipe: {
                    rules_count: itemRules.length,
                    selectable_rules_count: selectableRules.length,
                    pending_selectable_rules_count: pendingSelectableRules.length,
                    pending_selectable_rules: pendingSelectableRules.map((rule) => ({
                        rule_id: rule.id,
                        material_role: rule.material_role,
                        required_category_id: rule.required_category_id,
                        required_category_name: rule.requiredCategory?.name || null,
                        required_subcategory_id: rule.required_subcategory_id,
                        required_subcategory_name: rule.requiredSubcategory?.name || null,
                        quantity_per_unit: this.toNumber(rule.quantity),
                        waste_percentage: this.toNumber(rule.waste_percentage),
                        notes: rule.notes
                    }))
                },

                status: {
                    has_requirements: itemRequirements.length > 0,
                    has_pending_selectable_materials: pendingSelectableRules.length > 0,
                    is_material_planning_ready: pendingSelectableRules.length === 0
                }
            };
        }

        return result;
    }

    static async getPosSummary(saleId) {
        // Recalcular antes de responder para evitar saldos viejos
        await SaleStatusService.syncSaleStatuses(saleId);

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
                            as: 'product'
                        }
                    ]
                },
                {
                    model: Payment,
                    as: 'payments',
                    include: [
                        {
                            model: Account,
                            as: 'account',
                            required: false
                        }
                    ]
                }
            ],
            order: [
                [{ model: SaleItem, as: 'items' }, 'id', 'ASC'],
                [{ model: Payment, as: 'payments' }, 'payment_date', 'DESC']
            ]
        });

        if (!sale) {
            throw new AppError('Sale not found', 404);
        }

        const tickets = await SaleTicket.findAll({
            where: {
                sale_id: sale.id
            },
            order: [['issued_at', 'DESC']]
        });

        const materialRequirements = await SaleMaterialRequirement.findAll({
            where: {
                sale_id: sale.id,
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
                },
                {
                    model: SaleItem,
                    as: 'saleItem',
                    required: false
                }
            ],
            order: [['created_at', 'DESC']]
        });

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
                },
                {
                    model: SaleItem,
                    as: 'saleItem',
                    required: false
                }
            ],
            order: [['created_at', 'DESC']]
        });

        const externalServiceRows = externalServices.map((service) => service.get({ plain: true }));

        const itemExternalServices = this.buildItemExternalServices(
            sale.items || [],
            externalServiceRows
        );

        const externalServicesSummary = this.buildExternalServicesSummary(externalServiceRows);

        const productIds = [
            ...new Set((sale.items || []).map((item) => item.product_id).filter(Boolean))
        ];

        const productRules =
            productIds.length > 0
                ? await ProductMaterial.findAll({
                      where: {
                          product_id: {
                              [Op.in]: productIds
                          },
                          active: true
                      },
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
                      ],
                      order: [['id', 'ASC']]
                  })
                : [];

        const materialRequirementRows = materialRequirements.map((requirement) =>
            requirement.get({ plain: true })
        );

        const productRuleRows = productRules.map((rule) => rule.get({ plain: true }));

        const itemMaterialPlanning = this.buildItemMaterialPlanning(
            sale.items || [],
            materialRequirementRows,
            productRuleRows
        );

        const materialPlanningSummary =
            this.buildMaterialRequirementsSummary(materialRequirementRows);

        const itemPlanningValues = Object.values(itemMaterialPlanning);

        materialPlanningSummary.items_count = itemPlanningValues.length;
        materialPlanningSummary.items_ready_count = itemPlanningValues.filter(
            (item) => item.status.is_material_planning_ready
        ).length;
        materialPlanningSummary.items_pending_selectable_count = itemPlanningValues.filter(
            (item) => item.status.has_pending_selectable_materials
        ).length;

        const payments = sale.payments || [];
        const activePayments = payments.filter((payment) => payment.status !== 'CANCELLED');
        const cancelledPayments = payments.filter((payment) => payment.status === 'CANCELLED');

        const cashPaid = activePayments.reduce((sum, payment) => {
            if (payment.affects_balance === false) return sum;
            if (payment.type === 'RETENCION') return sum;

            return sum + parseFloat(payment.amount || 0);
        }, 0);

        const retainedAmount = activePayments.reduce((sum, payment) => {
            if (payment.affects_balance === false) return sum;
            if (payment.type !== 'RETENCION') return sum;

            return sum + parseFloat(payment.amount || 0);
        }, 0);

        const migratedAmount = activePayments.reduce((sum, payment) => {
            if (payment.type !== 'MIGRACION') return sum;

            return sum + parseFloat(payment.amount || 0);
        }, 0);

        const totalApplied = cashPaid + retainedAmount;
        const total = parseFloat(sale.total || 0);
        const balance = Math.max(total - totalApplied, 0);

        const activeTickets = tickets.filter((ticket) => ticket.status !== 'CANCELLED');
        const cancelledTickets = tickets.filter((ticket) => ticket.status === 'CANCELLED');

        const isFinanciallyClosed = sale.financial_status === 'PAID' || balance <= 0.01;
        const isSaleCancelled =
            ['CANCELLED', 'REFUNDED'].includes(sale.financial_status) ||
            ['CANCELLED', 'REFUNDED'].includes(sale.status);

        const canRegisterPayment = !isSaleCancelled && !isFinanciallyClosed;
        const canLiquidate = !isSaleCancelled && balance > 0.01;
        const canIssueTicket = !isSaleCancelled;
        const canCancelPayment = activePayments.length > 0;
        const canCancelTicket = activeTickets.length > 0;

        return {
            sale: {
                id: sale.id,
                sale_number: sale.sale_number,
                status: sale.status,
                financial_status: sale.financial_status,
                fulfillment_status: sale.fulfillment_status,
                type: sale.type,
                is_urgent: sale.is_urgent,
                is_paid: sale.is_paid,
                total: this.toNumber(sale.total),
                paid_amount: this.toNumber(sale.paid_amount),
                retained_amount: this.toNumber(sale.retained_amount),
                balance: this.toNumber(sale.balance),
                notes: sale.notes,
                created_at: sale.createdAt,
                updated_at: sale.updatedAt
            },

            client: sale.client
                ? {
                      id: sale.client.id,
                      name: sale.client.name,
                      phone: sale.client.phone,
                      email: sale.client.email,
                      address: sale.client.address
                  }
                : null,

            items: (sale.items || []).map((item) => ({
                id: item.id,
                product_id: item.product_id,
                product_name:
                    item.product?.name ||
                    item.product?.title ||
                    item.custom_description ||
                    'Prenda / Servicio',
                description:
                    item.custom_description || item.description || item.product?.name || null,
                garment_type: item.garment_type,
                client_garment_id: item.client_garment_id,
                measurement_id: item.measurement_id,
                garment_snapshot: item.garment_snapshot,
                measurement_snapshot: item.measurement_snapshot,
                quantity: item.quantity,
                unit_price: this.toNumber(item.unit_price),
                total: this.toNumber(item.total),
                production_status: item.production_status,
                delivery_status: item.delivery_status,
                delivered_at: item.delivered_at,
                material_planning: itemMaterialPlanning[String(item.id)] || {
                    sale_item_id: item.id,
                    product_id: item.product_id,
                    requirements_count: 0,
                    requirements: [],
                    summary: this.buildMaterialRequirementsSummary([]),
                    recipe: {
                        rules_count: 0,
                        selectable_rules_count: 0,
                        pending_selectable_rules_count: 0,
                        pending_selectable_rules: []
                    },
                    status: {
                        has_requirements: false,
                        has_pending_selectable_materials: false,
                        is_material_planning_ready: true
                    }
                },

                external_services: itemExternalServices[String(item.id)] || {
                    is_optional: true,
                    sale_item_id: item.id,
                    has_external_services: false,
                    count: 0,
                    total_cost: 0,
                    summary: this.buildExternalServicesSummary([]),
                    services: []
                }
            })),

            financial_summary: {
                total: this.toNumber(total),
                cash_paid: this.toNumber(cashPaid),
                retained_amount: this.toNumber(retainedAmount),
                migrated_amount: this.toNumber(migratedAmount),
                total_applied: this.toNumber(totalApplied),
                balance: this.toNumber(balance),
                financial_status: sale.financial_status,
                is_fully_paid: isFinanciallyClosed
            },

            payments: {
                active: activePayments.map((payment) => ({
                    id: payment.id,
                    sale_id: payment.sale_id,
                    account_id: payment.account_id,

                    amount: this.toNumber(payment.amount),
                    received_amount:
                        payment.received_amount !== null && payment.received_amount !== undefined
                            ? this.toNumber(payment.received_amount)
                            : null,
                    change_amount: this.toNumber(payment.change_amount),
                    payment_method: payment.payment_method,
                    type: payment.type,
                    status: payment.status,
                    affects_cash: payment.affects_cash,
                    affects_balance: payment.affects_balance,
                    reference: payment.reference,
                    notes: payment.notes,
                    payment_date: payment.payment_date,
                    cancelled_at: payment.cancelled_at,
                    cancellation_reason: payment.cancellation_reason,
                    account: payment.account
                        ? {
                              id: payment.account.id,
                              name: payment.account.name
                          }
                        : null,
                    metadata: payment.metadata
                })),

                cancelled: cancelledPayments.map((payment) => ({
                    id: payment.id,
                    sale_id: payment.sale_id,

                    received_amount:
                        payment.received_amount !== null && payment.received_amount !== undefined
                            ? this.toNumber(payment.received_amount)
                            : null,
                    change_amount: this.toNumber(payment.change_amount),

                    payment_method: payment.payment_method,
                    type: payment.type,
                    status: payment.status,
                    reference: payment.reference,
                    notes: payment.notes,
                    payment_date: payment.payment_date,
                    cancelled_at: payment.cancelled_at,
                    cancellation_reason: payment.cancellation_reason,
                    metadata: payment.metadata
                }))
            },

            tickets: {
                active: activeTickets.map((ticket) => ({
                    id: ticket.id,
                    ticket_number: ticket.ticket_number,
                    ticket_type: ticket.ticket_type,
                    status: ticket.status,
                    issued_by: ticket.issued_by,
                    issued_at: ticket.issued_at
                })),

                cancelled: cancelledTickets.map((ticket) => ({
                    id: ticket.id,
                    ticket_number: ticket.ticket_number,
                    ticket_type: ticket.ticket_type,
                    status: ticket.status,
                    issued_by: ticket.issued_by,
                    issued_at: ticket.issued_at,
                    cancelled_at: ticket.cancelled_at,
                    cancellation_reason: ticket.cancellation_reason
                }))
            },

            material_planning: {
                summary: materialPlanningSummary,
                requirements: {
                    all: materialRequirementRows.map((requirement) =>
                        this.mapMaterialRequirement(requirement)
                    ),
                    by_sale_item: itemMaterialPlanning
                }
            },

            payment_options: {
                methods: ['EFECTIVO', 'TRANSFERENCIA', 'TARJETA'],
                types: ['ANTICIPO', 'ABONO', 'LIQUIDACION', 'RETENCION']
            },

            external_services: {
                summary: externalServicesSummary,
                all: externalServiceRows.map((service) => this.mapExternalService(service)),
                by_sale_item: itemExternalServices
            },

            allowed_actions: {
                can_register_payment: canRegisterPayment,
                can_liquidate: canLiquidate,
                can_issue_ticket: canIssueTicket,
                can_cancel_payment: canCancelPayment,
                can_cancel_ticket: canCancelTicket,
                can_view_pdf: tickets.length > 0,

                can_add_external_service: true,
                can_view_external_services: true
            }
        };
    }

    static mapExternalService(service) {
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
            unit_cost: this.toNumber(service.unit_cost),
            subtotal: this.toNumber(service.subtotal),
            tax: this.toNumber(service.tax),
            discount: this.toNumber(service.discount),
            total_cost: this.toNumber(service.total_cost),
            status: service.status,
            sent_at: service.sent_at,
            expected_return_at: service.expected_return_at,
            received_at: service.received_at,
            notes: service.notes,
            created_at: service.createdAt,
            updated_at: service.updatedAt
        };
    }

    static buildExternalServicesSummary(services = []) {
        const summary = {
            is_optional: true,
            has_external_services: services.length > 0,
            count: services.length,
            total_cost: 0,
            pending_count: 0,
            sent_count: 0,
            in_progress_count: 0,
            received_count: 0,
            cancelled_count: 0,
            by_status: {},
            by_type: {},
            by_supplier: {}
        };

        for (const service of services) {
            const status = String(service.status || 'UNKNOWN').toUpperCase();
            const serviceType = String(service.service_type || 'UNKNOWN').toUpperCase();
            const supplierKey = String(service.supplier_id || 'SIN_PROVEEDOR');
            const totalCost = this.toNumber(service.total_cost);

            summary.total_cost += totalCost;

            if (status === 'PENDING') summary.pending_count += 1;
            if (status === 'SENT') summary.sent_count += 1;
            if (status === 'IN_PROGRESS') summary.in_progress_count += 1;
            if (status === 'RECEIVED') summary.received_count += 1;
            if (status === 'CANCELLED') summary.cancelled_count += 1;

            if (!summary.by_status[status]) {
                summary.by_status[status] = {
                    count: 0,
                    total_cost: 0
                };
            }

            summary.by_status[status].count += 1;
            summary.by_status[status].total_cost += totalCost;

            if (!summary.by_type[serviceType]) {
                summary.by_type[serviceType] = {
                    service_type: serviceType,
                    count: 0,
                    total_cost: 0
                };
            }

            summary.by_type[serviceType].count += 1;
            summary.by_type[serviceType].total_cost += totalCost;

            if (!summary.by_supplier[supplierKey]) {
                summary.by_supplier[supplierKey] = {
                    supplier_id: service.supplier_id,
                    supplier_name: service.supplier?.name || null,
                    count: 0,
                    total_cost: 0
                };
            }

            summary.by_supplier[supplierKey].count += 1;
            summary.by_supplier[supplierKey].total_cost += totalCost;
        }

        summary.total_cost = this.toNumber(summary.total_cost);

        for (const key of Object.keys(summary.by_status)) {
            summary.by_status[key].total_cost = this.toNumber(summary.by_status[key].total_cost);
        }

        for (const key of Object.keys(summary.by_type)) {
            summary.by_type[key].total_cost = this.toNumber(summary.by_type[key].total_cost);
        }

        summary.by_supplier = Object.values(summary.by_supplier).map((row) => ({
            ...row,
            total_cost: this.toNumber(row.total_cost)
        }));

        return summary;
    }

    static buildItemExternalServices(items = [], services = []) {
        const servicesByItem = {};

        for (const service of services) {
            const key = service.sale_item_id ? String(service.sale_item_id) : 'SALE_LEVEL';

            if (!servicesByItem[key]) {
                servicesByItem[key] = [];
            }

            servicesByItem[key].push(service);
        }

        const result = {};

        for (const item of items || []) {
            const key = String(item.id);
            const itemServices = servicesByItem[key] || [];

            result[key] = {
                sale_item_id: item.id,
                count: itemServices.length,
                total_cost: this.toNumber(
                    itemServices.reduce((sum, service) => {
                        return sum + this.toNumber(service.total_cost);
                    }, 0)
                ),
                summary: this.buildExternalServicesSummary(itemServices),
                services: itemServices.map((service) => this.mapExternalService(service))
            };
        }

        return result;
    }
}

module.exports = SalePosSummaryService;
