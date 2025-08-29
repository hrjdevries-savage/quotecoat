import { useState, useEffect } from 'react';
import { Upload, FileSpreadsheet, Settings, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { ExcelPriceService } from '@/services/ExcelPriceService';

export function ExcelPriceConfig() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [config, setConfig] = useState({
    lengthCell: 'A1',
    widthCell: 'A2',
    heightCell: 'A3',
    weightCell: 'A4',
    priceCell: 'A5'
  });
  const [isConfigured, setIsConfigured] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if Excel is already configured
    const existingConfig = ExcelPriceService.getConfig();
    if (existingConfig) {
      setConfig({
        lengthCell: existingConfig.lengthCell,
        widthCell: existingConfig.widthCell,
        heightCell: existingConfig.heightCell,
        weightCell: existingConfig.weightCell,
        priceCell: existingConfig.priceCell
      });
      setIsConfigured(ExcelPriceService.isConfigured() && !!existingConfig.workbook);
    }
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    setIsLoading(true);
    setError(null);

    try {
      await ExcelPriceService.loadWorkbookFromFile(uploadedFile);
      setFile(uploadedFile);
      
      toast({
        title: "Excel bestand geladen",
        description: `${uploadedFile.name} is succesvol geüpload`,
      });
      
      // Check if we now have a complete configuration
      setIsConfigured(ExcelPriceService.isConfigured());
    } catch (error) {
      setError('Kon Excel bestand niet laden');
      toast({
        title: "Fout bij uploaden",
        description: "Kon Excel bestand niet lezen",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!file) {
      setError('Upload eerst een Excel bestand');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Reload the workbook to ensure it's available
      await ExcelPriceService.loadWorkbookFromFile(file);
      
      // Save the configuration
      const configToSave = {
        fileName: file.name,
        lengthCell: config.lengthCell,
        widthCell: config.widthCell,
        heightCell: config.heightCell,
        weightCell: config.weightCell,
        priceCell: config.priceCell,
        workbook: ExcelPriceService.getConfig()?.workbook || null
      };

      ExcelPriceService.setConfig(configToSave);
      setIsConfigured(true);

      toast({
        title: "Configuratie opgeslagen",
        description: "Excel prijsberekening is geconfigureerd en klaar voor gebruik",
      });
    } catch (error) {
      setError('Kon configuratie niet opslaan');
      toast({
        title: "Fout",
        description: "Kon configuratie niet opslaan",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestCalculation = async () => {
    setIsLoading(true);
    try {
      const testPrice = await ExcelPriceService.calculatePrice(100, 50, 25, 2.5);
      toast({
        title: "Test berekening",
        description: testPrice !== null 
          ? `Test prijs: €${testPrice}` 
          : "Kon geen prijs berekenen - controleer de configuratie",
        variant: testPrice !== null ? "default" : "destructive"
      });
    } catch (error) {
      toast({
        title: "Test gefaald",
        description: "Fout bij test berekening",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearConfiguration = () => {
    ExcelPriceService.clearConfig();
    setFile(null);
    setIsConfigured(false);
    setError(null);
    toast({
      title: "Configuratie gewist",
      description: "Excel configuratie is verwijderd",
    });
  };

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isConfigured ? (
              <Check className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-yellow-500" />
            )}
            Excel Prijsberekening Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isConfigured ? (
            <Alert>
              <Check className="h-4 w-4" />
              <AlertDescription>
                Excel prijsberekening is geconfigureerd en klaar voor gebruik.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Upload een Excel bestand en configureer de cellen om automatische prijsberekening te activeren.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* File Upload Card */}
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
              <Label htmlFor="excel-file">Selecteer Excel bestand (.xlsx, .xls)</Label>
              <Input
                id="excel-file"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                disabled={isLoading}
                className="mt-1"
              />
            </div>
            {file && (
              <div className="text-sm text-muted-foreground">
                Geladen: {file.name}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cell Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Cel Configuratie
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="length-cell">Lengte Input Cel</Label>
                <Input
                  id="length-cell"
                  value={config.lengthCell}
                  onChange={(e) => setConfig(prev => ({ ...prev, lengthCell: e.target.value }))}
                  placeholder="A1"
                />
              </div>
              <div>
                <Label htmlFor="width-cell">Breedte Input Cel</Label>
                <Input
                  id="width-cell"
                  value={config.widthCell}
                  onChange={(e) => setConfig(prev => ({ ...prev, widthCell: e.target.value }))}
                  placeholder="A2"
                />
              </div>
              <div>
                <Label htmlFor="height-cell">Hoogte Input Cel</Label>
                <Input
                  id="height-cell"
                  value={config.heightCell}
                  onChange={(e) => setConfig(prev => ({ ...prev, heightCell: e.target.value }))}
                  placeholder="A3"
                />
              </div>
              <div>
                <Label htmlFor="weight-cell">Gewicht Input Cel</Label>
                <Input
                  id="weight-cell"
                  value={config.weightCell}
                  onChange={(e) => setConfig(prev => ({ ...prev, weightCell: e.target.value }))}
                  placeholder="A4"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="price-cell">Prijs Output Cel</Label>
                <Input
                  id="price-cell"
                  value={config.priceCell}
                  onChange={(e) => setConfig(prev => ({ ...prev, priceCell: e.target.value }))}
                  placeholder="A5"
                />
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={handleSaveConfig} 
                disabled={isLoading || !file}
                className="flex-1"
              >
                {isLoading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                Configuratie Opslaan
              </Button>
              
              {isConfigured && (
                <Button 
                  onClick={handleTestCalculation}
                  variant="outline"
                  disabled={isLoading}
                >
                  Test Berekening
                </Button>
              )}
              
              {isConfigured && (
                <Button 
                  onClick={clearConfiguration}
                  variant="destructive"
                  disabled={isLoading}
                >
                  Wissen
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}