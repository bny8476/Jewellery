-- 1. Create missing tables
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.jewelry_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric NOT NULL CHECK (price >= 0),
  category text NOT NULL,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pawn_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  item_description text NOT NULL,
  requested_amount numeric NOT NULL CHECK (requested_amount > 0),
  status text NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Handle new user profile creation triggers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Seed jewelry items
INSERT INTO public.jewelry_items (name, description, price, category, image_url) VALUES 
('Diamond Engagement Ring', 'Stunning 1.5 carat diamond ring set in 18k white gold', 8500.00, 'rings', 'https://images.unsplash.com/photo-1596944924619-5e4835177b6c?auto=format&fit=crop&w=400&q=80'),
('Gold Tennis Bracelet', 'Elegant 14k gold bracelet with perfect round diamonds', 4200.00, 'bracelets', 'https://images.unsplash.com/photo-1608701195398-4adbb5a0c6c2?auto=format&fit=crop&w=400&q=80'),
('Pearl Necklace', 'Classic strand of genuine South Sea pearls', 3200.00, 'necklaces', 'https://images.unsplash.com/photo-1596944924619-5e4835177b6c?auto=format&fit=crop&w=400&q=80'),
('Sapphire Earrings', 'Royal blue sapphires surrounded by diamonds in 18k gold', 2800.00, 'earrings', 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&w=400&q=80'),
('Rose Gold Watch', 'Luxury timepiece with leather strap and mother-of-pearl dial', 5500.00, 'watches', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80'),
('Platinum Wedding Band', 'Simple and elegant platinum band for timeless commitment', 1800.00, 'rings', 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=400&q=80'),
('Emerald Pendant', 'Vibrant Colombian emerald in diamond halo setting', 3900.00, 'pendants', 'https://images.unsplash.com/photo-1596944924619-5e4835177b6c?auto=format&fit=crop&w=400&q=80'),
('Silver Chain', 'Sterling silver chain with contemporary design', 450.00, 'chains', 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=400&q=80');

-- 4. Grant Permissions and Disable RLS for these new tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.jewelry_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pawn_requests DISABLE ROW LEVEL SECURITY;
