-- Create helper function to get current org_id from JWT
CREATE OR REPLACE FUNCTION public.current_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'org_id')::uuid,
    (auth.jwt() -> 'user_metadata' ->> 'org_id')::uuid
  );
$$;

-- Drop existing policies for inbound_messages
DROP POLICY IF EXISTS "Users can view their own inbound messages" ON public.inbound_messages;
DROP POLICY IF EXISTS "Users can insert their own inbound messages" ON public.inbound_messages;
DROP POLICY IF EXISTS "Users can update their own inbound messages" ON public.inbound_messages;
DROP POLICY IF EXISTS "Users can delete their own inbound messages" ON public.inbound_messages;

-- Create new policies using the helper function
CREATE POLICY "Allow SELECT for same org" 
ON public.inbound_messages 
FOR SELECT 
USING (org_id = public.current_org_id());

CREATE POLICY "Allow INSERT for same org" 
ON public.inbound_messages 
FOR INSERT 
WITH CHECK (org_id = public.current_org_id());

CREATE POLICY "Allow UPDATE for same org" 
ON public.inbound_messages 
FOR UPDATE 
USING (org_id = public.current_org_id());

CREATE POLICY "Allow DELETE for same org" 
ON public.inbound_messages 
FOR DELETE 
USING (org_id = public.current_org_id());

-- Create a function to handle auth events and set custom claims
CREATE OR REPLACE FUNCTION public.handle_auth_user_login()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_org_id uuid;
BEGIN
  -- Get org_id from user metadata
  user_org_id := (NEW.raw_user_meta_data ->> 'org_id')::uuid;
  
  -- If org_id exists, we don't need to do anything here
  -- The JWT will already contain the user_metadata
  
  RETURN NEW;
END;
$$;

-- Create trigger for user login events
-- Note: This trigger runs on auth.users table but we can't modify auth schema directly
-- Instead, we'll rely on the JWT already containing user_metadata with org_id

-- Create a function to ensure org_id is in custom claims
CREATE OR REPLACE FUNCTION public.get_claims(uid uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COALESCE(
      (SELECT (raw_user_meta_data ->> 'org_id')::text FROM auth.users WHERE id = uid),
      NULL
    )::jsonb AS org_id;
$$;