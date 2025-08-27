import { useState } from 'react';
import html2pdf from 'html2pdf.js';
import { supabase } from '@/integrations/supabase/client';
import { QuoteDraft } from '@/types';
import { useToast } from '@/hooks/use-toast';

export const useQuoteActions = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const saveQuoteToDatabase = async (quoteDraft: QuoteDraft, totalPrice: number, existingQuoteId?: string): Promise<string | null> => {
    try {
      setIsLoading(true);

      let quoteId = existingQuoteId;

      if (!quoteId) {
        // Create new quote
        const { data: quoteData, error: quoteError } = await supabase
          .from('quotes')
          .insert({
            quote_number: quoteDraft.meta.quoteNumber,
            client_name: quoteDraft.meta.clientName,
            client_email: quoteDraft.meta.clientEmail,
            client_address: quoteDraft.meta.clientAddress,
            client_city: quoteDraft.meta.clientCity,
            client_postal_code: quoteDraft.meta.clientPostalCode,
            client_reference: quoteDraft.meta.clientReference,
            validity_days: quoteDraft.meta.validityDays,
            terms: quoteDraft.meta.terms,
            total_price: totalPrice,
            status: 'draft'
          })
          .select()
          .single();

        if (quoteError) {
          console.error('Error saving quote:', quoteError);
          toast({
            title: "Fout",
            description: "Kon offerte niet opslaan",
            variant: "destructive",
          });
          return null;
        }

        quoteId = quoteData.id;
      } else {
        // Update existing quote
        const { error: updateError } = await supabase
          .from('quotes')
          .update({
            client_name: quoteDraft.meta.clientName,
            client_email: quoteDraft.meta.clientEmail,
            client_address: quoteDraft.meta.clientAddress,
            client_city: quoteDraft.meta.clientCity,
            client_postal_code: quoteDraft.meta.clientPostalCode,
            client_reference: quoteDraft.meta.clientReference,
            validity_days: quoteDraft.meta.validityDays,
            terms: quoteDraft.meta.terms,
            total_price: totalPrice,
          })
          .eq('id', quoteId);

        if (updateError) {
          console.error('Error updating quote:', updateError);
          toast({
            title: "Fout",
            description: "Kon offerte niet bijwerken",
            variant: "destructive",
          });
          return null;
        }

        // Clear existing line items for update (but NOT attachments)
        await supabase.from('quote_line_items').delete().eq('quote_id', quoteId);
      }

      // Save line items
      if (quoteDraft.lineItems.length > 0) {
        const lineItemsData = quoteDraft.lineItems.map(item => ({
          quote_id: quoteId,
          attachment_id: item.attachmentId || null, // client-id remains leading
          file_name: item.fileName || null,
          description: item.description,
          drawing_number: item.drawingNumber,
          behandeling: item.behandeling,
          lengte: item.lengte,
          breedte: item.breedte,
          hoogte: item.hoogte,
          gewicht_kg: item.gewichtKg,
          price: item.price
        }));

        const { error: lineItemsError } = await supabase
          .from('quote_line_items')
          .insert(lineItemsData);

        if (lineItemsError) {
          console.error('Error saving line items:', lineItemsError);
        }
      }

      // Attachments: UPSERT per item
      for (const a of quoteDraft.attachments) {
        // 1) upload only if no existing path
        let filePath = (a as any).filePath as string | undefined;

        if (!filePath && a.file) {
          const safeName = `${quoteId}/${a.id}_${a.fileName}`;
          const { error: uploadError } = await supabase.storage
            .from('quote-attachments')
            .upload(safeName, a.file, { upsert: true });
          if (uploadError) {
            console.error('Upload attachment failed:', uploadError);
            continue;
          }
          filePath = safeName;
        }

        // 2) upsert row (keep client-id as key)
        const row = {
          quote_id: quoteId,
          original_attachment_id: a.id,
          file_name: a.fileName,
          mime_type: a.mimeType,
          size_bytes: a.sizeBytes,
          file_path: filePath || `${quoteId}/${a.id}_${a.fileName}`
        };

        const { error: upsertErr } = await supabase
          .from('quote_attachments')
          .upsert(row, { onConflict: 'quote_id,original_attachment_id' });

        if (upsertErr) console.error('Upsert attachment failed:', upsertErr);
      }

      toast({
        title: "Succes",
        description: "Offerte opgeslagen",
      });

      return quoteId;
    } catch (error) {
      console.error('Error saving quote:', error);
      toast({
        title: "Fout",
        description: "Kon offerte niet opslaan",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const generateAndSavePdf = async (
    quoteDraft: QuoteDraft, 
    totalPrice: number, 
    templateRef: React.RefObject<HTMLDivElement>,
    quoteId?: string
  ): Promise<string | null> => {
    try {
      if (!templateRef.current) {
        throw new Error('Template reference not found');
      }

      // Generate PDF
      const opt = {
        margin: 1,
        filename: `Offerte_${quoteDraft.meta.quoteNumber}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      const pdfBlob = await html2pdf().set(opt).from(templateRef.current).outputPdf('blob');
      
      // If no quoteId provided, save the quote first
      let finalQuoteId = quoteId || quoteDraft.id;
      if (!finalQuoteId) {
        finalQuoteId = await saveQuoteToDatabase(quoteDraft, totalPrice);
        if (!finalQuoteId) return null;
      } else {
        // For existing quotes, update with new data
        finalQuoteId = await saveQuoteToDatabase(quoteDraft, totalPrice, finalQuoteId);
        if (!finalQuoteId) return null;
      }

      // Upload PDF to storage
      const pdfFileName = `${finalQuoteId}/quote_${quoteDraft.meta.quoteNumber}.pdf`;
      
      const { error: uploadError } = await supabase.storage
        .from('quote-pdfs')
        .upload(pdfFileName, pdfBlob, {
          contentType: 'application/pdf',
          upsert: true
        });

      if (uploadError) {
        console.error('Error uploading PDF:', uploadError);
        return null;
      }

      // Update quote with PDF path
      await supabase
        .from('quotes')
        .update({ pdf_file_path: pdfFileName })
        .eq('id', finalQuoteId);

      return finalQuoteId;
    } catch (error) {
      console.error('Error generating and saving PDF:', error);
      return null;
    }
  };

  const sendQuoteEmail = async (
    to: string,
    subject: string,
    body: string,
    quoteId: string
  ): Promise<boolean> => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase.functions.invoke('send-quote-email', {
        body: {
          to,
          subject,
          body,
          quoteId
        }
      });

      if (error) {
        console.error('Error sending email:', error);
        toast({
          title: "Fout",
          description: "Kon email niet verzenden",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Succes",
        description: "Offerte verzonden",
      });

      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: "Fout",
        description: "Kon email niet verzenden",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const loadQuoteForEditing = async (quoteId: string): Promise<QuoteDraft | null> => {
    try {
      setIsLoading(true);

      // Load the quote
      const { data: quoteData, error: quoteError } = await supabase
        .from('quotes')
        .select('*')
        .eq('id', quoteId)
        .single();

      if (quoteError) {
        console.error('Error loading quote:', quoteError);
        toast({
          title: "Fout",
          description: "Kon offerte niet laden",
          variant: "destructive",
        });
        return null;
      }

      // Load line items
      const { data: lineItemsData, error: lineItemsError } = await supabase
        .from('quote_line_items')
        .select('*')
        .eq('quote_id', quoteId);

      if (lineItemsError) {
        console.error('Error loading line items:', lineItemsError);
        toast({
          title: "Fout",
          description: "Kon regel items niet laden",
          variant: "destructive",
        });
        return null;
      }

      // Load attachments
      const { data: attachmentsData, error: attachmentsError } = await supabase
        .from('quote_attachments')
        .select('*')
        .eq('quote_id', quoteId);

      if (attachmentsError) {
        console.error('Error loading attachments:', attachmentsError);
        toast({
          title: "Fout",
          description: "Kon bijlagen niet laden",
          variant: "destructive",
        });
        return null;
      }

      // Download attachment files and create File objects
      const attachments: any[] = [];
      
      if (attachmentsData?.length) {
        for (const a of attachmentsData) {
          try {
            const { data: blob, error: dlErr } = await supabase.storage
              .from('quote-attachments')
              .download(a.file_path);

            if (dlErr) { 
              console.error('Download error', dlErr); 
              continue; 
            }

            // Blob -> File with correct name and mimetype
            const file = new File([blob], a.file_name, { type: a.mime_type || 'application/octet-stream' });
            const blobUrl = URL.createObjectURL(file);

            attachments.push({
              id: a.original_attachment_id ?? a.id,  // use stable client-id
              fileName: a.file_name,
              mimeType: a.mime_type,
              sizeBytes: a.size_bytes,
              blobUrl,
              file,                   // now a real File
              filePath: a.file_path,  // save path (avoids re-upload)
            });
          } catch (e) {
            console.error('Process attachment failed', e);
          }
        }
      }

      // Build quick lookup tables
      const attById = new Map(attachments.map(x => [x.id, x]));
      const attByName = new Map(attachments.map(x => [x.fileName, x]));

      // Line items + restore linking
      const lineItems = (lineItemsData || []).map(item => {
        let attachmentId = item.attachment_id || null;
        if (!attachmentId && item.file_name) {
          const guess = attByName.get(item.file_name);
          if (guess) attachmentId = guess.id;
        }
        return {
          id: item.id,
          attachmentId: attachmentId || undefined,
          fileName: item.file_name || undefined,
          description: item.description,
          drawingNumber: item.drawing_number || '',
          behandeling: item.behandeling || '',
          lengte: item.lengte ? Number(item.lengte) : null,
          breedte: item.breedte ? Number(item.breedte) : null,
          hoogte: item.hoogte ? Number(item.hoogte) : null,
          gewichtKg: item.gewicht_kg ? Number(item.gewicht_kg) : null,
          price: item.price ? Number(item.price) : null,
        };
      });

      // Convert to QuoteDraft format
      const quoteDraft: QuoteDraft = {
        id: quoteId, // Include the quote ID
        meta: {
          clientName: quoteData.client_name,
          clientEmail: quoteData.client_email || '',
          clientAddress: quoteData.client_address || '',
          clientCity: quoteData.client_city || '',
          clientPostalCode: quoteData.client_postal_code || '',
          clientReference: quoteData.client_reference || '',
          quoteNumber: quoteData.quote_number,
          validityDays: quoteData.validity_days,
          terms: quoteData.terms || '',
          createdAt: quoteData.created_at,
        },
        lineItems,
        attachments,
      };

      return quoteDraft;
    } catch (error) {
      console.error('Error loading quote for editing:', error);
      toast({
        title: "Fout",
        description: "Kon offerte niet laden voor bewerking",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    saveQuoteToDatabase,
    generateAndSavePdf,
    sendQuoteEmail,
    loadQuoteForEditing,
    isLoading
  };
};