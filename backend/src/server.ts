import http from 'http';
import path from 'path';
import fs from 'fs';
import { handleMetalRatesRoutes } from './routes/metalRates.ts';
import { handleDiamondRoutes } from './routes/diamond.ts';
import { handleRazorpayRoutes } from './routes/razorpay.ts';

const PORT = parseInt(process.env.PORT || '5001', 10);

// Helper to parse JSON body
async function parseJsonBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        if (body.trim()) {
          resolve(JSON.parse(body));
        } else {
          resolve({});
        }
      } catch {
        resolve({});
      }
    });
    req.on('error', () => {
      resolve({});
    });
  });
}

// Create HTTP server
const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin || '*';

  // Universal CORS
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  const requestUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = requestUrl.pathname;
  const query = Object.fromEntries(requestUrl.searchParams.entries());

  // Attach query and body to request object for compatibility
  (req as any).query = query;
  if (req.method === 'POST' || req.method === 'PUT') {
    (req as any).body = await parseJsonBody(req);
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
        service: "RCB JEWELRY'S & PAWN SHOP Backend API",
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

server.listen(PORT, () => {
  console.log(`✨ RCB Jewelry & Pawn Shop Backend Server running on port ${PORT}`);
  console.log(`📍 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`📍 Metal Rates: http://localhost:${PORT}/api/metal-rates`);
});

export default server;
