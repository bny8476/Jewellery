-- 1. Add missing nominee columns to the customers table
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS nominee_name text,
ADD COLUMN IF NOT EXISTS nominee_relation text,
ADD COLUMN IF NOT EXISTS nominee_contact text,
ADD COLUMN IF NOT EXISTS nominee_id_proof text;

-- 2. Create the "documents" storage bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', true) 
ON CONFLICT (id) DO NOTHING;

-- 3. Set up storage policies to allow file uploads (development mode)
-- (Drop existing to avoid errors if run multiple times)
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Insert Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Update Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete Access" ON storage.objects;

CREATE POLICY "Public Read Access" 
ON storage.objects FOR SELECT 
TO public USING ( bucket_id = 'documents' );

CREATE POLICY "Public Insert Access" 
ON storage.objects FOR INSERT 
TO public WITH CHECK ( bucket_id = 'documents' );

CREATE POLICY "Public Update Access" 
ON storage.objects FOR UPDATE 
TO public USING ( bucket_id = 'documents' );

CREATE POLICY "Public Delete Access" 
ON storage.objects FOR DELETE 
TO public USING ( bucket_id = 'documents' );
