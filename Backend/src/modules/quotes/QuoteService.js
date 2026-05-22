const { Quote, QuoteItem, Sale, SaleItem } = require('../../models');
const productRepository = require('../../repositories/product.repository');
const sequelize = require('../../config/database');
const AppError = require('../../utils/AppError');
const pricingEngine = require('../../core/pricingEngine');
const { GlobalSetting } = require('../../models');
const QueueService = require('../../services/QueueService');
const SaleService = require('../sales/SaleService');
const InventoryService = require('../inventory/InventoryService');

class QuoteService {

  static async fetchPricingConfig() {
      const settings = await GlobalSetting.findOne({ order: [['id', 'DESC']] });
      if (!settings) throw new AppError('Global settings not configured', 500);

      return {
          pricingRules: {
              operation_margin: settings.operational_factor || 0.14,
              profit_margin: settings.profit_margin || 0.20
          },
          costStructure: {
              labor_rate_sewing: settings.labor_rate_sewing || 44.38,
              labor_rate_pattern: settings.labor_rate_pattern || 50.50,
              fixed_supplies_costs: settings.fixed_supplies_costs || { "SENCILLO": 30 }
          }
      };
  }

  static async createQuote({ clientId, items, globalDiscount = 0, notes, validUntil, userId, transaction = null }) {
    if (!items || items.length === 0) throw new AppError('La cotización debe tener al menos un producto', 400);

    const executeTransaction = async (t) => {
      const count = await Quote.count({ transaction: t });
      const quoteNumber = `Q-${new Date().getFullYear()}${(count + 1).toString().padStart(4, '0')}`;
      const config = await this.fetchPricingConfig();

      const quote = await Quote.create({
        quote_number: quoteNumber,
        client_id: clientId,
        status: 'DRAFT',
        subtotal: 0,
        discount: globalDiscount,
        total: 0,
        notes: notes || null,
        valid_until: validUntil || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days default
        created_by: userId,
        pricing_snapshot: config
      }, { transaction: t });

      let subtotalAcc = 0;
      const quoteItemsPayload = [];

      for (const item of items) {
        const { quantity, productId, custom_description, extra_materials, manual_price } = item;
        if (!quantity || quantity <= 0) throw new AppError(`Cantidad inválida para producto`, 400);

        let productTemplate = { hours_sewing: 0, hours_pattern: 0, fixed_supply_tier: 'SENCILLO' };
        let baseMaterials = [];

        if (productId) {
          const product = await productRepository.findByIdWithMaterials(productId, { transaction: t });
          if (!product) throw new AppError(`Producto con ID ${productId} no encontrado`, 404);
          productTemplate = {
              hours_sewing: product.hours_sewing,
              hours_pattern: product.hours_pattern,
              fixed_supply_tier: product.fixed_supply_tier
          };
          if (product.materials) {
            baseMaterials = product.materials.map(pm => ({
              material_id: pm.material_id,
              unit_price: pm.material.cost,
              quantity: parseFloat(pm.quantity)
            }));
          }
        } else {
            // Support fully custom product without productId
            productTemplate = {
                hours_sewing: item.hours_sewing || 0,
                hours_pattern: item.hours_pattern || 0,
                fixed_supply_tier: item.supply_level || 'SENCILLO'
            };
        }

        const engineMaterials = baseMaterials.concat(extra_materials || []);

        const pricing = pricingEngine.calculateSaleItem({
            productTemplate,
            extraMaterials: engineMaterials,
            costStructure: config.costStructure,
            pricingRules: config.pricingRules,
            manualPrice: manual_price,
            quantity: quantity
        });

        const lineTotal = pricing.total;
        subtotalAcc += lineTotal;

        quoteItemsPayload.push({
          quote_id: quote.id,
          product_id: productId || null,
          custom_description: custom_description || null,
          quantity: quantity,
          unit_price: pricing.unit_price,
          unit_cost: pricing.cost,
          total: lineTotal,
          cost_breakdown: pricing.cost_breakdown,
          materials_estimate: engineMaterials,
          created_by: userId
        });
      }

      await QuoteItem.bulkCreate(quoteItemsPayload, { transaction: t });

      const defaultTotal = subtotalAcc - globalDiscount;
      quote.subtotal = subtotalAcc;
      quote.total = defaultTotal > 0 ? defaultTotal : 0;
      await quote.save({ transaction: t });

      return Quote.findByPk(quote.id, { include: ['items'], transaction: t });
    };

    return transaction ? executeTransaction(transaction) : sequelize.transaction(executeTransaction);
  }

  static async approveQuote(quoteId, transaction = null) {
      const executeTransaction = async (t) => {
          const quote = await Quote.findByPk(quoteId, { transaction: t });
          if (!quote) throw new AppError('Cotización no encontrada', 404);
          if (quote.status === 'EXPIRED') throw new AppError('No se puede aprobar una cotización expirada', 400);
          
          quote.status = 'APPROVED';
          await quote.save({ transaction: t });
          return quote;
      };
      return transaction ? executeTransaction(transaction) : sequelize.transaction(executeTransaction);
  }

  static async convertToSale(quoteId, userId, paymentData = null) {
      // Create sale exactly matching quote items (NO pricing engine recalculation)
      return await sequelize.transaction(async (t) => {
          const quote = await Quote.findByPk(quoteId, { 
              include: [{ model: QuoteItem, as: 'items' }],
              transaction: t 
          });

          if (!quote) throw new AppError('Cotización no encontrada', 404);
          if (quote.status !== 'APPROVED') throw new AppError('Solo cotizaciones Aprobadas pueden convertirse a venta', 400);

          // 1. Create Draft Sale via SaleService
          const saleNumber = `V-${Date.now().toString().slice(-6)}`;
          
          const sale = await Sale.create({
              sale_number: saleNumber,
              quote_id: quote.id,
              client_id: quote.client_id,
              total: quote.total,
              paid_amount: 0,
              balance: quote.total,
              status: 'PENDING',
              fulfillment_status: 'QUEUED', // ready for async processing
              created_by: userId
          }, { transaction: t });

          // 2. Clone QuoteItems -> SaleItems
          const saleItemsData = quote.items.map(qi => ({
              sale_id: sale.id,
              product_id: qi.product_id,
              custom_description: qi.custom_description,
              quantity: Math.round(qi.quantity), // Convert decimal quantity from quote to integer for sale
              unit_price: qi.unit_price,
              unit_cost: qi.unit_cost,
              total: qi.total,
              cost_breakdown: qi.cost_breakdown,
              materials_estimate: qi.materials_estimate
          }));

          const createdItems = await SaleItem.bulkCreate(saleItemsData, { transaction: t });

          // 3. Mark Quote as CONVERTED
          quote.status = 'CONVERTED';
          await quote.save({ transaction: t });

          // 4. Register initial payment if any (financial operation)
          if (paymentData && paymentData.amount > 0) {
              const PaymentService = require('../payments/PaymentService'); // Late require to avoid circular deps
              await PaymentService.registerPayment({
                  ...paymentData,
                  sale_id: sale.id,
                  type: paymentData.type || 'ANTICIPO',
                  created_by: userId
              }, t);
              await sale.reload({ transaction: t });
          }

          // 5. Enqueue Async WorkOrders via SaleOrchestrator behavior
          const { SALE_CONFIRMED } = require('../../queues/jobs/sale.jobs');
          const jobId = await QueueService.addSaleJob(SALE_CONFIRMED, {
              saleId: sale.id,
              userId
          });

          return { sale, processing: { mode: 'async', jobId: jobId.id } };
      });
  }
}

module.exports = QuoteService;
