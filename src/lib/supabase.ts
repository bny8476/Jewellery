import { createClient } from '@supabase/supabase-js';

const defaultUrl = 'https://rieyzldbygsgfiwhfdmo.supabase.co';
const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpZXl6bGRieWdzZ2Zpd2hmZG1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxNjc1MjYsImV4cCI6MjA4Mjc0MzUyNn0.Tr8GnAYZxjiqO_SJqpMKDOWswMFEt4ksc24ujgbrcpg';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || defaultUrl;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || defaultKey;

// True only if an actual live Supabase project is provided (not the expired demo/placeholder URL)
export const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL &&
  import.meta.env.VITE_SUPABASE_URL !== defaultUrl &&
  !import.meta.env.VITE_SUPABASE_URL.includes('rieyzldbygsgfiwhfdmo') &&
  !import.meta.env.VITE_SUPABASE_URL.includes('placeholder')
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for database
export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  updated_at: string;
};

export type MetalType = 'gold' | 'silver' | 'diamond' | 'platinum' | 'none';

export type JewelryItem = {
  id: string;
  name: string;
  description: string | null;
  price: number; // This will be the base/fixed price or calculated price
  category: string;
  image_url: string | null;
  metal_type: MetalType;
  weight: number; // weight in grams
  wastage_percent: number;
  created_at: string;
  updated_at: string;
};

export type PawnRequest = {
  id: string;
  user_id: string;
  item_description: string;
  requested_amount: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
};

export type Notification = {
  id: string;
  customer_id: string;
  notification_type: 'monthly_interest' | 'payment_reminder' | 'pledge_status' | 'general';
  title: string;
  message: string;
  pledge_id: string | null;
  interest_amount: number | null;
  total_amount: number | null;
  is_read: boolean;
  sent_via_email: boolean;
  email_sent_at: string | null;
  created_at: string;
};