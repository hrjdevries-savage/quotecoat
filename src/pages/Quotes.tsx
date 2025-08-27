import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Download, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SavedQuote {
  id: string;
  quote_number: string;
  client_name: string;
  client_email?: string;
  total_price: number;
  status: string;
  created_at: string;
  updated_at: string;
  pdf_file_path?: string;
}

export function Quotes() {
  const [quotes, setQuotes] = useState<SavedQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadQuotes();
  }, []);

  const loadQuotes = async () => {
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading quotes:', error);
        toast({
          title: "Fout",
          description: "Kon offertes niet laden",
          variant: "destructive",
        });
        return;
      }

      setQuotes(data || []);
    } catch (error) {
      console.error('Error loading quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = async (quote: SavedQuote) => {
    if (!quote.pdf_file_path) {
      toast({
        title: "Geen PDF",
        description: "Er is geen PDF beschikbaar voor deze offerte",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from('quote-pdfs')
        .download(quote.pdf_file_path);

      if (error) {
        console.error('Error downloading PDF:', error);
        toast({
          title: "Fout",
          description: "Kon PDF niet downloaden",
          variant: "destructive",
        });
        return;
      }

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Offerte_${quote.quote_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: "Fout",
        description: "Kon PDF niet downloaden",
        variant: "destructive",
      });
    }
  };

  const deleteQuote = async (quoteId: string) => {
    if (!confirm('Weet u zeker dat u deze offerte wilt verwijderen?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('quotes')
        .delete()
        .eq('id', quoteId);

      if (error) {
        console.error('Error deleting quote:', error);
        toast({
          title: "Fout",
          description: "Kon offerte niet verwijderen",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Succes",
        description: "Offerte verwijderd",
      });

      loadQuotes(); // Reload the list
    } catch (error) {
      console.error('Error deleting quote:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'secondary';
      case 'sent':
        return 'default';
      case 'accepted':
        return 'default';
      case 'rejected':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Concept';
      case 'sent':
        return 'Verzonden';
      case 'accepted':
        return 'Geaccepteerd';
      case 'rejected':
        return 'Geweigerd';
      default:
        return status;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL');
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center">Laden...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Offertes</h1>
        <Button onClick={() => navigate('/')}>
          Nieuwe Offerte
        </Button>
      </div>

      {quotes.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Geen offertes gevonden</p>
            <Button onClick={() => navigate('/')} className="mt-4">
              Maak uw eerste offerte
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {quotes.map((quote) => (
            <Card key={quote.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      Offerte {quote.quote_number}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {quote.client_name}
                    </p>
                  </div>
                  <Badge variant={getStatusColor(quote.status)}>
                    {getStatusText(quote.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Bedrag</p>
                    <p className="font-semibold">{formatPrice(quote.total_price)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Aangemaakt</p>
                    <p className="font-semibold">{formatDate(quote.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Laatst gewijzigd</p>
                    <p className="font-semibold">{formatDate(quote.updated_at)}</p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // TODO: Implement view quote functionality
                      toast({
                        title: "Binnenkort beschikbaar",
                        description: "Bekijken functionaliteit wordt binnenkort toegevoegd",
                      });
                    }}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Bekijken
                  </Button>
                  
                  {quote.pdf_file_path && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadPdf(quote)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      PDF
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // TODO: Implement edit quote functionality
                      toast({
                        title: "Binnenkort beschikbaar",
                        description: "Bewerken functionaliteit wordt binnenkort toegevoegd",
                      });
                    }}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Bewerken
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteQuote(quote.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Verwijderen
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}