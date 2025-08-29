-- Create excel_pricing_config table for persistent Excel template configuration
CREATE TABLE public.excel_pricing_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  selected_sheet TEXT NOT NULL,
  length_cell TEXT NOT NULL,
  width_cell TEXT NOT NULL,
  height_cell TEXT NOT NULL,
  weight_cell TEXT NOT NULL,
  price_cell TEXT NOT NULL,
  workbook_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.excel_pricing_config ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own excel pricing config" 
ON public.excel_pricing_config 
FOR SELECT 
USING (auth.uid() = owner_id);

CREATE POLICY "Users can create their own excel pricing config" 
ON public.excel_pricing_config 
FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own excel pricing config" 
ON public.excel_pricing_config 
FOR UPDATE 
USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own excel pricing config" 
ON public.excel_pricing_config 
FOR DELETE 
USING (auth.uid() = owner_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_excel_pricing_config_updated_at
BEFORE UPDATE ON public.excel_pricing_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for pricing templates
INSERT INTO storage.buckets (id, name, public) VALUES ('pricing-templates', 'pricing-templates', false);

-- Create storage policies for pricing templates
CREATE POLICY "Users can view their own pricing templates" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'pricing-templates' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own pricing templates" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'pricing-templates' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own pricing templates" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'pricing-templates' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own pricing templates" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'pricing-templates' AND auth.uid()::text = (storage.foldername(name))[1]);