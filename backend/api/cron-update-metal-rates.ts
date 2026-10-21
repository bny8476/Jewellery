import type { IncomingMessage, ServerResponse } from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const GRAMS_PER_TROY_OUNCE = 31.1034768;

function getApiKey(): string {
  if (process.env.GOLDAPI_KEY) return process.env.GOLDAPI_KEY.trim();
  if (process.env.GOLD_API_KEY) return process.env.GOLD_API_KEY.trim();
  if (process.env.VITE_GOLD_API_KEY) return process.env.VITE_GOLD_API_KEY.trim();

  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...rest] = trimmed.split('=');
          const val = rest.join('=').trim();
          if (key.trim() === 'GOLDAPI_KEY' || key.trim() === 'GOLD_API_KEY' || key.trim() === 'VITE_GOLD_API_KEY') {
            process.env[key.trim()] = val;
            return val;
          }
        }
      }
    }
  } catch {}

  return '';
}

function getTodayISTString(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
}

function getFormattedIST(date = new Date()): string {
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'medium'
  }) + ' IST';
}

const LOCAL_SNAPSHOT_FILE = path.resolve(process.cwd(), 'data', 'daily-metal-rates.json');

export function readLocalSnapshot(): any | null {
  try {
    if (fs.existsSync(LOCAL_SNAPSHOT_FILE)) {
      const raw = fs.readFileSync(LOCAL_SNAPSHOT_FILE, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Failed to read local snapshot file:', err);
  }
  return null;
}

export function writeLocalSnapshot(payload: any): void {
  try {
    const dir = path.dirname(LOCAL_SNAPSHOT_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(LOCAL_SNAPSHOT_FILE, JSON.stringify(payload, null, 2), 'utf8');
  } catch (err) {
    console.warn('Failed to write local snapshot file:', err);
  }
}

function getSupabaseClient() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || 
              process.env.VITE_SUPABASE_ANON_KEY || 
              process.env.SUPABASE_ANON_KEY;

  if (url && key) {
    return createClient(url, key);
  }
  return null;
}

export async function executeDailyMetalRatesUpdate(force = false): Promise<{
  success: boolean;
  status: 'updated' | 'already_updated_today' | 'failed';
  message: string;
  rates?: any;
}> {
  const todayIST = getTodayISTString();
  const existingLocal = readLocalSnapshot();

  // Prevent duplicate runs on the same calendar day unless forced
  if (!force && existingLocal && existingLocal.effective_date === todayIST && existingLocal.is_successful) {
    return {
      success: true,
      status: 'already_updated_today',
      message: `Rates already updated today at ${existingLocal.updated_at_ist}. Reusing locked daily rates.`,
      rates: existingLocal.rates_payload
    };
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('GOLDAPI_KEY environment variable is not configured.');
  }

  const headers = {
    'x-access-token': apiKey,
    'Content-Type': 'application/json'
  };

  // 1. Fetch Gold, Silver, Platinum from GoldAPI.io once for the day
  console.log(`[Daily Cron] Fetching 9:00 AM IST metal rates from GoldAPI.io for ${todayIST}...`);
  const [goldRes, silverRes, platRes] = await Promise.allSettled([
    fetch('https://www.goldapi.io/api/XAU/INR', { headers }),
    fetch('https://www.goldapi.io/api/XAG/INR', { headers }),
    fetch('https://www.goldapi.io/api/XPT/INR', { headers }),
  ]);

  let goldData: any = null;
  let silverData: any = null;
  let platData: any = null;

  if (goldRes.status === 'fulfilled' && goldRes.value.ok) {
    goldData = await goldRes.value.json();
  }
  if (silverRes.status === 'fulfilled' && silverRes.value.ok) {
    silverData = await silverRes.value.json();
  }
  if (platRes.status === 'fulfilled' && platRes.value.ok) {
    platData = await platRes.value.json();
  }

  const validGoldPrice = goldData?.price_gram_24k || goldData?.price;
  const validSilverPrice = silverData?.price_gram_24k || silverData?.price;

  if (!validGoldPrice && !validSilverPrice) {
    throw new Error('GoldAPI returned invalid or empty responses. Daily rates update aborted.');
  }

  // 2. Parse purity values
  const round2 = (num: number) => Math.round(num * 100) / 100;

  const gold24kPerGram = Number(
    goldData?.price_gram_24k ||
    (goldData?.price ? goldData.price / GRAMS_PER_TROY_OUNCE : null)
  );
  const gold22kPerGram = Number(
    goldData?.price_gram_22k ||
    (gold24kPerGram * 0.916)
  );
  const gold18kPerGram = Number(
    goldData?.price_gram_18k ||
    (gold24kPerGram * 0.750)
  );

  const goldChangePercent = Number(goldData?.chp || goldData?.change_percent || 0);
  const goldChangePerGram = goldData?.ch
    ? Math.round((goldData.ch / GRAMS_PER_TROY_OUNCE) * 100) / 100
    : Math.round((gold24kPerGram * (goldChangePercent / 100)) * 100) / 100;

  const silverPerGram = Number(
    silverData?.price_gram_24k ||
    silverData?.price_per_unit?.gram ||
    (silverData?.price ? silverData.price / GRAMS_PER_TROY_OUNCE : null)
  );
  const silverChangePercent = Number(silverData?.chp || silverData?.change_percent || 0);
  const silverChangePerGram = silverData?.ch
    ? Math.round((silverData.ch / GRAMS_PER_TROY_OUNCE) * 100) / 100
    : Math.round((silverPerGram * (silverChangePercent / 100)) * 100) / 100;

  const platPerGram = Number(
    platData?.price_gram_24k ||
    platData?.price_per_unit?.gram ||
    (platData?.price ? platData.price / GRAMS_PER_TROY_OUNCE : null) ||
    0
  );
  const platChangePercent = Number(platData?.chp || platData?.change_percent || 0);
  const platChangePerGram = platData?.ch
    ? Math.round((platData.ch / GRAMS_PER_TROY_OUNCE) * 100) / 100
    : Math.round((platPerGram * (platChangePercent / 100)) * 100) / 100;

  const now = new Date();
  const istFormatted = getFormattedIST(now);

  const ratesPayload = {
    gold: {
      symbol: 'XAU',
      k24: {
        ratePerGram: round2(gold24kPerGram),
        ratePer10Gram: round2(gold24kPerGram * 10),
        change24h: round2(goldChangePerGram),
        changePercent24h: round2(goldChangePercent),
        high24h: goldData?.high_price ? round2(goldData.high_price / GRAMS_PER_TROY_OUNCE) : undefined,
        low24h: goldData?.low_price ? round2(goldData.low_price / GRAMS_PER_TROY_OUNCE) : undefined,
        prevClose: goldData?.prev_close_price ? round2(goldData.prev_close_price / GRAMS_PER_TROY_OUNCE) : undefined
      },
      k22: {
        ratePerGram: round2(gold22kPerGram),
        ratePer10Gram: round2(gold22kPerGram * 10),
        change24h: round2(goldChangePerGram * 0.916),
        changePercent24h: round2(goldChangePercent)
      },
      k18: {
        ratePerGram: round2(gold18kPerGram),
        ratePer10Gram: round2(gold18kPerGram * 10),
        change24h: round2(goldChangePerGram * 0.75),
        changePercent24h: round2(goldChangePercent)
      }
    },
    silver: {
      symbol: 'XAG',
      ratePerGram: round2(silverPerGram),
      ratePer10Gram: round2(silverPerGram * 10),
      ratePerKg: round2(silverPerGram * 1000),
      change24h: round2(silverChangePerGram),
      changePercent24h: round2(silverChangePercent),
      high24h: silverData?.high_price ? round2(silverData.high_price / GRAMS_PER_TROY_OUNCE) : undefined,
      low24h: silverData?.low_price ? round2(silverData.low_price / GRAMS_PER_TROY_OUNCE) : undefined
    },
    platinum: {
      symbol: 'XPT',
      ratePerGram: round2(platPerGram),
      ratePer10Gram: round2(platPerGram * 10),
      ratePerKg: round2(platPerGram * 1000),
      change24h: round2(platChangePerGram),
      changePercent24h: round2(platChangePercent),
      high24h: platData?.high_price ? round2(platData.high_price / GRAMS_PER_TROY_OUNCE) : undefined,
      low24h: platData?.low_price ? round2(platData.low_price / GRAMS_PER_TROY_OUNCE) : undefined
    },
    retailEstimates: {
      gold24kRetail: round2(gold24kPerGram),
      gold22kRetail: round2(gold22kPerGram),
      silverRetailPerKg: round2(silverPerGram * 1000),
      gstRatePercent: 3.0,
      dutyNote: 'Official 9:00 AM IST daily bullion opening rates. Showroom estimates exclude 3% GST and crafting charges.'
    },
    metadata: {
      timestamp: now.toISOString(),
      istTime: istFormatted,
      source: 'GoldAPI.io Daily 9:00 AM IST Benchmark (IDC / LBMA Spot)',
      isLive: true,
      cached: true,
      cacheAgeSeconds: 0,
      stale: false,
      providerStatus: 'connected',
      updateSchedule: 'Once daily at 9:00 AM IST'
    }
  };

  const snapshotRecord = {
    effective_date: todayIST,
    is_successful: true,
    updated_at_ist: istFormatted,
    provider: 'GoldAPI.io',
    provider_timestamp: new Date((goldData?.timestamp || Math.floor(Date.now() / 1000)) * 1000).toISOString(),
    rates_payload: ratesPayload,
    gold_24k: round2(gold24kPerGram),
    gold_22k: round2(gold22kPerGram),
    gold_18k: round2(gold18kPerGram),
    silver_gram: round2(silverPerGram),
    silver_kg: round2(silverPerGram * 1000),
    platinum_gram: round2(platPerGram),
    platinum_kg: round2(platPerGram * 1000)
  };

  // 3. Persist to local disk snapshot
  writeLocalSnapshot(snapshotRecord);

  // 4. Persist to Supabase Database if connected
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('daily_metal_rates_snapshot').upsert(
        {
          effective_date: todayIST,
          gold_24k: round2(gold24kPerGram),
          gold_22k: round2(gold22kPerGram),
          gold_18k: round2(gold18kPerGram),
          silver_gram: round2(silverPerGram),
          silver_kg: round2(silverPerGram * 1000),
          platinum_gram: round2(platPerGram),
          platinum_kg: round2(platPerGram * 1000),
          rates_payload: ratesPayload,
          provider: 'GoldAPI.io',
          provider_timestamp: snapshotRecord.provider_timestamp,
          updated_at_ist: istFormatted
        },
        { onConflict: 'effective_date' }
      );

      // Also upsert ERP metal_rates table
      await Promise.allSettled([
        supabase.from('metal_rates').upsert(
          { metal_type: 'gold', rate_per_gram: round2(gold24kPerGram), effective_date: todayIST },
          { onConflict: 'metal_type,effective_date' }
        ),
        supabase.from('metal_rates').upsert(
          { metal_type: 'silver', rate_per_gram: round2(silverPerGram), effective_date: todayIST },
          { onConflict: 'metal_type,effective_date' }
        )
      ]);
      console.log(`[Daily Cron] Successfully saved daily rates into Supabase database for ${todayIST}`);
    } catch (dbErr) {
      console.warn('[Daily Cron] Database sync notice (local snapshot active):', dbErr);
    }
  }

  return {
    success: true,
    status: 'updated',
    message: `Rates successfully fetched from GoldAPI.io and locked for ${todayIST} at ${istFormatted}`,
    rates: ratesPayload
  };
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  // Authorization check for scheduled cron jobs or manual trigger
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : '';

  const safeCompare = (a: string, b: string): boolean => {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
  };

  if (cronSecret) {
    let authorized = Boolean(token && safeCompare(token, cronSecret));
    if (!authorized && token) {
      // Check if it's an authenticated staff token triggering manual sync
      try {
        const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
        if (supabaseUrl && supabaseKey) {
          const client = createClient(supabaseUrl, supabaseKey);
          const { data: { user } } = await client.auth.getUser(token);
          if (user) {
            authorized = true;
          }
        }
      } catch {}
    }

    if (!authorized) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Unauthorized: Valid CRON_SECRET or staff authorization Bearer token required.' }));
      return;
    }
  } else if (process.env.NODE_ENV === 'production') {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Server misconfiguration: CRON_SECRET is required in production' }));
    return;
  }

  const url = new URL(req.url || '', 'http://localhost');
  const force = url.searchParams.get('force') === 'true';

  try {
    const result = await executeDailyMetalRatesUpdate(force);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(result));
  } catch (err: any) {
    console.error('[Daily Cron Error]:', err);
    res.statusCode = 502;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: false,
      status: 'failed',
      error: err.message || 'Daily rates update failed'
    }));
  }
}
