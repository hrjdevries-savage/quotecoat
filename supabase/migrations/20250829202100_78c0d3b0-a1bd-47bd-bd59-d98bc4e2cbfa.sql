-- Add inbound email alias support to email_settings
ALTER TABLE public.email_settings 
ADD COLUMN IF NOT EXISTS inbound_token text;

-- Generate unique tokens for existing email settings
UPDATE public.email_settings 
SET inbound_token = encode(gen_random_bytes(16), 'hex')
WHERE inbound_token IS NULL;

-- Make inbound_token required for new records
ALTER TABLE public.email_settings 
ALTER COLUMN inbound_token SET NOT NULL;