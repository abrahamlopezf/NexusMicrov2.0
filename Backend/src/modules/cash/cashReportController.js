const CashReportService = require('./CashReportService');
const CashReportExportService = require('./CashReportExportService');

const getSessionReport = async (req, res, next) => {
    try {
        const result = await CashReportService.getSessionReport(
            req.params.sessionId
        );

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const getSessionReportPdf = async (req, res, next) => {
    try {
        const buffer = await CashReportExportService.generateSessionPdf(
            req.params.sessionId
        );

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="cash-session-${req.params.sessionId}-report.pdf"`
        );

        return res.send(buffer);
    } catch (error) {
        next(error);
    }
};

const getSessionReportExcel = async (req, res, next) => {
    try {
        const buffer = await CashReportExportService.generateSessionExcel(
            req.params.sessionId
        );

        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="cash-session-${req.params.sessionId}-report.xlsx"`
        );

        return res.send(buffer);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getSessionReport,
    getSessionReportPdf,
    getSessionReportExcel
};