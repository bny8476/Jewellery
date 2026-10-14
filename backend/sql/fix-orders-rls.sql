-- Ensure RLS is enabled
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view their own order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can create their own order items" ON public.order_items;

-- Recreate policies explicitly for authenticated users
CREATE POLICY "Users can view their own orders" 
ON public.orders FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders" 
ON public.orders FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own order items" 
ON public.order_items FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own order items" 
ON public.order_items FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
  )
);
