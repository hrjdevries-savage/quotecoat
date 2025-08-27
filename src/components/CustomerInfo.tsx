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
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-foreground">Klantgegevens</h2>
        <p className="text-muted-foreground">
          Vul de klantgegevens in voor de offerte
        </p>
      </div>

      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
      </Card>
    </div>
  );
}