import { useState } from 'react';
import { Send, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { QuoteDraft } from '@/types';
import { useQuoteActions } from '@/hooks/useQuoteActions';

interface EmailComposeProps {
  isOpen: boolean;
  onClose: () => void;
  quoteDraft: QuoteDraft;
  totalPrice: number;
  templateRef: React.RefObject<HTMLDivElement>;
  onEmailSent?: () => void;
}

export function EmailCompose({ isOpen, onClose, quoteDraft, totalPrice, templateRef, onEmailSent }: EmailComposeProps) {
  const [emailData, setEmailData] = useState({
    to: quoteDraft.meta.clientEmail || '',
    subject: `Offerte ${quoteDraft.meta.quoteNumber} - ${quoteDraft.meta.clientName}`,
    body: `Beste ${quoteDraft.meta.clientName},

Hierbij ontvangt u de offerte voor uw aanvraag.

Offerte nummer: ${quoteDraft.meta.quoteNumber}
Totaal bedrag: ${new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(totalPrice)}
Geldig tot: ${new Date(Date.now() + quoteDraft.meta.validityDays * 24 * 60 * 60 * 1000).toLocaleDateString('nl-NL')}

Indien u vragen heeft, neem dan gerust contact met ons op.

Met vriendelijke groet,
Uw team`
  });

  const { toast } = useToast();
  const { generateAndSavePdf, sendQuoteEmail, isLoading } = useQuoteActions();

  const handleSend = async () => {
    if (!emailData.to) {
      toast({
        title: 'Email adres vereist',
        description: 'Vul een email adres in om de offerte te verzenden.',
        variant: 'destructive'
      });
      return;
    }

    try {
      // First generate and save PDF, and save quote to database
      const quoteId = await generateAndSavePdf(quoteDraft, totalPrice, templateRef);
      
      if (!quoteId) {
        toast({
          title: "Fout",
          description: "Kon offerte niet opslaan",
          variant: "destructive",
        });
        return;
      }

      // Then send the email with PDF attachment
      const success = await sendQuoteEmail(emailData.to, emailData.subject, emailData.body, quoteId);
      
      if (success) {
        onEmailSent?.();
        onClose();
      }
    } catch (error) {
      console.error('Error sending quote:', error);
      toast({
        title: "Fout",
        description: "Kon offerte niet verzenden",
        variant: "destructive",
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>Offerte verzenden</DialogTitle>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="space-y-2">
            <Label htmlFor="emailTo">Naar *</Label>
            <Input
              id="emailTo"
              type="email"
              value={emailData.to}
              onChange={(e) => setEmailData(prev => ({ ...prev, to: e.target.value }))}
              placeholder="email@voorbeeld.nl"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="emailSubject">Onderwerp</Label>
            <Input
              id="emailSubject"
              value={emailData.subject}
              onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Onderwerp van de email"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="emailBody">Bericht</Label>
            <Textarea
              id="emailBody"
              value={emailData.body}
              onChange={(e) => setEmailData(prev => ({ ...prev, body: e.target.value }))}
              placeholder="Typ uw bericht hier..."
              rows={12}
              className="resize-none"
            />
          </div>
          
          {/* Offerte samenvatting */}
          <div className="bg-muted/20 p-4 rounded-lg border">
            <h4 className="font-medium mb-2">Offerte samenvatting</h4>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Offerte nummer:</span>
                <span className="font-medium">{quoteDraft.meta.quoteNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Klant:</span>
                <span className="font-medium">{quoteDraft.meta.clientName}</span>
              </div>
              <div className="flex justify-between">
                <span>Aantal items:</span>
                <span className="font-medium">{quoteDraft.lineItems.length}</span>
              </div>
              <div className="flex justify-between font-semibold pt-2 border-t">
                <span>Totaal bedrag:</span>
                <span className="text-primary">{formatPrice(totalPrice)}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Annuleren
          </Button>
          <Button onClick={handleSend} disabled={isLoading} className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            {isLoading ? 'Verzenden...' : 'Verzenden'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}