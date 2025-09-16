import React, { useState, useCallback } from 'react';
import { Upload, FileType, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { analyzeStepByFile } from '@/services/StepAnalyzerService';

export const FileAnalyzer = () => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { orgId } = useApp();

  const acceptedTypes = '.stp,.step,.eml,.msg,.pdf';
  const acceptedExtensions = ['stp', 'step', 'eml', 'msg', 'pdf'];

  const isStepFile = (filename: string): boolean => {
    return /\.(step|stp)$/i.test(filename);
  };

  const isEmailFile = (filename: string): boolean => {
    return /\.(eml|msg)$/i.test(filename);
  };

  const isPdfFile = (filename: string): boolean => {
    return /\.pdf$/i.test(filename);
  };

  const uploadToStorage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('files')
      .upload(fileName, file);

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    return data.path;
  };

  const createInboundMessage = async (file: File, storagePath: string) => {
    if (!orgId) {
      throw new Error('Organization ID not available');
    }

    const { error } = await supabase
      .from('inbound_messages')
      .insert({
        org_id: orgId,
        status: 'pending',
        subject: `Uploaded file: ${file.name}`,
        attachments: [{
          filename: file.name,
          size: file.size,
          mime_type: file.type,
          storage_path: storagePath
        }],
        detected_company: null,
        from_email: null,
        from_name: null,
        text_body: null,
        html_body: null
      });

    if (error) {
      throw new Error(`Database insert failed: ${error.message}`);
    }
  };

  const processFiles = useCallback(async (files: FileList) => {
    setIsProcessing(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop()?.toLowerCase();

        // Check if file type is accepted
        if (!fileExt || !acceptedExtensions.includes(fileExt)) {
          toast({
            title: 'Bestand niet ondersteund',
            description: `${file.name} - Alleen ${acceptedExtensions.join(', ')} bestanden zijn toegestaan`,
            variant: 'destructive',
          });
          errorCount++;
          continue;
        }

        try {
          if (isStepFile(file.name)) {
            // Analyze STEP files using existing API
            const result = await analyzeStepByFile(file, 'steel');
            
            toast({
              title: 'STEP bestand geanalyseerd',
              description: `${file.name} - Afmetingen: ${result.L}×${result.B}×${result.H}mm, Gewicht: ${result.W}kg`,
            });
            successCount++;
          } else if (isEmailFile(file.name) || isPdfFile(file.name)) {
            // Upload to storage and create inbound message
            const storagePath = await uploadToStorage(file);
            await createInboundMessage(file, storagePath);
            
            toast({
              title: 'Bestand geüpload',
              description: `${file.name} toegevoegd aan inbox voor verwerking`,
            });
            successCount++;
          }
        } catch (error) {
          console.error('Error processing file:', file.name, error);
          toast({
            title: 'Fout bij verwerken',
            description: `${file.name} - ${error instanceof Error ? error.message : 'Onbekende fout'}`,
            variant: 'destructive',
          });
          errorCount++;
        }
      }

      // Final summary toast
      if (successCount > 0) {
        toast({
          title: 'Verwerking voltooid',
          description: `${successCount} bestand(en) succesvol verwerkt${errorCount > 0 ? `, ${errorCount} fout(en)` : ''}`,
        });
      }
    } finally {
      setIsProcessing(false);
    }
  }, [toast, orgId]);

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
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileType className="h-5 w-5 text-primary" />
          Bestand analyseren
        </CardTitle>
        <CardDescription>
          Sleep bestanden hierheen of klik om te uploaden
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
            ${isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
            ${isProcessing ? 'pointer-events-none opacity-50' : ''}
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !isProcessing && document.getElementById('file-input')?.click()}
        >
          <input
            id="file-input"
            type="file"
            multiple
            accept={acceptedTypes}
            className="sr-only"
            onChange={handleFileInput}
          />
          
          <div className="space-y-4">
            {isProcessing ? (
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-sm text-muted-foreground">Bestanden verwerken...</p>
              </div>
            ) : (
              <>
                <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <p className="text-lg font-medium mb-2">
                    Sleep bestanden hier of klik om te selecteren
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Ondersteunde formaten: STEP/STP, EML/MSG, PDF
                  </p>
                </div>
              </>
            )}
          </div>
          
          <div className="mt-6 pt-4 border-t border-muted-foreground/10">
            <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-success" />
                <span>STEP/STP → Directe analyse (afmetingen & gewicht)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-success" />
                <span>EML/MSG/PDF → Upload naar inbox voor verwerking</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};