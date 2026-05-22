const ProductionService = require('./ProductionService');
const { SaleItem, Sale, Client } = require('../../models');
const { Op } = require('sequelize');

const startProduction = async (req, res, next) => {
    try {
        const result = await ProductionService.startProduction(req.params.id, req.user.id);
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const completeProduction = async (req, res, next) => {
    try {
        const result = await ProductionService.completeProduction(req.params.id, req.user.id);
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const getProductionStatus = async (req, res, next) => {
    try {
        const result = await ProductionService.getProductionStatus(req.params.id);
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const getOperationalGarments = async (req, res, next) => {
    try {

        const {
            production_status,
            delivery_status,
            urgent,
            client
        } = req.query;

        const where = {};

        // Production status filter
        if (production_status) {
            where.production_status = production_status;
        }

        // Delivery status filter
        if (delivery_status) {
            where.delivery_status = delivery_status;
        }

        const saleWhere = {};

        // Urgent filter
        if (urgent === 'true') {
            saleWhere.is_urgent = true;
        }

        const clientWhere = {};

        // Client search
        if (client) {
            clientWhere.name = {
                [Op.iLike]: `%${client}%`
            };
        }

        const garments = await SaleItem.findAll({

            where,

            include: [
                {
                    model: Sale,
                    as: 'sale',
                    where: saleWhere,
                    include: [
                        {
                            model: Client,
                            as: 'client',
                            where: clientWhere
                        }
                    ]
                }
            ],

            order: [
                ['created_at', 'DESC']
            ]
        });

        res.status(200).json({
            success: true,
            count: garments.length,
            data: garments
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    startProduction,
    completeProduction,
    getProductionStatus,
    getOperationalGarments
};