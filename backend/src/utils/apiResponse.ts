import type { ServerResponse } from 'http';
import crypto from 'crypto';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
  pagination?: {
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
  };
  timestamp: string;
  requestId?: string;
}

export function generateRequestId(): string {
  try {
    return 'req_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16);
  } catch {
    return 'req_' + Math.random().toString(36).slice(2, 12);
  }
}

/**
 * Sends a sanitized 500 response without leaking internal Postgres/DB messages or stack traces.
 * Logs full error details to server console paired with a unique requestId.
 */
export function sendSafe500Error(
  res: ServerResponse,
  err: any,
  publicContext: string = 'An unexpected internal error occurred'
): void {
  const requestId = generateRequestId();
  console.error(`[Server Error] requestId=${requestId} context="${publicContext}":`, err?.stack || err?.message || err);

  sendApiResponse(res, 500, {
    success: false,
    error: 'Something went wrong',
    message: publicContext,
    requestId
  });
}

/**
 * Standardizes all REST API responses across the platform
 */
export function sendApiResponse<T = any>(
  res: ServerResponse,
  statusCode: number,
  payload: {
    success: boolean;
    data?: T;
    error?: string;
    code?: string;
    message?: string;
    pagination?: {
      total: number;
      page: number;
      pageSize: number;
      hasMore: boolean;
    };
    requestId?: string;
  }
) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  if (payload.requestId) {
    res.setHeader('X-Request-Id', payload.requestId);
  }

  const response: ApiResponse<T> = {
    success: payload.success,
    data: payload.data,
    error: payload.error,
    code: payload.code,
    message: payload.message,
    pagination: payload.pagination,
    timestamp: new Date().toISOString(),
    requestId: payload.requestId
  };

  res.end(JSON.stringify(response));
}

