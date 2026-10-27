import { describe, it, expect, beforeEach, vi } from 'vitest';
import { addressService } from './addressService';
import { SavedAddress } from '../components/dashboard/AddressModal';

function createMemoryStorage() {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() {
      return Object.keys(store).length;
    }
  };
}

if (typeof globalThis.localStorage === 'undefined' || typeof (globalThis.localStorage as any)?.clear !== 'function') {
  (globalThis as any).localStorage = createMemoryStorage();
}

describe('Phase 3: Customer Address Multi-Tier Sync & Persistence Service', () => {
  const userId = 'patron-test-user-887766';
  const mockAddress1: SavedAddress = {
    id: 'addr-001',
    fullName: 'Ananya Deshmukh',
    phone: '9840123456',
    street: '12 Cathedral Road, Poes Garden',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600086',
    isDefault: true,
    label: 'Home'
  };

  const mockAddress2: SavedAddress = {
    id: 'addr-002',
    fullName: 'Ananya Deshmukh',
    phone: '9840123456',
    street: '45 Khader Nawaz Khan Road',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600006',
    isDefault: false,
    label: 'Work'
  };

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('1. Returns empty list when no addresses exist for user', async () => {
    const list = await addressService.getAddresses(userId);
    expect(list).toEqual([]);
  });

  it('2. Saves a new address to local cache and marks as default if it is the first address', async () => {
    const list = await addressService.saveAddress(userId, { ...mockAddress2, isDefault: false }, []);
    expect(list.length).toBe(1);
    expect(list[0].id).toBe('addr-002');
    expect(list[0].isDefault).toBe(true);

    const stored = JSON.parse(localStorage.getItem(`yazhini_addresses_${userId}`) || '[]');
    expect(stored.length).toBe(1);
  });

  it('3. Respects default selection and unsets previous default when new default is added', async () => {
    const listWithOne = await addressService.saveAddress(userId, mockAddress1, []);
    expect(listWithOne[0].isDefault).toBe(true);

    const updatedList = await addressService.saveAddress(userId, { ...mockAddress2, isDefault: true }, listWithOne);
    expect(updatedList.length).toBe(2);
    
    const addr1 = updatedList.find(a => a.id === 'addr-001');
    const addr2 = updatedList.find(a => a.id === 'addr-002');
    
    expect(addr1?.isDefault).toBe(false);
    expect(addr2?.isDefault).toBe(true);
  });

  it('4. Updates existing address in place without duplicating', async () => {
    const initialList = [mockAddress1];
    const editedAddress = { ...mockAddress1, street: 'Updated Street 99' };
    
    const updated = await addressService.saveAddress(userId, editedAddress, initialList);
    expect(updated.length).toBe(1);
    expect(updated[0].street).toBe('Updated Street 99');
  });

  it('5. Deleting default address automatically promotes remaining address to default', async () => {
    const initialList = [mockAddress1, mockAddress2];
    const updated = await addressService.deleteAddress(userId, 'addr-001', initialList);
    
    expect(updated.length).toBe(1);
    expect(updated[0].id).toBe('addr-002');
    expect(updated[0].isDefault).toBe(true);
  });

  it('6. Explicitly switches default address with setDefaultAddress', async () => {
    const initialList = [mockAddress1, mockAddress2];
    const updated = await addressService.setDefaultAddress(userId, 'addr-002', initialList);
    
    expect(updated.find(a => a.id === 'addr-001')?.isDefault).toBe(false);
    expect(updated.find(a => a.id === 'addr-002')?.isDefault).toBe(true);
  });

  it('7. Retrieves primary default delivery address for checkout prefill', async () => {
    const checkoutUserId = 'patron-checkout-user-7722';
    localStorage.setItem(`yazhini_addresses_${checkoutUserId}`, JSON.stringify([mockAddress1, mockAddress2]));
    
    const defaultAddr = await addressService.getDefaultAddress(checkoutUserId);
    expect(defaultAddr).not.toBeNull();
    expect(defaultAddr?.id).toBe('addr-001');
    expect(defaultAddr?.pincode).toBe('600086');
  });
});
