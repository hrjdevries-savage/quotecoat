import { useState, useCallback } from 'react';
import { Upload, Mail, FileText, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useQuoteStore } from '@/store/useQuoteStore';
import { Attachment, LineItem, QuoteDraft } from '@/types';
import { ConnectOutlookButton } from './ConnectOutlookButton';

export function EmailUpload() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { setDraft, generateQuoteNumber } = useQuoteStore();

  const parseEmailFile = async (file: File) => {
    console.log('Parsing email file:', file.name, file.size, file.type);
    const text = await file.text();
    console.log('Email content length:', text.length);
    const attachments: Attachment[] = [];
    
    const isMsg = file.name.toLowerCase().endsWith('.msg');
    const isEml = file.name.toLowerCase().endsWith('.eml');
    
    if (isMsg) {
      // MSG files are Microsoft compound documents - we need to parse them differently
      console.log('Parsing MSG file format');
      
      // Read as binary data instead of text
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Convert to text for searching but preserve binary data
      const textContent = new TextDecoder('latin1').decode(uint8Array);
      
      // Look for attachment markers in MSG files
      const attachmentMarkers = [
        /__attach_version1\.0_#/g,
        /__substg1\.0_3701000D/g, // Attachment data
        /__substg1\.0_3704001F/g, // Attachment filename
        /__substg1\.0_370E001F/g  // Attachment MIME type
      ];
      
      // Find filename patterns more specifically for MSG
      const filenamePatterns = [
        /([^\\/:*?"<>|\x00-\x1f]+\.(pdf|png|jpe?g|step?|stp|iges?|igs|stl|obj|3ds|fbx|dxf))[\x00\s]/gi,
        /filename[*]?[:=]\s*"?([^"\r\n\x00]+\.(pdf|png|jpe?g|step?|stp|iges?|igs|stl|obj|3ds|fbx|dxf))"?/gi
      ];
      
      let foundFilenames: string[] = [];
      
      for (const pattern of filenamePatterns) {
        const matches = [...textContent.matchAll(pattern)];
        foundFilenames = foundFilenames.concat(matches.map(match => match[1]));
      }
      
      // Remove duplicates and clean up
      foundFilenames = [...new Set(foundFilenames)].filter(name => 
        name && name.length > 0 && name.length < 255
      );
      
      console.log('Found filenames in MSG:', foundFilenames);
      
      // Look for base64 encoded content near filenames
      for (const filename of foundFilenames) {
        console.log('Processing MSG attachment:', filename);
        
        // Find the position of this filename
        const filenamePos = textContent.indexOf(filename);
        if (filenamePos === -1) continue;
        
        // Search for base64 content in a reasonable range around the filename
        const searchStart = Math.max(0, filenamePos - 10000);
        const searchEnd = Math.min(textContent.length, filenamePos + 50000);
        const searchArea = textContent.substring(searchStart, searchEnd);
        
        // Look for substantial base64 blocks
        const base64Regex = /([A-Za-z0-9+/]{100,}={0,2})/g;
        const base64Matches = [...searchArea.matchAll(base64Regex)];
        
        console.log(`Found ${base64Matches.length} potential base64 blocks for ${filename}`);
        
        // Try each base64 block to see which one produces valid content
        for (const base64Match of base64Matches) {
          try {
            const base64Content = base64Match[1];
            const paddedBase64 = base64Content + '='.repeat((4 - base64Content.length % 4) % 4);
            
            const byteCharacters = atob(paddedBase64);
            
            // Skip if too small or too large
            if (byteCharacters.length < 1000 || byteCharacters.length > 50000000) continue;
            
            const byteNumbers = new Array(byteCharacters.length);
            for (let j = 0; j < byteCharacters.length; j++) {
              byteNumbers[j] = byteCharacters.charCodeAt(j);
            }
            const byteArray = new Uint8Array(byteNumbers);
            
            // Validate content based on file type
            let isValid = true;
            if (filename.toLowerCase().endsWith('.pdf')) {
              const pdfHeader = String.fromCharCode.apply(null, Array.from(byteArray.slice(0, 4)));
              isValid = pdfHeader.startsWith('%PDF');
            } else if (filename.toLowerCase().endsWith('.png')) {
              // PNG signature: 89 50 4E 47
              isValid = byteArray[0] === 0x89 && byteArray[1] === 0x50 && byteArray[2] === 0x4E && byteArray[3] === 0x47;
            } else if (filename.toLowerCase().match(/\.(step|stp)$/)) {
              // STEP files typically start with "ISO-10303"
              const stepHeader = String.fromCharCode.apply(null, Array.from(byteArray.slice(0, 20)));
              isValid = stepHeader.includes('ISO-10303') || stepHeader.includes('STEP');
            }
            
            if (!isValid) {
              console.log(`Invalid content for ${filename}, trying next base64 block`);
              continue;
            }
            
            // Determine MIME type
            let mimeType = 'application/octet-stream';
            if (filename.toLowerCase().endsWith('.pdf')) mimeType = 'application/pdf';
            else if (filename.toLowerCase().match(/\.(jpg|jpeg)$/)) mimeType = 'image/jpeg';
            else if (filename.toLowerCase().endsWith('.png')) mimeType = 'image/png';
            else if (filename.toLowerCase().match(/\.(step|stp)$/)) mimeType = 'application/step';
            else if (filename.toLowerCase().match(/\.(iges|igs)$/)) mimeType = 'application/iges';
            
            const blob = new Blob([byteArray], { type: mimeType });
            const blobUrl = URL.createObjectURL(blob);
            
            console.log('Successfully created blob for MSG attachment:', filename, 'Size:', blob.size);
            
            const attachment: Attachment = {
              id: `att_${Date.now()}_${attachments.length}`,
              fileName: filename,
              mimeType: mimeType,
              sizeBytes: byteArray.length,
              blobUrl: blobUrl,
            };
            
            attachments.push(attachment);
            break; // Found valid content, move to next filename
            
          } catch (error) {
            console.log('Error processing base64 block for', filename, ':', error.message);
            continue; // Try next base64 block
          }
        }
      }
    } else if (isEml) {
      // Standard EML parsing
      console.log('Parsing EML file format');
      const attachmentBlockRegex = /Content-Disposition:\s*attachment[^]*?filename[*]?=(?:"([^"]+)"|([^;\s]+))[^]*?Content-Transfer-Encoding:\s*base64\s*\r?\n\r?\n([A-Za-z0-9+/=\r\n\s]+?)(?=\r?\n--|\r?\nContent-|$)/gi;
      
      let match;
      while ((match = attachmentBlockRegex.exec(text)) !== null) {
        const filename = match[1] || match[2];
        const base64Content = match[3].replace(/[\r\n\s]/g, '');
        
        console.log('Found complete EML attachment:', filename, 'Base64 length:', base64Content.length);
        
        if (filename && base64Content) {
          try {
            // Add padding if needed
            const paddedBase64 = base64Content + '='.repeat((4 - base64Content.length % 4) % 4);
            
            const byteCharacters = atob(paddedBase64);
            console.log('Decoded byte length for', filename, ':', byteCharacters.length);
            
            const byteNumbers = new Array(byteCharacters.length);
            for (let j = 0; j < byteCharacters.length; j++) {
              byteNumbers[j] = byteCharacters.charCodeAt(j);
            }
            const byteArray = new Uint8Array(byteNumbers);
            
            // Check if it's a valid PDF (starts with %PDF)
            const isPDF = filename.toLowerCase().endsWith('.pdf');
            if (isPDF) {
              const pdfHeader = String.fromCharCode.apply(null, Array.from(byteArray.slice(0, 4)));
              console.log('PDF header check for', filename, ':', pdfHeader);
              if (!pdfHeader.startsWith('%PDF')) {
                console.warn('Invalid PDF header for:', filename, 'Header:', pdfHeader);
                continue; // Skip this attachment if it's not a valid PDF
              }
            }
            
            // Determine MIME type based on file extension
            let mimeType = 'application/octet-stream';
            if (filename.toLowerCase().endsWith('.pdf')) mimeType = 'application/pdf';
            else if (filename.toLowerCase().match(/\.(jpg|jpeg)$/)) mimeType = 'image/jpeg';
            else if (filename.toLowerCase().endsWith('.png')) mimeType = 'image/png';
            else if (filename.toLowerCase().match(/\.(step|stp)$/)) mimeType = 'application/step';
            else if (filename.toLowerCase().match(/\.(iges|igs)$/)) mimeType = 'application/iges';
            
            const blob = new Blob([byteArray], { type: mimeType });
            const blobUrl = URL.createObjectURL(blob);
            
            console.log('Created blob for EML attachment:', filename, 'URL:', blobUrl, 'Size:', blob.size);
            
            const attachment: Attachment = {
              id: `att_${Date.now()}_${attachments.length}`,
              fileName: filename,
              mimeType: mimeType,
              sizeBytes: byteArray.length,
              blobUrl: blobUrl,
            };
            
            attachments.push(attachment);
            console.log('Successfully processed EML attachment:', filename);
          } catch (error) {
            console.error('Error processing EML attachment:', filename, error);
          }
        }
      }
    }
    
    console.log('Email parsing complete. Attachments found:', attachments.length);
    return attachments;
  };

  const processFiles = useCallback(async (files: FileList) => {
    setIsProcessing(true);
    
    try {
      const attachments: Attachment[] = [];
      const lineItems: LineItem[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Check if this is an email file
        if (file.name.toLowerCase().endsWith('.eml') || file.name.toLowerCase().endsWith('.msg')) {
          // Parse email and extract attachments
          const emailAttachments = await parseEmailFile(file);
          
          for (let j = 0; j < emailAttachments.length; j++) {
            const attachment = emailAttachments[j];
            attachments.push(attachment);

            // Create line item for each attachment
            const lineItem: LineItem = {
              id: `item_${Date.now()}_${j}`,
              attachmentId: attachment.id,
              fileName: attachment.fileName,
              description: attachment.fileName.replace(/\.[^/.]+$/, ''), // Remove extension
              drawingNumber: '',
              behandeling: '',
              lengte: null,
              breedte: null,
              hoogte: null,
              gewichtKg: null,
              price: null,
            };
            
            lineItems.push(lineItem);
          }
        } else {
          // Regular file upload - treat as attachment
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
            behandeling: '',
            lengte: null,
            breedte: null,
            hoogte: null,
            gewichtKg: null,
            price: null,
          };
          
          lineItems.push(lineItem);
        }
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
      
      console.log('Processing complete:', {
        totalFiles: files.length,
        attachmentsFound: attachments.length,
        lineItemsCreated: lineItems.length,
        attachments: attachments.map(a => ({ id: a.id, fileName: a.fileName, mimeType: a.mimeType })),
        lineItems: lineItems.map(l => ({ id: l.id, fileName: l.fileName, description: l.description }))
      });
      
      toast({
        title: 'Bestanden verwerkt',
        description: `${lineItems.length} regelitem(s) aangemaakt uit ${attachments.length} bijlage(s)`,
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
    
    console.log('Drop event triggered');
    console.log('DataTransfer items:', e.dataTransfer.items?.length);
    console.log('DataTransfer files:', e.dataTransfer.files?.length);
    console.log('DataTransfer types:', e.dataTransfer.types);
    
    // Check for files first
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      console.log('Processing dropped files:', Array.from(files).map(f => ({ name: f.name, type: f.type, size: f.size })));
      processFiles(files);
      return;
    }
    
    // Check for data transfer items (for Outlook emails)
    if (e.dataTransfer.items) {
      const items = Array.from(e.dataTransfer.items);
      console.log('DataTransfer items details:', items.map(item => ({ kind: item.kind, type: item.type })));
      
      // Look for file items
      const fileItems = items.filter(item => item.kind === 'file');
      if (fileItems.length > 0) {
        const droppedFiles: File[] = [];
        
        fileItems.forEach(item => {
          const file = item.getAsFile();
          if (file) {
            console.log('Found file from DataTransfer item:', file.name, file.type, file.size);
            droppedFiles.push(file);
          }
        });
        
        if (droppedFiles.length > 0) {
          const fileList = new DataTransfer();
          droppedFiles.forEach(file => fileList.items.add(file));
          processFiles(fileList.files);
          return;
        }
      }
      
      // Check for text data that might contain email content
      const textItems = items.filter(item => item.type.includes('text'));
      if (textItems.length > 0) {
        console.log('Found text items, checking for email content...');
        textItems.forEach(async (item) => {
          try {
            const data = await new Promise<string>((resolve) => {
              item.getAsString(resolve);
            });
            console.log('Text data preview:', data.substring(0, 200));
            
            // If it looks like email content, create a temporary .eml file
            if (data.includes('Content-Type:') || data.includes('From:') || data.includes('Subject:')) {
              console.log('Detected email content in text data, creating temporary .eml file');
              const emlBlob = new Blob([data], { type: 'message/rfc822' });
              const emlFile = new File([emlBlob], 'dropped-email.eml', { type: 'message/rfc822' });
              
              const fileList = new DataTransfer();
              fileList.items.add(emlFile);
              processFiles(fileList.files);
            }
          } catch (error) {
            console.error('Error processing text item:', error);
          }
        });
      }
    }
    
    // Fallback for no recognized data
    console.warn('No recognized file or email data in drop event');
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
    <div className="w-full max-w-4xl mx-auto -mt-12 relative z-10">
      <Card 
        className={`relative overflow-hidden p-12 border-2 border-dashed backdrop-blur-md transition-all duration-300 ${
          isDragOver 
            ? 'border-primary bg-background/40 scale-[1.02] shadow-2xl' 
            : 'border-primary/30 hover:border-primary/50 bg-background/20'
        } ${isProcessing ? 'opacity-50' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {/* Enhanced background with glassmorphism effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-background/30 via-background/10 to-background/30 backdrop-blur-sm" />
        
        <div className="relative text-center space-y-8">
          <div className="flex justify-center">
            {isProcessing ? (
              <div className="relative">
                <div className="animate-spin rounded-full h-20 w-20 border-4 border-primary/20 border-t-primary"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
              </div>
            ) : (
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-primary rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
                <div className="relative p-6 bg-background/90 backdrop-blur-sm rounded-full border border-primary/20 shadow-lg group-hover:shadow-xl transition-all">
                  <Upload className="h-12 w-12 text-primary" />
                </div>
              </div>
            )}
          </div>
          
          <div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent mb-3">
              {isProcessing ? 'Bestanden verwerken...' : 'Sleep bestanden hierheen'}
            </h3>
            <p className="text-muted-foreground text-lg leading-relaxed max-w-md mx-auto">
              Upload e-mail bestanden (.eml, .msg) of losse bijlagen om automatisch een offerte te genereren
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <ConnectOutlookButton />
            
            <label htmlFor="file-upload">
              <Button 
                size="lg"
                className="w-full sm:w-auto bg-gradient-primary hover:shadow-lg hover:scale-105 transition-all" 
                asChild 
                disabled={isProcessing}
              >
                <span className="cursor-pointer">
                  <Mail className="mr-2 h-5 w-5" />
                  E-mail uploaden
                </span>
              </Button>
            </label>
            
            <label htmlFor="attachment-upload">
              <Button 
                variant="outline" 
                size="lg"
                className="w-full sm:w-auto border-primary/20 hover:bg-primary/5 hover:border-primary/40 hover:scale-105 transition-all" 
                asChild 
                disabled={isProcessing}
              >
                <span className="cursor-pointer">
                  <FileText className="mr-2 h-5 w-5" />
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

          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground/80 bg-muted/20 rounded-full px-4 py-2 inline-flex">
            <AlertCircle className="h-4 w-4" />
            <span>Alle bestanden worden lokaal verwerkt en opgeslagen</span>
          </div>
        </div>
      </Card>
    </div>
  );
}