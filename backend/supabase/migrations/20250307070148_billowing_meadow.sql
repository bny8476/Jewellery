/*
  # Initial Schema Setup for Jewelry and Pawn Shop

  This migration creates the core schema for the jewelry and pawn shop application.
  Breaking down operations into smaller chunks to avoid timeout issues.

  1. Tables
    - profiles (user profiles linked to auth.users)
    - jewelry_items (inventory items)
    - pawn_requests (customer pawn requests)
  
  2. Security
    - RLS enabled on all tables
    - Appropriate policies for each table
*/

-- Step 1: Create base tables
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS jewelry_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric NOT NULL CHECK (price >= 0),
  category text NOT NULL,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pawn_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles ON DELETE CASCADE NOT NULL,
  item_description text NOT NULL,
  requested_amount numeric NOT NULL CHECK (requested_amount > 0),
  status text NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Step 2: Enable RLS
DO $$ 
BEGIN
  ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
  ALTER TABLE jewelry_items ENABLE ROW LEVEL SECURITY;
  ALTER TABLE pawn_requests ENABLE ROW LEVEL SECURITY;
END $$;

-- Step 3: Create policies for profiles
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
  CREATE POLICY "Users can read own profile"
    ON profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

  DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
  CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);
END $$;

-- Step 4: Create policies for jewelry items
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Anyone can view jewelry items" ON jewelry_items;
  CREATE POLICY "Anyone can view jewelry items"
    ON jewelry_items FOR SELECT
    TO public
    USING (true);
END $$;

-- Step 5: Create policies for pawn requests
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can create pawn requests" ON pawn_requests;
  CREATE POLICY "Users can create pawn requests"
    ON pawn_requests FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

  DROP POLICY IF EXISTS "Users can view own pawn requests" ON pawn_requests;
  CREATE POLICY "Users can view own pawn requests"
    ON pawn_requests FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
END $$;

-- Step 6: Create trigger function and trigger
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$ 
BEGIN
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
END $$;