const SaleTicketService = require('./SaleTicketService');
const SaleTicketPdfService = require('./SaleTicketPdfService');

const getTicketData = async (req, res, next) => {
    try {
        const result = await SaleTicketService.getTicketData(req.params.saleId);
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const issueTicket = async (req, res, next) => {
    try {
        const result = await SaleTicketService.issueTicket(
            req.params.saleId,
            req.body.ticket_type || 'SALE_SUMMARY',
            req.user?.id || null
        );

        res.status(201).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const getTicketsBySale = async (req, res, next) => {
    try {
        const result = await SaleTicketService.getTicketsBySale(req.params.saleId);
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const getTicketById = async (req, res, next) => {
    try {
        const result = await SaleTicketService.getTicketById(req.params.ticketId);

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const cancelTicket = async (req, res, next) => {
    try {
        const result = await SaleTicketService.cancelTicket(
            req.params.ticketId,
            req.body.reason,
            req.user?.id || null,
            req.body.manager_authorization || null
        );

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const getTicketPdf = async (req, res, next) => {
    try {
        const result = await SaleTicketPdfService.generateTicketPdf(
            req.params.ticketId
        );

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `inline; filename="${result.filename}"`
        );

        res.send(result.buffer);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getTicketData,
    issueTicket,
    getTicketsBySale,
    getTicketById,
    cancelTicket,
    getTicketPdf
};