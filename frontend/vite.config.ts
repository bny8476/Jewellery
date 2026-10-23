import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

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
            return;
          }

          const loadApiModule = async (relPath: string) => {
            const targetPath = path.resolve(__dirname, relPath);
            return import(/* @vite-ignore */ `file://${targetPath}`);
          };

          if (pathname === '/api/cron-update-metal-rates') {
            const mod = await loadApiModule('../backend/api/cron-update-metal-rates.ts');
            return await (mod.default || mod)(req, res);
          } else if (pathname === '/api/metal-rates/history') {
            const mod = await loadApiModule('../backend/api/metal-rates-history.ts');
            return await (mod.default || mod)(req, res);
          } else if (pathname.startsWith('/api/metal-rates/admin')) {
            const mod = await loadApiModule('../backend/api/metal-rates-admin.ts');
            return await (mod.default || mod)(req, res);
          } else if (pathname === '/api/metal-rates') {
            const mod = await loadApiModule('../backend/api/metal-rates.ts');
            return await (mod.default || mod)(req, res);
          } else if (pathname === '/api/diamond-price-estimate') {
            const mod = await loadApiModule('../backend/api/diamond-price-estimate.ts');
            return await (mod.default || mod)(req, res);
          } else if (pathname === '/api/create-razorpay-order') {
            const mod = await loadApiModule('../backend/api/create-razorpay-order.ts');
            return await (mod.default || mod)(req, res);
          } else if (pathname === '/api/verify-razorpay-payment') {
            const mod = await loadApiModule('../backend/api/verify-razorpay-payment.ts');
            return await (mod.default || mod)(req, res);
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
          }

          next();
        } catch (e: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: e.message || 'Server error' }));
        }
      });
    }
  };
}

function mediaStreamingPlugin() {
  const setupMediaMiddleware = (server: any) => {
    server.middlewares.use((req: any, res: any, next: any) => {
      const rawUrl = req.url ? req.url.split('?')[0] : '';
      if (/\.(mp4|webm|ogg|mov|mp3)$/i.test(rawUrl)) {
        const origSetHeader = res.setHeader.bind(res);
        const origWriteHead = res.writeHead.bind(res);

        res.setHeader = function (name: string, value: any) {
          if (typeof name === 'string' && name.toLowerCase() === 'cache-control') {
            // Chromium throws net::ERR_CACHE_OPERATION_NOT_SUPPORTED on 206 Partial Content range requests
            // when Cache-Control is set to 'no-cache'. Overriding to public, max-age=3600 fixes this.
            return origSetHeader('Cache-Control', 'public, max-age=3600, no-transform');
          }
          return origSetHeader(name, value);
        };

        res.writeHead = function (status: number, ...args: any[]) {
          res.setHeader('Cache-Control', 'public, max-age=3600, no-transform');
          res.setHeader('Accept-Ranges', 'bytes');
          return origWriteHead(status, ...args);
        };

        res.setHeader('Accept-Ranges', 'bytes');
      }
      next();
    });
  };

  return {
    name: 'media-streaming-headers',
    configureServer: setupMediaMiddleware,
    configurePreviewServer: setupMediaMiddleware
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  const isDev = command === 'serve';

  return {
    plugins: [
      react(),
      mediaStreamingPlugin(),
      ...(isDev ? [apiDevServerPlugin()] : [])
    ],
    server: {
      port: 5173,
      host: true,
      proxy: {
        // Proxy all /api routes to backend on port 5001 if active
        '/api': {
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
  };
});
