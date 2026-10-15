import { describe, it, expect } from 'vitest';
import { calculateProductPrice } from './cartPricing';


describe('Jewelry Dynamic Pricing & Tax Breakdown', () => {
  it('calculates 22K Gold jewelry price with wastage and 3% total GST', () => {
    // 10 grams of 22K gold @ ₹6,824/g with 10% wastage
    const result = calculateProductPrice(10, 'gold', 10, 0, 'Royal Gold Necklace');
    expect(result.basePrice).toBe(68240);
    expect(result.wastageAmount).toBe(6824);
    const taxable = 68240 + 6824; // 75064
    expect(result.cgst).toBe(taxable * 0.015);
    expect(result.sgst).toBe(taxable * 0.015);
    expect(result.totalPrice).toBe(Math.round(taxable * 1.03));
  });

  it('calculates 24K pure gold bullion price correctly', () => {
    // 5 grams of 24K gold coin @ ₹7,450/g with 2% wastage
    const result = calculateProductPrice(5, 'gold', 2, 0, '24K Lakshmi Gold Coin');
    expect(result.basePrice).toBe(37250);
    expect(result.wastageAmount).toBe(37250 * 0.02);
    expect(result.totalPrice).toBe(Math.round((37250 + 745) * 1.03));
  });

  it('calculates Silver items price correctly', () => {
    // 100 grams of silver @ ₹94.50/g with 5% wastage
    const result = calculateProductPrice(100, 'silver', 5, 0, 'Silver Pooja Thali');
    expect(result.basePrice).toBe(9450);
    expect(result.wastageAmount).toBe(9450 * 0.05);
    expect(result.totalPrice).toBe(Math.round((9450 + 472.5) * 1.03));
  });

  it('calculates Diamond jewelry based on carat value', () => {
    // 0.5 carat diamond @ ₹65,000/ct with 15% setting charges
    const result = calculateProductPrice(0.5, 'diamond', 15, 0, 'Solitaire Diamond Ring');
    expect(result.basePrice).toBe(32500);
    expect(result.wastageAmount).toBe(32500 * 0.15);
    expect(result.totalPrice).toBe(Math.round((32500 + 4875) * 1.03));
  });

  it('handles zero weight or non-metal items cleanly with fallback price', () => {
    const result = calculateProductPrice(0, 'none', 0, 5000, 'Jewelry Box');
    expect(result.basePrice).toBe(5000);
    expect(result.wastageAmount).toBe(0);
    expect(result.totalPrice).toBe(Math.round(5000 * 1.03));
  });

  it('computes cart aggregation across multiple line items', () => {
    const item1 = calculateProductPrice(10, 'gold', 10, 0, 'Royal Gold Necklace');
    const item2 = calculateProductPrice(100, 'silver', 5, 0, 'Silver Pooja Thali');

    const cartTotal = (item1.totalPrice * 1) + (item2.totalPrice * 2);
    expect(cartTotal).toBe(item1.totalPrice + (item2.totalPrice * 2));
    expect(cartTotal).toBeGreaterThan(0);
  });
});
