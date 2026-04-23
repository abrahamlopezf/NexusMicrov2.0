// RF-14, RF-22 - Servicio PDF Generador
class PdfService {
    static async generateQuotePdf(quoteData) {
        // En un entorno de producción, aquí usaremos pdfkit o puppeteer para inyectar 
        // el JSON en una plantilla y retornar el buffer
        return Buffer.from("%PDF-1.4\n%Hekka_Quote_Dummy_Buffer");
    }

    static async generateReceiptPdf(paymentData) {
        // En un entorno de producción, retorna el recibo oficial
        return Buffer.from("%PDF-1.4\n%Hekka_Receipt_Dummy_Buffer");
    }
}

module.exports = PdfService;
