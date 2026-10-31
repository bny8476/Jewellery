import pg from 'pg';
import crypto from 'crypto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const { Pool } = pg;
type PgPool = InstanceType<typeof Pool>;

// Environment variable resolution
const databaseUrl = process.env.DATABASE_URL || '';
const dbHost = process.env.DB_HOST || '';
const dbPassword = process.env.DB_PASSWORD || '';
const dbUser = process.env.DB_USER || 'postgres';
const dbPort = parseInt(process.env.DB_PORT || '5432', 10);
const dbName = process.env.DB_NAME || 'postgres';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://lxideysrehfiiixivobe.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                    process.env.SUPABASE_ANON_KEY || 
                    process.env.VITE_SUPABASE_ANON_KEY || 
                    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4aWRleXNyZWhmaWlpeGl2b2JlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxNjc1MjYsImV4cCI6MjA4Mjc0MzUyNn0.placeholder';

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

let poolInstance: PgPool | null = null;

function isPlaceholder(val?: string): boolean {
  if (!val) return true;
  const lower = val.toLowerCase();
  return lower.includes('your-project-id') || 
         lower.includes('placeholder') || 
         val === 'your_database_password' || 
         val === 'your_key_id';
}

function getEffectiveDatabaseUrl(): string {
  return process.env.DATABASE_URL || databaseUrl;
}

function isValidDbConfig(): boolean {
  const url = getEffectiveDatabaseUrl();
  if (url && !isPlaceholder(url)) return true;
  const host = process.env.DB_HOST || dbHost;
  const pwd = process.env.DB_PASSWORD || dbPassword;
  if (host && pwd && !isPlaceholder(host) && !isPlaceholder(pwd)) return true;
  return false;
}

export function getDbPool(): PgPool | null {
  if (poolInstance) return poolInstance;
  if (!isValidDbConfig()) return null;

  try {
    const url = getEffectiveDatabaseUrl();
    if (url && !isPlaceholder(url)) {
      poolInstance = new Pool({
        connectionString: url,
        ssl: { rejectUnauthorized: false },
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000
      });
      (poolInstance as any).on('error', (err: any) => {
        console.warn('[DB] Handled idle PostgreSQL client error (recovered):', err?.message || err);
      });
      return poolInstance;
    }

    const host = process.env.DB_HOST || dbHost;
    const pwd = process.env.DB_PASSWORD || dbPassword;
    if (host && pwd && !isPlaceholder(host) && !isPlaceholder(pwd)) {
      poolInstance = new Pool({
        host: dbHost,
        port: dbPort,
        user: dbUser,
        password: dbPassword,
        database: dbName,
        ssl: { rejectUnauthorized: false },
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000
      });
      (poolInstance as any).on('error', (err: any) => {
        console.warn('[DB] Handled idle PostgreSQL client error (recovered):', err?.message || err);
      });
      return poolInstance;
    }
  } catch (err) {
    console.warn('[DB] PostgreSQL pool initialization skipped, using fallback store:', err);
  }

  return null;
}

// In-Memory SQLite/PostgreSQL-compatible store for resilient local development & offline sandbox
export const memoryStore: Record<string, any[]> = {
  digital_gold_accounts: [],
  digital_gold_transactions: [],
  digital_gold_quotes: [],
  digital_gold_redemptions: [],
  digital_gold_sip_plans: [],
  digital_gold_reconciliation_runs: [],
  daily_metal_rates_snapshot: [],
  gift_cards: [],
  gift_card_transactions: [],
  gift_card_purchases: [],
  gift_card_audit_logs: [],
  gift_card_configs: [],
  gift_card_designs: [],
  jewelry_items: [],
  audit_logs: [],
  pos_sale_items: [],
  notifications: [],
  notification_preferences: [],
  customer_kyc: [],
  customer_kyc_audit: [],
  customers: [],
  pledges: [],
  pledge_items: [],
  part_payments: [],
  pledge_returns: [],
  pledge_renewals: [],
  pawn_accounting_ledger: [],
  collateral_vault_custody_log: [],
  pawn_enquiries: [],
  promotional_campaigns: [],
  campaign_analytics: []
};

export function executeMemoryQuery<T = any>(sql: string, params: any[] = []): T[] {
  const cleanSql = sql.trim();
  const lowerSql = cleanSql.toLowerCase();

  // Extract table name
  const tableMatch = lowerSql.match(/(?:from|into|update)\s+(?:public\.)?([a-z0-9_]+)/i);
  const tableName = tableMatch ? tableMatch[1].toLowerCase() : '';
  if (!tableName) return [] as T[];

  if (!memoryStore[tableName]) {
    memoryStore[tableName] = [];
  }
  const table = memoryStore[tableName];

  // 1. INSERT query
  if (lowerSql.startsWith('insert')) {
    const colMatch = cleanSql.match(/\(([^)]+)\)\s+values\s*\(([^)]+)\)/i);
    const newRecord: Record<string, any> = {
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (colMatch) {
      const cols = colMatch[1].split(',').map(c => c.trim().toLowerCase());
      const valTokens = colMatch[2].split(',').map(v => v.trim());
      valTokens.forEach((token, idx) => {
        const col = cols[idx];
        if (!col) return;
        if (token.startsWith('$')) {
          const paramIdx = parseInt(token.substring(1), 10) - 1;
          newRecord[col] = params[paramIdx];
        } else if (token.toUpperCase() === 'NOW()') {
          newRecord[col] = new Date().toISOString();
        } else if (token.startsWith("'") && token.endsWith("'")) {
          newRecord[col] = token.slice(1, -1);
        } else if (token.toUpperCase() === 'TRUE') {
          newRecord[col] = true;
        } else if (token.toUpperCase() === 'FALSE') {
          newRecord[col] = false;
        } else if (token.toUpperCase() === 'NULL') {
          newRecord[col] = null;
        }
      });
    }

    table.push(newRecord);
    return [newRecord] as unknown as T[];
  }

  // 2. UPDATE query
  if (lowerSql.startsWith('update')) {
    const affected: any[] = [];
    const whereIdMatch = cleanSql.match(/where\s+(?:k\.)?id\s*=\s*\$([0-9]+)/i);
    const whereCustMatch = cleanSql.match(/where\s+(?:k\.)?customer_id\s*=\s*\$([0-9]+)/i);
    const targetId = whereIdMatch ? params[parseInt(whereIdMatch[1], 10) - 1] : null;
    const targetCustId = whereCustMatch ? params[parseInt(whereCustMatch[1], 10) - 1] : null;

    table.forEach(row => {
      if ((!targetId && !targetCustId) || (targetId && row.id === targetId) || (targetCustId && row.customer_id === targetCustId)) {
        if (lowerSql.includes('status = $')) {
          const m = cleanSql.match(/status\s*=\s*\$([0-9]+)/i);
          if (m) row.status = params[parseInt(m[1], 10) - 1];
        } else if (lowerSql.includes("status = 'pending_verification'")) {
          row.status = 'PENDING_VERIFICATION';
        } else if (lowerSql.includes("status = 'under_review'")) {
          row.status = 'UNDER_REVIEW';
        } else if (lowerSql.includes("status = 'verified'")) {
          row.status = 'VERIFIED';
        } else if (lowerSql.includes("status = 'rejected'")) {
          row.status = 'REJECTED';
        } else if (lowerSql.includes("status = 'action_required'")) {
          row.status = 'ACTION_REQUIRED';
        } else if (lowerSql.includes("status = 'consumed'")) {
          row.status = 'CONSUMED';
        } else if (lowerSql.includes("status = 'expired'")) {
          row.status = 'EXPIRED';
        }

        if (lowerSql.includes('rejection_reason = $')) {
          const m = cleanSql.match(/rejection_reason\s*=\s*\$([0-9]+)/i);
          if (m) row.rejection_reason = params[parseInt(m[1], 10) - 1];
        }
        if (lowerSql.includes('action_required_notes = $')) {
          const m = cleanSql.match(/action_required_notes\s*=\s*\$([0-9]+)/i);
          if (m) row.action_required_notes = params[parseInt(m[1], 10) - 1];
        }
        if (lowerSql.includes('reviewer_name = $')) {
          const m = cleanSql.match(/reviewer_name\s*=\s*\$([0-9]+)/i);
          if (m) row.reviewer_name = params[parseInt(m[1], 10) - 1];
        }
        if (lowerSql.includes('verified_at = now()')) {
          row.verified_at = new Date().toISOString();
        }

        if (lowerSql.includes('gold_balance_grams = $')) {
          const m = cleanSql.match(/gold_balance_grams\s*=\s*\$([0-9]+)/i);
          if (m) row.gold_balance_grams = params[parseInt(m[1], 10) - 1];
        }
        if (lowerSql.includes('silver_balance_grams = $')) {
          const m = cleanSql.match(/silver_balance_grams\s*=\s*\$([0-9]+)/i);
          if (m) row.silver_balance_grams = params[parseInt(m[1], 10) - 1];
        }
        row.updated_at = new Date().toISOString();
        affected.push(row);
      }
    });

    return affected as unknown as T[];
  }

  // 3. SELECT query
  if (lowerSql.includes('count(*)') && tableName === 'customer_kyc') {
    const total = table.length;
    const pending = table.filter(r => r.status === 'PENDING_VERIFICATION').length;
    const under_review = table.filter(r => r.status === 'UNDER_REVIEW').length;
    const verified = table.filter(r => r.status === 'VERIFIED').length;
    const rejected = table.filter(r => r.status === 'REJECTED').length;
    const action_required = table.filter(r => r.status === 'ACTION_REQUIRED').length;

    return [{
      total: String(total),
      pending: String(pending),
      under_review: String(under_review),
      verified: String(verified),
      rejected: String(rejected),
      action_required: String(action_required)
    }] as unknown as T[];
  }

  let results = [...table];

  if (lowerSql.includes('where')) {
    if (lowerSql.includes('pan_hash = $1') && params.length >= 3) {
      results = results.filter(r => 
        (r.pan_hash === params[0] || r.aadhaar_hash === params[1]) && 
        r.customer_id !== params[2] && 
        r.status === 'VERIFIED'
      );
    } else if ((lowerSql.includes('customer_id = $1') || lowerSql.includes('k.customer_id = $1')) && params[0]) {
      results = results.filter(r => r.customer_id === params[0]);
    } else if (lowerSql.includes('kyc_id = $1') && params[0]) {
      results = results.filter(r => r.kyc_id === params[0]);
    } else if ((lowerSql.includes('id = $1') || lowerSql.includes('k.id = $1')) && params[0]) {
      results = results.filter(r => r.id === params[0] || r.reference_id === params[0]);
    }
  }

  if (lowerSql.includes('order by')) {
    results.sort((a, b) => (b.submitted_at || b.created_at || '').localeCompare(a.submitted_at || a.created_at || ''));
  }

  if (lowerSql.includes('limit 1')) {
    return results.slice(0, 1) as unknown as T[];
  }

  return results as unknown as T[];
}

export async function queryDb<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const pool = getDbPool();
  if (pool) {
    let client: any = null;
    try {
      client = await pool.connect();
      const res = await client.query(sql, params);
      return res.rows as T[];
    } catch (err: any) {
      // Diagnostic database failure logging
      const diagnostic = {
        message: err?.message || String(err),
        code: err?.code,
        detail: err?.detail,
        hint: err?.hint,
        position: err?.position,
        schema: err?.schema,
        table: err?.table,
        column: err?.column,
        query: sql.replace(/\s+/g, ' ').trim(),
        paramCount: params.length
      };
      console.error('[DB FATAL ERROR] PostgreSQL query execution failed:', diagnostic);

      const isProduction = process.env.NODE_ENV === 'production' || process.env.STRICT_DB === 'true';
      // Do NOT silently switch to memory storage in production or when connected to PostgreSQL
      if (isProduction || process.env.ALLOW_MEMORY_FALLBACK !== 'true') {
        const dbError: any = new Error(`Database query failed: ${err?.message || 'Internal Database Error'}`);
        dbError.code = err?.code || 'DATABASE_ERROR';
        dbError.detail = err?.detail;
        dbError.diagnostic = diagnostic;
        throw dbError;
      }

      console.warn('[DB DEV WARNING] Falling back to memory store in local dev mode only:', err?.message || err);
      return executeMemoryQuery<T>(sql, params);
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  // When no pool is configured:
  if (process.env.NODE_ENV === 'production') {
    const fatalMsg = '[DB FATAL] No PostgreSQL pool available in production environment';
    console.error(fatalMsg);
    throw new Error(fatalMsg);
  }

  // Fallback to in-memory store for local sandbox/dev when PG pool is not configured
  return executeMemoryQuery<T>(sql, params);
}

export async function checkDatabaseHealth(): Promise<{
  ok: boolean;
  provider: 'postgresql' | 'supabase_rest';
  latencyMs: number;
  error?: string;
}> {
  const start = Date.now();
  const pool = getDbPool();

  if (pool) {
    try {
      const client = await pool.connect();
      try {
        await client.query('SELECT 1 as ping');
        return {
          ok: true,
          provider: 'postgresql',
          latencyMs: Date.now() - start
        };
      } finally {
        client.release();
      }
    } catch (err: any) {
      console.warn('[DB Health] PostgreSQL ping failed, testing Supabase REST:', err.message);
    }
  }

  try {
    const { error } = await supabase.from('metal_rates').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      return {
        ok: false,
        provider: 'supabase_rest',
        latencyMs: Date.now() - start,
        error: error.message
      };
    }
    return {
      ok: true,
      provider: 'supabase_rest',
      latencyMs: Date.now() - start
    };
  } catch (err: any) {
    return {
      ok: false,
      provider: 'supabase_rest',
      latencyMs: Date.now() - start,
      error: err.message
    };
  }
}
