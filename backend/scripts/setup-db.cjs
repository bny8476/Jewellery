const { Client } = require('pg');

// SECURITY: Load database credentials strictly from environment variables
const config = {
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    host: process.env.DB_HOST || '',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'postgres',
    ssl: {
        rejectUnauthorized: false
    }
};

if (!config.password || !config.host) {
    console.error('❌ Error: Missing required database credentials in environment variables.');
    console.error('Please set DB_PASSWORD and DB_HOST before running setup-db.cjs.');
    process.exit(1);
}

const sampleJewelryItems = [
    {
        name: "Diamond Engagement Ring",
        description: "Stunning 1.5 carat diamond ring set in 18k white gold",
        price: 8500.00,
        category: "rings",
        image_url: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=400&q=80"
    },
    {
        name: "Gold Tennis Bracelet",
        description: "Elegant 14k gold bracelet with perfect round diamonds",
        price: 4200.00,
        category: "bracelets",
        image_url: "/images/trend_rose_gold_kada.jpg"
    },
    {
        name: "Pearl Necklace",
        description: "Classic strand of genuine South Sea pearls",
        price: 3200.00,
        category: "necklaces",
        image_url: "/images/cat_traditional.jpg"
    },
    {
        name: "Sapphire Earrings",
        description: "Royal blue sapphires surrounded by diamonds in 18k gold",
        price: 2800.00,
        category: "earrings",
        image_url: "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&w=400&q=80"
    },
    {
        name: "Rose Gold Watch",
        description: "Luxury timepiece with leather strap and mother-of-pearl dial",
        price: 5500.00,
        category: "watches",
        image_url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80"
    },
    {
        name: "Platinum Wedding Band",
        description: "Simple and elegant platinum band for timeless commitment",
        price: 1800.00,
        category: "rings",
        image_url: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=400&q=80"
    },
    {
        name: "Emerald Pendant",
        description: "Vibrant Colombian emerald in diamond halo setting",
        price: 3900.00,
        category: "pendants",
        image_url: "/images/gold_pendant_ganesha.jpg"
    },
    {
        name: "Silver Chain",
        description: "Sterling silver chain with contemporary design",
        price: 450.00,
        category: "chains",
        image_url: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=400&q=80"
    }
];

const sql = `
-- Create tables
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

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jewelry_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pawn_requests ENABLE ROW LEVEL SECURITY;

-- Create policies
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can read own profile') THEN
    CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can update own profile') THEN
    CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Anyone can view jewelry items') THEN
    CREATE POLICY "Anyone can view jewelry items" ON public.jewelry_items FOR SELECT TO public USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can create pawn requests') THEN
    CREATE POLICY "Users can create pawn requests" ON public.pawn_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can view own pawn requests') THEN
    CREATE POLICY "Users can view own pawn requests" ON public.pawn_requests FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;

-- Handle new user profile creation
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
`;

async function setup() {
    const client = new Client(config);

    try {
        console.log('Connecting to Supabase Database...');
        await client.connect();
        console.log('Connected successfully!');

        console.log('Applying schema...');
        await client.query(sql);
        console.log('✅ Database schema setup complete!');

        console.log('Seeding sample jewelry items...');
        const result = await client.query('SELECT count(*) FROM public.jewelry_items');
        if (parseInt(result.rows[0].count) === 0) {
            for (const item of sampleJewelryItems) {
                await client.query(
                    'INSERT INTO public.jewelry_items (name, description, price, category, image_url) VALUES ($1, $2, $3, $4, $5)',
                    [item.name, item.description, item.price, item.category, item.image_url]
                );
            }
            console.log('✅ Seeding complete!');
        } else {
            console.log('Items already exist, skipping seed.');
        }

    } catch (err) {
        console.error('❌ Error during setup:', err.message);
        console.log('\n--- Troubleshooting ---');
        console.log('If you get ENOTFOUND, it might be a DNS issue with the hostname.');
        console.log('Please copy-paste the SQL from this script directly into the Supabase SQL Editor if this continues to fail.');
    } finally {
        await client.end();
    }
}

setup();
