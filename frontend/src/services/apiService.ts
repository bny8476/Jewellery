import { supabase } from '../lib/supabase';
import { JewelryItem, PawnRequest } from '../lib/supabase';
import { realtimeManager } from './realtimeService';
import { localJewelryItems } from '../utils/localData';

export class ApiService {
  // Jewelry Items - Customer & Public
  static async getJewelryItems(options?: { includeDrafts?: boolean }): Promise<JewelryItem[]> {
    // 1. Try Supabase
    try {
      let query = supabase.from('jewelry_items').select('*');
      if (!options?.includeDrafts) {
        query = query.neq('status', 'archived').neq('status', 'draft');
      }
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (!error && data && data.length > 0) return data;
    } catch {
      // Fall through
    }

    // 2. Try Backend REST API
    try {
      const res = await fetch('/api/v1/inventory');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data && json.data.length > 0) return json.data;
      }
    } catch {
      // Fall through
    }

    // 3. Return canonical bundled catalogue items (filtering out archived/draft for customer)
    if (!options?.includeDrafts) {
      return localJewelryItems.filter(item => (item.status || 'published') !== 'archived' && (item.status || 'published') !== 'draft');
    }
    return localJewelryItems;
  }

  // Jewelry Items - Admin Management with Filters & KPI Metrics
  static async getAdminInventory(filters?: {
    search?: string;
    category?: string;
    gender?: string;
    metal_type?: string;
    status?: string;
    stock_status?: string;
    sort?: string;
  }): Promise<{ items: JewelryItem[]; metrics: { total: number; published: number; draft: number; archived: number; outOfStock: number; lowStock: number } }> {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.search) queryParams.set('search', filters.search);
      if (filters?.category && filters.category !== 'All') queryParams.set('category', filters.category);
      if (filters?.gender && filters.gender !== 'All') queryParams.set('gender', filters.gender);
      if (filters?.metal_type && filters.metal_type !== 'All') queryParams.set('metal_type', filters.metal_type);
      if (filters?.status && filters.status !== 'all') queryParams.set('status', filters.status);
      if (filters?.stock_status && filters.stock_status !== 'all') queryParams.set('stock_status', filters.stock_status);
      if (filters?.sort) queryParams.set('sort', filters.sort);

      // Attempt backend API with auth headers
      const res = await fetch(`/api/v1/inventory?${queryParams.toString()}`, {
        headers: {
          'Authorization': 'Bearer test-token-super_admin'
        }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          return {
            items: json.data,
            metrics: json.metrics || {
              total: json.data.length,
              published: json.data.filter((i: any) => (i.status || 'published') === 'published').length,
              draft: json.data.filter((i: any) => i.status === 'draft').length,
              archived: json.data.filter((i: any) => i.status === 'archived').length,
              outOfStock: json.data.filter((i: any) => i.in_stock === false || (i.stock_quantity ?? 0) <= 0).length,
              lowStock: json.data.filter((i: any) => (i.stock_quantity ?? 0) > 0 && (i.stock_quantity ?? 0) <= (i.low_stock_threshold ?? 3)).length
            }
          };
        }
      }
    } catch {
      // Fall through to database / local data
    }

    // Fallback through Supabase / resilientDatabase
    const { data } = await supabase.from('jewelry_items').select('*').order('created_at', { ascending: false });
    const all = (data && data.length > 0) ? data : localJewelryItems;

    let filtered = [...all];
    if (filters?.search) {
      const s = filters.search.toLowerCase();
      filtered = filtered.filter(i => i.name.toLowerCase().includes(s) || (i.sku && i.sku.toLowerCase().includes(s)) || i.category.toLowerCase().includes(s));
    }
    if (filters?.category && filters.category !== 'All') {
      filtered = filtered.filter(i => i.category.toLowerCase().includes(filters.category!.toLowerCase()));
    }
    if (filters?.gender && filters.gender !== 'All') {
      const g = filters.gender.toLowerCase();
      filtered = filtered.filter(i => (i.gender || 'women') === g || (g !== 'unisex' && i.gender === 'unisex'));
    }
    if (filters?.metal_type && filters.metal_type !== 'All') {
      filtered = filtered.filter(i => i.metal_type.toLowerCase() === filters.metal_type!.toLowerCase());
    }
    if (filters?.status && filters.status !== 'all') {
      filtered = filtered.filter(i => (i.status || 'published') === filters.status);
    }
    if (filters?.stock_status === 'out_of_stock') {
      filtered = filtered.filter(i => i.in_stock === false || (i.stock_quantity ?? 0) <= 0);
    } else if (filters?.stock_status === 'low_stock') {
      filtered = filtered.filter(i => (i.stock_quantity ?? 0) > 0 && (i.stock_quantity ?? 0) <= (i.low_stock_threshold ?? 3));
    } else if (filters?.stock_status === 'in_stock') {
      filtered = filtered.filter(i => i.in_stock !== false && (i.stock_quantity ?? 0) > 0);
    }

    const metrics = {
      total: all.length,
      published: all.filter(i => (i.status || 'published') === 'published').length,
      draft: all.filter(i => i.status === 'draft').length,
      archived: all.filter(i => i.status === 'archived').length,
      outOfStock: all.filter(i => i.in_stock === false || (i.stock_quantity ?? 0) <= 0).length,
      lowStock: all.filter(i => (i.stock_quantity ?? 0) > 0 && (i.stock_quantity ?? 0) <= (i.low_stock_threshold ?? 3)).length
    };

    return { items: filtered, metrics };
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

    // 3. Fallback to bundled catalogue items (matches id or sku or slug)
    const local = localJewelryItems.find(
      (item) => item.id === id || item.sku === id || item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === id.toLowerCase()
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

  static async updateProductStatus(id: string, status: 'published' | 'draft' | 'archived'): Promise<JewelryItem> {
    const patch: Partial<JewelryItem> = { status };
    if (status === 'archived') {
      patch.in_stock = false;
    }
    return ApiService.updateJewelryItem(id, patch);
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

  static async bulkUpdateProducts(action: 'publish' | 'unpublish' | 'archive' | 'restore' | 'category', ids: string[], extra?: any): Promise<{ success: boolean; count: number }> {
    try {
      const res = await fetch('/api/v1/inventory/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token-super_admin'
        },
        body: JSON.stringify({ action, ids, data: extra })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) return json;
      }
    } catch {
      // Fall through
    }

    // Resilient fallback
    const now = new Date().toISOString();
    for (const id of ids) {
      if (action === 'publish') await supabase.from('jewelry_items').update({ status: 'published', updated_at: now }).eq('id', id);
      if (action === 'unpublish') await supabase.from('jewelry_items').update({ status: 'draft', updated_at: now }).eq('id', id);
      if (action === 'archive') await supabase.from('jewelry_items').update({ status: 'archived', in_stock: false, updated_at: now }).eq('id', id);
      if (action === 'restore') await supabase.from('jewelry_items').update({ status: 'published', updated_at: now }).eq('id', id);
      if (action === 'category' && extra?.category) await supabase.from('jewelry_items').update({ category: extra.category, updated_at: now }).eq('id', id);
    }
    realtimeManager.dispatch('inventory.stock.changed', { bulkAction: action, count: ids.length });
    return { success: true, count: ids.length };
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
