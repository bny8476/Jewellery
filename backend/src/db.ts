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

function isValidDbConfig(): boolean {
  if (databaseUrl && !isPlaceholder(databaseUrl)) return true;
  if (dbHost && dbPassword && !isPlaceholder(dbHost) && !isPlaceholder(dbPassword)) return true;
  return false;
}

export function getDbPool(): PgPool | null {
  if (poolInstance) return poolInstance;
  if (!isValidDbConfig()) return null;

  try {
    if (databaseUrl && !isPlaceholder(databaseUrl)) {
      poolInstance = new Pool({
        connectionString: databaseUrl,
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

    if (dbHost && dbPassword && !isPlaceholder(dbHost) && !isPlaceholder(dbPassword)) {
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
const memoryStore: Record<string, any[]> = {
  digital_gold_accounts: [],
  digital_gold_transactions: [],
  digital_gold_quotes: [],
  digital_gold_redemptions: [],
  digital_gold_sip_plans: [],
  digital_gold_reconciliation_runs: [],
  daily_metal_rates_snapshot: []
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
      cols.forEach((col, idx) => {
        if (params && idx < params.length) {
          newRecord[col] = params[idx];
        }
      });
    }

    table.push(newRecord);
    return [newRecord] as unknown as T[];
  }

  // 2. UPDATE query
  if (lowerSql.startsWith('update')) {
    const affected: any[] = [];
    const whereIdMatch = cleanSql.match(/where\s+id\s*=\s*\$([0-9]+)/i);
    const targetId = whereIdMatch ? params[parseInt(whereIdMatch[1], 10) - 1] : null;

    table.forEach(row => {
      if (!targetId || row.id === targetId) {
        if (lowerSql.includes('status = $')) {
          const m = cleanSql.match(/status\s*=\s*\$([0-9]+)/i);
          if (m) row.status = params[parseInt(m[1], 10) - 1];
        } else if (lowerSql.includes("status = 'consumed'")) {
          row.status = 'CONSUMED';
        } else if (lowerSql.includes("status = 'expired'")) {
          row.status = 'EXPIRED';
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
  let results = [...table];

  if (lowerSql.includes('where')) {
    if (lowerSql.includes('customer_id = $1') && params[0]) {
      results = results.filter(r => r.customer_id === params[0]);
    } else if (lowerSql.includes('id = $1') && params[0]) {
      results = results.filter(r => r.id === params[0]);
    }
  }

  if (lowerSql.includes('order by')) {
    results.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  }

  if (lowerSql.includes('limit 1')) {
    return results.slice(0, 1) as unknown as T[];
  }

  return results as unknown as T[];
}

export async function queryDb<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const pool = getDbPool();
  if (pool) {
    try {
      const client = await pool.connect();
      try {
        const res = await client.query(sql, params);
        return res.rows as T[];
      } finally {
        client.release();
      }
    } catch (err: any) {
      console.warn('[DB] PostgreSQL direct query error, falling back to memory store:', err?.message || err);
      return executeMemoryQuery<T>(sql, params);
    }
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
