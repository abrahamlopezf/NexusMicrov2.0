const PDFDocument = require('pdfkit');
const { SaleTicket } = require('../../models');
const AppError = require('../../utils/AppError');

class SaleTicketPdfService {
    static formatMoney(value) {
        const amount = Number(value || 0);

        return amount.toLocaleString('es-MX', {
            style: 'currency',
            currency: 'MXN'
        });
    }

    static formatDate(value) {
        if (!value) return 'N/A';

        return new Date(value).toLocaleString('es-MX', {
            timeZone: 'America/Mexico_City',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    static drawRow(doc, label, value, x, y, width = 500) {
        doc
            .font('Helvetica-Bold')
            .fontSize(9)
            .text(label, x, y, { width: 150 });

        doc
            .font('Helvetica')
            .fontSize(9)
            .text(value || 'N/A', x + 150, y, { width: width - 150 });
    }

    static async generateTicketPdf(ticketId) {
        const ticket = await SaleTicket.findByPk(ticketId);

        if (!ticket) {
            throw new AppError('Ticket not found', 404);
        }

        const snapshot = ticket.snapshot || {};
        const sale = snapshot.sale || {};
        const client = snapshot.client || {};
        const items = snapshot.items || [];
        const payments = snapshot.payments || [];
        const summary = snapshot.financial_summary || {};

        const doc = new PDFDocument({
            size: 'A4',
            margin: 40,
            info: {
                Title: `Ticket ${ticket.ticket_number}`,
                Author: 'NexusMicro ERP',
                Subject: 'Ticket digital'
            }
        });

        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));

        const pdfPromise = new Promise((resolve, reject) => {
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);
        });

        // Header
        doc
            .font('Helvetica-Bold')
            .fontSize(18)
            .text('NexusMicro ERP', { align: 'center' });

        doc
            .font('Helvetica')
            .fontSize(10)
            .text('Ticket digital de venta', { align: 'center' });

        doc.moveDown(1);

        if (ticket.status === 'CANCELLED') {
            doc
                .font('Helvetica-Bold')
                .fontSize(18)
                .fillColor('red')
                .text('TICKET CANCELADO', { align: 'center' });

            doc
                .font('Helvetica')
                .fontSize(9)
                .fillColor('black')
                .text(`Motivo: ${ticket.cancellation_reason || 'Sin motivo especificado'}`, {
                    align: 'center'
                });

            doc.moveDown(1);
        }

        doc
            .fillColor('black')
            .moveTo(40, doc.y)
            .lineTo(555, doc.y)
            .stroke();

        doc.moveDown(1);

        // Ticket info
        let y = doc.y;

        this.drawRow(doc, 'Ticket:', ticket.ticket_number, 40, y);
        y += 16;
        this.drawRow(doc, 'Tipo:', ticket.ticket_type, 40, y);
        y += 16;
        this.drawRow(doc, 'Estado:', ticket.status, 40, y);
        y += 16;
        this.drawRow(doc, 'Emitido:', this.formatDate(ticket.issued_at), 40, y);
        y += 16;
        this.drawRow(doc, 'Venta:', sale.sale_number, 40, y);

        doc.y = y + 26;

        // Client
        doc
            .font('Helvetica-Bold')
            .fontSize(12)
            .text('Cliente');

        doc.moveDown(0.3);

        y = doc.y;
        this.drawRow(doc, 'Nombre:', client.name, 40, y);
        y += 16;
        this.drawRow(doc, 'Teléfono:', client.phone, 40, y);
        y += 16;
        this.drawRow(doc, 'Email:', client.email, 40, y);

        doc.y = y + 24;

        // Items
        doc
            .font('Helvetica-Bold')
            .fontSize(12)
            .text('Prendas / Conceptos');

        doc.moveDown(0.5);

        const tableTop = doc.y;
        const colX = {
            desc: 40,
            qty: 300,
            unit: 355,
            total: 455
        };

        doc
            .font('Helvetica-Bold')
            .fontSize(9)
            .text('Descripción', colX.desc, tableTop, { width: 250 })
            .text('Cant.', colX.qty, tableTop, { width: 40, align: 'right' })
            .text('P. Unit.', colX.unit, tableTop, { width: 80, align: 'right' })
            .text('Total', colX.total, tableTop, { width: 90, align: 'right' });

        doc
            .moveTo(40, tableTop + 14)
            .lineTo(555, tableTop + 14)
            .stroke();

        y = tableTop + 22;

        items.forEach(item => {
            if (y > 700) {
                doc.addPage();
                y = 50;
            }

            doc
                .font('Helvetica')
                .fontSize(9)
                .text(item.description || item.product_name || 'Prenda / Servicio', colX.desc, y, {
                    width: 250
                })
                .text(String(item.quantity || 0), colX.qty, y, {
                    width: 40,
                    align: 'right'
                })
                .text(this.formatMoney(item.unit_price), colX.unit, y, {
                    width: 80,
                    align: 'right'
                })
                .text(this.formatMoney(item.total), colX.total, y, {
                    width: 90,
                    align: 'right'
                });

            y += 28;
        });

        doc.y = y + 10;

        // Payments
        doc
            .font('Helvetica-Bold')
            .fontSize(12)
            .text('Pagos y movimientos');

        doc.moveDown(0.5);

        const payTop = doc.y;

        doc
            .font('Helvetica-Bold')
            .fontSize(9)
            .text('Fecha', 40, payTop, { width: 90 })
            .text('Tipo', 135, payTop, { width: 80 })
            .text('Método', 220, payTop, { width: 100 })
            .text('Importe', 465, payTop, { width: 90, align: 'right' });

        doc
            .moveTo(40, payTop + 14)
            .lineTo(555, payTop + 14)
            .stroke();

        y = payTop + 22;

        payments.forEach(payment => {
            if (y > 700) {
                doc.addPage();
                y = 50;
            }

            doc
                .font('Helvetica')
                .fontSize(8)
                .text(this.formatDate(payment.payment_date), 40, y, { width: 90 })
                .text(payment.type || 'N/A', 135, y, { width: 80 })
                .text(payment.payment_method || 'N/A', 220, y, { width: 100 })
                .text(this.formatMoney(payment.amount), 465, y, {
                    width: 90,
                    align: 'right'
                });

            if (payment.notes) {
                y += 11;
                doc
                    .fontSize(7)
                    .fillColor('#555555')
                    .text(`Nota: ${payment.notes}`, 135, y, { width: 390 })
                    .fillColor('black');
            }

            if (payment.payment_method === 'EFECTIVO' && Number(payment.change_amount || 0) > 0) {
                y += 11;
                doc
                    .fontSize(7)
                    .fillColor('#555555')
                    .text(
                        `Recibido: ${this.formatMoney(payment.received_amount)} | Cambio: ${this.formatMoney(payment.change_amount)}`,
                        135,
                        y,
                        { width: 390 }
                    )
                    .fillColor('black');
            }

            y += 24;
        });

        doc.y = y + 10;

        // Summary
        if (doc.y > 650) {
            doc.addPage();
        }

        doc
            .font('Helvetica-Bold')
            .fontSize(12)
            .text('Resumen financiero');

        doc.moveDown(0.5);

        y = doc.y;

        const summaryRows = [
            ['Total', this.formatMoney(summary.total)],
            ['Pagado en caja/banco', this.formatMoney(summary.cash_paid)],
            ['Retenciones', this.formatMoney(summary.retained_amount)],
            ['Migrado histórico', this.formatMoney(summary.migrated_amount)],
            ['Total aplicado', this.formatMoney(summary.total_applied)],
            ['Saldo pendiente', this.formatMoney(summary.balance)],
            ['Estado financiero', summary.financial_status || 'N/A']
        ];

        summaryRows.forEach(([label, value]) => {
            doc
                .font('Helvetica-Bold')
                .fontSize(10)
                .text(label, 330, y, { width: 120 });

            doc
                .font('Helvetica')
                .fontSize(10)
                .text(value, 455, y, { width: 100, align: 'right' });

            y += 18;
        });

        doc.y = y + 20;

        // Footer
        doc
            .font('Helvetica')
            .fontSize(8)
            .fillColor('#555555')
            .text(
                'Este documento es un comprobante interno generado desde el sistema. No sustituye comprobante fiscal.',
                40,
                760,
                { align: 'center', width: 515 }
            );

        doc.end();

        const buffer = await pdfPromise;

        return {
            buffer,
            filename: `${ticket.ticket_number}.pdf`
        };
    }
}

module.exports = SaleTicketPdfService;