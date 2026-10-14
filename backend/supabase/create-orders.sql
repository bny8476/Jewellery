-- Create Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id text PRIMARY KEY, -- Using text for ORD-XXXX format
  user_id uuid REFERENCES auth.users NOT NULL,
  total_amount numeric NOT NULL CHECK (total_amount >= 0),
  status text NOT NULL CHECK (status IN ('processing', 'shipped', 'delivered', 'cancelled')) DEFAULT 'processing',
  shipping_address jsonb NOT NULL,
  payment_intent_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_name text NOT NULL,
  price numeric NOT NULL,
  weight numeric,
  unit text,
  image_url text,
  quantity integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own order items" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );
