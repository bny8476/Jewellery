-- Phase 2 Enhancements Migration Script

-- 1. Enhance App Users (Staff Management)
ALTER TABLE public.app_users 
ADD COLUMN IF NOT EXISTS designation text,
ADD COLUMN IF NOT EXISTS qualification text,
ADD COLUMN IF NOT EXISTS date_of_birth date,
ADD COLUMN IF NOT EXISTS gender text CHECK (gender IN ('male', 'female', 'other')),
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS id_proof_type text,
ADD COLUMN IF NOT EXISTS id_proof_number text,
ADD COLUMN IF NOT EXISTS bank_name text,
ADD COLUMN IF NOT EXISTS account_number text,
ADD COLUMN IF NOT EXISTS ifsc_code text,
ADD COLUMN IF NOT EXISTS photo_url text,
ADD COLUMN IF NOT EXISTS is_blocked boolean DEFAULT false;

-- 2. Enhance Customers (Nominee Details)
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS nominee_name text,
ADD COLUMN IF NOT EXISTS nominee_relation text,
ADD COLUMN IF NOT EXISTS nominee_contact text,
ADD COLUMN IF NOT EXISTS nominee_id_proof text;

-- 3. Enhance Pledge Items (Touch/Purity & DC)
-- Note: 'purity' already exists, we will treat it as the text field for "Touch" value or "22K" etc.
-- Adding specific columns if needed, but existing purity might suffice. 
-- Let's add 'purity_percentage' for calculation if needed, but 'purity' text is flexible.
-- Adding 'document_charges' to Pledges table (usually per pledge, or per item? Image suggests Pledge Invoice level, so Pledges table)

ALTER TABLE public.pledges
ADD COLUMN IF NOT EXISTS document_charges numeric DEFAULT 0 CHECK (document_charges >= 0);

-- If we need 'Touch' specific field separate from 'purity' text:
ALTER TABLE public.pledge_items
ADD COLUMN IF NOT EXISTS purity_test_value text; -- To store "Touch" value like 916, 750 etc explicitly if separate from 'purity'

-- 4. Bank Pledge Enhancements (if any missed)
-- (Bank Pledge table already exists, checking if we need more fields based on image 'In Bank pledge')
-- Image shows: Bank Name, Bill No, Pledge No, Date, Gross Wt, Amount, Interest%, Paid Interest, Paid DC.
-- Existing 'bank_pledges' has amount_received, bank_interest_rate.
-- We might need to track 'paid_processing_fee' or similar if 'Paid DC' refers to that.

ALTER TABLE public.bank_pledges
ADD COLUMN IF NOT EXISTS processing_fee numeric DEFAULT 0;
