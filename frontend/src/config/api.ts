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

const configuredUrl = ((import.meta as any).env?.VITE_BACKEND_URL || '').trim();

if (
  (import.meta as any).env?.PROD &&
  (!configuredUrl ||
    configuredUrl.includes('localhost') ||
    configuredUrl.includes('127.0.0.1') ||
    configuredUrl.includes('0.0.0.0') ||
    configuredUrl.includes('[::1]'))
) {
  const errorMsg =
    'Invalid production API configuration. VITE_BACKEND_URL must point to the deployed backend service (e.g., https://your-backend.onrender.com). Please configure it in your Vercel project environment variables and redeploy.';
  console.error('[API Configuration Error]', errorMsg);
  throw new Error(errorMsg);
}

export const API_BASE_URL: string =
  configuredUrl ||
  ((import.meta as any).env?.DEV ? 'http://localhost:5001' : '');

export const BACKEND_URL: string = API_BASE_URL;
export const API_BASE: string = API_BASE_URL;

/**
 * Constructs an absolute URL using the centralized API base URL
 */
export function apiUrl(path: string): string {
  const base = API_BASE_URL.replace(/\/+$/, '');
  const cleanPath = path.replace(/^\/+/, '');
  return `${base}/${cleanPath}`;
}

/**
 * Builds an absolute URL to a backend API route
 */
export function getBackendUrl(path: string): string {
  return apiUrl(path);
}

/**
 * Builds the SSE events stream endpoint URL
 */
export function getEventsStreamUrl(userId?: string, token?: string): string {
  const params = new URLSearchParams();
  if (userId) params.set('userId', userId);
  if (token) params.set('token', token);
  const q = params.toString();
  return q ? `${apiUrl('/api/v1/events')}?${q}` : apiUrl('/api/v1/events');
}

/**
 * Startup validation check for application entry point
 */
export function assertApiConfigValid(): void {
  if (typeof window !== 'undefined') {
    if ((import.meta as any).env?.DEV) {
      console.log('[API Config] Local development mode. Connected backend:', API_BASE_URL);
    } else {
      console.log('[API Config] Production mode. Connected backend:', API_BASE_URL);
    }
  }
}
