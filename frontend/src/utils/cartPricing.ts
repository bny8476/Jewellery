/**
 * Standard Jewelry pricing calculations matching RateContext logic:
 * Total Price = (Base Metal Price + Wastage Amount) + CGST (1.5%) + SGST (1.5%)
 */
export const calculateProductPrice = (
  weight: number,
  metalType: 'gold' | 'silver' | 'diamond' | 'none',
  wastagePercent: number,
  fallbackPrice: number,
  productName: string,
  mockRates = { gold24k: 7450, gold22k: 6824, silver: 94.5, diamond: 65000 }
) => {
  let rate = 0;
  const is24K = productName.toLowerCase().includes('24k') || productName.toLowerCase().includes('coin') || productName.toLowerCase().includes('bar');

  if (metalType === 'gold') {
    rate = is24K ? mockRates.gold24k : mockRates.gold22k;
  } else if (metalType === 'silver') {
    rate = mockRates.silver;
  } else if (metalType === 'diamond') {
    rate = mockRates.diamond;
  }

  if (rate === 0 || metalType === 'none') {
    const cgst = fallbackPrice * 0.015;
    const sgst = fallbackPrice * 0.015;
    return {
      basePrice: fallbackPrice,
      wastageAmount: 0,
      cgst,
      sgst,
      totalPrice: Math.round(fallbackPrice + cgst + sgst),
    };
  }

  const basePrice = weight * rate;
  const wastageAmount = basePrice * (wastagePercent / 100);
  const taxableAmount = basePrice + wastageAmount;
  const cgst = taxableAmount * 0.015;
  const sgst = taxableAmount * 0.015;
  const totalPrice = Math.round(taxableAmount + cgst + sgst);

  return {
    basePrice,
    wastageAmount,
    cgst,
    sgst,
    totalPrice,
  };
};

export interface CartItemInput {
  id?: string;
  name: string;
  price: number;
  quantity?: number;
  weight?: number;
}

export interface CartTotalsResult {
  itemCount: number;
  subtotal: number;
  gstAmount: number;
  grandTotal: number;
  totalWeightGrams: number;
}

export function calculateCartTotals(items: CartItemInput[]): CartTotalsResult {
  let itemCount = 0;
  let subtotal = 0;
  let totalWeightGrams = 0;

  for (const item of items) {
    const qty = item.quantity || 1;
    itemCount += qty;
    subtotal += item.price * qty;
    totalWeightGrams += (item.weight || 0) * qty;
  }

  const gstAmount = Math.round(subtotal * 0.03); // 3% Bullion GST (1.5% CGST + 1.5% SGST)
  const grandTotal = subtotal + gstAmount;

  return {
    itemCount,
    subtotal,
    gstAmount,
    grandTotal,
    totalWeightGrams
  };
}
