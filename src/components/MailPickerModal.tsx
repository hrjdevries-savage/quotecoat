import { useEffect, useState } from 'react';
import { listMailsWithAttachments, listAttachments } from '@/auth/graphClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AttachmentPickerModal } from './AttachmentPickerModal';
import { Paperclip, User, Calendar } from 'lucide-react';

export function MailPickerModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mails, setMails] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    listMailsWithAttachments()
      .then((r) => setMails(r.value || []))
      .catch((e) => console.error('Graph mails error', e))
      .finally(() => setLoading(false));
  }, [open]);

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Paperclip className="h-5 w-5" />
              Selecteer e-mail met bijlagen
            </DialogTitle>
          </DialogHeader>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-auto space-y-3">
              {mails.map((m) => (
                <div key={m.id} className="flex items-center justify-between border border-border/50 rounded-lg p-4 hover:border-border transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate mb-1">{m.subject}</div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {(m.from?.emailAddress?.name || m.from?.emailAddress?.address) ?? 'Onbekend'}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(m.receivedDateTime).toLocaleString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Paperclip className="h-3 w-3" />
                        Bijlagen
                      </div>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={async () => {
                      try {
                        const atts = await listAttachments(m.id);
                        setSelected({ mail: m, attachments: atts.value || [] });
                      } catch (error) {
                        console.error('Failed to load attachments:', error);
                      }
                    }}
                    className="ml-4"
                  >
                    Kies bijlagen
                  </Button>
                </div>
              ))}
              {mails.length === 0 && !loading && (
                <div className="text-center py-8 text-muted-foreground">
                  Geen e-mails met bijlagen gevonden
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {selected && (
        <AttachmentPickerModal
          open={!!selected}
          mail={selected.mail}
          attachments={selected.attachments}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}