import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Download, 
  Edit, 
  Send,
  Eye,
  Calendar,
  User,
  Euro,
  FileText,
  CheckCircle
} from 'lucide-react';

// Mock data - in real app this would come from your backend  
const mockQuoteDetails = {
  '1': {
    id: '1',
    quoteNumber: 'WV-2024-001',
    customerName: 'TechCorp B.V.',
    customerEmail: 'john.doe@techcorp.nl', 
    status: 'sent',
    createdDate: '15 januari 2024',
    sentDate: '16 januari 2024',
    validUntil: '15 februari 2024',
    totalAmount: 15750,
    description: 'Coating project - Aluminum parts anodizing and powder coating',
    lineItems: [
      {
        description: 'Anodizing treatment - 200 small parts (50x50x10mm)',
        quantity: 200,
        unitPrice: 12.50,
        total: 2500
      },
      {
        description: 'Anodizing treatment - 150 medium parts (100x75x15mm)', 
        quantity: 150,
        unitPrice: 18.75,
        total: 2812.50
      },
      {
        description: 'Anodizing treatment - 150 large parts (200x150x25mm)',
        quantity: 150,
        unitPrice: 32.50,
        total: 4875
      },
      {
        description: 'Powder coating RAL 7016 - All parts',
        quantity: 500,
        unitPrice: 8.50,
        total: 4250
      },
      {
        description: 'Quality inspection and packaging',
        quantity: 1,
        unitPrice: 312.50,
        total: 312.50
      }
    ]
  }
};

const QuoteDetail = () => {
  const { id } = useParams();
  const quote = mockQuoteDetails[id as keyof typeof mockQuoteDetails];

  if (!quote) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Offerte niet gevonden</h2>
          <p className="text-muted-foreground mb-4">
            De offerte die u zoekt bestaat niet of is verwijderd.
          </p>
          <Link to="/quotes">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Terug naar Offertes
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline">Concept</Badge>;
      case 'sent':
        return <Badge variant="secondary">Verzonden</Badge>;
      case 'accepted':
        return <Badge variant="default" className="bg-success text-success-foreground">Geaccepteerd</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Afgewezen</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link to="/quotes">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Terug naar Offertes
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Bewerken
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            PDF Downloaden
          </Button>
          <Button size="sm">
            <Send className="h-4 w-4 mr-2" />
            Verzenden
          </Button>
        </div>
      </div>

      {/* Quote Header Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl mb-2">
                Offerte #{quote.quoteNumber}
              </CardTitle>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>{quote.customerName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Geldig tot: {quote.validUntil}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              {getStatusBadge(quote.status)}
              <div className="mt-2 text-2xl font-bold text-primary">
                €{quote.totalAmount.toLocaleString('nl-NL')}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Quote Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Klantgegevens
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Bedrijf:</span>
              <div>{quote.customerName}</div>
            </div>
            <div>
              <span className="font-medium">Email:</span>
              <div>{quote.customerEmail}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Datums
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Aangemaakt:</span>
              <div>{quote.createdDate}</div>
            </div>
            {quote.sentDate && (
              <div>
                <span className="font-medium">Verzonden:</span>
                <div>{quote.sentDate}</div>
              </div>
            )}
            <div>
              <span className="font-medium">Geldig tot:</span>
              <div>{quote.validUntil}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Euro className="h-5 w-5" />
              Totaal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              €{quote.totalAmount.toLocaleString('nl-NL')}
            </div>
            <div className="text-sm text-muted-foreground">
              Excl. BTW
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Offerte Regels
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {quote.lineItems.map((item, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">{item.description}</h4>
                    <div className="text-sm text-muted-foreground">
                      Aantal: {item.quantity} × €{item.unitPrice.toLocaleString('nl-NL')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      €{item.total.toLocaleString('nl-NL')}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <Separator />
            
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Totaal (excl. BTW)</span>
              <span>€{quote.totalAmount.toLocaleString('nl-NL')}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuoteDetail;