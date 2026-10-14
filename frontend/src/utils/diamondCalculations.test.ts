import { describe, it, expect } from 'vitest';
import { calculateDiamondPriceEstimate } from './diamondCalculations';

describe('Diamond Valuation & 4Cs Pricing Engine', () => {
  it('correctly prices D/FL and D/IF diamonds using FL_IF Rapaport benchmark', () => {
    const estFL = calculateDiamondPriceEstimate({
      carat: 1.0,
      color: 'D',
      clarity: 'FL',
      cut: 'Excellent',
      cert: 'GIA',
      shape: 'round'
    });

    const estIF = calculateDiamondPriceEstimate({
      carat: 1.0,
      color: 'D',
      clarity: 'IF',
      cut: 'Excellent',
      cert: 'GIA',
      shape: 'round'
    });

    const estFL_IF = calculateDiamondPriceEstimate({
      carat: 1.0,
      color: 'D',
      clarity: 'FL_IF',
      cut: 'Excellent',
      cert: 'GIA',
      shape: 'round'
    });

    // All should resolve to the 1,150,000 base rate + 4% GIA premium = 1,196,000
    expect(estFL.estimate.pricePerCarat).toBe(estIF.estimate.pricePerCarat);
    expect(estFL.estimate.pricePerCarat).toBe(estFL_IF.estimate.pricePerCarat);
    expect(estFL.estimate.totalPrice).toBe(1196000);
  });

  it('applies fancy shape discount (~12%) for Oval, Princess, and Cushion cuts', () => {
    const round = calculateDiamondPriceEstimate({
      carat: 1.0,
      shape: 'round',
      color: 'G',
      clarity: 'VS1',
      cut: 'Excellent',
      cert: 'IGI'
    });

    const oval = calculateDiamondPriceEstimate({
      carat: 1.0,
      shape: 'oval',
      color: 'G',
      clarity: 'VS1',
      cut: 'Excellent',
      cert: 'IGI'
    });

    expect(oval.adjustments.shapeFactor).toBe(0.88);
    expect(oval.estimate.totalPrice).toBeLessThan(round.estimate.totalPrice);
    expect(oval.estimate.totalPrice).toBe(Math.round(round.estimate.totalPrice * 0.88));
  });

  it('adjusts valuation based on cut quality (Ideal to Fair)', () => {
    const ideal = calculateDiamondPriceEstimate({ carat: 1.0, cut: 'Ideal' });
    const excellent = calculateDiamondPriceEstimate({ carat: 1.0, cut: 'Excellent' });
    const veryGood = calculateDiamondPriceEstimate({ carat: 1.0, cut: 'Very Good' });
    const fair = calculateDiamondPriceEstimate({ carat: 1.0, cut: 'Fair' });

    expect(ideal.estimate.totalPrice).toBeGreaterThan(excellent.estimate.totalPrice);
    expect(excellent.estimate.totalPrice).toBeGreaterThan(veryGood.estimate.totalPrice);
    expect(veryGood.estimate.totalPrice).toBeGreaterThan(fair.estimate.totalPrice);
  });

  it('handles certification premiums and non-certified discount', () => {
    const gia = calculateDiamondPriceEstimate({ carat: 1.0, cert: 'GIA' });
    const uncertified = calculateDiamondPriceEstimate({ carat: 1.0, cert: 'NONE' });

    expect(gia.adjustments.certFactor).toBe(1.04);
    expect(uncertified.adjustments.certFactor).toBe(0.82);
    expect(uncertified.estimate.totalPrice).toBeLessThan(gia.estimate.totalPrice * 0.85);
  });

  it('calculates Lab-Grown diamonds with exact natural equivalent comparison and savings disclosure', () => {
    const lab = calculateDiamondPriceEstimate({
      origin: 'lab_grown',
      carat: 2.0,
      color: 'F',
      clarity: 'VVS1',
      shape: 'round'
    });

    expect(lab.inputs.origin).toBe('lab_grown');
    expect(lab.adjustments.originFactor).toBe(0.20);
    expect(lab.estimate.naturalEquivalentPrice).toBeDefined();
    expect(lab.estimate.savingsAmount).toBeDefined();
    expect(lab.estimate.savingsPercent).toBe(80);
    expect(lab.estimate.totalPrice).toBe(Math.round((lab.estimate.naturalEquivalentPrice || 0) * 0.20));
  });

  it('handles small melee diamonds (0.02ct) and edge carat weights', () => {
    const melee = calculateDiamondPriceEstimate({
      carat: 0.02,
      color: 'H',
      clarity: 'SI1'
    });

    expect(melee.inputs.carat).toBe(0.02);
    expect(melee.estimate.totalPrice).toBeGreaterThan(0);
    expect(melee.estimate.pricePerCarat).toBeGreaterThan(0);
  });
});
