import type { IncomingMessage, ServerResponse } from 'http';
import { readLocalSnapshot, executeDailyMetalRatesUpdate } from './cron-update-metal-rates';
import { createClient } from '@supabase/supabase-js';

interface MetalRateQuote {
  ratePerGram: number;
  ratePer10Gram?: number;
  ratePerKg?: number;
  change24h: number;
  changePercent24h: number;
  high24h?: number;
  low24h?: number;
  prevClose?: number;
}

export interface MetalRatesResponse {
  gold: {
    symbol: 'XAU';
    k24: MetalRateQuote;
    k22: MetalRateQuote;
    k18: MetalRateQuote;
  };
  silver: {
    symbol: 'XAG';
  } & MetalRateQuote;
  platinum: {
    symbol: 'XPT';
  } & MetalRateQuote;
  retailEstimates: {
    gold24kRetail: number;
    gold22kRetail: number;
    silverRetailPerKg: number;
    gstRatePercent: number;
    dutyNote: string;
  };
  metadata: {
    timestamp: string;
    istTime: string;
    displayNotice: string;
    source: string;
    isLive: boolean;
    cached: boolean;
    cacheAgeSeconds: number;
    stale: boolean;
    providerStatus: 'connected' | 'fallback' | 'cached';
    effectiveDate: string;
  };
}

let inMemorySnapshot: MetalRatesResponse | null = null;
let lastMemoryLoadTime = 0;
const MEMORY_CACHE_TTL_MS = 5 * 60 * 1000; // 5 min in-memory refresh from database/disk

function getTodayISTString(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
}

async function loadSavedSnapshotFromDatabase(): Promise<any | null> {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (url && key) {
    try {
      const supabase = createClient(url, key);
      const { data, error } = await supabase
        .from('daily_metal_rates_snapshot')
        .select('*')
        .order('effective_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data && data.rates_payload) {
        return {
          effective_date: data.effective_date,
          updated_at_ist: data.updated_at_ist,
          provider_timestamp: data.provider_timestamp,
          rates_payload: data.rates_payload
        };
      }
    } catch (err) {
      console.warn('Could not query database for daily rates snapshot:', err);
    }
  }
  return null;
}

export async function getLiveMetalRatesData(): Promise<MetalRatesResponse> {
  const now = Date.now();
  const todayIST = getTodayISTString();

  // 1. Serve from in-memory cache if recently checked
  if (inMemorySnapshot && (now - lastMemoryLoadTime < MEMORY_CACHE_TTL_MS)) {
    const isToday = inMemorySnapshot.metadata.effectiveDate === todayIST;
    return {
      ...inMemorySnapshot,
      metadata: {
        ...inMemorySnapshot.metadata,
        cached: true,
        stale: !isToday,
        cacheAgeSeconds: Math.floor((now - lastMemoryLoadTime) / 1000)
      }
    };
  }

  // 2. Load saved snapshot from local disk storage or Supabase database (WITHOUT calling GoldAPI.io)
  let savedSnapshot = readLocalSnapshot();

  if (!savedSnapshot) {
    savedSnapshot = await loadSavedSnapshotFromDatabase();
  }

  // 3. If no daily snapshot exists yet (e.g. cold start / first setup), trigger initial seed
  if (!savedSnapshot) {
    console.log('[Rates Service] Initializing first daily snapshot from GoldAPI.io...');
    try {
      const seedResult = await executeDailyMetalRatesUpdate(false);
      savedSnapshot = readLocalSnapshot() || {
        effective_date: todayIST,
        updated_at_ist: seedResult.rates.metadata.istTime,
        rates_payload: seedResult.rates
      };
    } catch (seedErr) {
      console.error('[Rates Service] Initial snapshot seed failed:', seedErr);
    }
  }

  if (!savedSnapshot || !savedSnapshot.rates_payload) {
    throw new Error('No saved metal rates found. Please ensure daily cron has executed.');
  }

  // 4. Check freshness: compare saved snapshot effective date with today's IST date
  const isToday = savedSnapshot.effective_date === todayIST;
  const ratesPayload = savedSnapshot.rates_payload;

  const displayNotice = isToday
    ? `Rates last updated on ${savedSnapshot.effective_date} at 9:00 AM IST`
    : `Rates last updated on ${savedSnapshot.effective_date} (Prevailing Benchmark - Pending 9:00 AM IST Update)`;

  const response: MetalRatesResponse = {
    ...ratesPayload,
    metadata: {
      ...ratesPayload.metadata,
      cached: true,
      stale: !isToday,
      isLive: isToday,
      effectiveDate: savedSnapshot.effective_date,
      displayNotice,
      providerStatus: isToday ? 'connected' : 'fallback',
      cacheAgeSeconds: Math.floor((now - lastMemoryLoadTime) / 1000)
    }
  };

  inMemorySnapshot = response;
  lastMemoryLoadTime = now;
  return response;
}

export default async function handler(_req: IncomingMessage, res: ServerResponse) {
  try {
    const rates = await getLiveMetalRatesData();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=900');
    res.statusCode = 200;
    res.end(JSON.stringify(rates));
  } catch (err: any) {
    res.statusCode = 502;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: err.message || 'Service Unavailable' }));
  }
}
