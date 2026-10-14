import { describe, it, expect, vi } from 'vitest';
import { realtimeManager } from './realtimeService';

describe('RealtimeSyncManager', () => {
  it('allows subscription to custom business events', () => {
    const callback = vi.fn();
    const unsubscribe = realtimeManager.subscribe('customers.created', callback);

    const testPayload = { id: 'cust-123', full_name: 'Vikram Mehta' };
    realtimeManager.dispatch('customers.created', testPayload);

    expect(callback).toHaveBeenCalledWith(testPayload);
    unsubscribe();
  });

  it('unsubscribes cleanly without leaking memory', () => {
    const callback = vi.fn();
    const unsubscribe = realtimeManager.subscribe('sales.confirmed', callback);

    unsubscribe();
    realtimeManager.dispatch('sales.confirmed', { orderId: 'ORD-999' });

    expect(callback).not.toHaveBeenCalled();
  });

  it('handles multiple concurrent subscribers for inventory events', () => {
    const cb1 = vi.fn();
    const cb2 = vi.fn();

    const unsub1 = realtimeManager.subscribe('inventory.stock.changed', cb1);
    const unsub2 = realtimeManager.subscribe('inventory.stock.changed', cb2);

    const payload = { id: 'jewel-1', quantity: 5 };
    realtimeManager.dispatch('inventory.stock.changed', payload);

    expect(cb1).toHaveBeenCalledWith(payload);
    expect(cb2).toHaveBeenCalledWith(payload);

    unsub1();
    unsub2();
  });

  it('dispatches pawn-loans.created events properly', () => {
    const callback = vi.fn();
    const unsub = realtimeManager.subscribe('pawn-loans.created', callback);

    const loanPayload = { id: 'pledge-456', pledge_no: 'PL-100234', loan_amount: 50000 };
    realtimeManager.dispatch('pawn-loans.created', loanPayload);

    expect(callback).toHaveBeenCalledWith(loanPayload);
    unsub();
  });
});
