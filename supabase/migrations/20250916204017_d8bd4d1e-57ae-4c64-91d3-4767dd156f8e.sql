-- Update all existing RLS policies to use the current_org_id() helper function for consistency

-- Update quotes policies
DROP POLICY IF EXISTS "Users can manage their own quotes" ON public.quotes;
CREATE POLICY "Allow quotes access for same org" 
ON public.quotes 
FOR ALL 
USING (owner_id = auth.uid() AND org_id = public.current_org_id())
WITH CHECK (owner_id = auth.uid() AND org_id = public.current_org_id());

-- Update email_settings policies  
DROP POLICY IF EXISTS "Users can manage their own email settings" ON public.email_settings;
CREATE POLICY "Allow email_settings access for same org" 
ON public.email_settings 
FOR ALL 
USING (owner_id = auth.uid() AND org_id = public.current_org_id());

-- Update work_instructions policies
DROP POLICY IF EXISTS "Users can manage their own work instructions" ON public.work_instructions;
CREATE POLICY "Allow work_instructions access for same org" 
ON public.work_instructions 
FOR ALL 
USING (owner_id = auth.uid() AND org_id = public.current_org_id())
WITH CHECK (owner_id = auth.uid() AND org_id = public.current_org_id());

-- Update email_messages policies
DROP POLICY IF EXISTS "Users can manage their own email messages" ON public.email_messages;
CREATE POLICY "Allow email_messages access for same org" 
ON public.email_messages 
FOR ALL 
USING (owner_id = auth.uid() AND org_id = public.current_org_id());

-- Update company_settings policies
DROP POLICY IF EXISTS "Users can manage their own company settings" ON public.company_settings;
CREATE POLICY "Allow company_settings access for same org" 
ON public.company_settings 
FOR ALL 
USING (org_id = public.current_org_id())
WITH CHECK (org_id = public.current_org_id());

-- Update excel_pricing_config policies
DROP POLICY IF EXISTS "Users can view their own excel pricing config" ON public.excel_pricing_config;
DROP POLICY IF EXISTS "Users can create their own excel pricing config" ON public.excel_pricing_config;
DROP POLICY IF EXISTS "Users can update their own excel pricing config" ON public.excel_pricing_config;
DROP POLICY IF EXISTS "Users can delete their own excel pricing config" ON public.excel_pricing_config;

CREATE POLICY "Allow excel_pricing_config SELECT for same org" 
ON public.excel_pricing_config 
FOR SELECT 
USING (owner_id = auth.uid() AND org_id = public.current_org_id());

CREATE POLICY "Allow excel_pricing_config INSERT for same org" 
ON public.excel_pricing_config 
FOR INSERT 
WITH CHECK (owner_id = auth.uid() AND org_id = public.current_org_id());

CREATE POLICY "Allow excel_pricing_config UPDATE for same org" 
ON public.excel_pricing_config 
FOR UPDATE 
USING (owner_id = auth.uid() AND org_id = public.current_org_id());

CREATE POLICY "Allow excel_pricing_config DELETE for same org" 
ON public.excel_pricing_config 
FOR DELETE 
USING (owner_id = auth.uid() AND org_id = public.current_org_id());

-- Update organizations policy to use current_org_id()
DROP POLICY IF EXISTS "Users can view their own organization" ON public.organizations;
CREATE POLICY "Allow organizations SELECT for same org" 
ON public.organizations 
FOR SELECT 
USING (id = public.current_org_id());