import { supabase } from '../lib/supabase';
import { apiUrl } from '../config/api';
import { toast } from '../utils/toast';

let isRedirectingToLogin = false;

/**
 * Safe handler for session expiration.
 * Clears invalid authentication state and redirects to login with return path.
 * Contains anti-loop protection if already on the login or register page.
 */
export function handleSessionExpiration(): void {
  if (typeof window === 'undefined' || isRedirectingToLogin) return;

  const pathname = window.location.pathname;
  if (pathname === '/login' || pathname === '/signup' || pathname === '/register') return;

  isRedirectingToLogin = true;

  try {
    toast.error('Your session has expired. Please sign in again.');
  } catch {
    // fallback
  }

  setTimeout(() => {
    isRedirectingToLogin = false;
    const returnUrl = encodeURIComponent(pathname + window.location.search);
    window.location.href = `/login?from=${returnUrl}`;
  }, 1200);
}

export interface GetAccessTokenOptions {
  silent?: boolean;
}

/**
 * Retrieves the current active Supabase access token.
 * Refreshes session if token is missing or near expiration.
 * Throws an actionable error if session cannot be recovered (unless silent: true).
 */
export async function getValidAccessToken(options?: { silent?: false }): Promise<string>;
export async function getValidAccessToken(options: { silent: true }): Promise<string | null>;
export async function getValidAccessToken(options: GetAccessTokenOptions = {}): Promise<string | null> {
  const { data, error } = await supabase.auth.getSession().catch(() => ({ data: { session: null }, error: null }));
  let session = data?.session;

  // If no session or error, attempt session refresh
  if (error || !session?.access_token) {
    try {
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      if (!refreshError && refreshData?.session?.access_token) {
        session = refreshData.session;
      }
    } catch {
      // Refresh failed
    }
  }

  // Check if token is nearing expiration (within 45 seconds)
  if (session?.access_token && session.expires_at) {
    const now = Math.floor(Date.now() / 1000);
    if (session.expires_at - now < 45) {
      try {
        const { data: refreshed } = await supabase.auth.refreshSession();
        if (refreshed?.session?.access_token) {
          session = refreshed.session;
        }
      } catch {
        // Fall back to current access token
      }
    }
  }

  if (!session?.access_token) {
    if (!options.silent) {
      handleSessionExpiration();
      throw new Error('Authentication session is missing or expired. Please login again.');
    }
    return null;
  }

  return session.access_token;
}

/**
 * Reusable authenticated fetch wrapper for all protected APIs (Pawn, Admin, etc.)
 *
 * Guarantees:
 * 1. Uses the centralized API configuration URL (no hardcoded localhost in production).
 * 2. Retrieves current verified Supabase session and attaches Authorization: Bearer <token>.
 * 3. Never sends fake x-user-email or role spoofing headers.
 * 4. Gracefully handles 401 Unauthorized (attempts token refresh, prompts login) and 403 Forbidden.
 * 5. Safe development logging without exposing tokens or secrets.
 */
export async function authenticatedFetch(pathOrUrl: string, init: RequestInit = {}): Promise<Response> {
  const targetUrl = pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')
    ? pathOrUrl
    : apiUrl(pathOrUrl);

  const token = await getValidAccessToken();

  const headers = new Headers(init.headers || {});
  headers.set('Accept', 'application/json');
  headers.set('Authorization', `Bearer ${token}`);

  // Strip legacy unauthenticated / bypass headers
  headers.delete('x-user-email');
  headers.delete('x-user-role');
  headers.delete('x-user-id');

  if (import.meta.env.DEV) {
    console.debug(`[API Request] ${init.method || 'GET'} ${targetUrl}`, {
      hasSession: Boolean(token)
    });
  }

  const response = await fetch(targetUrl, {
    ...init,
    headers
  });

  if (import.meta.env.DEV) {
    console.debug(`[API Response] ${response.status} ${targetUrl}`);
  }

  // Handle 401 Unauthorized
  if (response.status === 401) {
    // Attempt single session refresh and retry
    try {
      const { data: refreshData } = await supabase.auth.refreshSession();
      if (refreshData?.session?.access_token) {
        headers.set('Authorization', `Bearer ${refreshData.session.access_token}`);
        const retryRes = await fetch(targetUrl, { ...init, headers });
        if (retryRes.status !== 401) {
          return retryRes;
        }
      }
    } catch {
      // Refresh retry failed
    }

    handleSessionExpiration();
    throw new Error('Authentication session is missing or expired. Please login again.');
  }

  // Handle 403 Forbidden
  if (response.status === 403) {
    let errorDetail = 'Forbidden: Staff permissions required.';
    try {
      const cloned = response.clone();
      const body = await cloned.json();
      if (body.error) errorDetail = body.error;
    } catch {
      // Fallback message
    }

    if (import.meta.env.DEV) {
      console.warn(`[API 403 Forbidden] ${targetUrl}:`, errorDetail);
    }
    throw new Error(errorDetail);
  }

  return response;
}

