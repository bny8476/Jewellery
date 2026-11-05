/**
 * Centralized API & Backend Configuration
 *
 * Guarantees that production builds NEVER attempt to call localhost/loopback address space.
 *
 * Rules:
 * - Production (import.meta.env.PROD === true):
 *   VITE_BACKEND_URL is strictly required and must point to your deployed backend (e.g. on Render).
 *   Throws an actionable configuration error if missing or pointing to loopback addresses.
 *
 * - Local Development (import.meta.env.DEV === true):
 *   Permits fallback to http://localhost:5001 when VITE_BACKEND_URL is not set.
 */

function resolveBackendUrl(): string {
  const envVal = ((import.meta as any).env?.VITE_BACKEND_URL || '').trim();
  const isProd = Boolean((import.meta as any).env?.PROD);

  if (isProd) {
    if (!envVal) {
      const errorMessage =
        '[FATAL CONFIG ERROR] VITE_BACKEND_URL is required in production builds. ' +
        'Please define VITE_BACKEND_URL in your Vercel project Environment Variables (e.g. https://your-backend.onrender.com) ' +
        'and redeploy your application.';
      console.error(errorMessage);
      throw new Error(errorMessage);
    }

    if (
      envVal.includes('localhost') ||
      envVal.includes('127.0.0.1') ||
      envVal.includes('0.0.0.0') ||
      envVal.includes('[::1]')
    ) {
      const errorMessage =
        `[FATAL CONFIG ERROR] VITE_BACKEND_URL cannot point to a loopback/localhost address ("${envVal}") in production. ` +
        'Modern browsers enforce Private Network Access (PNA) and block public HTTPS sites from accessing loopback space. ' +
        'Set VITE_BACKEND_URL to your deployed HTTPS backend URL in Vercel and redeploy.';
      console.error(errorMessage);
      throw new Error(errorMessage);
    }

    return envVal.replace(/\/+$/, '');
  }

  // Local development fallback
  return (envVal || 'http://localhost:5001').replace(/\/+$/, '');
}

export const BACKEND_URL = resolveBackendUrl();
export const API_BASE = BACKEND_URL;

/**
 * Builds an absolute URL to a backend API route
 */
export function getBackendUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${BACKEND_URL}${cleanPath}`;
}

/**
 * Builds the SSE events stream endpoint URL with parameters
 */
export function getEventsStreamUrl(userId: string = 'customer_default', token?: string): string {
  const params = new URLSearchParams();
  if (userId) params.set('userId', userId);
  if (token) params.set('token', token);
  return `${BACKEND_URL}/api/v1/events?${params.toString()}`;
}

/**
 * Startup validation check for application entry point
 */
export function assertApiConfigValid(): void {
  if (typeof window !== 'undefined') {
    if ((import.meta as any).env?.DEV) {
      console.log('[API Config] Local development mode. Connected backend:', BACKEND_URL);
    } else {
      console.log('[API Config] Production mode. Connected backend:', BACKEND_URL);
    }
  }
}
