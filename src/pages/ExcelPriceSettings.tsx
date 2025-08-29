import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ExcelPriceConfig } from '@/components/ExcelPriceConfig';
import { AuthWrapper } from '@/components/AuthWrapper';
import { ArrowLeft } from 'lucide-react';

export const ExcelPriceSettings = () => {
  const navigate = useNavigate();

  return (
    <AuthWrapper>
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
    </AuthWrapper>
  );
};