import { EmailUpload } from '@/components/EmailUpload';
import { LineItemsTable } from '@/components/LineItemsTable';
import { CustomerInfo } from '@/components/CustomerInfo';
import { PdfGenerator } from '@/components/PdfGenerator';
import { useQuoteStore } from '@/store/useQuoteStore';

const Index = () => {
  const { currentDraft } = useQuoteStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="container mx-auto px-4 py-8 space-y-12">
        {!currentDraft ? (
          <EmailUpload />
        ) : (
          <>
            <LineItemsTable />
            <CustomerInfo />
            <PdfGenerator />
          </>
        )}
      </div>
    </div>
  );
};

export default Index;