import { useState, useCallback } from 'react';
import { Upload, Mail, FileText, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useQuoteStore } from '@/store/useQuoteStore';
import { Attachment, LineItem, QuoteDraft } from '@/types';

export function EmailUpload() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { setDraft, generateQuoteNumber } = useQuoteStore();

  const processFiles = useCallback(async (files: FileList) => {
    setIsProcessing(true);
    
    try {
      const attachments: Attachment[] = [];
      const lineItems: LineItem[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Create attachment
        const attachment: Attachment = {
          id: `att_${Date.now()}_${i}`,
          fileName: file.name,
          mimeType: file.type || 'application/octet-stream',
          sizeBytes: file.size,
          blobUrl: URL.createObjectURL(file),
          file: file,
        };
        
        attachments.push(attachment);

        // Create corresponding line item
        const lineItem: LineItem = {
          id: `item_${Date.now()}_${i}`,
          attachmentId: attachment.id,
          fileName: file.name,
          description: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
          drawingNumber: '',
          price: null,
        };
        
        lineItems.push(lineItem);
      }

      // Create new draft
      const draft: QuoteDraft = {
        meta: {
          clientName: '',
          clientReference: '',
          quoteNumber: generateQuoteNumber(),
          validityDays: 30,
          terms: 'Prijzen zijn exclusief BTW. Geldig tot vervaldatum.',
          createdAt: new Date().toISOString(),
        },
        lineItems,
        attachments,
        emailParseInfo: files.length === 1 && files[0].name.endsWith('.eml') 
          ? { subject: 'Imported from email' }
          : undefined,
      };

      setDraft(draft);
      
      toast({
        title: 'Bestanden verwerkt',
        description: `${files.length} bestand(en) toegevoegd als regelitems`,
      });
    } catch (error) {
      console.error('Error processing files:', error);
      toast({
        title: 'Fout bij verwerken',
        description: 'Er ging iets mis bij het verwerken van de bestanden',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [setDraft, generateQuoteNumber, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFiles(files);
    }
  }, [processFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
  }, [processFiles]);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-4">
          Coat24 Offerte Builder
        </h1>
        <p className="text-muted-foreground text-lg">
          Upload je e-mail met bijlagen om automatisch een offerte te genereren
        </p>
      </div>

      <Card 
        className={`p-12 border-2 border-dashed transition-all duration-200 ${
          isDragOver 
            ? 'border-primary bg-primary/5 scale-105' 
            : 'border-border hover:border-primary/50'
        } ${isProcessing ? 'opacity-50' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            {isProcessing ? (
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
            ) : (
              <div className="p-4 bg-primary/10 rounded-full">
                <Upload className="h-12 w-12 text-primary" />
              </div>
            )}
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-2">
              {isProcessing ? 'Bestanden verwerken...' : 'Sleep bestanden hierheen'}
            </h3>
            <p className="text-muted-foreground mb-4">
              Ondersteund: .eml, .msg bestanden of losse bijlagen
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <label htmlFor="file-upload">
              <Button asChild disabled={isProcessing}>
                <span className="cursor-pointer">
                  <Mail className="mr-2 h-4 w-4" />
                  E-mail uploaden
                </span>
              </Button>
            </label>
            
            <label htmlFor="attachment-upload">
              <Button variant="outline" asChild disabled={isProcessing}>
                <span className="cursor-pointer">
                  <FileText className="mr-2 h-4 w-4" />
                  Bijlagen uploaden
                </span>
              </Button>
            </label>
          </div>

          <input
            id="file-upload"
            type="file"
            className="hidden"
            accept=".eml,.msg"
            onChange={handleFileInput}
            disabled={isProcessing}
          />
          
          <input
            id="attachment-upload"
            type="file"
            className="hidden"
            multiple
            onChange={handleFileInput}
            disabled={isProcessing}
          />

          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span>Alle bestanden worden lokaal verwerkt en opgeslagen</span>
          </div>
        </div>
      </Card>
    </div>
  );
}