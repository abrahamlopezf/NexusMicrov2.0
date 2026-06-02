const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

const CashReportService = require('./CashReportService');

class CashReportExportService {
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

    static async generateSessionPdf(sessionId) {
        const report = await CashReportService.getSessionReport(sessionId);

        return await new Promise((resolve, reject) => {
            const doc = new PDFDocument({
                size: 'LETTER',
                margin: 40
            });

            const chunks = [];

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            doc.fontSize(18).font('Helvetica-Bold').text('Reporte de Caja', {
                align: 'center'
            });

            doc.moveDown(0.5);
            doc.fontSize(10).font('Helvetica').text(`Generado: ${this.formatDate(new Date())}`, {
                align: 'center'
            });

            this.addSectionTitle(doc, 'Sesión');

            doc.fontSize(10);
            doc.text(`Sesión: #${report.session.id}`);
            doc.text(`Estado: ${report.session.status}`);
            doc.text(`Abierta por usuario: ${report.session.opened_by || '-'}`);
            doc.text(`Cerrada por usuario: ${report.session.closed_by || '-'}`);
            doc.text(`Apertura: ${this.formatDate(report.session.opened_at)}`);
            doc.text(`Cierre: ${this.formatDate(report.session.closed_at)}`);
            doc.text(`Notas apertura: ${report.session.notes || '-'}`);
            doc.text(`Notas cierre: ${report.session.closing_notes || '-'}`);

            this.addSectionTitle(doc, 'Totales');

            doc.text(`Monto inicial: ${this.formatMoney(report.totals.opening_amount)}`);
            doc.text(`Ingresos: ${this.formatMoney(report.totals.income)}`);
            doc.text(`Egresos: ${this.formatMoney(report.totals.expense)}`);
            doc.text(`Retiros: ${this.formatMoney(report.totals.withdrawal)}`);
            doc.text(`Ajustes positivos: ${this.formatMoney(report.totals.adjustment_in)}`);
            doc.text(`Ajustes negativos: ${this.formatMoney(report.totals.adjustment_out)}`);
            doc.text(`Movimientos netos: ${this.formatMoney(report.totals.net_movements)}`);
            doc.text(`Cierre esperado: ${this.formatMoney(report.totals.expected_closing_amount)}`);
            doc.text(`Cierre real: ${report.session.actual_closing_amount !== null
                ? this.formatMoney(report.session.actual_closing_amount)
                : '-'
                }`);
            doc.text(`Diferencia: ${report.session.difference_amount !== null
                ? this.formatMoney(report.session.difference_amount)
                : '-'
                }`);

            this.addSectionTitle(doc, 'Desglose por tipo de movimiento');

            Object.entries(report.breakdown.by_movement_type || {}).forEach(([type, data]) => {
                doc.text(
                    `${type} | Cantidad: ${data.count} | Bruto: ${this.formatMoney(data.gross_amount)} | Neto: ${this.formatMoney(data.net_amount)}`
                );
            });

            this.addSectionTitle(doc, 'Movimientos activos');

            if (!report.movements.active.length) {
                doc.text('Sin movimientos activos.');
            }

            report.movements.active.forEach(movement => {
                doc.moveDown(0.4);
                doc.font('Helvetica-Bold').text(`#${movement.id} - ${movement.movement_type}`);
                doc.font('Helvetica').text(`Monto: ${this.formatMoney(movement.amount)} | Neto: ${this.formatMoney(movement.net_amount)}`);
                doc.text(`Método: ${movement.payment_method || '-'} | Fuente: ${movement.source}`);
                doc.text(`Descripción: ${movement.description || '-'}`);
                doc.text(`Referencia: ${movement.reference || '-'}`);
                doc.text(`Creado por: ${movement.created_by || '-'} | Fecha: ${this.formatDate(movement.created_at)}`);

                if (movement.authorizations?.creation) {
                    const auth = movement.authorizations.creation;
                    doc.text(`Autorización creación: #${auth.id} | ${auth.authorization_mode} | Autorizó: ${auth.authorized_by}`);
                    doc.text(`Motivo autorización: ${auth.reason}`);
                }
            });

            this.addSectionTitle(doc, 'Movimientos cancelados');

            if (!report.movements.cancelled.length) {
                doc.text('Sin movimientos cancelados.');
            }

            report.movements.cancelled.forEach(movement => {
                doc.moveDown(0.4);
                doc.font('Helvetica-Bold').text(`#${movement.id} - ${movement.movement_type}`);
                doc.font('Helvetica').text(`Monto: ${this.formatMoney(movement.amount)}`);
                doc.text(`Descripción: ${movement.description || '-'}`);
                doc.text(`Cancelado: ${this.formatDate(movement.cancelled_at)}`);
                doc.text(`Motivo cancelación: ${movement.cancellation_reason || '-'}`);

                if (movement.authorizations?.cancellation) {
                    const auth = movement.authorizations.cancellation;
                    doc.text(`Autorización cancelación: #${auth.id} | ${auth.authorization_mode} | Autorizó: ${auth.authorized_by}`);
                    doc.text(`Motivo autorización: ${auth.reason}`);
                }
            });

            doc.end();
        });
    }

    static async generateSessionExcel(sessionId) {
        const report = await CashReportService.getSessionReport(sessionId);

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'NexusMicro';
        workbook.created = new Date();

        const summary = workbook.addWorksheet('Resumen');
        summary.columns = [
            { header: 'Campo', key: 'field', width: 35 },
            { header: 'Valor', key: 'value', width: 40 }
        ];

        summary.addRows([
            { field: 'Sesión', value: report.session.id },
            { field: 'Estado', value: report.session.status },
            { field: 'Abierta por', value: report.session.opened_by || '' },
            { field: 'Cerrada por', value: report.session.closed_by || '' },
            { field: 'Fecha apertura', value: this.formatDate(report.session.opened_at) },
            { field: 'Fecha cierre', value: this.formatDate(report.session.closed_at) },
            { field: 'Monto inicial', value: report.totals.opening_amount },
            { field: 'Ingresos', value: report.totals.income },
            { field: 'Egresos', value: report.totals.expense },
            { field: 'Retiros', value: report.totals.withdrawal },
            { field: 'Ajustes positivos', value: report.totals.adjustment_in },
            { field: 'Ajustes negativos', value: report.totals.adjustment_out },
            { field: 'Movimientos netos', value: report.totals.net_movements },
            { field: 'Cierre esperado', value: report.totals.expected_closing_amount },
            { field: 'Cierre real', value: report.session.actual_closing_amount ?? '' },
            { field: 'Diferencia', value: report.session.difference_amount ?? '' },
            { field: 'Notas apertura', value: report.session.notes || '' },
            { field: 'Notas cierre', value: report.session.closing_notes || '' }
        ]);

        const movementsSheet = workbook.addWorksheet('Movimientos');
        movementsSheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Estado', key: 'status', width: 14 },
            { header: 'Tipo', key: 'movement_type', width: 20 },
            { header: 'Fuente', key: 'source', width: 15 },
            { header: 'Método', key: 'payment_method', width: 18 },
            { header: 'Monto', key: 'amount', width: 15 },
            { header: 'Neto', key: 'net_amount', width: 15 },
            { header: 'Descripción', key: 'description', width: 35 },
            { header: 'Referencia', key: 'reference', width: 20 },
            { header: 'Creado por', key: 'created_by', width: 15 },
            { header: 'Creado en', key: 'created_at', width: 24 },
            { header: 'Cancelado en', key: 'cancelled_at', width: 24 },
            { header: 'Motivo cancelación', key: 'cancellation_reason', width: 35 },
            { header: 'Autorización creación', key: 'creation_authorization', width: 25 },
            { header: 'Autorización cancelación', key: 'cancellation_authorization', width: 25 }
        ];

        const allMovements = [
            ...report.movements.active,
            ...report.movements.cancelled
        ];

        allMovements.forEach(movement => {
            movementsSheet.addRow({
                id: movement.id,
                status: movement.status,
                movement_type: movement.movement_type,
                source: movement.source,
                payment_method: movement.payment_method || '',
                amount: movement.amount,
                net_amount: movement.net_amount ?? '',
                description: movement.description || '',
                reference: movement.reference || '',
                created_by: movement.created_by || '',
                created_at: this.formatDate(movement.created_at),
                cancelled_at: this.formatDate(movement.cancelled_at),
                cancellation_reason: movement.cancellation_reason || '',
                creation_authorization: movement.authorizations?.creation?.id || '',
                cancellation_authorization: movement.authorizations?.cancellation?.id || ''
            });
        });

        const authorizationsSheet = workbook.addWorksheet('Autorizaciones');
        authorizationsSheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Operación', key: 'operation_type', width: 35 },
            { header: 'Target', key: 'target_type', width: 20 },
            { header: 'Target ID', key: 'target_id', width: 15 },
            { header: 'Modo', key: 'authorization_mode', width: 25 },
            { header: 'Solicitado por', key: 'requested_by', width: 18 },
            { header: 'Autorizado por', key: 'authorized_by', width: 18 },
            { header: 'Motivo', key: 'reason', width: 45 },
            { header: 'Fecha', key: 'authorized_at', width: 24 }
        ];

        allMovements.forEach(movement => {
            const auths = movement.authorizations?.all || [];

            auths.forEach(auth => {
                authorizationsSheet.addRow({
                    id: auth.id,
                    operation_type: auth.operation_type,
                    target_type: auth.target_type,
                    target_id: auth.target_id,
                    authorization_mode: auth.authorization_mode,
                    requested_by: auth.requested_by,
                    authorized_by: auth.authorized_by,
                    reason: auth.reason,
                    authorized_at: this.formatDate(auth.authorized_at)
                });
            });
        });

        [summary, movementsSheet, authorizationsSheet].forEach(sheet => {
            sheet.getRow(1).font = { bold: true };
            sheet.views = [{ state: 'frozen', ySplit: 1 }];
        });

        return await workbook.xlsx.writeBuffer();
    }
}

module.exports = CashReportExportService;