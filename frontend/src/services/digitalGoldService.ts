import { supabase } from '../lib/supabase';

const API_BASE = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001').replace(/\/$/, '');

export interface DigitalGoldRates {
  metalType: string;
  purity: string;
  buyRatePerGram: number;
  sellRatePerGram: number;
  marketSpotRatePerGram: number;
  spreadPercent: number;
  currency: string;
  provider: string;
  isSandbox: boolean;
  freshnessTimestamp: string;
  cacheTtlSeconds: number;
  providerStatus: string;
}

export interface BullionQuote {
  quoteId: string;
  quoteReference: string;
  type: 'BUY' | 'SELL';
  metalType: string;
  ratePerGram: number;
  grams: number;
  metalValue: number;
  gstRatePercent: number;
  gstAmount: number;
  convenienceFee: number;
  totalAmount: number;
  expiresAt: string;
  validForSeconds: number;
  provider: string;
}

export interface RedemptionProduct {
  id: string;
  name: string;
  grams: number;
  purity: string;
  dimension: string;
  mintingCharges: number;
  inStock: boolean;
  imageUrl: string;
}

export interface CustomerWallet {
  accountNumber: string;
  goldBalanceGrams: number;
  reservedGrams: number;
  availableGrams: number;
  marketValuationInr: number;
  liveRatePerGram: number;
  kycStatus: string;
  status: string;
  provider: string;
  recentTransactions: any[];
}

export interface AdminDigitalGoldOverview {
  totalVaultGoldGrams: number;
  activeAccountsCount: number;
  totalBuyVolumeInr: number;
  totalSellVolumeInr: number;
  pendingRedemptionsCount: number;
  lastReconciliation: any | null;
  allTransactions: any[];
}

// Helper to get auth token
async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  if (session?.user?.id) {
    headers['x-user-id'] = session.user.id;
    if (session.user.email) {
      headers['x-user-email'] = session.user.email;
    }
  }
  return headers;
}

export async function fetchDigitalGoldRates(): Promise<DigitalGoldRates> {
  const res = await fetch(`${API_BASE}/api/v1/digital-gold/rates`);
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to fetch digital gold rates');
  }
  return json.rates;
}

export async function requestBullionQuote(params: {
  type: 'BUY' | 'SELL';
  amountInr?: number;
  grams?: number;
}): Promise<BullionQuote> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/v1/digital-gold/quote`, {
    method: 'POST',
    headers,
    body: JSON.stringify(params)
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to generate locked bullion quote');
  }
  return json.quote;
}

export async function createBuyOrder(quoteId: string): Promise<{
  transaction: any;
  razorpay: {
    key: string;
    orderId: string;
    amount: number;
    currency: string;
    name: string;
    description: string;
  };
}> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/v1/digital-gold/buy/order`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ quoteId })
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to initialize buy order');
  }
  return json;
}

export async function verifyBuyPayment(data: {
  transactionId: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
}): Promise<{
  success: boolean;
  message: string;
  transaction: any;
  vaultBalance: number;
}> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/v1/digital-gold/buy/verify`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data)
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to verify payment and allocate gold');
  }
  return json;
}

export async function executeSellBack(params: {
  quoteId: string;
  bankDetails: {
    accountNumber: string;
    ifscCode: string;
    accountHolderName: string;
    bankName: string;
  };
}): Promise<{
  success: boolean;
  message: string;
  transaction: any;
  remainingBalance: number;
}> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/v1/digital-gold/sell/execute`, {
    method: 'POST',
    headers,
    body: JSON.stringify(params)
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to execute gold sell-back');
  }
  return json;
}

export async function fetchRedemptionProducts(): Promise<RedemptionProduct[]> {
  const res = await fetch(`${API_BASE}/api/v1/digital-gold/products/redemption`);
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to fetch minted gold products');
  }
  return json.products;
}

export async function requestPhysicalRedemption(params: {
  productId: string;
  shippingAddress: {
    deliveryName: string;
    deliveryPhone: string;
    deliveryAddress: string;
    city: string;
    state: string;
    pincode: string;
  };
}): Promise<{
  success: boolean;
  message: string;
  redemption: any;
  remainingBalance: number;
}> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/v1/digital-gold/redeem`, {
    method: 'POST',
    headers,
    body: JSON.stringify(params)
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to request physical redemption');
  }
  return json;
}

export async function fetchCustomerWallet(): Promise<CustomerWallet | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return null;
  }
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/v1/digital-gold/wallet`, {
    headers
  });
  if (res.status === 401) {
    return null;
  }
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to fetch digital gold wallet');
  }
  return json.wallet;
}

export async function fetchCustomerTransactions(): Promise<any[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return [];
  }
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/v1/digital-gold/transactions`, {
    headers
  });
  if (res.status === 401) {
    return [];
  }
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to fetch transactions');
  }
  return json.transactions || [];
}

export async function fetchAdminOverview(): Promise<AdminDigitalGoldOverview> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/v1/digital-gold/admin/overview`, {
    headers
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to fetch admin overview');
  }
  return json.overview;
}

export async function triggerAdminReconciliation(): Promise<{
  success: boolean;
  message: string;
  reconciliation: any;
}> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/v1/digital-gold/admin/reconcile`, {
    method: 'POST',
    headers
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to trigger custody reconciliation');
  }
  return json;
}
