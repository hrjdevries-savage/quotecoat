import { EmailUpload } from '@/components/EmailUpload';
import { LineItemsTable } from '@/components/LineItemsTable';
import { CustomerInfo } from '@/components/CustomerInfo';
import { PdfGenerator } from '@/components/PdfGenerator';
import { useQuoteStore } from '@/store/useQuoteStore';
import { Settings, HelpCircle, ArrowLeft, FileText, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
const Index = () => {
  const {
    currentDraft,
    clearDraft
  } = useQuoteStore();
  return <div className="relative min-h-screen">
      {/* Global background gradient */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/15 via-accent/15 to-accent/15"></div>
      
      
      {/* Conditional Header */}
      {!currentDraft ? (/* Hero Section for landing page */
    <div className="relative overflow-hidden pb-8">
          <div className="container relative mx-auto px-4 py-[18px]">
            <div className="max-w-4xl">
              <h1 className="mb-6 bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent py-[10px] px-[10px]">
                Coating quotes made simple
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl leading-relaxed mt-8">
                Upload your specifications, get instant quotes, and streamline your manufacturing workflow with our AI-powered platform.
              </p>
            </div>
          </div>
        </div>) : (/* Navigation bar for quote editing */
    <div className="relative border-b border-border/20 bg-background/20 backdrop-blur-md">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button onClick={clearDraft} variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Terug naar start
                </Button>
                <div className="h-6 w-px bg-border/40"></div>
                <h2 className="text-xl font-semibold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                  Offerte #{currentDraft.meta.quoteNumber}
                </h2>
              </div>
              
              <div className="flex items-center space-x-2">
                <Link to="/quotes">
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                    <FileText className="h-4 w-4 mr-2" />
                    Offertes
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  <Upload className="h-4 w-4 mr-2" />
                  Files
                </Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  <Settings className="h-4 w-4 mr-2" />
                  Instellingen
                </Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  FAQ
                </Button>
              </div>
            </div>
          </div>
        </div>)}

      {/* Main Content */}
      <div className={`container mx-auto px-4 pb-16 space-y-12 ${currentDraft ? 'pt-8' : ''}`}>
        {!currentDraft ? <EmailUpload /> : <div className="space-y-8">
            <LineItemsTable />
            <CustomerInfo />
            <PdfGenerator />
          </div>}
      </div>
    </div>;
};
export default Index;