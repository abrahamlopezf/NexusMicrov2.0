const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

const PosDailyReportService = require('./PosDailyReportService');

class PosDailyReportExportService {
    static formatMoney(value) {
        const amount = Number(parseFloat(value || 0).toFixed(2));
        return `$${amount.toLocaleString('es-MX', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    }

    static formatDate(value) {
        if (!value) return '-';

        return new Date(value).toLocaleString('es-MX', {
            timeZone: 'America/Mexico_City',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    static addSectionTitle(doc, title) {
        doc.moveDown(1);
        doc.fontSize(13).font('Helvetica-Bold').text(title);
        doc.moveDown(0.3);
        doc.moveTo(doc.x, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.6);
        doc.font('Helvetica');
    }

    static async generateDailyPdf(query = {}) {
        const report = await PosDailyReportService.getDailyReport(query);

        return await new Promise((resolve, reject) => {
            const doc = new PDFDocument({
                size: 'LETTER',
                margin: 40
            });

            const chunks = [];

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            doc.fontSize(18).font('Helvetica-Bold').text('Reporte POS Diario', {
                align: 'center'
            });

            doc.moveDown(0.5);
            doc.fontSize(10).font('Helvetica').text(`Fecha: ${report.period.date}`, {
                align: 'center'
            });

            doc.text(`Generado: ${this.formatDate(new Date())}`, {
                align: 'center'
            });

            this.addSectionTitle(doc, 'Resumen');

            doc.text(`Ventas creadas: ${report.summary.sales_created_count}`);
            doc.text(`Total ventas creadas: ${this.formatMoney(report.summary.sales_created_total)}`);
            doc.text(`Pagos activos: ${report.summary.payments_count}`);
            doc.text(`Pagos en caja: ${this.formatMoney(report.summary.payments_cash_paid)}`);
            doc.text(`Retenciones: ${this.formatMoney(report.summary.payments_retained_amount)}`);
            doc.text(`Total aplicado: ${this.formatMoney(report.summary.payments_total_applied)}`);
            doc.text(`Pagos cancelados: ${report.summary.cancelled_payments_count}`);
            doc.text(`Monto cancelado: ${this.formatMoney(report.summary.cancelled_payments_amount)}`);

            doc.moveDown(0.5);
            doc.text(`Tickets emitidos total: ${report.summary.tickets_issued_total_count}`);
            doc.text(`Tickets vigentes: ${report.summary.tickets_currently_issued_count}`);
            doc.text(`Tickets cancelados: ${report.summary.tickets_cancelled_count}`);
            doc.text(`Tickets emitidos y cancelados mismo día: ${report.summary.tickets_issued_and_cancelled_same_day_count}`);

            doc.moveDown(0.5);
            doc.text(`Sesiones de caja: ${report.summary.cash_sessions_count}`);
            doc.text(`Cajas abiertas: ${report.summary.cash_sessions_open_count}`);
            doc.text(`Cajas cerradas: ${report.summary.cash_sessions_closed_count}`);

            this.addSectionTitle(doc, 'Pagos activos');

            if (!report.payments.list.length) {
                doc.text('Sin pagos activos en el periodo.');
            }

            report.payments.list.forEach(payment => {
                doc.moveDown(0.4);
                doc.font('Helvetica-Bold').text(`#${payment.id} - ${payment.type}`);
                doc.font('Helvetica').text(`Venta: ${payment.sale_number || '-'} | Cliente: ${payment.client?.name || '-'}`);
                doc.text(`Monto: ${this.formatMoney(payment.amount)} | Método: ${payment.payment_method}`);
                if (payment.payment_method === 'EFECTIVO' && payment.change_amount > 0) {
                    doc.text(`Recibido: ${this.formatMoney(payment.received_amount)} | Cambio: ${this.formatMoney(payment.change_amount)}`);
                }
                doc.text(`Fecha: ${this.formatDate(payment.payment_date)}`);
            });

            this.addSectionTitle(doc, 'Pagos cancelados');

            if (!report.payments.cancelled.length) {
                doc.text('Sin pagos cancelados en el periodo.');
            }

            report.payments.cancelled.forEach(payment => {
                doc.moveDown(0.4);
                doc.font('Helvetica-Bold').text(`#${payment.id} - ${payment.type}`);
                doc.font('Helvetica').text(`Venta: ${payment.sale_number || '-'} | Cliente: ${payment.client?.name || '-'}`);
                doc.text(`Monto: ${this.formatMoney(payment.amount)} | Método: ${payment.payment_method}`);
                doc.text(`Cancelado: ${this.formatDate(payment.cancelled_at)}`);
                doc.text(`Motivo: ${payment.cancellation_reason || '-'}`);

                if (payment.authorization) {
                    doc.text(`Autorización: #${payment.authorization.id} | ${payment.authorization.authorization_mode} | Autorizó: ${payment.authorization.authorized_by}`);
                }
            });

            this.addSectionTitle(doc, 'Tickets cancelados');

            if (!report.tickets.cancelled.length) {
                doc.text('Sin tickets cancelados en el periodo.');
            }

            report.tickets.cancelled.forEach(ticket => {
                doc.moveDown(0.4);
                doc.font('Helvetica-Bold').text(`#${ticket.id} - ${ticket.ticket_number}`);
                doc.font('Helvetica').text(`Venta: ${ticket.sale_id} | Tipo: ${ticket.ticket_type}`);
                doc.text(`Cancelado: ${this.formatDate(ticket.cancelled_at)}`);
                doc.text(`Motivo: ${ticket.cancellation_reason || '-'}`);

                if (ticket.authorization) {
                    doc.text(`Autorización: #${ticket.authorization.id} | ${ticket.authorization.authorization_mode} | Autorizó: ${ticket.authorization.authorized_by}`);
                }
            });

            this.addSectionTitle(doc, 'Sesiones de caja');

            if (!report.cash_sessions.length) {
                doc.text('Sin sesiones de caja en el periodo.');
            }

            report.cash_sessions.forEach(session => {
                doc.moveDown(0.4);
                doc.font('Helvetica-Bold').text(`Caja #${session.id} - ${session.status}`);
                doc.font('Helvetica').text(`Abrió: ${session.opened_by || '-'} | Cerró: ${session.closed_by || '-'}`);
                doc.text(`Inicial: ${this.formatMoney(session.opening_amount)} | Esperado: ${this.formatMoney(session.expected_closing_amount)}`);
                doc.text(`Real: ${session.actual_closing_amount !== null
                        ? this.formatMoney(session.actual_closing_amount)
                        : '-'
                    } | Diferencia: ${session.difference_amount !== null
                        ? this.formatMoney(session.difference_amount)
                        : '-'
                    }`);
                doc.text(`Apertura: ${this.formatDate(session.opened_at)} | Cierre: ${this.formatDate(session.closed_at)}`);

                if (session.authorization) {
                    doc.text(`Autorización cierre con diferencia: #${session.authorization.id} | Autorizó: ${session.authorization.authorized_by}`);
                }
            });

            doc.end();
        });
    }

    static async generateDailyExcel(query = {}) {
        const report = await PosDailyReportService.getDailyReport(query);

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'NexusMicro';
        workbook.created = new Date();

        const summary = workbook.addWorksheet('Resumen');
        summary.columns = [
            { header: 'Campo', key: 'field', width: 45 },
            { header: 'Valor', key: 'value', width: 30 }
        ];

        summary.addRows([
            { field: 'Fecha', value: report.period.date },
            { field: 'Inicio periodo', value: this.formatDate(report.period.start) },
            { field: 'Fin periodo', value: this.formatDate(report.period.end) },
            { field: 'Ventas creadas', value: report.summary.sales_created_count },
            { field: 'Total ventas creadas', value: report.summary.sales_created_total },
            { field: 'Pagos activos', value: report.summary.payments_count },
            { field: 'Pagos en caja', value: report.summary.payments_cash_paid },
            { field: 'Retenciones', value: report.summary.payments_retained_amount },
            { field: 'Total aplicado', value: report.summary.payments_total_applied },
            { field: 'Pagos cancelados', value: report.summary.cancelled_payments_count },
            { field: 'Monto pagos cancelados', value: report.summary.cancelled_payments_amount },
            { field: 'Tickets emitidos total', value: report.summary.tickets_issued_total_count },
            { field: 'Tickets vigentes', value: report.summary.tickets_currently_issued_count },
            { field: 'Tickets cancelados', value: report.summary.tickets_cancelled_count },
            { field: 'Tickets emitidos y cancelados mismo día', value: report.summary.tickets_issued_and_cancelled_same_day_count },
            { field: 'Sesiones de caja', value: report.summary.cash_sessions_count },
            { field: 'Cajas abiertas', value: report.summary.cash_sessions_open_count },
            { field: 'Cajas cerradas', value: report.summary.cash_sessions_closed_count }
        ]);

        const paymentsSheet = workbook.addWorksheet('Pagos activos');
        paymentsSheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Venta', key: 'sale_number', width: 25 },
            { header: 'Cliente', key: 'client', width: 30 },
            { header: 'Monto', key: 'amount', width: 15 },
            { header: 'Recibido', key: 'received_amount', width: 15 },
            { header: 'Cambio', key: 'change_amount', width: 15 },
            { header: 'Método', key: 'payment_method', width: 18 },
            { header: 'Tipo', key: 'type', width: 18 },
            { header: 'Fecha', key: 'payment_date', width: 24 },
            { header: 'Creado por', key: 'created_by', width: 15 },
            { header: 'Notas', key: 'notes', width: 35 }
        ];

        report.payments.list.forEach(payment => {
            paymentsSheet.addRow({
                id: payment.id,
                sale_number: payment.sale_number || '',
                client: payment.client?.name || '',
                amount: payment.amount,
                received_amount: payment.received_amount ?? '',
                change_amount: payment.change_amount,
                payment_method: payment.payment_method,
                type: payment.type,
                payment_date: this.formatDate(payment.payment_date),
                created_by: payment.created_by || '',
                notes: payment.notes || ''
            });
        });

        const cancelledPaymentsSheet = workbook.addWorksheet('Pagos cancelados');
        cancelledPaymentsSheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Venta', key: 'sale_number', width: 25 },
            { header: 'Cliente', key: 'client', width: 30 },
            { header: 'Monto', key: 'amount', width: 15 },
            { header: 'Recibido', key: 'received_amount', width: 15 },
            { header: 'Cambio', key: 'change_amount', width: 15 },
            { header: 'Método', key: 'payment_method', width: 18 },
            { header: 'Tipo', key: 'type', width: 18 },
            { header: 'Cancelado en', key: 'cancelled_at', width: 24 },
            { header: 'Motivo', key: 'cancellation_reason', width: 35 },
            { header: 'Autorización ID', key: 'authorization_id', width: 18 },
            { header: 'Autorizado por', key: 'authorized_by', width: 18 },
            { header: 'Modo autorización', key: 'authorization_mode', width: 22 }
        ];

        report.payments.cancelled.forEach(payment => {
            cancelledPaymentsSheet.addRow({
                id: payment.id,
                sale_number: payment.sale_number || '',
                client: payment.client?.name || '',
                amount: payment.amount,
                received_amount: payment.received_amount ?? '',
                change_amount: payment.change_amount,
                payment_method: payment.payment_method,
                type: payment.type,
                cancelled_at: this.formatDate(payment.cancelled_at),
                cancellation_reason: payment.cancellation_reason || '',
                authorization_id: payment.authorization?.id || '',
                authorized_by: payment.authorization?.authorized_by || '',
                authorization_mode: payment.authorization?.authorization_mode || ''
            });
        });

        const ticketsSheet = workbook.addWorksheet('Tickets cancelados');
        ticketsSheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Venta ID', key: 'sale_id', width: 12 },
            { header: 'Número ticket', key: 'ticket_number', width: 40 },
            { header: 'Tipo', key: 'ticket_type', width: 20 },
            { header: 'Emitido por', key: 'issued_by', width: 15 },
            { header: 'Emitido en', key: 'issued_at', width: 24 },
            { header: 'Cancelado en', key: 'cancelled_at', width: 24 },
            { header: 'Motivo', key: 'cancellation_reason', width: 35 },
            { header: 'Autorización ID', key: 'authorization_id', width: 18 },
            { header: 'Autorizado por', key: 'authorized_by', width: 18 },
            { header: 'Modo autorización', key: 'authorization_mode', width: 22 }
        ];

        report.tickets.cancelled.forEach(ticket => {
            ticketsSheet.addRow({
                id: ticket.id,
                sale_id: ticket.sale_id,
                ticket_number: ticket.ticket_number,
                ticket_type: ticket.ticket_type,
                issued_by: ticket.issued_by || '',
                issued_at: this.formatDate(ticket.issued_at),
                cancelled_at: this.formatDate(ticket.cancelled_at),
                cancellation_reason: ticket.cancellation_reason || '',
                authorization_id: ticket.authorization?.id || '',
                authorized_by: ticket.authorization?.authorized_by || '',
                authorization_mode: ticket.authorization?.authorization_mode || ''
            });
        });

        const cashSessionsSheet = workbook.addWorksheet('Sesiones caja');
        cashSessionsSheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Estado', key: 'status', width: 15 },
            { header: 'Abierta por', key: 'opened_by', width: 15 },
            { header: 'Cerrada por', key: 'closed_by', width: 15 },
            { header: 'Monto inicial', key: 'opening_amount', width: 15 },
            { header: 'Cierre esperado', key: 'expected_closing_amount', width: 18 },
            { header: 'Cierre real', key: 'actual_closing_amount', width: 15 },
            { header: 'Diferencia', key: 'difference_amount', width: 15 },
            { header: 'Apertura', key: 'opened_at', width: 24 },
            { header: 'Cierre', key: 'closed_at', width: 24 },
            { header: 'Autorización ID', key: 'authorization_id', width: 18 },
            { header: 'Autorizado por', key: 'authorized_by', width: 18 }
        ];

        report.cash_sessions.forEach(session => {
            cashSessionsSheet.addRow({
                id: session.id,
                status: session.status,
                opened_by: session.opened_by || '',
                closed_by: session.closed_by || '',
                opening_amount: session.opening_amount,
                expected_closing_amount: session.expected_closing_amount,
                actual_closing_amount: session.actual_closing_amount ?? '',
                difference_amount: session.difference_amount ?? '',
                opened_at: this.formatDate(session.opened_at),
                closed_at: this.formatDate(session.closed_at),
                authorization_id: session.authorization?.id || '',
                authorized_by: session.authorization?.authorized_by || ''
            });
        });

        [
            summary,
            paymentsSheet,
            cancelledPaymentsSheet,
            ticketsSheet,
            cashSessionsSheet
        ].forEach(sheet => {
            sheet.getRow(1).font = { bold: true };
            sheet.views = [{ state: 'frozen', ySplit: 1 }];
        });

        return await workbook.xlsx.writeBuffer();
    }
}

module.exports = PosDailyReportExportService;