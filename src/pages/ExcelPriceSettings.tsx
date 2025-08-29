import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ExcelPriceConfig } from '@/components/ExcelPriceConfig';
import { ArrowLeft } from 'lucide-react';

export const ExcelPriceSettings = () => {
  const navigate = useNavigate();

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

        <ExcelPriceConfig />
      </div>
    </div>
  );
};