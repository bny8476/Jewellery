import type { IncomingMessage, ServerResponse } from 'http';
import metalRatesHandler from '../../api/metal-rates.ts';
import metalRatesHistoryHandler from '../../api/metal-rates-history.ts';
import metalRatesAdminHandler from '../../api/metal-rates-admin.ts';
import cronUpdateMetalRatesHandler from '../../api/cron-update-metal-rates.ts';

export async function handleMetalRatesRoutes(req: IncomingMessage, res: ServerResponse, pathname: string) {
  if (pathname === '/api/metal-rates') {
    return metalRatesHandler(req, res);
  }
  if (pathname === '/api/metal-rates/history') {
    return metalRatesHistoryHandler(req, res);
  }
  if (pathname.startsWith('/api/metal-rates/admin')) {
    return metalRatesAdminHandler(req, res);
  }
  if (pathname === '/api/cron-update-metal-rates') {
    return cronUpdateMetalRatesHandler(req, res);
  }
  return false;
}
