import { useRef } from 'react';
import { FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuoteStore } from '@/store/useQuoteStore';
import { PdfTemplate } from './PdfTemplate';
import html2pdf from 'html2pdf.js';

export function PdfGenerator() {
  const { currentDraft, getTotalPrice } = useQuoteStore();
  const templateRef = useRef<HTMLDivElement>(null);

  const generatePdf = async () => {
    if (!currentDraft || !templateRef.current) return;

    const element = templateRef.current;
    
    const options = {
      margin: [10, 10, 10, 10],
      filename: `Offerte_${currentDraft.meta.quoteNumber}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        letterRendering: true,
        allowTaint: false
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait' 
      }
    };

    try {
      await html2pdf().set(options).from(element).save();
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  if (!currentDraft) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">PDF Offerte Genereren</h3>
        <Button onClick={generatePdf} className="flex items-center gap-2">
          <FileDown className="h-4 w-4" />
          Download PDF
        </Button>
      </div>
      
      {/* Hidden template for PDF generation */}
      <div className="hidden">
        <PdfTemplate 
          ref={templateRef}
          quoteDraft={currentDraft}
          totalPrice={getTotalPrice()}
        />
      </div>
      
      {/* Preview */}
      <div className="border rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
        <div className="text-sm text-muted-foreground mb-2">Preview:</div>
        <div className="scale-75 origin-top-left transform">
          <PdfTemplate 
            quoteDraft={currentDraft}
            totalPrice={getTotalPrice()}
          />
        </div>
      </div>
    </div>
  );
}