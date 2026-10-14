import { supabase } from '../lib/supabase';
import { JewelryItem, PawnRequest } from '../lib/supabase';

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

  static async createJewelryItem(item: Omit<JewelryItem, 'id' | 'created_at' | 'updated_at'>): Promise<JewelryItem> {
    const { data, error } = await supabase
      .from('jewelry_items')
      .insert(item)
      .select()
      .single();
    
    if (error) throw error;
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
    return data;
  }

  static async deleteJewelryItem(id: string): Promise<void> {
    const { error } = await supabase
      .from('jewelry_items')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
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
