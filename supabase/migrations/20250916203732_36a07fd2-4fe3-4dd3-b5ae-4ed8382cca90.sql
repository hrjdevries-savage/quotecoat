-- Create inbound_messages table
CREATE TABLE public.inbound_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid NOT NULL,
  received_at timestamp with time zone NOT NULL DEFAULT now(),
  from_email text,
  from_name text,
  subject text,
  text_body text,
  html_body text,
  attachments jsonb DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  thread_id text,
  detected_company text,
  offer_id uuid,
  
  CONSTRAINT check_status CHECK (status IN ('pending', 'processing', 'quoted', 'ignored'))
);

-- Create indexes for performance
CREATE INDEX idx_inbound_messages_org_received ON public.inbound_messages (org_id, received_at DESC);
CREATE INDEX idx_inbound_messages_status ON public.inbound_messages (status);

-- Enable Row Level Security
ALTER TABLE public.inbound_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for multi-tenant access
CREATE POLICY "Users can view their own inbound messages" 
ON public.inbound_messages 
FOR SELECT 
USING (
  (org_id::text = (auth.jwt() ->> 'org_id') OR org_id = (auth.jwt() ->> 'org_id')::uuid)
);

CREATE POLICY "Users can insert their own inbound messages" 
ON public.inbound_messages 
FOR INSERT 
WITH CHECK (
  (org_id::text = (auth.jwt() ->> 'org_id') OR org_id = (auth.jwt() ->> 'org_id')::uuid)
);

CREATE POLICY "Users can update their own inbound messages" 
ON public.inbound_messages 
FOR UPDATE 
USING (
  (org_id::text = (auth.jwt() ->> 'org_id') OR org_id = (auth.jwt() ->> 'org_id')::uuid)
);

CREATE POLICY "Users can delete their own inbound messages" 
ON public.inbound_messages 
FOR DELETE 
USING (
  (org_id::text = (auth.jwt() ->> 'org_id') OR org_id = (auth.jwt() ->> 'org_id')::uuid)
);