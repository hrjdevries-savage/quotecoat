import { useState } from 'react';
import { Eye, Trash2, Plus, Copy, DollarSign, ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useQuoteStore } from '@/store/useQuoteStore';
import { LineItem } from '@/types';
import { formatFileSize } from '@/utils/helpers';
import { AttachmentPreview } from './AttachmentPreview';

export function LineItemsTable() {
  const { 
    currentDraft, 
    updateLineItem, 
    removeLineItem, 
    addLineItem, 
    getTotalPrice,
    clearDraft
  } = useQuoteStore();
  
  const [showPreviewId, setShowPreviewId] = useState<string | null>(null);

  if (!currentDraft) return null;

  const handleAddEmptyRow = () => {
    const newItem: LineItem = {
      id: `item_${Date.now()}`,
      description: '',
      drawingNumber: '',
      behandeling: '',
      lengte: null,
      breedte: null,
      hoogte: null,
      gewichtKg: null,
      price: null,
    };
    addLineItem(newItem);
  };

  const handlePriceChange = (itemId: string, value: string) => {
    const numValue = value === '' ? null : parseFloat(value);
    updateLineItem(itemId, { price: numValue });
  };

  const formatPrice = (price: number | null) => {
    if (price === null) return '';
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const getFilePreview = (lineItem: LineItem) => {
    const attachment = currentDraft.attachments.find(
      att => att.id === lineItem.attachmentId
    );
    
    if (!attachment) return null;

    const isPDF = attachment.mimeType === 'application/pdf';
    const isCAD = /\.(step|stp|iges|igs|stl|obj|3ds|fbx|dxf)$/i.test(attachment.fileName);
    
    return { attachment, isPDF, isCAD };
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Regelitems</h2>
          <p className="text-muted-foreground">
            Bewerk omschrijvingen, tekeningnummers en prijzen
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={clearDraft} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Nieuwe Offerte
          </Button>
          <Button onClick={handleAddEmptyRow} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Regel toevoegen
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left p-3 font-medium w-16">Preview</th>
                <th className="text-left p-3 font-medium min-w-[180px]">Bestand</th>
                <th className="text-left p-3 font-medium min-w-[200px]">Omschrijving</th>
                <th className="text-left p-3 font-medium min-w-[120px]">Tekeningnr.</th>
                <th className="text-left p-3 font-medium min-w-[120px]">Behandeling</th>
                <th className="text-left p-3 font-medium min-w-[80px]">Lengte</th>
                <th className="text-left p-3 font-medium min-w-[80px]">Breedte</th>
                <th className="text-left p-3 font-medium min-w-[80px]">Hoogte</th>
                <th className="text-left p-3 font-medium min-w-[100px]">Gewicht KG</th>
                <th className="text-left p-3 font-medium min-w-[100px]">Prijs (€)</th>
                <th className="text-left p-3 font-medium w-20">Acties</th>
              </tr>
            </thead>
            <tbody>
              {currentDraft.lineItems.map((item) => {
                const preview = getFilePreview(item);
                
                return (
                  <tr key={item.id} className="border-b hover:bg-muted/20 transition-colors">
                    <td className="p-3" rowSpan={2}>
                      {preview ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowPreviewId(item.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      ) : (
                        <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">-</span>
                        </div>
                      )}
                    </td>
                    
                    <td className="p-3" rowSpan={2}>
                      {item.fileName ? (
                        <div className="space-y-1">
                          <div className="font-medium text-sm truncate max-w-[160px]">
                            {item.fileName}
                          </div>
                          {preview && (
                            <div className="flex gap-1 flex-wrap">
                              {preview.isPDF && (
                                <Badge variant="secondary" className="text-xs">PDF</Badge>
                              )}
                              {preview.isCAD && (
                                <Badge variant="secondary" className="text-xs">CAD</Badge>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {formatFileSize(preview.attachment.sizeBytes)}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Handmatige regel</span>
                      )}
                    </td>
                    
                    <td className="p-3" colSpan={2}>
                      <Input
                        value={item.description}
                        onChange={(e) => updateLineItem(item.id, { description: e.target.value })}
                        placeholder="Omschrijving..."
                        className="w-full"
                      />
                    </td>
                    
                    <td className="p-3">
                      <Input
                        value={item.behandeling}
                        onChange={(e) => updateLineItem(item.id, { behandeling: e.target.value })}
                        placeholder="Behandeling..."
                        className="w-full"
                      />
                    </td>
                    
                    <td className="p-3">
                      <Input
                        type="number"
                        min="0"
                        step="0.1"
                        value={item.lengte || ''}
                        onChange={(e) => updateLineItem(item.id, { lengte: e.target.value === '' ? null : parseFloat(e.target.value) })}
                        placeholder="mm"
                        className="w-full"
                      />
                    </td>
                    
                    <td className="p-3">
                      <Input
                        type="number"
                        min="0"
                        step="0.1"
                        value={item.breedte || ''}
                        onChange={(e) => updateLineItem(item.id, { breedte: e.target.value === '' ? null : parseFloat(e.target.value) })}
                        placeholder="mm"
                        className="w-full"
                      />
                    </td>
                    
                    <td className="p-3">
                      <Input
                        type="number"
                        min="0"
                        step="0.1"
                        value={item.hoogte || ''}
                        onChange={(e) => updateLineItem(item.id, { hoogte: e.target.value === '' ? null : parseFloat(e.target.value) })}
                        placeholder="mm"
                        className="w-full"
                      />
                    </td>
                    
                    <td className="p-3">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.gewichtKg || ''}
                        onChange={(e) => updateLineItem(item.id, { gewichtKg: e.target.value === '' ? null : parseFloat(e.target.value) })}
                        placeholder="kg"
                        className="w-full"
                      />
                    </td>
                    
                    <td className="p-3" rowSpan={2}>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.price || ''}
                        onChange={(e) => handlePriceChange(item.id, e.target.value)}
                        placeholder="0.00"
                        className="w-full"
                      />
                    </td>
                    
                    <td className="p-3" rowSpan={2}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeLineItem(item.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        <div className="border-t bg-muted/30 p-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Copy className="mr-2 h-4 w-4" />
                Kopieer bestandsnamen
              </Button>
              <Button variant="outline" size="sm">
                <DollarSign className="mr-2 h-4 w-4" />
                Wis alle prijzen
              </Button>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Totaal</div>
              <div className="text-2xl font-bold text-primary">
                {formatPrice(getTotalPrice())}
              </div>
            </div>
          </div>
        </div>
      </Card>
      
      <AttachmentPreview
        attachment={showPreviewId ? currentDraft.attachments.find(att => 
          currentDraft.lineItems.find(item => item.id === showPreviewId)?.attachmentId === att.id
        ) || null : null}
        isOpen={!!showPreviewId}
        onClose={() => setShowPreviewId(null)}
      />
    </div>
  );
}