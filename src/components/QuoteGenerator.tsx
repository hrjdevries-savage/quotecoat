import { useState } from 'react';
import { FileDown, Mail, Save, Settings } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useQuoteStore } from '@/store/useQuoteStore';
import { useToast } from '@/hooks/use-toast';
import { generatePDF, generateEmailText } from '@/utils/quoteGenerator';
import { copyToClipboard } from '@/utils/helpers';

export function QuoteGenerator() {
  const { currentDraft, updateMeta, getTotalPrice } = useQuoteStore();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  if (!currentDraft) return null;

  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    try {
      await generatePDF(currentDraft);
      toast({
        title: 'PDF gegenereerd',
        description: 'De offerte is gedownload als PDF',
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'Fout bij PDF generatie',
        description: 'Er ging iets mis bij het genereren van de PDF',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyEmailText = async () => {
    try {
      const emailText = generateEmailText(currentDraft);
      await copyToClipboard(emailText);
      toast({
        title: 'E-mailtekst gekopieerd',
        description: 'De offerte is gekopieerd naar het klembord',
      });
    } catch (error) {
      console.error('Error copying email text:', error);
      toast({
        title: 'Fout bij kopiëren',
        description: 'Er ging iets mis bij het kopiëren van de tekst',
        variant: 'destructive',
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
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Offerte genereren</h2>
          <p className="text-muted-foreground">
            Vul de klantgegevens in en genereer de offerte
          </p>
        </div>
        
        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              Instellingen
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Offerte instellingen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="validity">Geldigheid (dagen)</Label>
                <Input
                  id="validity"
                  type="number"
                  value={currentDraft.meta.validityDays}
                  onChange={(e) => updateMeta({ validityDays: parseInt(e.target.value) || 30 })}
                />
              </div>
              <div>
                <Label htmlFor="terms">Voorwaarden</Label>
                <Textarea
                  id="terms"
                  value={currentDraft.meta.terms || ''}
                  onChange={(e) => updateMeta({ terms: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="clientName">Klantnaam *</Label>
              <Input
                id="clientName"
                value={currentDraft.meta.clientName}
                onChange={(e) => updateMeta({ clientName: e.target.value })}
                placeholder="Naam van de klant"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="clientReference">Klant referentie</Label>
              <Input
                id="clientReference"
                value={currentDraft.meta.clientReference || ''}
                onChange={(e) => updateMeta({ clientReference: e.target.value })}
                placeholder="Project naam of referentie"
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="quoteNumber">Offertenummer</Label>
              <Input
                id="quoteNumber"
                value={currentDraft.meta.quoteNumber}
                onChange={(e) => updateMeta({ quoteNumber: e.target.value })}
                placeholder="Automatisch gegenereerd"
              />
            </div>
            
            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Totaal bedrag</div>
              <div className="text-2xl font-bold text-primary">
                {formatPrice(getTotalPrice())}
              </div>
              <div className="text-sm text-muted-foreground">
                {currentDraft.lineItems.length} regelitem(s)
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Preview Card */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Offerte preview</h3>
        <div className="bg-muted/30 p-6 rounded-lg space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-bold text-lg">Coat24</h4>
              <p className="text-sm text-muted-foreground">Offerte Builder MVP</p>
            </div>
            <div className="text-right text-sm">
              <div>Offertenummer: {currentDraft.meta.quoteNumber}</div>
              <div>Datum: {new Date().toLocaleDateString('nl-NL')}</div>
            </div>
          </div>
          
          <div>
            <div className="font-medium">Klant: {currentDraft.meta.clientName || '[Klantnaam]'}</div>
            {currentDraft.meta.clientReference && (
              <div className="text-sm text-muted-foreground">
                Referentie: {currentDraft.meta.clientReference}
              </div>
            )}
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Omschrijving</th>
                  <th className="text-left py-2">Tekeningnr.</th>
                  <th className="text-left py-2">Bestand</th>
                  <th className="text-right py-2">Prijs</th>
                </tr>
              </thead>
              <tbody>
                {currentDraft.lineItems.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-2">{item.description || '-'}</td>
                    <td className="py-2">{item.drawingNumber || '-'}</td>
                    <td className="py-2">{item.fileName || 'Handmatige regel'}</td>
                    <td className="py-2 text-right">
                      {item.price ? formatPrice(item.price) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 font-bold">
                  <td colSpan={3} className="py-2">Totaal</td>
                  <td className="py-2 text-right">{formatPrice(getTotalPrice())}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          
          <div className="text-xs text-muted-foreground border-t pt-4">
            <p>Geldig tot: {new Date(Date.now() + currentDraft.meta.validityDays * 24 * 60 * 60 * 1000).toLocaleDateString('nl-NL')}</p>
            <p>{currentDraft.meta.terms}</p>
          </div>
        </div>
      </Card>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button 
          onClick={handleGeneratePDF} 
          disabled={isGenerating || !currentDraft.meta.clientName}
          className="flex-1"
        >
          <FileDown className="mr-2 h-4 w-4" />
          {isGenerating ? 'Genereren...' : 'Download PDF'}
        </Button>
        
        <Button 
          variant="outline" 
          onClick={handleCopyEmailText}
          disabled={!currentDraft.meta.clientName}
          className="flex-1"
        >
          <Mail className="mr-2 h-4 w-4" />
          Kopieer e-mailtekst
        </Button>
        
        <Button variant="outline">
          <Save className="mr-2 h-4 w-4" />
          Concept opslaan
        </Button>
      </div>
    </div>
  );
}