import { supabase, createLocalJwt } from '../lib/supabase';

const API_BASE = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001').replace(/\/$/, '');

export interface GiftCardDesign {
  id: string;
  name: string;
  tagline: string;
  theme: string;
  bgGradient: string;
  accentColor: string;
  pattern: string;
  image: string;
  occasions: string[];
}

export interface GiftCardDesignsResponse {
  success: boolean;
  designs: GiftCardDesign[];
  denominations: number[];
  limits: {
    minAmount: number;
    maxAmount: number;
    currency: string;
  };
  occasions: string[];
}

export interface GiftCardCheckResult {
  code: string;
  designId: string;
  designName: string;
  designImage: string;
  currency: string;
  originalValue: number;
  currentBalance: number;
  redeemedValue: number;
  status: 'ACTIVE' | 'PARTIALLY_REDEEMED' | 'FULLY_REDEEMED' | 'EXPIRED' | 'SUSPENDED' | 'CANCELLED';
  recipientName: string;
  expiresAt: string;
  createdAt: string;
}

export interface GiftCardPurchasePayload {
  amount: number;
  designId: string;
  cardType?: 'DIGITAL' | 'PHYSICAL';
  recipientName: string;
  recipientEmail: string;
  recipientPhone?: string;
  senderName: string;
  senderEmail?: string;
  giftMessage?: string;
  occasion?: string;
  deliveryMethod?: 'EMAIL' | 'SMS' | 'POSTAL';
  deliveryDate?: string;
}

export interface GiftCardValidationResponse {
  success: boolean;
  valid?: boolean;
  cardId?: string;
  code?: string;
  availableBalance?: number;
  appliedAmount?: number;
  remainingOrderPayable?: number;
  remainingCardBalance?: number;
  currency?: string;
  error?: string;
}

export interface GiftCardTransaction {
  id: string;
  gift_card_id: string;
  transaction_type: 'ISSUANCE' | 'REDEMPTION' | 'REFUND' | 'ADJUSTMENT' | 'EXPIRY';
  amount: number;
  balance_before: number;
  balance_after: number;
  currency: string;
  order_number?: string;
  reason: string;
  authorized_actor?: string;
  created_at: string;
}

export interface GiftCardRecord {
  id: string;
  code: string;
  maskedCode?: string;
  pin?: string;
  design_id: string;
  design?: GiftCardDesign;
  card_type: 'DIGITAL' | 'PHYSICAL';
  original_value: number;
  current_balance: number;
  currency: string;
  status: 'PENDING_PAYMENT' | 'ACTIVE' | 'PARTIALLY_REDEEMED' | 'FULLY_REDEEMED' | 'EXPIRED' | 'SUSPENDED' | 'CANCELLED';
  purchaser_id?: string;
  purchaser_name?: string;
  purchaser_email?: string;
  recipient_name: string;
  recipient_email: string;
  recipient_phone?: string;
  gift_message?: string;
  occasion?: string;
  delivery_method: string;
  delivery_status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED';
  delivery_date?: string;
  expires_at: string;
  created_at: string;
  updated_at?: string;
  transactions?: GiftCardTransaction[];
}

export interface AdminGiftCardsOverview {
  success: boolean;
  stats: {
    totalCardsSold: number;
    totalValueIssued: number;
    totalRedeemedValue: number;
    outstandingLiability: number;
    activeCardsCount: number;
    fullyRedeemedCount: number;
    suspendedCount: number;
    currency: string;
  };
  cards: GiftCardRecord[];
}

export interface AdminGiftCardDetailResponse {
  success: boolean;
  card: GiftCardRecord;
  transactions: GiftCardTransaction[];
  auditLogs: {
    id: string;
    gift_card_id: string;
    actor: string;
    action: string;
    details: any;
    ip_address?: string;
    created_at: string;
  }[];
}

export interface AdminReconciliationReport {
  success: boolean;
  reconciliationDate: string;
  totalCardsAudited: number;
  totalDiscrepancies: number;
  isSystemReconciled: boolean;
  rows: {
    cardId: string;
    code: string;
    originalValue: number;
    storedBalance: number;
    ledgerCalculatedBalance: number;
    discrepancy: number;
    status: string;
    isBalanced: boolean;
    transactionCount: number;
  }[];
}

// Helper for authenticating client requests
async function getAuthHeaders(): Promise<Record<string, string>> {
  let { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      session = {
        user,
        access_token: createLocalJwt(user),
        token_type: 'bearer',
        expires_in: 604800,
        expires_at: Math.floor(Date.now() / 1000) + 604800,
        refresh_token: 'local_token'
      };
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  const user = session?.user;
  const token = session?.access_token || (user ? createLocalJwt(user) : '');

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (user?.id) {
    headers['x-user-id'] = user.id;
    if (user.email) {
      headers['x-user-email'] = user.email;
    }
  }
  return headers;
}

export const giftCardService = {
  /**
   * Fetch approved gift card designs, denominations, and limits
   */
  async getDesigns(): Promise<GiftCardDesignsResponse> {
    const res = await fetch(`${API_BASE}/api/v1/gift-cards/designs`);
    if (!res.ok) {
      throw new Error('Failed to load gift card designs');
    }
    return res.json();
  },

  /**
   * Check balance of a gift card by Code and 4-digit PIN
   */
  async checkBalance(code: string, pin: string): Promise<{ success: boolean; card?: GiftCardCheckResult; error?: string }> {
    const res = await fetch(`${API_BASE}/api/v1/gift-cards/check-balance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, pin })
    });
    return res.json();
  },

  /**
   * Initiate a gift card purchase session
   */
  async initiatePurchase(payload: GiftCardPurchasePayload): Promise<{
    success: boolean;
    purchaseId?: string;
    razorpayOrderId?: string;
    receiptNumber?: string;
    amount?: number;
    currency?: string;
    keyId?: string;
    error?: string;
  }> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/api/v1/gift-cards/purchases/initiate`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  /**
   * Verify payment and issue real gift card
   */
  async verifyAndIssue(params: {
    purchaseId: string;
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
  }): Promise<{
    success: boolean;
    message?: string;
    isDuplicate?: boolean;
    card?: {
      id: string;
      code: string;
      pin: string;
      amount: number;
      currency: string;
      designId: string;
      recipientName: string;
      recipientEmail: string;
      senderName: string;
      giftMessage?: string;
      expiresAt: string;
      viewUrl: string;
    };
    error?: string;
  }> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/api/v1/gift-cards/purchases/verify-and-issue`, {
      method: 'POST',
      headers,
      body: JSON.stringify(params)
    });
    return res.json();
  },

  /**
   * Get public recipient gift card view by code
   */
  async getPublicCard(code: string): Promise<{
    success: boolean;
    card?: {
      code: string;
      design: GiftCardDesign;
      originalValue: number;
      currentBalance: number;
      currency: string;
      status: string;
      recipientName: string;
      senderName: string;
      giftMessage?: string;
      occasion?: string;
      expiresAt: string;
      createdAt: string;
    };
    error?: string;
  }> {
    const res = await fetch(`${API_BASE}/api/v1/gift-cards/view/${encodeURIComponent(code)}`);
    return res.json();
  },

  /**
   * Fetch customer's purchased and received gift cards for dashboard
   */
  async getMyGiftCards(): Promise<{
    success: boolean;
    purchased: GiftCardRecord[];
    received: GiftCardRecord[];
    error?: string;
  }> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/api/v1/gift-cards/my-cards`, {
      method: 'GET',
      headers
    });
    return res.json();
  },

  /**
   * Validate gift card at checkout against current cart total
   */
  async validateRedemption(code: string, pin: string, cartTotal: number): Promise<GiftCardValidationResponse> {
    const res = await fetch(`${API_BASE}/api/v1/gift-cards/validate-redemption`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, pin, cartTotal })
    });
    return res.json();
  },

  /**
   * Commit atomic redemption on final order confirmation
   */
  async redeemCard(params: {
    code: string;
    pin: string;
    amount: number;
    orderNumber?: string;
  }): Promise<{
    success: boolean;
    message?: string;
    transactionId?: string;
    balanceBefore?: number;
    amountRedeemed?: number;
    remainingBalance?: number;
    status?: string;
    error?: string;
  }> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/api/v1/gift-cards/redeem`, {
      method: 'POST',
      headers,
      body: JSON.stringify(params)
    });
    return res.json();
  },

  /**
   * Resend digital card email notification
   */
  async resendCard(idOrCode: string): Promise<{ success: boolean; message?: string; error?: string }> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/api/v1/gift-cards/${encodeURIComponent(idOrCode)}/resend`, {
      method: 'POST',
      headers
    });
    return res.json();
  },

  /**
   * Admin: List all gift cards with stats & filters
   */
  async getAdminCards(params?: { search?: string; status?: string }): Promise<AdminGiftCardsOverview> {
    const headers = await getAuthHeaders();
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.status) searchParams.set('status', params.status);

    const res = await fetch(`${API_BASE}/api/v1/admin/gift-cards?${searchParams.toString()}`, {
      method: 'GET',
      headers
    });
    return res.json();
  },

  /**
   * Admin: Get single card detail with transaction ledger & audit trail
   */
  async getAdminCardDetail(id: string): Promise<AdminGiftCardDetailResponse> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/api/v1/admin/gift-cards/${encodeURIComponent(id)}`, {
      method: 'GET',
      headers
    });
    return res.json();
  },

  /**
   * Admin: Update gift card status (ACTIVE, SUSPENDED, CANCELLED) with mandatory audit reason
   */
  async updateAdminStatus(id: string, status: string, reason: string): Promise<{ success: boolean; message?: string; error?: string }> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/api/v1/admin/gift-cards/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status, reason })
    });
    return res.json();
  },

  /**
   * Admin: Manual balance adjustment (CREDIT / DEBIT) with mandatory ledger reason
   */
  async adjustAdminBalance(id: string, params: {
    adjustmentAmount: number;
    direction: 'CREDIT' | 'DEBIT';
    reason: string;
  }): Promise<{ success: boolean; message?: string; card?: GiftCardRecord; error?: string }> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/api/v1/admin/gift-cards/${encodeURIComponent(id)}/adjust-balance`, {
      method: 'POST',
      headers,
      body: JSON.stringify(params)
    });
    return res.json();
  },

  /**
   * Admin: Financial Ledger Reconciliation Report
   */
  async getAdminReconciliation(): Promise<AdminReconciliationReport> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/api/v1/admin/gift-cards/reconciliation`, {
      method: 'GET',
      headers
    });
    return res.json();
  }
};
