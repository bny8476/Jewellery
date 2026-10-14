import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Import local fallback API handlers
import metalRatesHandler from '../backend/api/metal-rates.ts';
import metalRatesHistoryHandler from '../backend/api/metal-rates-history.ts';
import diamondEstimateHandler from '../backend/api/diamond-price-estimate.ts';
import metalRatesAdminHandler from '../backend/api/metal-rates-admin.ts';
import cronUpdateMetalRatesHandler from '../backend/api/cron-update-metal-rates.ts';
import createRazorpayOrderHandler from '../backend/api/create-razorpay-order.ts';
import verifyRazorpayPaymentHandler from '../backend/api/verify-razorpay-payment.ts';

function apiDevServerPlugin() {
  return {
    name: 'api-dev-server',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        const pathname = req.url.split('?')[0];
        try {
          if (pathname === '/api/health') {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ status: 'ok', service: 'Vite Frontend Internal API' }));
          } else if (pathname === '/api/cron-update-metal-rates') {
            await cronUpdateMetalRatesHandler(req, res);
          } else if (pathname === '/api/metal-rates/history') {
            await metalRatesHistoryHandler(req, res);
          } else if (pathname.startsWith('/api/metal-rates/admin')) {
            await metalRatesAdminHandler(req, res);
          } else if (pathname === '/api/metal-rates') {
            await metalRatesHandler(req, res);
          } else if (pathname === '/api/diamond-price-estimate') {
            await diamondEstimateHandler(req, res);
          } else if (pathname === '/api/create-razorpay-order') {
            await createRazorpayOrderHandler(req, res);
          } else if (pathname === '/api/verify-razorpay-payment') {
            await verifyRazorpayPaymentHandler(req, res);
          } else if (pathname === '/api/v1/events' || pathname === '/api/events') {
            res.writeHead(200, {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache, no-transform',
              'Connection': 'keep-alive',
              'Access-Control-Allow-Origin': '*'
            });
            res.write(':keepalive\n\n');
            const timer = setInterval(() => {
              try {
                res.write(':keepalive\n\n');
              } catch {
                clearInterval(timer);
              }
            }, 25000);
            req.on('close', () => clearInterval(timer));
            return;
          } else {
            next();
          }
        } catch (e: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: e.message || 'Server error' }));
        }
      });
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), apiDevServerPlugin()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      // Proxy /api/v1 to local backend if running on 5001
      '/api/v1': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        ws: true
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
});
