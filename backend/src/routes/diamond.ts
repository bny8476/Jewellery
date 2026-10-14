import type { IncomingMessage, ServerResponse } from 'http';
import diamondEstimateHandler from '../../api/diamond-price-estimate.ts';

export async function handleDiamondRoutes(req: IncomingMessage, res: ServerResponse, pathname: string) {
  if (pathname === '/api/diamond-price-estimate') {
    return diamondEstimateHandler(req, res);
  }
  return false;
}
