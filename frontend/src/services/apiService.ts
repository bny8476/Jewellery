import { supabase } from '../lib/supabase';
import { JewelryItem, PawnRequest } from '../lib/supabase';
import { realtimeManager } from './realtimeService';
import { localJewelryItems } from '../utils/localData';

export class ApiService {
  // Jewelry Items
  static async getJewelryItems(): Promise<JewelryItem[]> {
    const { data, error } = await supabase
      .from('jewelry_items')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async getJewelryItemById(id: string): Promise<JewelryItem | null> {
    if (!id) return null;

    // 1. Try Supabase
    try {
      const { data, error } = await supabase
        .from('jewelry_items')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (!error && data) return data;
    } catch {
      // Fall through to API / local data
    }

    // 2. Try Backend REST API
    try {
      const res = await fetch(`/api/v1/inventory/${encodeURIComponent(id)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) return json.data;
      }
    } catch {
      // Fall through
    }

    // 3. Fallback to bundled catalogue items (matches id or slug)
    const local = localJewelryItems.find(
      (item) => item.id === id || item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === id.toLowerCase()
    );
    if (local) return local;

    return null;
  }

  static async createJewelryItem(item: Omit<JewelryItem, 'id' | 'created_at' | 'updated_at'>): Promise<JewelryItem> {
    const { data, error } = await supabase
      .from('jewelry_items')
      .insert(item)
      .select()
      .single();
    
    if (error) throw error;
    try {
      realtimeManager.dispatch('inventory.product.created', data);
    } catch {
      // ignore
    }
    return data;
  }

  static async updateJewelryItem(id: string, item: Partial<JewelryItem>): Promise<JewelryItem> {
    const { data, error } = await supabase
      .from('jewelry_items')
      .update(item)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    try {
      realtimeManager.dispatch('inventory.product.updated', data);
    } catch {
      // ignore
    }
    return data;
  }

  static async deleteJewelryItem(id: string): Promise<void> {
    const { error } = await supabase
      .from('jewelry_items')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    try {
      realtimeManager.dispatch('inventory.stock.changed', { id, deleted: true });
    } catch {
      // ignore
    }
  }

  // Pawn Requests
  static async getPawnRequests(userId?: string): Promise<PawnRequest[]> {
    let query = supabase
      .from('pawn_requests')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  }

  static async createPawnRequest(request: Omit<PawnRequest, 'id' | 'created_at' | 'updated_at'>): Promise<PawnRequest> {
    const { data, error } = await supabase
      .from('pawn_requests')
      .insert(request)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updatePawnRequestStatus(id: string, status: 'pending' | 'approved' | 'rejected'): Promise<PawnRequest> {
    const { data, error } = await supabase
      .from('pawn_requests')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // User Profile
  static async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateUserProfile(userId: string, profile: { full_name?: string }) {
    const { data, error } = await supabase
      .from('profiles')
      .update(profile)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Admin functions (these should be protected by RLS policies)
  static async getAllPawnRequests(): Promise<PawnRequest[]> {
    const { data, error } = await supabase
      .from('pawn_requests')
      .select(`
        *,
        profiles (email, full_name)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }
}
