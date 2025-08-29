-- Fix RLS policies to be strictly owner-based instead of public access
-- First drop existing overly permissive policies
DROP POLICY IF EXISTS "Allow all access to quotes" ON public.quotes;
DROP POLICY IF EXISTS "Allow all access to quote_line_items" ON public.quote_line_items;
DROP POLICY IF EXISTS "Allow all access to quote_attachments" ON public.quote_attachments;

-- Create proper owner-only policies for quotes
CREATE POLICY "Users can manage their own quotes" 
ON public.quotes 
FOR ALL 
TO authenticated 
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Create proper owner-only policies for quote_line_items
-- Link through quotes table to verify ownership
CREATE POLICY "Users can manage their own quote line items" 
ON public.quote_line_items 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.quotes 
    WHERE quotes.id = quote_line_items.quote_id 
    AND quotes.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.quotes 
    WHERE quotes.id = quote_line_items.quote_id 
    AND quotes.owner_id = auth.uid()
  )
);

-- Create proper owner-only policies for quote_attachments
-- Link through quotes table to verify ownership
CREATE POLICY "Users can manage their own quote attachments" 
ON public.quote_attachments 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.quotes 
    WHERE quotes.id = quote_attachments.quote_id 
    AND quotes.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.quotes 
    WHERE quotes.id = quote_attachments.quote_id 
    AND quotes.owner_id = auth.uid()
  )
);

-- Ensure all quotes have an owner_id (migrate existing data)
-- Set owner_id to a default if null (assuming first user for demo)
UPDATE public.quotes 
SET owner_id = (SELECT id FROM auth.users LIMIT 1)
WHERE owner_id IS NULL;

-- Make owner_id required going forward
ALTER TABLE public.quotes 
ALTER COLUMN owner_id SET NOT NULL;

-- Update storage policies for private access
-- Drop any existing public policies
DROP POLICY IF EXISTS "Anyone can view quote attachments" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload quote attachments" ON storage.objects;

-- Create private policies for quote-attachments bucket
CREATE POLICY "Users can manage their own quote attachment files" 
ON storage.objects 
FOR ALL 
TO authenticated 
USING (
  bucket_id = 'quote-attachments' 
  AND EXISTS (
    SELECT 1 FROM public.quote_attachments qa
    JOIN public.quotes q ON qa.quote_id = q.id
    WHERE qa.file_path = objects.name 
    AND q.owner_id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'quote-attachments' 
  AND EXISTS (
    SELECT 1 FROM public.quote_attachments qa
    JOIN public.quotes q ON qa.quote_id = q.id
    WHERE qa.file_path = objects.name 
    AND q.owner_id = auth.uid()
  )
);

-- Create private policies for quote-pdfs bucket  
CREATE POLICY "Users can manage their own quote PDF files" 
ON storage.objects 
FOR ALL 
TO authenticated 
USING (
  bucket_id = 'quote-pdfs'
  AND EXISTS (
    SELECT 1 FROM public.quotes q
    WHERE q.pdf_file_path = objects.name 
    AND q.owner_id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'quote-pdfs'
  AND EXISTS (
    SELECT 1 FROM public.quotes q
    WHERE q.pdf_file_path = objects.name 
    AND q.owner_id = auth.uid()
  )
);