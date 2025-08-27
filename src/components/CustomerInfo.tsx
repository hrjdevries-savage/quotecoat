import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useQuoteStore } from '@/store/useQuoteStore';

export function CustomerInfo() {
  const { currentDraft, updateMeta, getTotalPrice } = useQuoteStore();

  if (!currentDraft) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
          Klantgegevens
        </h2>
        <p className="text-muted-foreground text-lg">
          Vul de klantgegevens in voor de offerte
        </p>
      </div>

      <Card className="p-8 border border-border/40 bg-gradient-card shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="clientName" className="text-sm font-medium">Klantnaam *</Label>
            <Input
              id="clientName"
              value={currentDraft.meta.clientName}
              onChange={(e) => updateMeta({ clientName: e.target.value })}
              placeholder="Naam van de klant"
              className="border-border/60 focus:border-primary/60 transition-colors"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="clientEmail" className="text-sm font-medium">Email adres</Label>
            <Input
              id="clientEmail"
              type="email"
              value={currentDraft.meta.clientEmail || ''}
              onChange={(e) => updateMeta({ clientEmail: e.target.value })}
              placeholder="email@voorbeeld.nl"
              className="border-border/60 focus:border-primary/60 transition-colors"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="clientReference" className="text-sm font-medium">Klant referentie</Label>
            <Input
              id="clientReference"
              value={currentDraft.meta.clientReference || ''}
              onChange={(e) => updateMeta({ clientReference: e.target.value })}
              placeholder="Project naam of referentie"
              className="border-border/60 focus:border-primary/60 transition-colors"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="clientAddress" className="text-sm font-medium">Adres</Label>
            <Input
              id="clientAddress"
              value={currentDraft.meta.clientAddress || ''}
              onChange={(e) => updateMeta({ clientAddress: e.target.value })}
              placeholder="Straat en huisnummer"
              className="border-border/60 focus:border-primary/60 transition-colors"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="clientPostalCode" className="text-sm font-medium">Postcode</Label>
            <Input
              id="clientPostalCode"
              value={currentDraft.meta.clientPostalCode || ''}
              onChange={(e) => updateMeta({ clientPostalCode: e.target.value })}
              placeholder="1234 AB"
              className="border-border/60 focus:border-primary/60 transition-colors"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="clientCity" className="text-sm font-medium">Plaats</Label>
            <Input
              id="clientCity"
              value={currentDraft.meta.clientCity || ''}
              onChange={(e) => updateMeta({ clientCity: e.target.value })}
              placeholder="Plaats"
              className="border-border/60 focus:border-primary/60 transition-colors"
            />
          </div>
        </div>
        
        {/* Totaal bedrag card apart */}
        <div className="mt-8">
          <div className="relative overflow-hidden p-6 bg-gradient-to-br from-primary/10 via-background to-accent/10 rounded-lg border border-primary/20 max-w-md">
            <div className="absolute inset-0 bg-gradient-primary opacity-5"></div>
            <div className="relative">
              <div className="text-sm text-muted-foreground mb-2 font-medium">Totaal bedrag</div>
              <div className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {formatPrice(getTotalPrice())}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {currentDraft.lineItems.length} regelitem(s)
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}