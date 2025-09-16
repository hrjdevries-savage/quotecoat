import React, { useState, useEffect } from 'react';
import { Mail, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';

export const InboxPending = () => {
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const { orgId } = useApp();

  const fetchPendingCount = async () => {
    if (!orgId) {
      setIsLoading(false);
      return;
    }

    try {
      const { count, error } = await supabase
        .from('inbound_messages')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        .eq('org_id', orgId);

      if (error) {
        console.error('Error fetching pending count:', error);
      } else {
        setPendingCount(count || 0);
      }
    } catch (error) {
      console.error('Error fetching pending count:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingCount();

    // Set up real-time subscription for changes to inbound_messages
    const channel = supabase
      .channel('inbound_messages_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inbound_messages',
          filter: orgId ? `org_id=eq.${orgId}` : undefined,
        },
        () => {
          // Refetch count when any change happens to inbound_messages for this org
          fetchPendingCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orgId]);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-accent" />
          Inbox → Te Offreren
        </CardTitle>
        <CardDescription>
          Berichten die wachten op verwerking tot offerte
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col justify-between h-full">
        <div className="space-y-4">
          <div className="text-center">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span className="text-muted-foreground">Laden...</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-3xl font-bold text-foreground">
                    {pendingCount}
                  </span>
                  {pendingCount > 0 && (
                    <Badge variant="secondary" className="bg-accent/20 text-accent">
                      {pendingCount === 1 ? 'nieuw' : 'nieuwe'}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {pendingCount === 0 
                    ? 'Geen berichten in behandeling'
                    : pendingCount === 1
                    ? 'Bericht wacht op verwerking'
                    : 'Berichten wachten op verwerking'
                  }
                </p>
              </div>
            )}
          </div>

          {pendingCount > 0 && (
            <div className="text-center">
              <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                <p className="text-sm text-accent font-medium">
                  Er zijn nieuwe berichten die een offerte nodig hebben
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="pt-4">
          <Link to="/inbox" className="block">
            <Button 
              size="lg" 
              className="w-full" 
              variant={pendingCount > 0 ? "default" : "outline"}
            >
              <Mail className="h-4 w-4 mr-2" />
              Naar Inbox
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};