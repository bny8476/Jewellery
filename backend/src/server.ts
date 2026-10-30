import http from 'http';
import path from 'path';
import fs from 'fs';
import { handleMetalRatesRoutes } from './routes/metalRates.ts';
import { handleDiamondRoutes } from './routes/diamond.ts';
import { handleRazorpayRoutes } from './routes/razorpay.ts';
import { handleApiV1Routes } from './routes/apiV1.ts';
import { handleDigitalGoldRoutes } from './routes/digitalGold.ts';
import { handleGiftCardRoutes } from './routes/giftCards.ts';
import { handleRateComparisonRoutes } from './routes/rateComparison.ts';
import { handleKycRoutes } from './routes/kyc.ts';
import { handlePawnRoutes } from './routes/pawnLoans.ts';
import { handleCampaignsRoutes } from './routes/campaigns.ts';

const PORT = parseInt(process.env.PORT || '5001', 10);

// Helper to parse JSON body with strict size limit & syntax validation
async function parseJsonBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    const MAX_PAYLOAD_BYTES = 1024 * 1024; // 1MB payload limit
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > MAX_PAYLOAD_BYTES) {
        req.destroy(new Error('Payload Too Large: Maximum allowed request size is 1MB.'));
      }
    });
    req.on('end', () => {
      try {
        if (body.trim()) {
          resolve(JSON.parse(body));
        } else {
          resolve({});
        }
      } catch (err: any) {
        reject(new Error(`Malformed JSON request payload: ${err.message}`));
      }
    });
    req.on('error', (err) => {
      reject(err);
    });
  });
}

// Explicit CORS Allowed Origins
const ALLOWED_ORIGINS = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://localhost:5001',
  ...(process.env.CLIENT_ORIGIN ? [process.env.CLIENT_ORIGIN] : []),
  ...(process.env.APP_URL ? [process.env.APP_URL] : [])
]);

// Create HTTP server
const server = http.createServer(async (req, res) => {
  // Core Security Headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  const reqOrigin = req.headers.origin || '';
  const isAllowed = ALLOWED_ORIGINS.has(reqOrigin) || 
    (process.env.NODE_ENV !== 'production' && reqOrigin.startsWith('http://localhost:'));

  if (isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', reqOrigin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else {
    res.setHeader('Access-Control-Allow-Origin', process.env.CLIENT_ORIGIN || 'http://localhost:5173');
  }

  const requestedHeaders = req.headers['access-control-request-headers'];
  res.setHeader(
    'Access-Control-Allow-Headers',
    requestedHeaders || 'Content-Type, Authorization, X-Requested-With, x-user-id, x-user-email, X-User-Id, X-User-Email, Accept, Origin, Range'
  );
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const requestUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = requestUrl.pathname;
  const query = Object.fromEntries(requestUrl.searchParams.entries());

  // Attach query and body to request object for compatibility
  (req as any).query = query;
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    try {
      (req as any).body = await parseJsonBody(req);
    } catch (parseErr: any) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: parseErr.message || 'Invalid JSON request payload' }));
      return;
    }
  } else {
    (req as any).body = {};
  }

  // Helper response wrapper
  (res as any).status = function (code: number) {
    this.statusCode = code;
    return this;
  };
  (res as any).json = function (data: any) {
    this.setHeader('Content-Type', 'application/json');
    this.end(JSON.stringify(data));
  };

  try {
    // Health check endpoint
    if (pathname === '/api/health' || pathname === '/health') {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        status: 'ok',
        service: "YAZHINI FINE JEWELS & PAWN SHOP Backend API",
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      }));
      return;
    }

    // Modular route handlers
    const handledMetalRates = await handleMetalRatesRoutes(req, res, pathname);
    if (handledMetalRates !== false) return;

    const handledDiamond = await handleDiamondRoutes(req, res, pathname);
    if (handledDiamond !== false) return;

    const handledRazorpay = await handleRazorpayRoutes(req, res, pathname);
    if (handledRazorpay !== false) return;

    const handledPawn = await handlePawnRoutes(req, res, pathname);
    if (handledPawn !== false) return;

    const handledApiV1 = await handleApiV1Routes(req, res, pathname);
    if (handledApiV1 !== false) return;

    const handledDigitalGold = await handleDigitalGoldRoutes(req, res, pathname);
    if (handledDigitalGold !== false) return;

    const handledGiftCard = await handleGiftCardRoutes(req, res, pathname);
    if (handledGiftCard !== false) return;

    const handledRateComparison = await handleRateComparisonRoutes(req, res, pathname);
    if (handledRateComparison !== false) return;

    const handledKyc = await handleKycRoutes(req, res, pathname);
    if (handledKyc !== false) return;

    const handledCampaigns = await handleCampaignsRoutes(req, res, pathname);
    if (handledCampaigns !== false) return;

    // Serve frontend static build if available (SPA Fallback for /admin, /dashboard, etc.)
    const frontendDist = path.resolve(process.cwd(), 'frontend', 'dist');
    const parentFrontendDist = path.resolve(process.cwd(), '..', 'frontend', 'dist');
    const targetDist = fs.existsSync(frontendDist) ? frontendDist : (fs.existsSync(parentFrontendDist) ? parentFrontendDist : null);

    if (targetDist && req.method === 'GET' && !pathname.startsWith('/api/')) {
      const filePath = path.join(targetDist, pathname);
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        const contentTypes: Record<string, string> = {
          '.html': 'text/html',
          '.js': 'application/javascript',
          '.css': 'text/css',
          '.json': 'application/json',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.svg': 'image/svg+xml',
          '.ico': 'image/x-icon',
          '.webp': 'image/webp'
        };
        res.statusCode = 200;
        res.setHeader('Content-Type', contentTypes[ext] || 'application/octet-stream');
        fs.createReadStream(filePath).pipe(res);
        return;
      }

      // Route all client-side SPA URLs (e.g. /admin, /admin/login, /dashboard) to index.html
      const indexPath = path.join(targetDist, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html');
        fs.createReadStream(indexPath).pipe(res);
        return;
      }
    }

    // 404 for unknown endpoints
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      error: 'Endpoint not found',
      path: pathname
    }));
  } catch (err: any) {
    console.error(`[Backend API Error] ${req.method} ${pathname}:`, err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      error: 'Internal Server Error',
      message: err.message || 'An unexpected error occurred'
    }));
  }
});

process.on('uncaughtException', (err: any) => {
  console.warn('[Server] Handled uncaught exception (server kept running):', err?.message || err);
});

process.on('unhandledRejection', (reason: any) => {
  console.warn('[Server] Handled unhandled rejection (server kept running):', reason?.message || reason);
});

server.listen(PORT, () => {
  console.log(`✨ YAZHINI Fine Jewels & Pawn Shop Backend Server running on port ${PORT}`);
  console.log(`📍 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`📍 Metal Rates: http://localhost:${PORT}/api/metal-rates`);
});

export default server;
