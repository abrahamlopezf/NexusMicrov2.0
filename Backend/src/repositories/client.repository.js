const BaseRepository = require('./base.repository');
const db = require('../models');
const { Op } = require('sequelize');

class ClientRepository extends BaseRepository {
  constructor() {
    super(db.Client);
  }

  async findDuplicate({ email, phone }, excludeId = null) {
    const conditions = [];

    if (email) {
      conditions.push({ email });
    }

    if (phone) {
      conditions.push({ phone });
    }

    if (!conditions.length) {
      return null;
    }

    const where = {
      [Op.or]: conditions
    };

    if (excludeId) {
      where.id = {
        [Op.ne]: excludeId
      };
    }

    return this.model.findOne({ where });
  }

  async createClient(data, options = {}) {
    return this.model.create(data, options);
  }

  async updateClient(id, data, options = {}) {
    const client = await this.model.findByPk(id);

    if (!client) {
      return null;
    }

    return client.update(data, options);
  }

  async softDeleteClient(id, options = {}) {
    const client = await this.model.findByPk(id);

    if (!client) {
      return null;
    }

    await client.destroy(options);

    return client;
  }

  async findAllPaginated(query = {}) {
    const where = {};

    if (query.search) {
      const search = `%${String(query.search).trim()}%`;

      where[Op.or] = [
        { name: { [Op.iLike]: search } },
        { email: { [Op.iLike]: search } },
        { phone: { [Op.iLike]: search } }
      ];
    }

    if (query.email) {
      where.email = String(query.email).trim().toLowerCase();
    }

    if (query.phone) {
      where.phone = String(query.phone).trim();
    }

    const limit = Math.min(parseInt(query.limit, 10) || 50, 100);
    const page = Math.max(parseInt(query.page, 10) || 1, 1);
    const offset = (page - 1) * limit;

    const result = await this.model.findAndCountAll({
      where,
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

  async findByIdWithRelations(id) {
    return this.model.findByPk(id, {
      include: [
        {
          association: 'sales',
          include: [
            {
              association: 'items',
              attributes: [
                'id',
                'custom_description',
                'description',
                'quantity',
                'unit_price',
                'total',
                'product_id',
                'production_status',
                'delivery_status',
                'garment_type'
              ],
              include: [
                {
                  association: 'product',
                  required: false
                }
              ]
            },
            {
              association: 'payments',
              required: false
            }
          ],
          attributes: [
            'id',
            'sale_number',
            'total',
            'paid_amount',
            'retained_amount',
            'balance',
            'status',
            'financial_status',
            'fulfillment_status',
            'created_at',
            'updated_at'
          ]
        },
        {
          association: 'quotes',
          required: false
        }
      ]
    });
  }

  async findClientProfile(id) {
    const client = await this.model.findByPk(id);

    if (!client) {
      return null;
    }

    const sales = await db.Sale.findAll({
      where: {
        client_id: id
      },
      include: [
        {
          model: db.SaleItem,
          as: 'items',
          required: false,
          include: [
            {
              model: db.Product,
              as: 'product',
              required: false
            }
          ]
        },
        {
          model: db.Payment,
          as: 'payments',
          required: false
        }
      ],
      order: [['created_at', 'DESC']]
    });

    const saleIds = sales.map(sale => sale.id);

    const tickets = saleIds.length > 0
      ? await db.SaleTicket.findAll({
        where: {
          sale_id: {
            [Op.in]: saleIds
          }
        },
        order: [['issued_at', 'DESC']]
      })
      : [];

    const quotes = db.Quote
      ? await db.Quote.findAll({
        where: {
          client_id: id
        },
        order: [['created_at', 'DESC']]
      })
      : [];

    const garments = db.ClientGarment
      ? await db.ClientGarment.findAll({
        where: {
          client_id: id
        },
        include: [
          {
            model: db.GarmentMeasurement,
            as: 'measurements',
            required: false,
            include: [
              {
                model: db.GarmentAnnotation,
                as: 'annotations',
                required: false
              }
            ]
          },
          {
            model: db.GarmentAnnotation,
            as: 'annotations',
            required: false
          }
        ],
        order: [['created_at', 'DESC']]
      })
      : [];

    return {
      client,
      sales,
      tickets,
      quotes,
      garments
    };
  }
}

module.exports = new ClientRepository();