import type { IncomingMessage, ServerResponse } from 'http';
import crypto from 'crypto';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  max: number;      // Max allowed requests in time window
  message?: string;
  keyGenerator?: (req: IncomingMessage) => string;
}

interface ClientRecord {
  count: number;
  resetTime: number;
}

const stores = new Map<string, Map<string, ClientRecord>>();

/**
 * Resolves client identity securely.
 * Respects reverse proxies (Cloudflare, Render, Vercel) only when configured as a trusted proxy.
 */
export function getClientIp(req: IncomingMessage): string {
  const isTrustedProxy = process.env.TRUSTED_PROXY === 'true' || process.env.NODE_ENV === 'production';

  if (isTrustedProxy) {
    const cfIp = req.headers['cf-connecting-ip'];
    if (typeof cfIp === 'string' && cfIp.trim()) return cfIp.trim();

    const realIp = req.headers['x-real-ip'];
    if (typeof realIp === 'string' && realIp.trim()) return realIp.trim();

    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.trim()) {
      return forwarded.split(',')[0].trim();
    }
  }

  return req.socket.remoteAddress || '127.0.0.1';
}

/**
 * Default composite key: combines IP and hashed user auth token if present
 */
function defaultKeyGenerator(req: IncomingMessage): string {
  const ip = getClientIp(req);
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    const token = auth.substring(7).trim();
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex').slice(0, 12);
    return `${ip}_user_${tokenHash}`;
  }
  return ip;
}

export function createRateLimiter(bucketName: string, config: RateLimitConfig) {
  if (!stores.has(bucketName)) {
    stores.set(bucketName, new Map());
  }
  const store = stores.get(bucketName)!;

  // Cleanup old expired records periodically
  setInterval(() => {
    const now = Date.now();
    store.forEach((record, key) => {
      if (now > record.resetTime) {
        store.delete(key);
      }
    });
  }, Math.max(config.windowMs, 60000));

  return function checkRateLimit(req: IncomingMessage, res: ServerResponse): boolean {
    const keyGen = config.keyGenerator || defaultKeyGenerator;
    const clientKey = keyGen(req);
    const now = Date.now();

    let record = store.get(clientKey);
    if (!record || now > record.resetTime) {
      record = { count: 1, resetTime: now + config.windowMs };
      store.set(clientKey, record);
      return true;
    }

    record.count++;
    if (record.count > config.max) {
      const retryAfterSec = Math.ceil((record.resetTime - now) / 1000);
      res.statusCode = 429;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Retry-After', String(retryAfterSec));
      res.end(JSON.stringify({
        error: config.message || 'Too many requests. Please slow down and try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: retryAfterSec
      }));
      return false;
    }

    return true;
  };
}

// Configured Rate Limiters adhering to statutory & security benchmarks
export const loginLimiter = createRateLimiter('login', {
  windowMs: 60 * 1000,
  max: 5,
  message: 'Too many authentication attempts. Please wait 60 seconds before retrying.'
});

export const orderCreationLimiter = createRateLimiter('orders', {
  windowMs: 60 * 1000,
  max: 10,
  message: 'Order creation rate limit reached. Please wait a moment.'
});

export const paymentLimiter = createRateLimiter('payments', {
  windowMs: 60 * 1000,
  max: 10,
  message: 'Payment transaction rate limit exceeded. Please wait a moment before trying again.'
});

export const kycLimiter = createRateLimiter('kyc', {
  windowMs: 60 * 1000,
  max: 5,
  message: 'KYC submission rate limit reached. Please retry shortly.'
});

export const pawnLimiter = createRateLimiter('pawn', {
  windowMs: 60 * 1000,
  max: 15,
  message: 'Pawn operation rate limit reached. Please wait a moment.'
});

export const adminLimiter = createRateLimiter('admin', {
  windowMs: 60 * 1000,
  max: 40,
  message: 'Administrative request limit reached. Please slow down.'
});
