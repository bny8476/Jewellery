export interface DiamondCalculationParams {
  origin: 'natural' | 'lab_grown';
  carat: number;
  shape: string;
  cut: string;
  color: string;
  clarity: string;
  cert: string;
}

export interface DiamondCalculationResult {
  inputs: {
    origin: 'natural' | 'lab_grown';
    carat: number;
    shape: string;
    cut: string;
    color: string;
    clarity: string;
    cert: string;
  };
  estimate: {
    pricePerCarat: number;
    totalPrice: number;
    currency: 'INR';
    naturalEquivalentPrice?: number;
    savingsAmount?: number;
    savingsPercent?: number;
  };
  adjustments: {
    originFactor: number;
    shapeFactor: number;
    cutFactor: number;
    certFactor: number;
  };
  disclosure: {
    benchmarkSource: string;
    asOfDate: string;
    isEstimate: boolean;
    disclaimer: string;
  };
}

export async function fetchDiamondPriceEstimate(params: DiamondCalculationParams): Promise<DiamondCalculationResult> {
  const query = new URLSearchParams({
    origin: params.origin,
    carat: params.carat.toString(),
    shape: params.shape,
    cut: params.cut,
    color: params.color,
    clarity: params.clarity,
    cert: params.cert
  });

  const response = await fetch(`/api/diamond-price-estimate?${query.toString()}`, {
    method: 'GET',
    headers: { 'Accept': 'application/json' }
  });

  if (!response.ok) {
    throw new Error(`Failed to calculate diamond estimate: ${response.statusText}`);
  }

  return response.json();
}

export { calculateDiamondPriceEstimate } from '../../api/diamond-price-estimate';
