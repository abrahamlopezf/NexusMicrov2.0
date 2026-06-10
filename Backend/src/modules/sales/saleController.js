const SaleOrchestrator = require('./SaleOrchestrator');
const SaleCostSummaryService = require('./SaleCostSummaryService');

const AppError = require('../../utils/AppError');

const createSale = async (req, res, next) => {
    try {
        const { saleData, itemsData } = req.body;

        const userId = req.user?.id;

        if (!userId) {
            throw new AppError('Authenticated user id not found in token', 401);
        }

        const result = await SaleOrchestrator.createSale(saleData, itemsData, userId);

        res.status(201).json({
            success: true,
            data: result,
            message: 'Sale created successfully'
        });
    } catch (error) {
        next(error);
    }
};

const getAllSales = async (req, res, next) => {
    try {
        const { Sale, Client } = require('../../models');
        const APIFeatures = require('../../utils/apiFeatures');

        const features = new APIFeatures({}, req.query).paginate().sort();

        const { count, rows } = await Sale.findAndCountAll({
            ...features.queryOptions,
            include: [
                {
                    model: Client,
                    as: 'client',
                    attributes: ['id', 'name', 'phone', 'email']
                }
            ]
        });

        res.json({
            success: true,
            results: rows.length,
            total: count,
            totalPages: Math.ceil(count / features.queryOptions.limit),
            currentPage: parseInt(req.query.page, 10) || 1,
            data: rows
        });
    } catch (err) {
        next(err);
    }
};

const getPendingSales = async (req, res, next) => {
    try {
        const { Sale, Client } = require('../../models');
        const { Op } = require('sequelize');
        const sales = await Sale.findAll({
            where: {
                created_by: req.user.id,
                status: { [Op.in]: ['PENDIENTE', 'EN_PRODUCCION'] }
            },
            include: [{ model: Client, as: 'client', attributes: ['name', 'phone'] }],
            order: [['created_at', 'DESC']]
        });
        res.json({ success: true, data: sales });
    } catch (err) {
        next(err);
    }
};

const getDeliveries = async (req, res, next) => {
    try {
        const { Sale, Client } = require('../../models');
        const sales = await Sale.findAll({
            where: {
                created_by: req.user.id,
                status: 'LISTO_ENTREGA'
            },
            include: [{ model: Client, as: 'client', attributes: ['name', 'phone'] }],
            order: [['created_at', 'ASC']]
        });
        res.json({ success: true, data: sales });
    } catch (err) {
        next(err);
    }
};

const deliverSale = async (req, res, next) => {
    try {
        const { Sale } = require('../../models');
        const sale = await Sale.findOne({ where: { id: req.params.id, created_by: req.user.id } });
        if (!sale)
            return res
                .status(404)
                .json({ success: false, message: 'Sale not found or unauthorized' });

        sale.status = 'ENTREGADO';
        sale.fulfillment_status = 'COMPLETED';
        await sale.save();

        res.json({ success: true, data: sale });
    } catch (err) {
        next(err);
    }
};

const getSaleCostSummary = async (req, res, next) => {
    try {
        const result = await SaleCostSummaryService.getSaleCostSummary(req.params.saleId);

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createSale,
    getAllSales,
    getPendingSales,
    getDeliveries,
    deliverSale,
    getSaleCostSummary
};
