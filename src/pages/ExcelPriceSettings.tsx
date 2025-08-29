import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ExcelPriceConfig } from '@/components/ExcelPriceConfig';
import { ExcelPriceService, ExcelConfig } from '@/services/ExcelPriceService';
import { ArrowLeft } from 'lucide-react';

export const ExcelPriceSettings = () => {
  const navigate = useNavigate();
  const [currentConfig, setCurrentConfig] = useState<ExcelConfig | null>(
    ExcelPriceService.getConfig()
  );

  const handleConfigSave = (config: ExcelConfig) => {
    ExcelPriceService.setConfig(config);
    setCurrentConfig(config);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Terug
          </Button>
          
          <h1 className="text-3xl font-bold">Excel Prijsberekening Configuratie</h1>
          <p className="text-muted-foreground mt-2">
            Upload een Excel bestand en configureer de cellen voor automatische prijsberekening
          </p>
        </div>

        <ExcelPriceConfig 
          onConfigSave={handleConfigSave}
          currentConfig={currentConfig}
        />

        {ExcelPriceService.isConfigured() && (
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-800 dark:text-green-200">
              ✓ Excel prijsberekening is geconfigureerd en actief
            </p>
          </div>
        )}
      </div>
    </div>
  );
};