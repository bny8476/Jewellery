import pg from 'pg';
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

export function getDbPool(): PgPool | null {
  if (poolInstance) return poolInstance;

  try {
    if (databaseUrl) {
      poolInstance = new Pool({
        connectionString: databaseUrl,
        ssl: { rejectUnauthorized: false },
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000
      });
      return poolInstance;
    }

    if (dbHost && dbPassword) {
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
      return poolInstance;
    }
  } catch (err) {
    console.warn('[DB] PostgreSQL pool initialization skipped, using Supabase REST API:', err);
  }

  return null;
}

export async function queryDb<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const pool = getDbPool();
  if (pool) {
    const client = await pool.connect();
    try {
      const res = await client.query(sql, params);
      return res.rows as T[];
    } finally {
      client.release();
    }
  }

  // Fallback to Supabase PostgREST if raw PG pool is not configured
  throw new Error('Database direct pool not configured. Please supply DATABASE_URL or DB_HOST credentials.');
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
    const { data, error } = await supabase.from('metal_rates').select('id').limit(1);
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
