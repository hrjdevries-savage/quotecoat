import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  MailOpen, 
  Paperclip, 
  Clock, 
  User,
  Search,
  Filter
} from 'lucide-react';
import { Input } from '@/components/ui/input';

// Mock data for demonstration
const mockEmails = [
  {
    id: '1',
    from: 'john.doe@techcorp.nl',
    subject: 'Offerte aanvraag - Coating project 2024',
    preview: 'Hallo, wij zijn op zoek naar een offerte voor coating van onze nieuwe producten...',
    date: '2 uur geleden',
    isRead: false,
    hasAttachment: true,
    priority: 'high'
  },
  {
    id: '2',
    from: 'maria.jensen@manufacturing.com',
    subject: 'Re: STEP bestand analyse',
    preview: 'Bedankt voor de snelle analyse. Kunnen we de coating specificaties bespreken?',
    date: '4 uur geleden',
    isRead: false,
    hasAttachment: false,
    priority: 'normal'
  },
  {
    id: '3',
    from: 'peter@metalworks.nl',
    subject: 'Nieuwe project files beschikbaar',
    preview: 'Ik heb de nieuwe CAD bestanden klaar voor de coating analyse...',
    date: '1 dag geleden',
    isRead: true,
    hasAttachment: true,
    priority: 'normal'
  },
  {
    id: '4',
    from: 'support@supplier.com',
    subject: 'Prijsupdate Q1 2024',
    preview: 'Geachte partner, hierbij ontvangt u de nieuwe prijslijst voor Q1 2024...',
    date: '2 dagen geleden',
    isRead: true,
    hasAttachment: true,
    priority: 'low'
  }
];

const Inbox = () => {
  const unreadCount = mockEmails.filter(email => !email.isRead).length;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'normal': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Inbox</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} ongelezen berichten` : 'Alle berichten gelezen'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Zoek in berichten..."
            className="pl-10"
          />
        </div>
      </div>

      {/* Email List */}
      <div className="space-y-3">
        {mockEmails.map((email) => (
          <Link key={email.id} to={`/inbox/${email.id}`}>
            <Card className={`cursor-pointer transition-all hover:shadow-md ${
              !email.isRead ? 'border-primary/50 bg-primary/5' : ''
            }`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Status Icon */}
                  <div className="flex-shrink-0 pt-1">
                    {email.isRead ? (
                      <MailOpen className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Mail className="h-4 w-4 text-primary" />
                    )}
                  </div>

                  {/* Email Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className={`text-sm truncate ${
                          !email.isRead ? 'font-medium' : 'text-muted-foreground'
                        }`}>
                          {email.from}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant={getPriorityColor(email.priority)} className="text-xs">
                          {email.priority === 'high' ? 'Hoog' : 
                           email.priority === 'normal' ? 'Normaal' : 'Laag'}
                        </Badge>
                        {email.hasAttachment && (
                          <Paperclip className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    <h3 className={`text-base mb-1 ${
                      !email.isRead ? 'font-semibold' : 'font-medium'
                    }`}>
                      {email.subject}
                    </h3>
                    
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {email.preview}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{email.date}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Empty State */}
      {mockEmails.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Geen berichten</h3>
            <p className="text-muted-foreground">
              Je inbox is leeg. Nieuwe berichten verschijnen hier automatisch.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Inbox;