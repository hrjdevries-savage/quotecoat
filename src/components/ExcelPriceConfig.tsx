import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Upload, Settings } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ExcelConfig {
  fileName: string;
  lengthCell: string;
  widthCell: string;
  heightCell: string;
  weightCell: string;
  priceCell: string;
  workbook: XLSX.WorkBook | null;
}

interface ExcelPriceConfigProps {
  onConfigSave: (config: ExcelConfig) => void;
  currentConfig?: ExcelConfig | null;
}

export const ExcelPriceConfig = ({ onConfigSave, currentConfig }: ExcelPriceConfigProps) => {
  const { toast } = useToast();
  const [config, setConfig] = useState<ExcelConfig>({
    fileName: currentConfig?.fileName || '',
    lengthCell: currentConfig?.lengthCell || 'A1',
    widthCell: currentConfig?.widthCell || 'B1',
    heightCell: currentConfig?.heightCell || 'C1',
    weightCell: currentConfig?.weightCell || 'D1',
    priceCell: currentConfig?.priceCell || 'E1',
    workbook: currentConfig?.workbook || null
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        setConfig(prev => ({
          ...prev,
          fileName: file.name,
          workbook
        }));

        toast({
          title: "Excel bestand geladen",
          description: `${file.name} is succesvol geüpload`,
        });
      } catch (error) {
        toast({
          title: "Fout bij uploaden",
          description: "Kon Excel bestand niet lezen",
          variant: "destructive",
        });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSaveConfig = () => {
    if (!config.workbook) {
      toast({
        title: "Geen Excel bestand",
        description: "Upload eerst een Excel bestand",
        variant: "destructive",
      });
      return;
    }

    onConfigSave(config);
    toast({
      title: "Configuratie opgeslagen",
      description: "Excel prijsberekening is geconfigureerd",
    });
  };

  const getWorksheetNames = () => {
    if (!config.workbook) return [];
    return config.workbook.SheetNames;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Excel Bestand Upload
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="excel-file">Selecteer Excel bestand</Label>
              <Input
                id="excel-file"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="mt-1"
              />
            </div>
            {config.fileName && (
              <div className="text-sm text-muted-foreground">
                Geladen: {config.fileName}
              </div>
            )}
            {getWorksheetNames().length > 0 && (
              <div className="text-sm">
                <strong>Werkbladen:</strong> {getWorksheetNames().join(', ')}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Cel Configuratie
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="length-cell">Lengte Cel (bijv. A1)</Label>
              <Input
                id="length-cell"
                value={config.lengthCell}
                onChange={(e) => setConfig(prev => ({ ...prev, lengthCell: e.target.value }))}
                placeholder="A1"
              />
            </div>
            <div>
              <Label htmlFor="width-cell">Breedte Cel (bijv. B1)</Label>
              <Input
                id="width-cell"
                value={config.widthCell}
                onChange={(e) => setConfig(prev => ({ ...prev, widthCell: e.target.value }))}
                placeholder="B1"
              />
            </div>
            <div>
              <Label htmlFor="height-cell">Hoogte Cel (bijv. C1)</Label>
              <Input
                id="height-cell"
                value={config.heightCell}
                onChange={(e) => setConfig(prev => ({ ...prev, heightCell: e.target.value }))}
                placeholder="C1"
              />
            </div>
            <div>
              <Label htmlFor="weight-cell">Gewicht Cel (bijv. D1)</Label>
              <Input
                id="weight-cell"
                value={config.weightCell}
                onChange={(e) => setConfig(prev => ({ ...prev, weightCell: e.target.value }))}
                placeholder="D1"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="price-cell">Prijs Output Cel (bijv. E1)</Label>
              <Input
                id="price-cell"
                value={config.priceCell}
                onChange={(e) => setConfig(prev => ({ ...prev, priceCell: e.target.value }))}
                placeholder="E1"
              />
            </div>
          </div>
          
          <div className="mt-6">
            <Button onClick={handleSaveConfig} className="w-full">
              Configuratie Opslaan
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};