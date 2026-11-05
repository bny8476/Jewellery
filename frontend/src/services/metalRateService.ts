export interface MetalRateQuote {
  ratePerGram: number;
  ratePer10Gram?: number;
  ratePerKg?: number;
  change24h: number;
  changePercent24h: number;
  high24h?: number;
  low24h?: number;
  prevClose?: number;
}

export interface MetalRatesData {
  gold: {
    k24: MetalRateQuote;
    k22: MetalRateQuote;
    k18: MetalRateQuote;
  };
  silver: MetalRateQuote;
  platinum: MetalRateQuote;
  retailEstimates: {
    gold22kRetail: number;
    gold24kRetail: number;
    silverRetailPerKg: number;
    gstRatePercent: number;
    dutyNote: string;
  };
  metadata: {
    timestamp: string;
    istTime: string;
    source: string;
    isLive: boolean;
    cached: boolean;
    cacheAgeSeconds: number;
    stale: boolean;
    providerStatus: 'connected' | 'fallback' | 'cached';
  };
}

export interface MetalHistoryPoint {
  date: string;
  dayLabel: string;
  gold24k: number;
  gold22k: number;
  silver: number;
  platinum: number;
}

export interface MetalRatesHistoryData {
  history: MetalHistoryPoint[];
  period: '7d' | '30d';
  source: string;
  timestamp: string;
}

const BACKEND_URL = ((import.meta as any).env?.VITE_BACKEND_URL || 'http://localhost:5001').replace(/\/$/, '');

export async function fetchLiveMetalRates(): Promise<MetalRatesData> {
  const response = await fetch(`${BACKEND_URL}/api/metal-rates`, {
    method: 'GET',
    headers: { 'Accept': 'application/json' }
  });

  const contentType = response.headers.get('content-type') || '';
  if (!response.ok || !contentType.includes('application/json')) {
    throw new Error(`Failed to fetch metal rates: HTTP ${response.status}`);
  }

  return response.json();
}

export async function fetchMetalRatesHistory(days = 7): Promise<MetalRatesHistoryData> {
  const response = await fetch(`${BACKEND_URL}/api/metal-rates/history?days=${days}`, {
    method: 'GET',
    headers: { 'Accept': 'application/json' }
  });

  const contentType = response.headers.get('content-type') || '';
  if (!response.ok || !contentType.includes('application/json')) {
    throw new Error(`Failed to fetch metal rates history: HTTP ${response.status}`);
  }

  return response.json();
}

export async function testProviderConnectivity() {
  const response = await fetch(`${BACKEND_URL}/api/metal-rates/admin/test`, {
    method: 'GET',
    headers: { 'Accept': 'application/json' }
  });

  const contentType = response.headers.get('content-type') || '';
  if (!response.ok || !contentType.includes('application/json')) {
    throw new Error(`Connectivity check failed: HTTP ${response.status}`);
  }

  return response.json();
}
