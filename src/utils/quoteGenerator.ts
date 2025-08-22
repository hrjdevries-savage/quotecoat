import jsPDF from 'jspdf';
import { QuoteDraft } from '@/types';
import { downloadBlob } from './helpers';

export function generatePDF(draft: QuoteDraft): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      let yPos = 30;

      // Header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Coat24', margin, yPos);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Offerte Builder MVP', margin, yPos + 8);

      // Quote info (right aligned)
      const rightMargin = pageWidth - margin;
      doc.text(`Offertenummer: ${draft.meta.quoteNumber}`, rightMargin, yPos, { align: 'right' });
      doc.text(`Datum: ${new Date().toLocaleDateString('nl-NL')}`, rightMargin, yPos + 8, { align: 'right' });

      yPos += 30;

      // Client info
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Klantgegevens', margin, yPos);
      
      yPos += 8;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Klant: ${draft.meta.clientName}`, margin, yPos);
      
      if (draft.meta.clientReference) {
        yPos += 6;
        doc.text(`Referentie: ${draft.meta.clientReference}`, margin, yPos);
      }

      yPos += 20;

      // Table header
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Regelitems', margin, yPos);
      
      yPos += 15;

      // Table
      const tableStartY = yPos;
      const colWidths = [80, 40, 50, 30]; // Omschrijving, Tekeningnr, Bestand, Prijs
      const colPositions = [margin, margin + colWidths[0], margin + colWidths[0] + colWidths[1], margin + colWidths[0] + colWidths[1] + colWidths[2]];

      // Table headers
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Omschrijving', colPositions[0], yPos);
      doc.text('Tekeningnr.', colPositions[1], yPos);
      doc.text('Bestand', colPositions[2], yPos);
      doc.text('Prijs (€)', colPositions[3], yPos);

      // Line under headers
      yPos += 2;
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 8;

      // Table rows
      doc.setFont('helvetica', 'normal');
      let total = 0;

      draft.lineItems.forEach((item) => {
        // Check if we need a new page
        if (yPos > 250) {
          doc.addPage();
          yPos = 30;
        }

        const price = item.price || 0;
        total += price;

        doc.text(item.description || '-', colPositions[0], yPos, { maxWidth: colWidths[0] - 5 });
        doc.text(item.drawingNumber || '-', colPositions[1], yPos, { maxWidth: colWidths[1] - 5 });
        doc.text(item.fileName || 'Handmatig', colPositions[2], yPos, { maxWidth: colWidths[2] - 5 });
        doc.text(price > 0 ? formatPrice(price) : '-', colPositions[3], yPos);

        yPos += 8;
      });

      // Total line
      yPos += 5;
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 8;

      doc.setFont('helvetica', 'bold');
      doc.text('Totaal:', colPositions[2], yPos);
      doc.text(formatPrice(total), colPositions[3], yPos);

      yPos += 20;

      // Terms
      if (draft.meta.terms) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Voorwaarden:', margin, yPos);
        yPos += 6;
        const splitTerms = doc.splitTextToSize(draft.meta.terms, pageWidth - 2 * margin);
        doc.text(splitTerms, margin, yPos);
        yPos += splitTerms.length * 4;
      }

      // Validity
      yPos += 10;
      const validUntil = new Date(Date.now() + draft.meta.validityDays * 24 * 60 * 60 * 1000);
      doc.text(`Geldig tot: ${validUntil.toLocaleDateString('nl-NL')}`, margin, yPos);

      // Footer
      const footerY = doc.internal.pageSize.getHeight() - 20;
      doc.setFontSize(8);
      doc.text('Gegenereerd met Coat24 Offer Builder (MVP)', pageWidth / 2, footerY, { align: 'center' });

      // Save the PDF
      const pdfBlob = doc.output('blob');
      const filename = `Offerte_${draft.meta.quoteNumber}_${draft.meta.clientName.replace(/\s+/g, '_')}.pdf`;
      downloadBlob(pdfBlob, filename);
      
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

export function generateEmailText(draft: QuoteDraft): string {
  const total = draft.lineItems.reduce((sum, item) => sum + (item.price || 0), 0);
  const validUntil = new Date(Date.now() + draft.meta.validityDays * 24 * 60 * 60 * 1000);

  let emailText = `Onderwerp: Offerte ${draft.meta.quoteNumber} - ${draft.meta.clientName}\n\n`;
  emailText += `Beste ${draft.meta.clientName},\n\n`;
  emailText += `Hierbij ontvangt u onze offerte voor de gevraagde werkzaamheden.\n\n`;
  
  if (draft.meta.clientReference) {
    emailText += `Referentie: ${draft.meta.clientReference}\n`;
  }
  
  emailText += `Offertenummer: ${draft.meta.quoteNumber}\n`;
  emailText += `Datum: ${new Date().toLocaleDateString('nl-NL')}\n\n`;
  
  emailText += `REGELITEMS:\n`;
  emailText += `${'='.repeat(80)}\n`;
  emailText += `${'Omschrijving'.padEnd(30)} ${'Tekeningnr.'.padEnd(15)} ${'Bestand'.padEnd(20)} ${'Prijs'.padStart(10)}\n`;
  emailText += `${'-'.repeat(80)}\n`;
  
  draft.lineItems.forEach((item) => {
    const desc = (item.description || '-').substring(0, 29).padEnd(30);
    const drawing = (item.drawingNumber || '-').substring(0, 14).padEnd(15);
    const filename = (item.fileName || 'Handmatig').substring(0, 19).padEnd(20);
    const price = item.price ? formatPrice(item.price) : '-';
    
    emailText += `${desc} ${drawing} ${filename} ${price.padStart(10)}\n`;
  });
  
  emailText += `${'-'.repeat(80)}\n`;
  emailText += `${'TOTAAL:'.padEnd(65)} ${formatPrice(total).padStart(10)}\n`;
  emailText += `${'='.repeat(80)}\n\n`;
  
  emailText += `Geldig tot: ${validUntil.toLocaleDateString('nl-NL')}\n\n`;
  
  if (draft.meta.terms) {
    emailText += `VOORWAARDEN:\n${draft.meta.terms}\n\n`;
  }
  
  emailText += `Met vriendelijke groet,\n\n`;
  emailText += `Het Coat24 team\n\n`;
  emailText += `---\n`;
  emailText += `Deze offerte is gegenereerd met Coat24 Offer Builder (MVP)\n`;
  
  return emailText;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR'
  }).format(price);
}