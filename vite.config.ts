import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Import backend API handlers for development server routing
import metalRatesHandler from './api/metal-rates';
import metalRatesHistoryHandler from './api/metal-rates-history';
import diamondEstimateHandler from './api/diamond-price-estimate';
import metalRatesAdminHandler from './api/metal-rates-admin';
import cronUpdateMetalRatesHandler from './api/cron-update-metal-rates';
import createRazorpayOrderHandler from './api/create-razorpay-order';
import verifyRazorpayPaymentHandler from './api/verify-razorpay-payment';

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
          if (pathname === '/api/cron-update-metal-rates') {
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

