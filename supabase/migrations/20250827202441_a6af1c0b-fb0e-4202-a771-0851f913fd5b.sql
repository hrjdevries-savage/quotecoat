-- Add unique constraint for upsert functionality
ALTER TABLE quote_attachments 
ADD CONSTRAINT unique_quote_attachment 
UNIQUE (quote_id, original_attachment_id);