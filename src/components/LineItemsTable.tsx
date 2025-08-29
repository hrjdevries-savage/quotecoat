import React, { useState } from 'react';
import { Eye, Trash2, Plus, Copy, DollarSign, ArrowLeft, Calculator } from 'lucide-react';
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useQuoteStore } from '@/store/useQuoteStore';
import { LineItem } from '@/types';
import { formatFileSize } from '@/utils/helpers';
import { AttachmentPreview } from './AttachmentPreview';
import { ExcelDebugPanel } from './ExcelDebugPanel';

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

  const handleDimensionChange = async (itemId: string, field: 'lengte' | 'breedte' | 'hoogte' | 'gewichtKg', value: string) => {
    const numericValue = value === '' ? null : parseFloat(value);
    const updatedItem = { [field]: numericValue };
    updateLineItem(itemId, updatedItem);

    // Debounced price calculation
    debouncedCalculatePrice(itemId, updatedItem);
  };

  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({});

  const calculatePrice = async (itemId: string) => {
    const item = currentDraft?.lineItems.find(item => item.id === itemId);
    if (!item) return;

    const { ExcelPriceService } = await import('@/services/ExcelPriceService');
    if (await ExcelPriceService.isConfigured()) {
      // Only calculate if all required fields have values
      if (item.lengte && item.breedte && item.hoogte && item.gewichtKg) {
        const result = await ExcelPriceService.calculatePrice(
          item.lengte,
          item.breedte, 
          item.hoogte,
          item.gewichtKg
        );
        
        // Store debug info for this item
        setDebugInfo(prev => ({ ...prev, [itemId]: result.debugInfo }));
        
        if (result.price !== null) {
          updateLineItem(itemId, { price: result.price });
        }
      }
    }
  };

  const debouncedCalculatePrice = useDebouncedCallback(async (itemId: string, updatedItem: any) => {
    const item = currentDraft?.lineItems.find(item => item.id === itemId);
    if (!item) return;

    const { ExcelPriceService } = await import('@/services/ExcelPriceService');
    if (await ExcelPriceService.isConfigured()) {
      const updatedLineItem = { ...item, ...updatedItem };
      
      // Only calculate if all required fields have values
      if (updatedLineItem.lengte && updatedLineItem.breedte && 
          updatedLineItem.hoogte && updatedLineItem.gewichtKg) {
        
        const result = await ExcelPriceService.calculatePrice(
          updatedLineItem.lengte,
          updatedLineItem.breedte, 
          updatedLineItem.hoogte,
          updatedLineItem.gewichtKg
        );
        
        // Store debug info for this item
        setDebugInfo(prev => ({ ...prev, [itemId]: result.debugInfo }));
        
        if (result.price !== null) {
          updateLineItem(itemId, { price: result.price });
        }
      } else {
        // Clear price if dimensions are incomplete
        updateLineItem(itemId, { price: null });
        setDebugInfo(prev => ({ ...prev, [itemId]: null }));
      }
    }
  }, 250); // 250ms debounce delay

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
          <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
            Regelitems
          </h2>
          <p className="text-muted-foreground text-lg">
            Bewerk omschrijvingen, tekeningnummers en prijzen
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={clearDraft} 
            variant="outline"
            className="border-primary/20 hover:bg-primary/5 hover:border-primary/40 transition-all"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Nieuwe Offerte
          </Button>
          <Button 
            onClick={handleAddEmptyRow} 
            className="bg-gradient-primary hover:shadow-lg hover:scale-105 transition-all"
          >
            <Plus className="mr-2 h-4 w-4" />
            Regel toevoegen
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden border border-border/40 bg-gradient-card shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gradient-to-r from-primary/5 to-accent/5">
                <th className="text-left p-3 font-semibold text-xs w-12">Preview</th>
                <th className="text-left p-3 font-semibold text-xs min-w-[140px]">Bestand</th>
                <th className="text-left p-3 font-semibold text-xs min-w-[160px]">Omschrijving</th>
                <th className="text-left p-3 font-semibold text-xs w-20">Tekeningnr.</th>
                <th className="text-left p-3 font-semibold text-xs min-w-[100px]">Behandeling</th>
                <th className="text-left p-3 font-semibold text-xs w-20">L (mm)</th>
                <th className="text-left p-3 font-semibold text-xs w-20">B (mm)</th>
                <th className="text-left p-3 font-semibold text-xs w-20">H (mm)</th>
                <th className="text-left p-2 font-medium text-xs w-20">Gewicht</th>
                <th className="text-left p-2 font-medium text-xs w-24">Prijs (€)</th>
                <th className="text-left p-2 font-medium text-xs w-12">Acties</th>
              </tr>
            </thead>
            <tbody>
              {currentDraft.lineItems.map((item) => {
                const preview = getFilePreview(item);
                
                return (
                  <React.Fragment key={item.id}>
                    <tr className="border-b hover:bg-muted/20 transition-colors">
                      <td className="p-2">
                        {preview ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowPreviewId(item.id)}
                            className="h-6 w-6 p-0"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        ) : (
                          <div className="w-6 h-6 bg-muted rounded flex items-center justify-center">
                            <span className="text-xs text-muted-foreground">-</span>
                          </div>
                        )}
                      </td>
                      
                      <td className="p-2">
                        {item.fileName ? (
                          <div className="space-y-1">
                            <div className="font-medium text-xs truncate max-w-[120px]">
                              {item.fileName}
                            </div>
                            {preview && (
                              <div className="flex gap-1 flex-wrap">
                                {preview.isPDF && (
                                  <Badge variant="secondary" className="text-xs h-4 px-1">PDF</Badge>
                                )}
                                {preview.isCAD && (
                                  <Badge variant="secondary" className="text-xs h-4 px-1">CAD</Badge>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">Handmatig</span>
                        )}
                      </td>
                      
                      <td className="p-2">
                        <Input
                          value={item.description}
                          onChange={(e) => updateLineItem(item.id, { description: e.target.value })}
                          placeholder="Omschrijving..."
                          className="h-8 text-xs"
                        />
                      </td>
                      
                      <td className="p-2">
                        <Input
                          value={item.drawingNumber}
                          onChange={(e) => updateLineItem(item.id, { drawingNumber: e.target.value })}
                          placeholder="Tekening..."
                          className="h-8 text-xs"
                        />
                      </td>
                      
                      <td className="p-2">
                        <Input
                          value={item.behandeling}
                          onChange={(e) => updateLineItem(item.id, { behandeling: e.target.value })}
                          placeholder="Behandeling..."
                          className="h-8 text-xs"
                        />
                      </td>
                      
                      <td className="p-2">
                        <Input
                          type="number"
                          min="0"
                          step="0.1"
                          value={item.lengte || ''}
                          onChange={(e) => handleDimensionChange(item.id, 'lengte', e.target.value)}
                          placeholder="0"
                          className="h-8 text-xs"
                        />
                      </td>
                      
                      <td className="p-2">
                        <Input
                          type="number"
                          min="0"
                          step="0.1"
                          value={item.breedte || ''}
                          onChange={(e) => handleDimensionChange(item.id, 'breedte', e.target.value)}
                          placeholder="0"
                          className="h-8 text-xs"
                        />
                      </td>
                      
                      <td className="p-2">
                        <Input
                          type="number"
                          min="0"
                          step="0.1"
                          value={item.hoogte || ''}
                          onChange={(e) => handleDimensionChange(item.id, 'hoogte', e.target.value)}
                          placeholder="0"
                          className="h-8 text-xs"
                        />
                      </td>
                      
                      <td className="p-2">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.gewichtKg || ''}
                          onChange={(e) => handleDimensionChange(item.id, 'gewichtKg', e.target.value)}
                          placeholder="0"
                          className="h-8 text-xs"
                        />
                      </td>
                      
                       <td className="p-2">
                         <div className="flex gap-1 items-center">
                           <Input
                             type="number"
                             min="0"
                             step="0.01"
                             value={item.price || ''}
                             onChange={(e) => handlePriceChange(item.id, e.target.value)}
                             placeholder="0.00"
                             className="h-8 text-xs flex-1"
                           />
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => calculatePrice(item.id)}
                             disabled={!item.lengte || !item.breedte || !item.hoogte || !item.gewichtKg}
                             className="h-8 w-8 p-0"
                             title="Bereken prijs met Excel"
                           >
                             <Calculator className="h-3 w-3" />
                           </Button>
                         </div>
                       </td>
                      
                      <td className="p-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeLineItem(item.id)}
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                    
                    {/* Debug Panel Row */}
                    {debugInfo[item.id] && (
                      <tr>
                        <td colSpan={11} className="p-2">
                          <ExcelDebugPanel 
                            debugInfo={debugInfo[item.id]} 
                            lineItemId={item.id}
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        
        <div className="border-t bg-muted/30 p-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
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