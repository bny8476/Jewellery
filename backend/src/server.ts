import http from 'http';
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
