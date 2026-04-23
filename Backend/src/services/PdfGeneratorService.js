// Abstract Layer for PDF Generation
// This allows hot-swapping between Puppeteer (HTML->PDF) and DocxTemplater (DOCX->PDF) later.

class PdfGeneratorFactory {
  static getGenerator(strategy = 'puppeteer') {
      if (strategy === 'puppeteer') {
          return new PuppeteerPdfGenerator();
      } else if (strategy === 'docxtemplater') {
          return new DocxTemplaterGenerator();
      }
      throw new Error('PDF Generation Strategy not supported');
  }
}

class PuppeteerPdfGenerator {
  async generate(quoteData) {
      // In a real env, import puppeteer dynamically to avoid crashing if not installed yet
      let puppeteer;
      try {
          puppeteer = require('puppeteer');
      } catch (err) {
          throw new Error('Puppeteer is not installed. Please run `npm install puppeteer`');
      }

      const htmlContent = this._buildHtmlTemplate(quoteData);

      const browser = await puppeteer.launch({ headless: 'new' });
      const page = await browser.newPage();
      
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      const pdfBuffer = await page.pdf({
          format: 'A4',
          printBackground: true,
          margin: { top: '2cm', right: '2cm', bottom: '2cm', left: '2cm' }
      });

      await browser.close();
      return pdfBuffer;
  }

  _buildHtmlTemplate(quote) {
      // This template mirrors "cotización Los Fresnitos.docx" styling
      const rows = quote.items.map(i => `
          <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${i.quantity}</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${i.custom_description || 'Prenda'}</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${i.unit_price}</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${i.total}</td>
          </tr>
      `).join('');

      return `
      <!DOCTYPE html>
      <html>
      <head>
          <style>
              body { font-family: 'Helvetica', Arial, sans-serif; color: #333; }
              .header { text-align: right; margin-bottom: 40px; }
              .title { color: #d4af37; /* Hekka Gold */ font-size: 24px; font-weight: bold; }
              .details { margin-bottom: 30px; }
              table { w-full; border-collapse: collapse; margin-top: 20px; width: 100%; }
              th { background-color: #000; color: #fff; text-align: left; padding: 10px; }
              .totals { text-align: right; margin-top: 20px; font-weight: bold; }
          </style>
      </head>
      <body>
          <div class="header">
              <div class="title">HEKKA SASTRERÍA</div>
              <p>Cotización: <strong>${quote.quote_number}</strong></p>
              <p>Fecha: ${new Date().toLocaleDateString()}</p>
              <p>Válida hasta: ${quote.valid_until}</p>
          </div>
          
          <div class="details">
              <p>Atención a: <strong>${quote.client?.name || 'Cliente'}</strong></p>
          </div>

          <table>
              <thead>
                  <tr>
                      <th>Cant.</th>
                      <th>Descripción</th>
                      <th style="text-align:right;">P. Unitario</th>
                      <th style="text-align:right;">Total</th>
                  </tr>
              </thead>
              <tbody>
                  ${rows}
              </tbody>
          </table>

          <div class="totals">
              <p>Subtotal: $${quote.subtotal}</p>
              <p>Descuento: $${quote.discount}</p>
              <p style="font-size: 18px; color: #d4af37;">TOTAL: $${quote.total}</p>
          </div>

          <div style="margin-top: 50px; font-size: 12px; color: #666;">
              <p>Notas: ${quote.notes || 'Ninguna'}</p>
              <p>Generado automáticamente por NexusMicro ERP.</p>
          </div>
      </body>
      </html>
      `;
  }
}

class DocxTemplaterGenerator {
  async generate(quoteData) {
      throw new Error('DocxTemplater strategy not yet implemented.');
  }
}

module.exports = PdfGeneratorFactory;
