import { useState } from 'react';
import { ensureLogin } from '@/auth/msalClient';
import { Button } from '@/components/ui/button';
import { MailPickerModal } from './MailPickerModal';
import { Mail } from 'lucide-react';

export function ConnectOutlookButton() {
  const [open, setOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      await ensureLogin();
      setOpen(true);
    } catch (error) {
      console.error('Failed to connect to Outlook:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <>
      <Button 
        variant="outline" 
        onClick={handleConnect}
        disabled={isConnecting}
        className="border-primary/20 hover:border-primary/40"
      >
        <Mail className="h-4 w-4 mr-2" />
        {isConnecting ? 'Verbinden...' : 'Connect Outlook'}
      </Button>
      <MailPickerModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}