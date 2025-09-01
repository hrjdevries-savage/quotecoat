import React, { useState } from 'react';
import { Eye, Trash2, Plus, Copy, DollarSign, ArrowLeft, Calculator, Upload, RotateCcw, AlertTriangle } from 'lucide-react';
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useQuoteStore } from '@/store/useQuoteStore';
import { LineItem } from '@/types';
import { formatFileSize } from '@/utils/helpers';
import { AttachmentPreview } from './AttachmentPreview';
import { ExcelDebugPanel } from './ExcelDebugPanel';
import { calcL17, type SheetType, testCalculation } from '@/lib/excelCalc';
import { analyzeStepByUrl, isStepFile, parseNumberLoose, formatNumberLocale, DEMO_STEP_URL, MATERIALS, type StepAnalysisResult } from '@/services/StepAnalyzerService';
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
  const [excelResults, setExcelResults] = useState<Record<string, { sheet: SheetType; result: number | null; error?: string }>>({});
  const [excelLoading, setExcelLoading] = useState<Record<string, boolean>>({});
  const [stepAnalyzing, setStepAnalyzing] = useState<Record<string, boolean>>({});
  const [stepAnalysisErrors, setStepAnalysisErrors] = useState<Record<string, string>>({});
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
      excelSheet: 'Sublimotion' as SheetType,
      material: 'steel'
    };
    addLineItem(newItem);
  };
  const handlePriceChange = (itemId: string, value: string) => {
    const numValue = value === '' ? null : parseFloat(value);
    updateLineItem(itemId, {
      price: numValue
    });
  };
  const handleDimensionChange = async (itemId: string, field: 'lengte' | 'breedte' | 'hoogte' | 'gewichtKg', value: string) => {
    // Convert comma to dot for decimal numbers
    const normalizedValue = value.replace(',', '.');
    const numericValue = normalizedValue === '' ? null : parseFloat(normalizedValue);
    
    const updatedItem = {
      [field]: numericValue
    };
    updateLineItem(itemId, updatedItem);

    // Auto-calculate Excel price when all dimensions are filled
    debouncedExcelCalculation(itemId);
  };

  const handleExcelCalculation = async (itemId: string) => {
    const item = currentDraft?.lineItems.find(item => item.id === itemId);
    if (!item || !item.lengte || !item.breedte || !item.hoogte || !item.gewichtKg) {
      return;
    }

    setExcelLoading(prev => ({ ...prev, [itemId]: true }));
    setExcelResults(prev => ({ ...prev, [itemId]: { sheet: item.excelSheet || 'Sublimotion', result: null } }));

    try {
      const result = await calcL17({
        sheet: item.excelSheet || 'Sublimotion',
        length: item.lengte,
        width: item.breedte,
        height: item.hoogte,
        weight: item.gewichtKg
      });

      setExcelResults(prev => ({
        ...prev,
        [itemId]: { sheet: item.excelSheet || 'Sublimotion', result }
      }));

      // Update the price with Excel result
      if (result !== null) {
        updateLineItem(itemId, { price: result });
      }

    } catch (error) {
      console.error('Excel calculation error:', error);
      setExcelResults(prev => ({
        ...prev,
        [itemId]: { 
          sheet: item.excelSheet || 'Sublimotion', 
          result: null, 
          error: error instanceof Error ? error.message : 'Berekening mislukt' 
        }
      }));
    } finally {
      setExcelLoading(prev => ({ ...prev, [itemId]: false }));
    }
  };

  // Debounced auto-calculation for Excel prices
  const debouncedExcelCalculation = useDebouncedCallback(async (itemId: string) => {
    const item = currentDraft?.lineItems.find(item => item.id === itemId);
    if (!item || !item.lengte || !item.breedte || !item.hoogte || !item.gewichtKg) {
      return;
    }
    
    // Auto-calculate if all dimensions are filled
    await handleExcelCalculation(itemId);
  }, 400);

  // Bulk calculate all rows
  const handleBulkCalculation = async () => {
    if (!currentDraft) return;
    
    const validItems = currentDraft.lineItems.filter(item => 
      item.lengte && item.breedte && item.hoogte && item.gewichtKg
    );
    
    for (const item of validItems) {
      await handleExcelCalculation(item.id);
    }
    
    // Show success message (you can implement a toast/snackbar here)
    alert('Prijzen bijgewerkt');
  };

  const handleSheetChange = (itemId: string, sheet: SheetType) => {
    updateLineItem(itemId, { excelSheet: sheet });
  };

  const handleMaterialChange = (itemId: string, material: string) => {
    updateLineItem(itemId, { material });
  };

  const handleDensityChange = (itemId: string, value: string) => {
    const density = value === '' ? undefined : parseFloat(value.replace(',', '.'));
    updateLineItem(itemId, { density });
  };

  const analyzeStepFile = async (itemId: string, fileUrl: string) => {
    const item = currentDraft?.lineItems.find(item => item.id === itemId);
    if (!item) return;

    setStepAnalyzing(prev => ({ ...prev, [itemId]: true }));
    setStepAnalysisErrors(prev => ({ ...prev, [itemId]: '' }));

    try {
      console.log('🔬 Starting STEP analysis for:', item.fileName);
      const result: StepAnalysisResult = await analyzeStepByUrl(
        fileUrl, 
        item.material || 'steel',
        item.density
      );

      console.log('✅ STEP analysis result:', result);

      // Update line item with analysis results
      updateLineItem(itemId, {
        lengte: result.L,
        breedte: result.B,
        hoogte: result.H,
        gewichtKg: result.W,
        stepAnalysisResult: {
          solids: result.solids,
          volume_m3: result.volume_m3,
          autoFilled: true
        }
      });

      // Auto-trigger Excel calculation after successful analysis
      setTimeout(() => {
        handleExcelCalculation(itemId);
      }, 500);

    } catch (error) {
      console.error('❌ STEP analysis failed:', error);
      setStepAnalysisErrors(prev => ({
        ...prev,
        [itemId]: 'Analyseren van STEP is niet gelukt. Probeer opnieuw of vul L, B, H en Gewicht handmatig in.'
      }));
    } finally {
      setStepAnalyzing(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const handleRetryStepAnalysis = async (itemId: string) => {
    const item = currentDraft?.lineItems.find(item => item.id === itemId);
    if (!item) return;

    const attachment = currentDraft.attachments.find(att => att.id === item.attachmentId);
    if (!attachment) return;

    // Try to get a valid URL for the file
    if (attachment.url) {
      await analyzeStepFile(itemId, attachment.url);
    }
  };

  const handleDemoStepAnalysis = async () => {
    // Create a demo line item
    const demoItem: LineItem = {
      id: `demo_${Date.now()}`,
      description: 'Demo STEP Analysis',
      drawingNumber: 'DEMO-001',
      behandeling: '',
      lengte: null,
      breedte: null,
      hoogte: null,
      gewichtKg: null,
      price: null,
      excelSheet: 'Sublimotion' as SheetType,
      material: 'steel',
      fileName: 'demo.step'
    };
    
    addLineItem(demoItem);
    
    // Analyze the demo STEP file
    await analyzeStepFile(demoItem.id, DEMO_STEP_URL);
  };

  const handleTestCalculation = async () => {
    try {
      setExcelLoading(prev => ({ ...prev, 'test': true }));
      console.log('🧪 Starting test calculation...');
      
      const result = await calcL17({
        sheet: 'Sublimotion',
        length: 2000,
        width: 500,
        height: 500,
        weight: 700
      });
      
      if (result !== null) {
        alert(`✅ Test successful: L17 = ${result}`);
      } else {
        alert('⚠️ Test returned null - check Excel formulas');
      }
    } catch (error) {
      console.error('❌ Test failed:', error);
      alert(`❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setExcelLoading(prev => ({ ...prev, 'test': false }));
    }
  };
  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({});
  const calculatePrice = async (itemId: string) => {
    const item = currentDraft?.lineItems.find(item => item.id === itemId);
    if (!item) return;
    const {
      ExcelPriceService
    } = await import('@/services/ExcelPriceService');
    if (await ExcelPriceService.isConfigured()) {
      // Only calculate if all required fields have values
      if (item.lengte && item.breedte && item.hoogte && item.gewichtKg) {
        const result = await ExcelPriceService.calculatePrice(item.lengte, item.breedte, item.hoogte, item.gewichtKg);

        // Store debug info for this item
        setDebugInfo(prev => ({
          ...prev,
          [itemId]: result.debugInfo
        }));
        if (result.price !== null) {
          updateLineItem(itemId, {
            price: result.price
          });
        }
      }
    }
  };
  const debouncedCalculatePrice = useDebouncedCallback(async (itemId: string, updatedItem: any) => {
    const item = currentDraft?.lineItems.find(item => item.id === itemId);
    if (!item) return;
    const {
      ExcelPriceService
    } = await import('@/services/ExcelPriceService');
    if (await ExcelPriceService.isConfigured()) {
      const updatedLineItem = {
        ...item,
        ...updatedItem
      };

      // Only calculate if all required fields have values
      if (updatedLineItem.lengte && updatedLineItem.breedte && updatedLineItem.hoogte && updatedLineItem.gewichtKg) {
        const result = await ExcelPriceService.calculatePrice(updatedLineItem.lengte, updatedLineItem.breedte, updatedLineItem.hoogte, updatedLineItem.gewichtKg);

        // Store debug info for this item
        setDebugInfo(prev => ({
          ...prev,
          [itemId]: result.debugInfo
        }));
        if (result.price !== null) {
          updateLineItem(itemId, {
            price: result.price
          });
        }
      } else {
        // Clear price if dimensions are incomplete
        updateLineItem(itemId, {
          price: null
        });
        setDebugInfo(prev => ({
          ...prev,
          [itemId]: null
        }));
      }
    }
  }, 250); // 250ms debounce delay

  const formatPrice = (price: number | null) => {
    if (price === null) return '—';
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  // Calculate total from Excel prices
  const getTotalExcelPrice = () => {
    if (!currentDraft) return 0;
    return currentDraft.lineItems.reduce((total, item) => {
      return total + (item.price || 0);
    }, 0);
  };
  const getFilePreview = (lineItem: LineItem) => {
    const attachment = currentDraft.attachments.find(att => att.id === lineItem.attachmentId);
    if (!attachment) return null;
    const isPDF = attachment.mimeType === 'application/pdf';
    const isCAD = /\.(step|stp|iges|igs|stl|obj|3ds|fbx|dxf)$/i.test(attachment.fileName);
    return {
      attachment,
      isPDF,
      isCAD
    };
  };
  return <div className="w-full max-w-7xl mx-auto space-y-6">
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
          <Button onClick={clearDraft} variant="outline" className="border-primary/20 hover:bg-primary/5 hover:border-primary/40 transition-all">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Nieuwe Offerte
          </Button>
          <Button onClick={handleDemoStepAnalysis} variant="outline" className="border-accent/20 hover:bg-accent/5 hover:border-accent/40 transition-all">
            <Upload className="mr-2 h-4 w-4" />
            Test met demo STEP
          </Button>
          <Button onClick={handleAddEmptyRow} className="bg-gradient-primary hover:shadow-lg hover:scale-105 transition-all">
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
                <th className="text-left p-3 font-semibold text-xs w-20">L (mm)</th>
                <th className="text-left p-3 font-semibold text-xs w-20">B (mm)</th>
                <th className="text-left p-3 font-semibold text-xs w-20">H (mm)</th>
                <th className="text-left p-2 font-medium text-xs w-20">Gewicht (kg)</th>
                <th className="text-left p-2 font-medium text-xs w-24">Materiaal</th>
                <th className="text-left p-2 font-medium text-xs w-28">Excel Sheet</th>
                <th className="text-left p-2 font-medium text-xs min-w-[140px]">Prijs (Excel L17)</th>
                <th className="text-left p-2 font-medium text-xs w-12">Acties</th>
              </tr>
            </thead>
            <tbody>
              {currentDraft.lineItems.map(item => {
              const preview = getFilePreview(item);
              return <React.Fragment key={item.id}>
                    <tr className="border-b hover:bg-muted/20 transition-colors">
                      <td className="p-2">
                        {preview ? <Button variant="outline" size="sm" onClick={() => setShowPreviewId(item.id)} className="h-6 w-6 p-0">
                            <Eye className="h-3 w-3" />
                          </Button> : <div className="w-6 h-6 bg-muted rounded flex items-center justify-center">
                            <span className="text-xs text-muted-foreground">-</span>
                          </div>}
                      </td>
                      
                      <td className="p-2">
                        {item.fileName ? <div className="space-y-1">
                            <div className="font-medium text-xs truncate max-w-[120px]">
                              {item.fileName}
                            </div>
                            <div className="flex gap-1 flex-wrap items-center">
                              {preview?.isPDF && <Badge variant="secondary" className="text-xs h-4 px-1">PDF</Badge>}
                              {preview?.isCAD && <Badge variant="secondary" className="text-xs h-4 px-1">CAD</Badge>}
                              {isStepFile(item.fileName) && (
                                <>
                                  {stepAnalyzing[item.id] && (
                                    <div className="flex items-center gap-1">
                                      <div className="w-3 h-3 border border-primary border-t-transparent rounded-full animate-spin" />
                                      <span className="text-xs text-primary">Analyseren...</span>
                                    </div>
                                  )}
                                  {item.stepAnalysisResult?.autoFilled && !stepAnalyzing[item.id] && (
                                    <Badge variant="outline" className="text-xs h-4 px-1 text-primary border-primary">
                                      Auto-ingevuld
                                    </Badge>
                                  )}
                                   {!stepAnalyzing[item.id] && (
                                     <Button
                                       variant="ghost" 
                                       size="sm"
                                       onClick={() => handleRetryStepAnalysis(item.id)}
                                       className="h-4 px-1 text-xs text-primary hover:text-primary"
                                       title="Vul vanuit STEP"
                                     >
                                       <Upload className="h-3 w-3 mr-1" />
                                       Vul
                                     </Button>
                                   )}
                                   {stepAnalysisErrors[item.id] && !stepAnalyzing[item.id] && (
                                     <Button
                                       variant="ghost" 
                                       size="sm"
                                       onClick={() => handleRetryStepAnalysis(item.id)}
                                       className="h-4 px-1 text-xs text-destructive hover:text-destructive"
                                       title="Opnieuw analyseren"
                                     >
                                       <RotateCcw className="h-3 w-3 mr-1" />
                                       Retry
                                     </Button>
                                   )}
                                </>
                              )}
                            </div>
                            {stepAnalysisErrors[item.id] && (
                              <div className="text-xs text-destructive max-w-[120px]">
                                {stepAnalysisErrors[item.id]}
                              </div>
                            )}
                            {item.stepAnalysisResult && !stepAnalysisErrors[item.id] && (
                              <div className="text-xs text-muted-foreground max-w-[120px]">
                                Solids: {item.stepAnalysisResult.solids} | Vol: {formatNumberLocale(item.stepAnalysisResult.volume_m3, 6)} m³
                              </div>
                            )}
                          </div> : <span className="text-muted-foreground text-xs">Handmatig</span>}
                      </td>
                      
                      <td className="p-2">
                        <Input value={item.description} onChange={e => updateLineItem(item.id, {
                      description: e.target.value
                    })} placeholder="Omschrijving..." className="h-8 text-xs" />
                      </td>
                      
                      <td className="p-2">
                        <Input value={item.drawingNumber} onChange={e => updateLineItem(item.id, {
                      drawingNumber: e.target.value
                    })} placeholder="Tekening..." className="h-8 text-xs" />
                      </td>
                      
                      <td className="p-2">
                        <Input type="number" min="0" step="0.1" value={item.lengte || ''} onChange={e => handleDimensionChange(item.id, 'lengte', e.target.value)} placeholder="0" className="h-8 text-xs" />
                      </td>
                      
                      <td className="p-2">
                        <Input type="number" min="0" step="0.1" value={item.breedte || ''} onChange={e => handleDimensionChange(item.id, 'breedte', e.target.value)} placeholder="0" className="h-8 text-xs" />
                      </td>
                      
                      <td className="p-2">
                        <Input type="number" min="0" step="0.1" value={item.hoogte || ''} onChange={e => handleDimensionChange(item.id, 'hoogte', e.target.value)} placeholder="0" className="h-8 text-xs" />
                      </td>
                      
                      <td className="p-2">
                        <div className="space-y-1">
                          <Input 
                            type="number" 
                            min="0" 
                            step="0.01" 
                            value={item.gewichtKg || ''} 
                            onChange={e => handleDimensionChange(item.id, 'gewichtKg', e.target.value)} 
                            placeholder="0" 
                            className="h-8 text-xs" 
                          />
                          {(item.lengte && item.breedte && item.hoogte && item.gewichtKg) && 
                           (item.lengte < 10 || item.breedte < 10 || item.hoogte < 10 || 
                            item.lengte > 100000 || item.breedte > 100000 || item.hoogte > 100000) && (
                            <div className="flex items-center gap-1 text-xs text-amber-600">
                              <AlertTriangle className="h-3 w-3" />
                              <span>Units controleren?</span>
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td className="p-2">
                        <Select value={item.material || 'steel'} onValueChange={(value) => handleMaterialChange(item.id, value)}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {MATERIALS.map(material => (
                              <SelectItem key={material.value} value={material.value}>
                                {material.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      
                      <td className="p-2">
                        <Select value={item.excelSheet || 'Sublimotion'} onValueChange={(value: SheetType) => handleSheetChange(item.id, value)}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Sublimotion">Sublimotion</SelectItem>
                            <SelectItem value="Verzinken">Verzinken</SelectItem>
                            <SelectItem value="Dompelbeitsen">Dompelbeitsen</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>

                      <td className="p-2">
                        <div className="flex gap-1 items-center">
                          <Input 
                            readOnly 
                            value={
                              excelResults[item.id]?.error 
                                ? `ERR: ${excelResults[item.id]?.error}` 
                                : item.price !== null
                                  ? formatPrice(item.price)
                                  : '—'
                            } 
                            placeholder="Auto-bereken" 
                            className="h-8 text-xs flex-1 px-[5px] bg-muted/50" 
                            title={excelResults[item.id]?.error || `Prijs: ${formatPrice(item.price)}`}
                          />
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleExcelCalculation(item.id)} 
                            disabled={!item.lengte || !item.breedte || !item.hoogte || !item.gewichtKg || excelLoading[item.id]} 
                            className="h-8 w-8 p-0" 
                            title="Bereken met Excel"
                          >
                            {excelLoading[item.id] ? (
                              <div className="w-3 h-3 border border-primary border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Calculator className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </td>
                      
                      <td className="p-2">
                        <Button variant="outline" size="sm" onClick={() => removeLineItem(item.id)} className="h-6 w-6 p-0 text-destructive hover:text-destructive">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                    
                    {/* Debug Panel Row */}
                    {debugInfo[item.id] && <tr>
                        <td colSpan={11} className="p-2">
                          <ExcelDebugPanel debugInfo={debugInfo[item.id]} lineItemId={item.id} />
                        </td>
                      </tr>}
                  </React.Fragment>;
            })}
            </tbody>
          </table>
        </div>
        
        <div className="border-t bg-muted/30 p-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={handleBulkCalculation}>
                <Calculator className="mr-2 h-4 w-4" />
                Reken alle regels
              </Button>
              <Button variant="outline" size="sm" onClick={handleTestCalculation} disabled={excelLoading['test']}>
                {excelLoading['test'] ? (
                  <div className="w-4 h-4 border border-primary border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <Calculator className="mr-2 h-4 w-4" />
                )}
                Test Excel (L=2000, B=500, H=500, W=700)
              </Button>
              <Button variant="outline" size="sm" onClick={handleDemoStepAnalysis} className="text-blue-600 border-blue-200 hover:bg-blue-50">
                <Upload className="mr-2 h-4 w-4" />
                Demo STEP-analyse
              </Button>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Totaal (Excel)</div>
              <div className="text-2xl font-bold text-primary">
                {formatPrice(getTotalExcelPrice())}
              </div>
            </div>
          </div>
        </div>
      </Card>
      
      <AttachmentPreview attachment={showPreviewId ? currentDraft.attachments.find(att => currentDraft.lineItems.find(item => item.id === showPreviewId)?.attachmentId === att.id) || null : null} isOpen={!!showPreviewId} onClose={() => setShowPreviewId(null)} />
    </div>;
}