-- Create quotes table for storing quote data
CREATE TABLE public.quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_number TEXT NOT NULL UNIQUE,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_address TEXT,
  client_city TEXT,
  client_postal_code TEXT,
  client_reference TEXT,
  validity_days INTEGER NOT NULL DEFAULT 30,
  terms TEXT,
  total_price DECIMAL(10,2),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  pdf_file_path TEXT
);

-- Create quote_line_items table
CREATE TABLE public.quote_line_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  attachment_id TEXT,
  file_name TEXT,
  description TEXT NOT NULL,
  drawing_number TEXT,
  behandeling TEXT,
  lengte DECIMAL(10,2),
  breedte DECIMAL(10,2),
  hoogte DECIMAL(10,2),
  gewicht_kg DECIMAL(10,2),
  price DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quote_attachments table
CREATE TABLE public.quote_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  original_attachment_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_attachments ENABLE ROW LEVEL SECURITY;

-- Create policies (for now allowing all access - add auth later)
CREATE POLICY "Allow all access to quotes" ON public.quotes FOR ALL USING (true);
CREATE POLICY "Allow all access to quote_line_items" ON public.quote_line_items FOR ALL USING (true);
CREATE POLICY "Allow all access to quote_attachments" ON public.quote_attachments FOR ALL USING (true);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('quote-pdfs', 'quote-pdfs', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('quote-attachments', 'quote-attachments', false);

-- Create storage policies
CREATE POLICY "Allow all access to quote-pdfs" ON storage.objects FOR ALL USING (bucket_id = 'quote-pdfs');
CREATE POLICY "Allow all access to quote-attachments" ON storage.objects FOR ALL USING (bucket_id = 'quote-attachments');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();