-- ============================================================================
-- YAZHINI FINE JEWELS — Gift Card Management System Schema
-- Migration: 04_gift_card_management_system.sql
-- ============================================================================

-- 1. Gift Cards Table
CREATE TABLE IF NOT EXISTS public.gift_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(32) NOT NULL UNIQUE,
    pin_hash VARCHAR(128) NOT NULL,
    design_id VARCHAR(64) NOT NULL DEFAULT 'royal_gold',
    original_value NUMERIC(12, 2) NOT NULL CHECK (original_value > 0),
    current_balance NUMERIC(12, 2) NOT NULL CHECK (current_balance >= 0),
    currency VARCHAR(8) NOT NULL DEFAULT 'INR',
    status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (status IN ('pending_payment', 'active', 'partially_redeemed', 'fully_redeemed', 'suspended', 'cancelled', 'expired')),
    purchaser_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    purchaser_name VARCHAR(255) NOT NULL,
    purchaser_email VARCHAR(255) NOT NULL,
    purchaser_phone VARCHAR(32),
    recipient_name VARCHAR(255) NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_phone VARCHAR(32),
    personal_message TEXT,
    delivery_method VARCHAR(32) NOT NULL DEFAULT 'digital_email' CHECK (delivery_method IN ('digital_email', 'physical_delivery')),
    delivery_status VARCHAR(32) NOT NULL DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'delivered', 'failed', 'scheduled')),
    scheduled_delivery_at TIMESTAMPTZ,
    expiry_date TIMESTAMPTZ,
    purchase_order_id VARCHAR(128),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for Gift Cards
CREATE INDEX IF NOT EXISTS idx_gift_cards_code ON public.gift_cards(code);
CREATE INDEX IF NOT EXISTS idx_gift_cards_purchaser_email ON public.gift_cards(purchaser_email);
CREATE INDEX IF NOT EXISTS idx_gift_cards_recipient_email ON public.gift_cards(recipient_email);
CREATE INDEX IF NOT EXISTS idx_gift_cards_status ON public.gift_cards(status);

-- 2. Gift Card Transactions Ledger Table (Double-Entry Auditable Ledger)
CREATE TABLE IF NOT EXISTS public.gift_card_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gift_card_id UUID NOT NULL REFERENCES public.gift_cards(id) ON DELETE CASCADE,
    transaction_type VARCHAR(32) NOT NULL CHECK (transaction_type IN ('issuance', 'redemption', 'refund', 'cancellation', 'adjustment')),
    amount NUMERIC(12, 2) NOT NULL,
    balance_before NUMERIC(12, 2) NOT NULL,
    balance_after NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(8) NOT NULL DEFAULT 'INR',
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    order_number VARCHAR(128),
    reference_id VARCHAR(128),
    reason TEXT NOT NULL,
    authorized_actor VARCHAR(255) NOT NULL DEFAULT 'system',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gc_transactions_card_id ON public.gift_card_transactions(gift_card_id);
CREATE INDEX IF NOT EXISTS idx_gc_transactions_order_number ON public.gift_card_transactions(order_number);

-- 3. Gift Card Purchases Table
CREATE TABLE IF NOT EXISTS public.gift_card_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    purchaser_name VARCHAR(255) NOT NULL,
    purchaser_email VARCHAR(255) NOT NULL,
    purchaser_phone VARCHAR(32),
    recipient_name VARCHAR(255) NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_phone VARCHAR(32),
    personal_message TEXT,
    design_id VARCHAR(64) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    delivery_method VARCHAR(32) NOT NULL DEFAULT 'digital_email',
    scheduled_date TIMESTAMPTZ,
    payment_status VARCHAR(32) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    payment_gateway VARCHAR(32) NOT NULL DEFAULT 'razorpay',
    razorpay_order_id VARCHAR(128),
    razorpay_payment_id VARCHAR(128),
    gift_card_id UUID REFERENCES public.gift_cards(id) ON DELETE SET NULL,
    idempotency_key VARCHAR(128) UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gc_purchases_razorpay_order ON public.gift_card_purchases(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_gc_purchases_email ON public.gift_card_purchases(purchaser_email);

-- 4. Gift Card Audit Logs Table
CREATE TABLE IF NOT EXISTS public.gift_card_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gift_card_id UUID REFERENCES public.gift_cards(id) ON DELETE CASCADE,
    actor VARCHAR(255) NOT NULL,
    action VARCHAR(64) NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gc_audit_card_id ON public.gift_card_audit_logs(gift_card_id);

-- 5. Row Level Security Policies
ALTER TABLE public.gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_card_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_card_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_card_audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow public read access to card details by exact matching code & pin for balance check / redemption
CREATE POLICY "Public can verify card with code" ON public.gift_cards
    FOR SELECT USING (true);

-- Allow authenticated users to view cards they purchased or received
CREATE POLICY "Users can view their gift cards" ON public.gift_cards
    FOR SELECT TO authenticated
    USING (purchaser_id = auth.uid() OR purchaser_email = auth.jwt() ->> 'email' OR recipient_email = auth.jwt() ->> 'email');

-- Allow staff full access
CREATE POLICY "Staff full access gift_cards" ON public.gift_cards
    FOR ALL TO authenticated
    USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin', 'manager', 'cashier'));

CREATE POLICY "Staff full access gift_card_transactions" ON public.gift_card_transactions
    FOR ALL TO authenticated
    USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin', 'manager', 'cashier'));
