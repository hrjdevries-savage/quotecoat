import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Bug, ChevronDown, ChevronRight } from 'lucide-react';
import { ExcelDebugInfo } from '@/services/ExcelPriceService';

interface ExcelDebugPanelProps {
  debugInfo: ExcelDebugInfo | null;
  lineItemId: string;
}

export const ExcelDebugPanel: React.FC<ExcelDebugPanelProps> = ({ debugInfo, lineItemId }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!debugInfo) return null;

  return (
    <Card className="mt-2 border-orange-200 bg-orange-50/50">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full justify-start p-2">
            {isOpen ? <ChevronDown className="h-4 w-4 mr-2" /> : <ChevronRight className="h-4 w-4 mr-2" />}
            <Bug className="h-4 w-4 mr-2" />
            Excel Debug Info ({lineItemId})
            {debugInfo.errors.length > 0 && (
              <Badge variant="destructive" className="ml-2">{debugInfo.errors.length} errors</Badge>
            )}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Sheet:</strong> {debugInfo.sheetName}
              </div>
              <div>
                <strong>Template Hash:</strong> {debugInfo.templateHash?.slice(0, 8)}...
              </div>
            </div>

            <div>
              <strong className="text-sm">Input Cells:</strong>
              <div className="mt-1 space-y-1">
                {Object.entries(debugInfo.inputCells).map(([cell, value]) => (
                  <div key={cell} className="flex justify-between text-xs bg-white p-1 rounded">
                    <span className="font-mono">{cell}:</span>
                    <span>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <strong className="text-sm">Output Cell:</strong>
              <div className="mt-1 bg-white p-2 rounded text-xs">
                <div className="flex justify-between">
                  <span className="font-mono">{debugInfo.outputCell.ref}:</span>
                  <span className={debugInfo.outputCell.value !== null ? 'text-green-600 font-semibold' : 'text-red-600'}>
                    {debugInfo.outputCell.value !== null ? `€${debugInfo.outputCell.value}` : 'null'}
                  </span>
                </div>
              </div>
            </div>

            {debugInfo.errors.length > 0 && (
              <div>
                <strong className="text-sm text-red-600">Errors:</strong>
                <div className="mt-1 space-y-1">
                  {debugInfo.errors.map((error, index) => (
                    <Alert key={index} variant="destructive" className="py-2">
                      <AlertDescription className="text-xs">{error}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};