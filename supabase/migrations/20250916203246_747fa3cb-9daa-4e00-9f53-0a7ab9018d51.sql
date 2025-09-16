-- Add org_id column to all relevant tables for multi-tenancy
-- First, add org_id columns to all tables that need organization-level filtering

ALTER TABLE public.quotes ADD COLUMN org_id uuid NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE public.email_settings ADD COLUMN org_id uuid NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE public.work_instructions ADD COLUMN org_id uuid NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE public.email_messages ADD COLUMN org_id uuid NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE public.company_settings ADD COLUMN org_id uuid NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE public.excel_pricing_config ADD COLUMN org_id uuid NOT NULL DEFAULT gen_random_uuid();

-- Create organizations table for future expansion
CREATE TABLE public.organizations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on organizations table
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for organizations
CREATE POLICY "Users can view their own organization" 
ON public.organizations 
FOR SELECT 
USING (
  id::text = (auth.jwt() ->> 'org_id') OR
  id = (auth.jwt() ->> 'org_id')::uuid
);

-- Update existing RLS policies to include org_id filtering
-- Update quotes RLS policy
DROP POLICY IF EXISTS "Users can manage their own quotes" ON public.quotes;
CREATE POLICY "Users can manage their own quotes" 
ON public.quotes 
FOR ALL 
USING (
  owner_id = auth.uid() AND 
  (org_id::text = (auth.jwt() ->> 'org_id') OR org_id = (auth.jwt() ->> 'org_id')::uuid)
)
WITH CHECK (
  owner_id = auth.uid() AND 
  (org_id::text = (auth.jwt() ->> 'org_id') OR org_id = (auth.jwt() ->> 'org_id')::uuid)
);

-- Update email_settings RLS policy
DROP POLICY IF EXISTS "Users can manage their own email settings" ON public.email_settings;
CREATE POLICY "Users can manage their own email settings" 
ON public.email_settings 
FOR ALL 
USING (
  owner_id = auth.uid() AND 
  (org_id::text = (auth.jwt() ->> 'org_id') OR org_id = (auth.jwt() ->> 'org_id')::uuid)
);

-- Update work_instructions RLS policy
DROP POLICY IF EXISTS "Allow all operations on work_instructions for testing" ON public.work_instructions;
CREATE POLICY "Users can manage their own work instructions" 
ON public.work_instructions 
FOR ALL 
USING (
  owner_id = auth.uid() AND 
  (org_id::text = (auth.jwt() ->> 'org_id') OR org_id = (auth.jwt() ->> 'org_id')::uuid)
)
WITH CHECK (
  owner_id = auth.uid() AND 
  (org_id::text = (auth.jwt() ->> 'org_id') OR org_id = (auth.jwt() ->> 'org_id')::uuid)
);

-- Update email_messages RLS policy
DROP POLICY IF EXISTS "Users can view their own email messages" ON public.email_messages;
CREATE POLICY "Users can manage their own email messages" 
ON public.email_messages 
FOR ALL 
USING (
  owner_id = auth.uid() AND 
  (org_id::text = (auth.jwt() ->> 'org_id') OR org_id = (auth.jwt() ->> 'org_id')::uuid)
);

-- Update company_settings RLS policy
DROP POLICY IF EXISTS "Allow all operations on company_settings" ON public.company_settings;
CREATE POLICY "Users can manage their own company settings" 
ON public.company_settings 
FOR ALL 
USING (
  (org_id::text = (auth.jwt() ->> 'org_id') OR org_id = (auth.jwt() ->> 'org_id')::uuid)
)
WITH CHECK (
  (org_id::text = (auth.jwt() ->> 'org_id') OR org_id = (auth.jwt() ->> 'org_id')::uuid)
);

-- Update excel_pricing_config RLS policies
DROP POLICY IF EXISTS "Users can view their own excel pricing config" ON public.excel_pricing_config;
DROP POLICY IF EXISTS "Users can create their own excel pricing config" ON public.excel_pricing_config;
DROP POLICY IF EXISTS "Users can update their own excel pricing config" ON public.excel_pricing_config;
DROP POLICY IF EXISTS "Users can delete their own excel pricing config" ON public.excel_pricing_config;

CREATE POLICY "Users can view their own excel pricing config" 
ON public.excel_pricing_config 
FOR SELECT 
USING (
  owner_id = auth.uid() AND 
  (org_id::text = (auth.jwt() ->> 'org_id') OR org_id = (auth.jwt() ->> 'org_id')::uuid)
);

CREATE POLICY "Users can create their own excel pricing config" 
ON public.excel_pricing_config 
FOR INSERT 
WITH CHECK (
  owner_id = auth.uid() AND 
  (org_id::text = (auth.jwt() ->> 'org_id') OR org_id = (auth.jwt() ->> 'org_id')::uuid)
);

CREATE POLICY "Users can update their own excel pricing config" 
ON public.excel_pricing_config 
FOR UPDATE 
USING (
  owner_id = auth.uid() AND 
  (org_id::text = (auth.jwt() ->> 'org_id') OR org_id = (auth.jwt() ->> 'org_id')::uuid)
);

CREATE POLICY "Users can delete their own excel pricing config" 
ON public.excel_pricing_config 
FOR DELETE 
USING (
  owner_id = auth.uid() AND 
  (org_id::text = (auth.jwt() ->> 'org_id') OR org_id = (auth.jwt() ->> 'org_id')::uuid)
);

-- Create trigger for organizations updated_at
CREATE TRIGGER update_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();