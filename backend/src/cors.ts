/**
 * Centralized CORS & Allowed Origins Configuration for Backend
 *
 * Secure CORS Strategy:
 * - Allows local development origins (localhost, 127.0.0.1 on ports 5173, 3000, 5001)
 * - Dynamically supports production & preview origins from CLIENT_ORIGIN (comma-separated)
 * - Never emits wildcard Access-Control-Allow-Origin: * when credentials are used
 */

const parsedClientOrigins = (process.env.CLIENT_ORIGIN || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const parsedAppUrls = (process.env.APP_URL || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

export const ALLOWED_ORIGINS = new Set<string>([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://localhost:5001',
  'https://jewellery-inky-five.vercel.app',
  ...parsedClientOrigins,
  ...parsedAppUrls
]);

/**
 * Validates if an incoming request Origin is allowed.
 * Supports exact domain matches and glob patterns (e.g., https://*.vercel.app if defined).
 */
export function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.has(origin)) return true;

  // Support wildcard entries if explicitly configured in CLIENT_ORIGIN
  for (const allowed of ALLOWED_ORIGINS) {
    if (allowed.includes('*')) {
      const escaped = allowed.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
      const pattern = new RegExp(`^${escaped}$`, 'i');
      if (pattern.test(origin)) return true;
    }
  }

  return false;
}

