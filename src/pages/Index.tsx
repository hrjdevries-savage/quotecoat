import { EmailUpload } from '@/components/EmailUpload';
import { LineItemsTable } from '@/components/LineItemsTable';
import { CustomerInfo } from '@/components/CustomerInfo';
import { PdfGenerator } from '@/components/PdfGenerator';
import { useQuoteStore } from '@/store/useQuoteStore';

const Index = () => {
  const { currentDraft } = useQuoteStore();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden pb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/15 via-accent/15 to-transparent" />
        <div className="container relative mx-auto px-4 py-16">
          <div className="max-w-4xl">
            <div className="mb-6">
              <span className="inline-block px-4 py-2 bg-primary/10 text-primary text-sm font-medium rounded-full border border-primary/20">
                Professional Quote Generator
              </span>
            </div>
            <h1 className="mb-6 bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent">
              Manufacturing quotes made simple
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl leading-relaxed">
              Upload your specifications, get instant quotes, and streamline your manufacturing workflow with our AI-powered platform.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative">
        <div className="container relative mx-auto px-4 pb-16 space-y-12">
          {!currentDraft ? (
            <EmailUpload />
          ) : (
            <div className="space-y-8">
              <LineItemsTable />
              <CustomerInfo />
              <PdfGenerator />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;