-- Phase 3 Schema Changes

-- Add photo_url to customers table for storing customer/proof image
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'customers'
        AND column_name = 'photo_url'
    ) THEN
        ALTER TABLE customers ADD COLUMN photo_url TEXT;
    END IF;
END $$;
