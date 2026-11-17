import type { IncomingMessage, ServerResponse } from 'http';
import { metalRatesAdminSettingsSchema } from '../src/schemas/validationSchemas.ts';

export interface AdminMetalSettings {
  activeProvider: 'goldapi' | 'metals_dev' | 'manual';
  refreshIntervalMinutes: number;
  cacheTtlMinutes: number;
  goldAdjustmentPerGram: number; // e.g. +50 or -20
  silverAdjustmentPerGram: number;
  platinumAdjustmentPerGram: number;
  updatedAt: string;
  updatedBy: string;
}

export interface AdminAuditRecord {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  details: string;
}

let currentSettings: AdminMetalSettings = {
  activeProvider: 'goldapi',
  refreshIntervalMinutes: 15,
  cacheTtlMinutes: 15,
  goldAdjustmentPerGram: 0,
  silverAdjustmentPerGram: 0,
  platinumAdjustmentPerGram: 0,
  updatedAt: new Date().toISOString(),
  updatedBy: 'system'
};

const auditLog: AdminAuditRecord[] = [
  {
    id: 'audit-init',
    timestamp: new Date().toISOString(),
    action: 'SYSTEM_INITIALIZE',
    user: 'system',
    details: 'Precious metal live feed initialized with GoldAPI.io provider.'
  }
];

export async function testProviderConnectivity(): Promise<{
  connected: boolean;
  latencyMs: number;
  provider: string;
  httpStatus: number;
  message: string;
}> {
  const start = Date.now();
  const apiKey = (
    process.env.GOLDAPI_KEY ||
    process.env.GOLD_API_KEY ||
    process.env.VITE_GOLD_API_KEY ||
    ''
  ).trim();

  if (!apiKey) {
    return {
      connected: false,
      latencyMs: 0,
      provider: 'GoldAPI.io',
      httpStatus: 401,
      message: 'GOLDAPI_KEY is not configured in backend environment.'
    };
  }

  try {
    const res = await fetch('https://www.goldapi.io/api/XAU/INR', {
      headers: { 'x-access-token': apiKey }
    });
    const latencyMs = Date.now() - start;
    return {
      connected: res.ok,
      latencyMs,
      provider: 'GoldAPI.io (IDC/LBMA Spot Feed)',
      httpStatus: res.status,
      message: res.ok ? 'Connection healthy. Real-time rates streaming.' : `Provider responded with status ${res.status}`
    };
  } catch (err: any) {
    return {
      connected: false,
      latencyMs: Date.now() - start,
      provider: 'GoldAPI.io',
      httpStatus: 500,
      message: err.message || 'Network connectivity error'
    };
  }
}

export function getAdminSettings() {
  return {
    settings: currentSettings,
    auditLog: auditLog.slice(-15).reverse()
  };
}

export function updateAdminSettings(newSettings: Partial<AdminMetalSettings>, user = 'admin'): AdminMetalSettings {
  currentSettings = {
    ...currentSettings,
    ...newSettings,
    updatedAt: new Date().toISOString(),
    updatedBy: user
  };

  auditLog.push({
    id: `audit-${Date.now()}`,
    timestamp: new Date().toISOString(),
    action: 'UPDATE_SETTINGS',
    user,
    details: `Updated metal settings: ${JSON.stringify(newSettings)}`
  });

  return currentSettings;
}

import { authenticateRequest } from '../src/routes/apiV1.ts';

async function verifyStaff(req: IncomingMessage): Promise<{ isStaff: boolean; email?: string; error?: string; status?: number }> {
  const auth = await authenticateRequest(req);
  if (!auth.user) {
    return { isStaff: false, error: 'Authentication required. Please log in with staff credentials.', status: 401 };
  }
  if (!auth.isStaff) {
    return { isStaff: false, error: 'Forbidden: Staff or administrator credentials required.', status: 403 };
  }
  return { isStaff: true, email: auth.user.email || 'admin@luxury.com' };
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const auth = await verifyStaff(req);
  if (!auth.isStaff) {
    res.statusCode = auth.status || 401;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: auth.error || 'Unauthorized: Staff credentials required.' }));
    return;
  }

  const url = new URL(req.url || '', 'http://localhost');

  if (url.pathname.endsWith('/test')) {
    const testResult = await testProviderConnectivity();
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.end(JSON.stringify(testResult));
    return;
  }

  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const settingsToValidate = payload.settings || payload;
        const parseResult = metalRatesAdminSettingsSchema.partial().safeParse(settingsToValidate);
        if (!parseResult.success) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            success: false,
            error: 'Invalid metal rates settings payload',
            details: parseResult.error.flatten().fieldErrors
          }));
          return;
        }

        const updated = updateAdminSettings(parseResult.data, auth.email || 'Admin Staff');
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(JSON.stringify({ success: true, settings: updated }));
      } catch (err: any) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // GET
  const data = getAdminSettings();
  res.setHeader('Content-Type', 'application/json');
  res.statusCode = 200;
  res.end(JSON.stringify(data));
}
