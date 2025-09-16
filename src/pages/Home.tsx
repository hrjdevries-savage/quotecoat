import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Mail, 
  FileText, 
  Upload, 
  Settings, 
  BarChart3,
  Clock
} from 'lucide-react';

const Home = () => {
  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Hero Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent">
          Welkom bij Coat24
        </h1>
        <p className="text-muted-foreground text-lg">
          Beheer je coating offertes en projecten vanaf één plek
        </p>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Link to="/inbox">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Mail className="h-5 w-5 text-primary" />
                Inbox
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Bekijk nieuwe offerteaanvragen en berichten
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">3 nieuwe berichten</span>
                <Button size="sm" variant="ghost">Openen →</Button>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/quotes">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-accent" />
                Offertes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Bekijk en beheer al je offertes
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">12 actieve offertes</span>
                <Button size="sm" variant="ghost">Bekijken →</Button>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Upload className="h-5 w-5 text-success" />
              Nieuwe Offerte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Upload bestanden voor een nieuwe offerte
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Email of bestanden</span>
              <Button size="sm" variant="ghost">Starten →</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recente Activiteit
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <FileText className="h-4 w-4 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium">Offerte #2024-001</p>
                <p className="text-xs text-muted-foreground">Verzonden naar klant</p>
              </div>
              <span className="text-xs text-muted-foreground">2u geleden</span>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <Mail className="h-4 w-4 text-accent" />
              <div className="flex-1">
                <p className="text-sm font-medium">Nieuwe email ontvangen</p>
                <p className="text-xs text-muted-foreground">Van: john@bedrijf.nl</p>
              </div>
              <span className="text-xs text-muted-foreground">4u geleden</span>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <Upload className="h-4 w-4 text-success" />
              <div className="flex-1">
                <p className="text-sm font-medium">STEP bestand verwerkt</p>
                <p className="text-xs text-muted-foreground">project_bracket.step</p>
              </div>
              <span className="text-xs text-muted-foreground">1d geleden</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Overzicht
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 rounded-lg bg-primary/10">
                <div className="text-2xl font-bold text-primary">24</div>
                <div className="text-xs text-muted-foreground">Offertes deze maand</div>
              </div>
              
              <div className="text-center p-4 rounded-lg bg-accent/10">
                <div className="text-2xl font-bold text-accent">€45.2k</div>
                <div className="text-xs text-muted-foreground">Totale waarde</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 rounded-lg bg-success/10">
                <div className="text-2xl font-bold text-success">18</div>
                <div className="text-xs text-muted-foreground">Goedgekeurd</div>
              </div>
              
              <div className="text-center p-4 rounded-lg bg-warning/10">
                <div className="text-2xl font-bold text-warning">6</div>
                <div className="text-xs text-muted-foreground">In behandeling</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Home;