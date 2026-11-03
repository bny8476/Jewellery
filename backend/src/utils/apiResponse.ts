import type { ServerResponse } from 'http';

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

