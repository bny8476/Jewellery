import { supabase } from '../lib/supabase';
import { SavedAddress } from '../components/dashboard/AddressModal';

const safeStorage = {
  getItem(key: string): string | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      if (typeof globalThis !== 'undefined' && (globalThis as any).localStorage) {
        return (globalThis as any).localStorage.getItem(key);
      }
    } catch {
      // Storage restricted or unavailable
    }
    return null;
  },
  setItem(key: string, value: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
      if (typeof globalThis !== 'undefined' && (globalThis as any).localStorage) {
        (globalThis as any).localStorage.setItem(key, value);
      }
    } catch {
      // Storage restricted or unavailable
    }
  }
};

export const addressService = {
  /**
   * Fetch addresses for a given user.
   * Checks Supabase Auth Metadata -> DB Table 'customer_addresses' -> LocalStorage fallback.
   */
  async getAddresses(userId: string): Promise<SavedAddress[]> {
    if (!userId) return [];

    const storageKey = `yazhini_addresses_${userId}`;

    // 1. Try fetching from Supabase database table if available
    try {
      const { data, error } = await supabase
        .from('customer_addresses')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false });

      if (!error && data && data.length > 0) {
        const mapped: SavedAddress[] = data.map((d: any) => ({
          id: d.id,
          fullName: d.full_name,
          phone: d.phone,
          street: d.street,
          city: d.city,
          state: d.state,
          pincode: d.pincode,
          isDefault: Boolean(d.is_default),
          label: d.label || 'Home'
        }));
        // Update local cache
        safeStorage.setItem(storageKey, JSON.stringify(mapped));
        return mapped;
      }
    } catch {
      // Table may not exist or offline; proceed to auth metadata
    }

    // 2. Try fetching from user_metadata (Auth persistence)
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id === userId && Array.isArray(user.user_metadata?.addresses) && user.user_metadata.addresses.length > 0) {
        const metadataAddresses = user.user_metadata.addresses as SavedAddress[];
        safeStorage.setItem(storageKey, JSON.stringify(metadataAddresses));
        return metadataAddresses;
      }
    } catch {
      // Offline fallback
    }

    // 3. Fallback to localStorage
    try {
      const stored = safeStorage.getItem(storageKey);
      if (stored) {
        return JSON.parse(stored) as SavedAddress[];
      }
    } catch (e) {
      console.warn('Failed to parse localStorage addresses:', e);
    }

    return [];
  },

  /**
   * Save (add or update) an address across all storage tiers.
   */
  async saveAddress(
    userId: string, 
    address: SavedAddress, 
    currentAddresses: SavedAddress[]
  ): Promise<SavedAddress[]> {
    if (!userId) return currentAddresses;

    const storageKey = `yazhini_addresses_${userId}`;
    let updated: SavedAddress[];

    if (address.isDefault) {
      updated = currentAddresses.map(a => ({ ...a, isDefault: a.id === address.id }));
      const exists = updated.some(a => a.id === address.id);
      if (!exists) {
        updated.push(address);
      } else {
        updated = updated.map(a => a.id === address.id ? address : a);
      }
    } else {
      const exists = currentAddresses.some(a => a.id === address.id);
      if (exists) {
        updated = currentAddresses.map(a => a.id === address.id ? address : a);
      } else {
        // If this is the only address, mark it default automatically
        const isFirst = currentAddresses.length === 0;
        updated = [...currentAddresses, { ...address, isDefault: isFirst }];
      }
    }

    // 1. Immediate local persistence
    safeStorage.setItem(storageKey, JSON.stringify(updated));

    // 2. Background sync to Supabase Auth metadata
    try {
      await supabase.auth.updateUser({
        data: { addresses: updated }
      });
    } catch (err) {
      console.debug('Failed to sync addresses to auth metadata:', err);
    }

    // 3. Sync to Supabase customer_addresses table if accessible
    try {
      await supabase
        .from('customer_addresses')
        .upsert({
          id: address.id,
          user_id: userId,
          full_name: address.fullName,
          phone: address.phone,
          street: address.street,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
          is_default: address.isDefault,
          label: address.label,
          updated_at: new Date().toISOString()
        });
    } catch {
      // Table may not exist yet
    }

    // 4. Sync default address to profiles table for checkout autofill
    const defaultAddress = updated.find(a => a.isDefault) || updated[0];
    if (defaultAddress) {
      try {
        await supabase
          .from('profiles')
          .update({
            address: defaultAddress.street,
            city: defaultAddress.city,
            pincode: defaultAddress.pincode,
            phone: defaultAddress.phone
          })
          .eq('id', userId);
      } catch {
        // Ignored if profiles table does not have address column
      }
    }

    return updated;
  },

  /**
   * Delete an address by ID across all storage tiers.
   */
  async deleteAddress(
    userId: string, 
    addressId: string, 
    currentAddresses: SavedAddress[]
  ): Promise<SavedAddress[]> {
    if (!userId) return currentAddresses;

    const storageKey = `yazhini_addresses_${userId}`;
    const updated = currentAddresses.filter(a => a.id !== addressId);

    // If we deleted the default and there are remaining addresses, assign first as default
    if (updated.length > 0 && !updated.some(a => a.isDefault)) {
      updated[0].isDefault = true;
    }

    // 1. Local storage
    safeStorage.setItem(storageKey, JSON.stringify(updated));

    // 2. Auth metadata
    try {
      await supabase.auth.updateUser({
        data: { addresses: updated }
      });
    } catch (err) {
      console.debug('Failed to sync address deletion to auth metadata:', err);
    }

    // 3. Database table
    try {
      await supabase
        .from('customer_addresses')
        .delete()
        .eq('id', addressId)
        .eq('user_id', userId);
    } catch {
      // Table may not exist
    }

    return updated;
  },

  /**
   * Mark an address as primary/default across all storage tiers.
   */
  async setDefaultAddress(
    userId: string, 
    addressId: string, 
    currentAddresses: SavedAddress[]
  ): Promise<SavedAddress[]> {
    if (!userId) return currentAddresses;

    const storageKey = `yazhini_addresses_${userId}`;
    const updated = currentAddresses.map(a => ({ ...a, isDefault: a.id === addressId }));

    // 1. Local storage
    safeStorage.setItem(storageKey, JSON.stringify(updated));

    // 2. Auth metadata
    try {
      await supabase.auth.updateUser({
        data: { addresses: updated }
      });
    } catch (err) {
      console.debug('Failed to sync default address to auth metadata:', err);
    }

    // 3. Database table
    try {
      await supabase
        .from('customer_addresses')
        .update({ is_default: false })
        .eq('user_id', userId);

      await supabase
        .from('customer_addresses')
        .update({ is_default: true })
        .eq('id', addressId)
        .eq('user_id', userId);
    } catch {
      // Table may not exist
    }

    // 4. Sync to profiles
    const defaultAddr = updated.find(a => a.id === addressId);
    if (defaultAddr) {
      try {
        await supabase
          .from('profiles')
          .update({
            address: defaultAddr.street,
            city: defaultAddr.city,
            pincode: defaultAddr.pincode,
            phone: defaultAddr.phone
          })
          .eq('id', userId);
      } catch {
        // Table column may not exist
      }
    }

    return updated;
  },

  /**
   * Retrieve the primary default delivery address for checkout.
   */
  async getDefaultAddress(userId?: string): Promise<SavedAddress | null> {
    if (!userId) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;
        userId = user.id;
      } catch {
        return null;
      }
    }

    const addresses = await this.getAddresses(userId);
    return addresses.find(a => a.isDefault) || addresses[0] || null;
  }
};
