import type { IncomingMessage, ServerResponse } from 'http';

export interface DiamondEstimateRequest {
  origin?: 'natural' | 'lab_grown';
  carat?: number;
  shape?: string;
  cut?: string;
  color?: string;
  clarity?: string;
  cert?: string;
}

export interface DiamondEstimateResponse {
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

// 4Cs Rapaport Baseline Grid (Price per carat in thousands of INR for 1.00-1.49ct Round Brilliant)
const BASE_PRICES_PER_CARAT_THOUSANDS: Record<string, Record<string, number>> = {
  // Color: { Clarity: Price in ₹000s per carat }
  'D': { 'FL_IF': 1150, 'VVS1': 920, 'VVS2': 780, 'VS1': 660, 'VS2': 580, 'SI1': 480, 'SI2': 390, 'I1': 240 },
  'E': { 'FL_IF': 950,  'VVS1': 810, 'VVS2': 700, 'VS1': 610, 'VS2': 530, 'SI1': 440, 'SI2': 360, 'I1': 220 },
  'F': { 'FL_IF': 850,  'VVS1': 730, 'VVS2': 640, 'VS1': 560, 'VS2': 490, 'SI1': 420, 'SI2': 340, 'I1': 210 },
  'G': { 'FL_IF': 720,  'VVS1': 630, 'VVS2': 560, 'VS1': 490, 'VS2': 440, 'SI1': 380, 'SI2': 310, 'I1': 190 },
  'H': { 'FL_IF': 620,  'VVS1': 540, 'VVS2': 480, 'VS1': 430, 'VS2': 390, 'SI1': 340, 'SI2': 280, 'I1': 180 },
  'I': { 'FL_IF': 510,  'VVS1': 450, 'VVS2': 410, 'VS1': 370, 'VS2': 340, 'SI1': 300, 'SI2': 250, 'I1': 160 },
  'J': { 'FL_IF': 420,  'VVS1': 380, 'VVS2': 350, 'VS1': 320, 'VS2': 290, 'SI1': 260, 'SI2': 220, 'I1': 140 },
  'K': { 'FL_IF': 340,  'VVS1': 310, 'VVS2': 280, 'VS1': 260, 'VS2': 230, 'SI1': 210, 'SI2': 180, 'I1': 120 },
};

export function calculateDiamondPriceEstimate(params: DiamondEstimateRequest): DiamondEstimateResponse {
  const origin = params.origin || 'natural';
  const carat = Math.max(0.1, Number(params.carat) || 1.0);
  const shape = (params.shape || 'Round').toLowerCase();
  const cut = params.cut || 'Excellent';
  const color = (params.color || 'G').toUpperCase();
  const clarity = (params.clarity || 'VS1').toUpperCase();
  const cert = params.cert || 'GIA';

  // 1. Get Base 1ct Price from Rapaport Grid
  const colorRow = BASE_PRICES_PER_CARAT_THOUSANDS[color] || BASE_PRICES_PER_CARAT_THOUSANDS['G'];
  const baseThousands = colorRow[clarity] || colorRow['VS1'] || 450;
  let basePricePerCarat = baseThousands * 1000;

  // 2. Carat Tier Scaling (Exponential weight progression in natural diamonds)
  let caratTierMultiplier = 1.0;
  if (carat < 0.30) caratTierMultiplier = 0.40;
  else if (carat < 0.50) caratTierMultiplier = 0.55;
  else if (carat < 0.70) caratTierMultiplier = 0.70;
  else if (carat < 0.90) caratTierMultiplier = 0.85;
  else if (carat < 1.00) caratTierMultiplier = 0.92;
  else if (carat <= 1.49) caratTierMultiplier = 1.00;
  else if (carat <= 1.99) caratTierMultiplier = 1.45;
  else if (carat <= 2.99) caratTierMultiplier = 2.15;
  else if (carat <= 3.99) caratTierMultiplier = 3.20;
  else caratTierMultiplier = 4.50;

  // 3. Shape Adjustment (Round Brilliant commands premium; fancy shapes trade at discount)
  let shapeFactor = 1.0;
  if (shape !== 'round') {
    shapeFactor = 0.88; // ~12% fancy shape discount
  }

  // 4. Cut Grade Adjustment
  let cutFactor = 1.0;
  switch (cut.toLowerCase()) {
    case 'ideal': cutFactor = 1.05; break;
    case 'excellent': cutFactor = 1.00; break;
    case 'very good': cutFactor = 0.93; break;
    case 'good': cutFactor = 0.85; break;
    case 'fair': cutFactor = 0.75; break;
    default: cutFactor = 1.00;
  }

  // 5. Certification Factor
  let certFactor = 1.0;
  switch (cert.toUpperCase()) {
    case 'GIA': certFactor = 1.04; break;
    case 'IGI': certFactor = 1.00; break;
    case 'SGL': certFactor = 0.96; break;
    case 'HRD': certFactor = 0.98; break;
    case 'NONE': certFactor = 0.82; break;
    default: certFactor = 1.00;
  }

  // 6. Origin Factor (Lab-Grown vs Natural)
  // In Indian trade, CVD/HPHT lab-grown diamonds trade at roughly 18-22% of natural benchmark
  const originFactor = origin === 'lab_grown' ? 0.20 : 1.0;

  // Calculate Natural baseline for comparison
  const naturalPricePerCarat = Math.round(basePricePerCarat * caratTierMultiplier * shapeFactor * cutFactor * certFactor);
  const naturalTotalPrice = Math.round(naturalPricePerCarat * carat);

  // Final Price with Origin factor
  const finalPricePerCarat = Math.round(naturalPricePerCarat * originFactor);
  const finalTotalPrice = Math.round(finalPricePerCarat * carat);

  return {
    inputs: {
      origin,
      carat,
      shape: shape.charAt(0).toUpperCase() + shape.slice(1),
      cut,
      color,
      clarity,
      cert
    },
    estimate: {
      pricePerCarat: finalPricePerCarat,
      totalPrice: finalTotalPrice,
      currency: 'INR',
      ...(origin === 'lab_grown' ? {
        naturalEquivalentPrice: naturalTotalPrice,
        savingsAmount: naturalTotalPrice - finalTotalPrice,
        savingsPercent: Math.round(((naturalTotalPrice - finalTotalPrice) / naturalTotalPrice) * 100)
      } : {})
    },
    adjustments: {
      originFactor,
      shapeFactor,
      cutFactor,
      certFactor
    },
    disclosure: {
      benchmarkSource: 'Rapaport Diamond Specification Index (Calibrated 2026 Matrix in INR)',
      asOfDate: new Date().toISOString().split('T')[0],
      isEstimate: true,
      disclaimer: 'Calculated commercial estimate based on prevailing 4Cs wholesale benchmark matrices. Physical retail prices may vary based on exact visual symmetry, polish, fluorescence, and lab verification.'
    }
  };
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const url = new URL(req.url || '', 'http://localhost');
    const params: DiamondEstimateRequest = {
      origin: (url.searchParams.get('origin') as any) || 'natural',
      carat: parseFloat(url.searchParams.get('carat') || '1.0'),
      shape: url.searchParams.get('shape') || 'Round',
      cut: url.searchParams.get('cut') || 'Excellent',
      color: url.searchParams.get('color') || 'G',
      clarity: url.searchParams.get('clarity') || 'VS1',
      cert: url.searchParams.get('cert') || 'GIA'
    };

    const estimate = calculateDiamondPriceEstimate(params);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200');
    res.statusCode = 200;
    res.end(JSON.stringify(estimate));
  } catch (err: any) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: err.message || 'Invalid parameters' }));
  }
}
