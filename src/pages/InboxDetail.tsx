import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Reply, 
  Forward, 
  Archive, 
  Trash2,
  Download,
  User,
  Calendar,
  Paperclip
} from 'lucide-react';

// Mock data - in real app this would come from your backend
const mockEmailDetails = {
  '1': {
    id: '1',
    from: 'john.doe@techcorp.nl',
    to: 'coating@coat24.nl',
    subject: 'Offerte aanvraag - Coating project 2024',
    date: '15 januari 2024, 14:30',
    content: `Geachte Coat24 team,

Wij zijn TechCorp en zijn op zoek naar een offerte voor coating van onze nieuwe product serie. Het betreft circa 500 onderdelen die een hoogwaardige coating nodig hebben.

Details van het project:
- Materiaal: Aluminum 6061
- Afmetingen: Variërend van 50x50x10mm tot 200x150x25mm  
- Coating type: Anodiseren + powder coating
- Kleur: RAL 7016 (Antraciet grijs)
- Hoeveelheid: 500 stuks
- Leverdatum gewenst: Eind maart 2024

In de bijlage vindt u de STEP bestanden van alle onderdelen. Kunt u ons een gedetailleerde offerte sturen inclusief lead times?

Met vriendelijke groet,
John Doe
Project Manager
TechCorp B.V.
+31 20 123 4567
john.doe@techcorp.nl`,
    attachments: [
      { name: 'project_parts.step', size: '2.4 MB' },
      { name: 'specifications.pdf', size: '890 KB' },
      { name: 'technical_drawing.dwg', size: '1.2 MB' }
    ],
    isRead: false,
    priority: 'high'
  }
};

const InboxDetail = () => {
  const { id } = useParams();
  const email = mockEmailDetails[id as keyof typeof mockEmailDetails];

  if (!email) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Bericht niet gevonden</h2>
          <p className="text-muted-foreground mb-4">
            Het bericht dat u zoekt bestaat niet of is verwijderd.
          </p>
          <Link to="/inbox">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Terug naar Inbox
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'normal': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link to="/inbox">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Terug naar Inbox
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Reply className="h-4 w-4 mr-2" />
            Beantwoorden
          </Button>
          <Button variant="outline" size="sm">
            <Forward className="h-4 w-4 mr-2" />
            Doorsturen
          </Button>
          <Button variant="outline" size="sm">
            <Archive className="h-4 w-4 mr-2" />
            Archiveren
          </Button>
          <Button variant="outline" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Verwijderen
          </Button>
        </div>
      </div>

      {/* Email Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-xl mb-2">{email.subject}</CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>{email.from}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{email.date}</span>
                </div>
              </div>
            </div>
            
            <Badge variant={getPriorityColor(email.priority)} className="text-xs">
              {email.priority === 'high' ? 'Hoog' : 
               email.priority === 'normal' ? 'Normaal' : 'Laag'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Email Content */}
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-line text-sm leading-relaxed">
              {email.content}
            </div>
          </div>

          {/* Attachments */}
          {email.attachments && email.attachments.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  Bijlagen ({email.attachments.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {email.attachments.map((attachment, index) => (
                    <div 
                      key={index}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer group"
                    >
                      <Paperclip className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {attachment.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {attachment.size}
                        </p>
                      </div>
                      <Download className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Quick Actions */}
          <Separator />
          <div className="flex items-center gap-4">
            <Button>
              <Reply className="h-4 w-4 mr-2" />
              Offerte Maken
            </Button>
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Afspraak Plannen
            </Button>
            <Button variant="outline">
              <Archive className="h-4 w-4 mr-2" />
              Archiveren
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InboxDetail;