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

-- Add owner_id to existing quotes table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'owner_id') THEN
    ALTER TABLE public.quotes ADD COLUMN owner_id uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Add original_attachment_id to quote_line_items
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quote_line_items' AND column_name = 'original_attachment_id') THEN
    ALTER TABLE public.quote_line_items ADD COLUMN original_attachment_id text;
  END IF;
END $$;

-- Add unique constraint for upsert capability on quote_attachments
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'quote_attachments_quote_id_original_attachment_id_key') THEN
    ALTER TABLE public.quote_attachments ADD CONSTRAINT quote_attachments_quote_id_original_attachment_id_key UNIQUE (quote_id, original_attachment_id);
  END IF;
END $$;