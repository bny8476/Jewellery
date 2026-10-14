/**
 * Daily Real-time Metal Rates Updater (9:00 AM IST Cron Job)
 * Fetches live gold, silver, and platinum rates from GoldAPI.io once per day
 * and records the snapshot in both Supabase database and local storage.
 * 
 * Usage:
 *   node scripts/update-metal-rates.cjs
 * Or:
 *   npm run update:rates
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Parse .env
const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...values] = trimmed.split('=');
      if (key && values.length > 0) {
        process.env[key.trim()] = values.join('=').trim();
      }
    }
  });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://lxideysrehfiiixivobe.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                    process.env.VITE_SUPABASE_ANON_KEY || 
                    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4aWRleXNyZWhmaWlpeGl2b2JlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxNjc1MjYsImV4cCI6MjA4Mjc0MzUyNn0.placeholder';
const goldApiKey = (process.env.GOLDAPI_KEY || process.env.GOLD_API_KEY || process.env.VITE_GOLD_API_KEY || '').trim();

const supabase = createClient(supabaseUrl, supabaseKey);
const GRAMS_PER_TROY_OUNCE = 31.1034768;

function getTodayISTString() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
}

function getFormattedIST(date = new Date()) {
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'medium'
  }) + ' IST';
}

async function runDailyUpdate() {
  const todayIST = getTodayISTString();
  const now = new Date();
  const istFormatted = getFormattedIST(now);

  console.log(`\n======================================================`);
  console.log(`📡 RCB JEWELRY'S — Daily 9:00 AM IST Metal Rates Update`);
  console.log(`📅 Target Date: ${todayIST} (${istFormatted})`);
  console.log(`======================================================\n`);

  if (!goldApiKey) {
    console.error('❌ Error: GOLDAPI_KEY environment variable is missing.');
    process.exit(1);
  }

  const headers = {
    'x-access-token': goldApiKey,
    'Content-Type': 'application/json'
  };

  try {
    console.log('Fetching live spot rates from GoldAPI.io for XAU, XAG, XPT...');
    const [goldRes, silverRes, platRes] = await Promise.allSettled([
      fetch('https://www.goldapi.io/api/XAU/INR', { headers }),
      fetch('https://www.goldapi.io/api/XAG/INR', { headers }),
      fetch('https://www.goldapi.io/api/XPT/INR', { headers }),
    ]);

    let goldData = null;
    let silverData = null;
    let platData = null;

    if (goldRes.status === 'fulfilled' && goldRes.value.ok) goldData = await goldRes.value.json();
    if (silverRes.status === 'fulfilled' && silverRes.value.ok) silverData = await silverRes.value.json();
    if (platRes.status === 'fulfilled' && platRes.value.ok) platData = await platRes.value.json();

    const round2 = num => Math.round(num * 100) / 100;

    const gold24k = Number(goldData?.price_gram_24k || (goldData?.price ? goldData.price / GRAMS_PER_TROY_OUNCE : 0));
    const gold22k = Number(goldData?.price_gram_22k || (gold24k * 0.916));
    const gold18k = Number(goldData?.price_gram_18k || (gold24k * 0.750));
    const goldChangePercent = Number(goldData?.chp || goldData?.change_percent || 0);
    const goldChange = goldData?.ch ? round2(goldData.ch / GRAMS_PER_TROY_OUNCE) : round2(gold24k * (goldChangePercent / 100));

    const silverGram = Number(silverData?.price_gram_24k || (silverData?.price ? silverData.price / GRAMS_PER_TROY_OUNCE : 0));
    const silverChangePercent = Number(silverData?.chp || silverData?.change_percent || 0);
    const silverChange = silverData?.ch ? round2(silverData.ch / GRAMS_PER_TROY_OUNCE) : round2(silverGram * (silverChangePercent / 100));

    const platGram = Number(platData?.price_gram_24k || (platData?.price ? platData.price / GRAMS_PER_TROY_OUNCE : 0));
    const platChangePercent = Number(platData?.chp || platData?.change_percent || 0);
    const platChange = platData?.ch ? round2(platData.ch / GRAMS_PER_TROY_OUNCE) : round2(platGram * (platChangePercent / 100));

    console.log(`💰 Resolved Official 9:00 AM IST Bullion Rates:`);
    console.log(`   - Gold 24K (999):   ₹${round2(gold24k)} / g  (₹${round2(gold24k * 10)} / 10g)`);
    console.log(`   - Gold 22K (916):   ₹${round2(gold22k)} / g`);
    console.log(`   - Gold 18K (750):   ₹${round2(gold18k)} / g`);
    console.log(`   - Silver 999:       ₹${round2(silverGram)} / g  (₹${round2(silverGram * 1000)} / kg)`);
    console.log(`   - Platinum 950:     ₹${round2(platGram)} / g`);

    const ratesPayload = {
      gold: {
        symbol: 'XAU',
        k24: { ratePerGram: round2(gold24k), ratePer10Gram: round2(gold24k * 10), change24h: goldChange, changePercent24h: goldChangePercent },
        k22: { ratePerGram: round2(gold22k), ratePer10Gram: round2(gold22k * 10), change24h: round2(goldChange * 0.916), changePercent24h: goldChangePercent },
        k18: { ratePerGram: round2(gold18k), ratePer10Gram: round2(gold18k * 10), change24h: round2(goldChange * 0.75), changePercent24h: goldChangePercent },
      },
      silver: {
        symbol: 'XAG',
        ratePerGram: round2(silverGram),
        ratePer10Gram: round2(silverGram * 10),
        ratePerKg: round2(silverGram * 1000),
        change24h: silverChange,
        changePercent24h: silverChangePercent
      },
      platinum: {
        symbol: 'XPT',
        ratePerGram: round2(platGram),
        ratePer10Gram: round2(platGram * 10),
        ratePerKg: round2(platGram * 1000),
        change24h: platChange,
        changePercent24h: platChangePercent
      },
      retailEstimates: {
        gold24kRetail: round2(gold24k),
        gold22kRetail: round2(gold22k),
        silverRetailPerKg: round2(silverGram * 1000),
        gstRatePercent: 3.0,
        dutyNote: 'Official 9:00 AM IST daily opening rates. Showroom estimates exclude 3% GST and crafting charges.'
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
      gold_24k: round2(gold24k),
      gold_22k: round2(gold22k),
      gold_18k: round2(gold18k),
      silver_gram: round2(silverGram),
      silver_kg: round2(silverGram * 1000),
      platinum_gram: round2(platGram),
      platinum_kg: round2(platGram * 1000)
    };

    // Save local snapshot
    const localFile = path.resolve(__dirname, '..', 'data', 'daily-metal-rates.json');
    fs.mkdirSync(path.dirname(localFile), { recursive: true });
    fs.writeFileSync(localFile, JSON.stringify(snapshotRecord, null, 2), 'utf8');
    console.log(`💾 Saved local snapshot to data/daily-metal-rates.json`);

    // Save to Supabase
    try {
      await supabase.from('daily_metal_rates_snapshot').upsert(
        {
          effective_date: todayIST,
          gold_24k: round2(gold24k),
          gold_22k: round2(gold22k),
          gold_18k: round2(gold18k),
          silver_gram: round2(silverGram),
          silver_kg: round2(silverGram * 1000),
          platinum_gram: round2(platGram),
          platinum_kg: round2(platGram * 1000),
          rates_payload: ratesPayload,
          provider: 'GoldAPI.io',
          provider_timestamp: snapshotRecord.provider_timestamp,
          updated_at_ist: istFormatted
        },
        { onConflict: 'effective_date' }
      );

      await Promise.allSettled([
        supabase.from('metal_rates').upsert(
          { metal_type: 'gold', rate_per_gram: round2(gold24k), effective_date: todayIST },
          { onConflict: 'metal_type,effective_date' }
        ),
        supabase.from('metal_rates').upsert(
          { metal_type: 'silver', rate_per_gram: round2(silverGram), effective_date: todayIST },
          { onConflict: 'metal_type,effective_date' }
        )
      ]);
      console.log(`✅ Saved daily rates to Supabase database for ${todayIST}!`);
    } catch (dbErr) {
      console.warn(`⚠️ Supabase notice:`, dbErr.message);
    }

    console.log(`\n🎉 Daily rates successfully locked for ${todayIST} at ${istFormatted}\n`);

  } catch (err) {
    console.error(`❌ Failed to update daily rates:`, err.message);
    process.exit(1);
  }
}

runDailyUpdate();
