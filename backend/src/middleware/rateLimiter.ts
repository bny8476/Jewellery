import type { IncomingMessage, ServerResponse } from 'http';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  max: number;      // Max allowed requests in time window
  message?: string;
}

interface ClientRecord {
  count: number;
  resetTime: number;
}

const stores = new Map<string, Map<string, ClientRecord>>();

function getClientIp(req: IncomingMessage): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || '127.0.0.1';
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
    const ip = getClientIp(req);
    const now = Date.now();

    let record = store.get(ip);
    if (!record || now > record.resetTime) {
      record = { count: 1, resetTime: now + config.windowMs };
      store.set(ip, record);
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
        retryAfter: retryAfterSec
      }));
      return false;
    }

    return true;
  };
}

// Configured Rate Limiters
export const loginLimiter = createRateLimiter('login', {
  windowMs: 60 * 1000,
  max: 5,
  message: 'Too many login attempts. Please wait 60 seconds before retrying.'
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

