export interface AppliedCoupon {
  code: string;
  discountAmount: number;
  description: string;
}

export interface CouponDefinition {
  code: string;
  type: 'percentage' | 'flat';
  value: number; // percentage (e.g. 20 for 20% off making charges) or flat in INR
  minOrderValue: number;
  maxDiscount?: number;
  description: string;
}

export const AVAILABLE_COUPONS: Record<string, CouponDefinition> = {
  ROYAL20: {
    code: 'ROYAL20',
    type: 'percentage',
    value: 5, // Equivalent to ~20% off total making charges / ~5% overall discount
    minOrderValue: 5000,
    maxDiscount: 15000,
    description: 'Flat 20% Off Making Charges (up to ₹15,000)'
  },
  WELCOME500: {
    code: 'WELCOME500',
    type: 'flat',
    value: 500,
    minOrderValue: 10000,
    description: 'Flat ₹500 Off for Valued Patrons'
  },
  FESTIVE1000: {
    code: 'FESTIVE1000',
    type: 'flat',
    value: 1000,
    minOrderValue: 25000,
    description: 'Royal Festive Discount of ₹1,000'
  },
  EXCHANGE5: {
    code: 'EXCHANGE5',
    type: 'percentage',
    value: 5,
    minOrderValue: 10000,
    maxDiscount: 20000,
    description: 'Special Old Gold Trade-in Privilege: Extra 5% Off (up to ₹20,000)'
  }
};

export function validateAndApplyCoupon(code: string, subtotal: number): { success: boolean; coupon?: AppliedCoupon; error?: string } {
  const cleanCode = (code || '').trim().toUpperCase();
  if (!cleanCode) {
    return { success: false, error: 'Please enter a coupon code.' };
  }

  const def = AVAILABLE_COUPONS[cleanCode];
  if (!def) {
    return { success: false, error: `Coupon code "${cleanCode}" is invalid or expired.` };
  }

  if (subtotal < def.minOrderValue) {
    return {
      success: false,
      error: `Coupon "${cleanCode}" requires a minimum order value of ₹${def.minOrderValue.toLocaleString('en-IN')}.`
    };
  }

  let discount = 0;
  if (def.type === 'flat') {
    discount = def.value;
  } else {
    discount = Math.round((subtotal * def.value) / 100);
    if (def.maxDiscount && discount > def.maxDiscount) {
      discount = def.maxDiscount;
    }
  }

  return {
    success: true,
    coupon: {
      code: def.code,
      discountAmount: discount,
      description: def.description
    }
  };
}
