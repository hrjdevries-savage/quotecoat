import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { b64ToFile } from '@/utils/fileUtils';
import { useQuoteStore } from '@/store/useQuoteStore';
import { nanoid } from 'nanoid';
import { useState } from 'react';
import { File, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type GraphAttachment = {
  id: string;
  name: string;
  contentType?: string;
  size?: number;
  contentBytes?: string;
  ['@odata.type']?: string;
};

export function AttachmentPickerModal({
  open, onClose, mail, attachments
}: {
  open: boolean;
  onClose: () => void;
  mail: any;
  attachments: GraphAttachment[];
}) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const { addAttachmentsAndLineItems } = useQuoteStore();
  const { toast } = useToast();

  const fileAtts = attachments.filter(a => a['@odata.type'] === '#microsoft.graph.fileAttachment');

  const handleImport = () => {
    try {
      const selected = fileAtts.filter(a => checked[a.id]);
      
      if (selected.length === 0) {
        toast({
          title: "Geen bijlagen geselecteerd",
          description: "Selecteer minimaal één bijlage om te importeren.",
          variant: "destructive"
        });
        return;
      }

      const newAttachments = selected.map(a => {
        const f = b64ToFile(a.contentBytes || '', a.name, a.contentType || 'application/octet-stream');
        const id = nanoid();
        return {
          id,
          fileName: a.name,
          mimeType: a.contentType || 'application/octet-stream',
          sizeBytes: a.size || f.size,
          file: f,
          blobUrl: URL.createObjectURL(f),
        };
      });

      const newLineItems = newAttachments.map(att => ({
        id: nanoid(),
        attachmentId: att.id,
        fileName: att.fileName,
        description: '',
        drawingNumber: '',
        behandeling: '',
        lengte: null,
        breedte: null,
        hoogte: null,
        gewichtKg: null,
        price: null
      }));

      addAttachmentsAndLineItems(newAttachments, newLineItems);
      
      toast({
        title: "Bijlagen geïmporteerd",
        description: `${selected.length} bijlage(n) succesvol toegevoegd aan de offerte.`
      });
      
      onClose();
    } catch (error) {
      console.error('Failed to import attachments:', error);
      toast({
        title: "Import mislukt",
        description: "Er is een fout opgetreden bij het importeren van de bijlagen.",
        variant: "destructive"
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Bijlagen selecteren – {mail.subject}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 max-h-[50vh] overflow-auto">
          {fileAtts.map((a) => (
            <div key={a.id} className="flex items-center justify-between border border-border/50 rounded-lg p-3 hover:border-border transition-colors">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <File className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{a.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {a.contentType} · {formatFileSize(a.size || 0)}
                  </div>
                </div>
              </div>
              <Checkbox
                checked={!!checked[a.id]}
                onCheckedChange={(checked) => 
                  setChecked(prev => ({ ...prev, [a.id]: !!checked }))
                }
              />
            </div>
          ))}
          {fileAtts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <File className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Geen directe file-attachments gevonden.</p>
              <p className="text-xs">Item/inline attachments worden nog niet ondersteund.</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Annuleren
          </Button>
          <Button onClick={handleImport} disabled={fileAtts.length === 0}>
            Importeer geselecteerde bijlagen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}