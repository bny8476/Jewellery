-- Add the missing document_charges column to pledges
ALTER TABLE public.pledges
ADD COLUMN IF NOT EXISTS document_charges numeric DEFAULT 0;
