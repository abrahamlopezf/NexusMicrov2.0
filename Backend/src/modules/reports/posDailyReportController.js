const PosDailyReportService = require('./PosDailyReportService');
const PosDailyReportExportService = require('./PosDailyReportExportService');

const getDailyReport = async (req, res, next) => {
    try {
        const result = await PosDailyReportService.getDailyReport(req.query);

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const getDailyReportPdf = async (req, res, next) => {
    try {
        const buffer = await PosDailyReportExportService.generateDailyPdf(
            req.query
        );

        const date = req.query.date || new Date().toISOString().slice(0, 10);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="pos-daily-report-${date}.pdf"`
        );

        return res.send(buffer);
    } catch (error) {
        next(error);
    }
};

const getDailyReportExcel = async (req, res, next) => {
    try {
        const buffer = await PosDailyReportExportService.generateDailyExcel(
            req.query
        );

        const date = req.query.date || new Date().toISOString().slice(0, 10);

        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="pos-daily-report-${date}.xlsx"`
        );

        return res.send(buffer);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getDailyReport,
    getDailyReportPdf,
    getDailyReportExcel
};