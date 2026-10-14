/*
  # Initial Schema Setup for Jewelry Pawn Shop

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key) - matches auth.users.id
      - `email` (text)
      - `full_name` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `jewelry_items`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `price` (numeric)
      - `category` (text)
      - `image_url` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `pawn_requests`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles.id)
      - `item_description` (text)
      - `requested_amount` (numeric)
      - `status` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text NOT NULL,
  full_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create jewelry items table
CREATE TABLE IF NOT EXISTS jewelry_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric NOT NULL,
  category text NOT NULL,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create pawn requests table
CREATE TABLE IF NOT EXISTS pawn_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) NOT NULL,
  item_description text NOT NULL,
  requested_amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jewelry_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pawn_requests ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Jewelry items policies
CREATE POLICY "Anyone can view jewelry items"
  ON jewelry_items
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Pawn requests policies
CREATE POLICY "Users can view their own pawn requests"
  ON pawn_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create pawn requests"
  ON pawn_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pawn requests"
  ON pawn_requests
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);