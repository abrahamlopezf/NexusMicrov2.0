const QuoteService = require('./QuoteService');
const PdfGeneratorFactory = require('../../services/PdfGeneratorService');
const { Quote, QuoteItem, Client } = require('../../models');
const AppError = require('../../utils/AppError');
const { Op } = require('sequelize');

exports.createQuote = async (req, res, next) => {
    try {
        const { client_id, items, discount, notes, valid_until } = req.body;
        const userId = req.user.id;
        
        const quote = await QuoteService.createQuote({ 
            clientId: client_id, 
            items, 
            globalDiscount: discount, 
            notes, 
            validUntil: valid_until,
            userId 
        });

        res.status(201).json({
            status: 'success',
            data: { quote }
        });
    } catch (error) {
        next(error);
    }
};

exports.getQuotes = async (req, res, next) => {
    try {
        const { status, client_id, startDate, endDate } = req.query;
        let whereClause = {};

        if (status) whereClause.status = status;
        if (client_id) whereClause.client_id = client_id;
        if (startDate && endDate) {
            whereClause.createdAt = { [Op.between]: [new Date(startDate), new Date(endDate)] };
        }

        const quotes = await Quote.findAll({
            where: whereClause,
            include: [
                { model: Client, as: 'client', attributes: ['id', 'name', 'email'] }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            status: 'success',
            results: quotes.length,
            data: { quotes }
        });
    } catch (error) {
        next(error);
    }
};

exports.getQuoteById = async (req, res, next) => {
    try {
        const quote = await Quote.findByPk(req.params.id, {
            include: [
                { model: QuoteItem, as: 'items' },
                { model: Client, as: 'client' }
            ]
        });

        if (!quote) return next(new AppError('Cotización no encontrada', 404));

        res.status(200).json({
            status: 'success',
            data: { quote }
        });
    } catch (error) {
        next(error);
    }
};

exports.generatePdf = async (req, res, next) => {
    try {
        const quote = await Quote.findByPk(req.params.id, {
            include: [
                { model: QuoteItem, as: 'items' },
                { model: Client, as: 'client' }
            ]
        });

        if (!quote) return next(new AppError('Cotización no encontrada', 404));

        const pdfService = PdfGeneratorFactory.getGenerator('puppeteer');
        const pdfBuffer = await pdfService.generate(quote);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="Cotizacion_${quote.quote_number}.pdf"`,
            'Content-Length': pdfBuffer.length
        });
        
        res.status(200).send(pdfBuffer);
    } catch (error) {
        next(error);
    }
};

exports.approveQuote = async (req, res, next) => {
    try {
        const quote = await QuoteService.approveQuote(req.params.id);
        res.status(200).json({
            status: 'success',
            message: 'Cotización Aprobada',
            data: { quote }
        });
    } catch (error) {
        next(error);
    }
};

exports.convertToSale = async (req, res, next) => {
    try {
        const { payment } = req.body;
        const result = await QuoteService.convertToSale(req.params.id, req.user.id, payment);
        
        res.status(200).json({
            status: 'success',
            message: 'Cotización convertida a Venta exitosamente',
            data: result
        });
    } catch (error) {
        next(error);
    }
};
