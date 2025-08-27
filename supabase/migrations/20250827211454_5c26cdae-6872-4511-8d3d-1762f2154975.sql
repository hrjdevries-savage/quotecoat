-- Email settings per gebruiker/workspace
CREATE TABLE public.email_settings (
  owner_id uuid PRIMARY KEY,
  inbound_alias text UNIQUE NOT NULL,
  bcc_enabled boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Log van ontvangen emails
CREATE TABLE public.email_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  from_email text,
  subject text,
  received_at timestamp with time zone DEFAULT now(),
  raw_provider_id text
);

-- Bijlagen van ontvangen emails
CREATE TABLE public.email_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES public.email_messages(id) ON DELETE CASCADE,
  file_name text,
  mime_type text,
  size_bytes bigint,
  storage_path text NOT NULL
);

-- Enable RLS on all new tables
ALTER TABLE public.email_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_attachments ENABLE ROW LEVEL SECURITY;

-- RLS policies (assuming owner_id = auth.uid())
CREATE POLICY "Users can manage their own email settings" 
ON public.email_settings 
FOR ALL 
USING (owner_id = auth.uid());

CREATE POLICY "Users can view their own email messages" 
ON public.email_messages 
FOR ALL 
USING (owner_id = auth.uid());

CREATE POLICY "Users can view their own email attachments" 
ON public.email_attachments 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.email_messages 
    WHERE id = email_attachments.message_id 
    AND owner_id = auth.uid()
  )
);

-- Add owner_id to existing quotes table if not exists
ALTER TABLE public.quotes 
ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id);

-- Update existing quotes to have owner_id (temporary fallback)
UPDATE public.quotes 
SET owner_id = auth.uid() 
WHERE owner_id IS NULL;

-- Make owner_id required for new quotes
ALTER TABLE public.quotes 
ALTER COLUMN owner_id SET NOT NULL;

-- Add RLS policy for quotes with owner_id
DROP POLICY IF EXISTS "Allow all access to quotes" ON public.quotes;
CREATE POLICY "Users can manage their own quotes" 
ON public.quotes 
FOR ALL 
USING (owner_id = auth.uid());

-- Update existing line items and attachments tables for better relationships
ALTER TABLE public.quote_line_items 
ADD COLUMN IF NOT EXISTS original_attachment_id text;

-- Add unique constraint for upsert capability
ALTER TABLE public.quote_attachments 
ADD CONSTRAINT IF NOT EXISTS quote_attachments_quote_id_original_attachment_id_key 
UNIQUE (quote_id, original_attachment_id);