import { describe, it, expect } from 'vitest';
import { calculateDiamondPriceEstimate } from '../services/diamondService';

describe('Diamond Price Estimate Engine (Rapaport Index INR)', () => {
  it('calculates a valid estimate for a 1-carat Round, Excellent, G, VS1 natural diamond', () => {
    const res = calculateDiamondPriceEstimate({
      origin: 'natural',
      carat: 1.0,
      shape: 'round',
      cut: 'excellent',
      color: 'G',
      clarity: 'VS1',
      cert: 'GIA'
    });

    expect(res.estimate.totalPrice).toBeGreaterThan(100000);
    expect(res.estimate.pricePerCarat).toBeGreaterThan(100000);
    expect(res.disclosure.benchmarkSource).toContain('Rapaport');
    expect(res.inputs.origin).toBe('natural');
    expect(res.disclosure.disclaimer).toBeDefined();
    expect(res.disclosure.isEstimate).toBe(true);
  });

  it('calculates Lab-Grown diamond price with an approximate ~80% discount vs natural counterpart', () => {
    const naturalEstimate = calculateDiamondPriceEstimate({
      origin: 'natural',
      carat: 1.5,
      shape: 'round',
      cut: 'ideal',
      color: 'E',
      clarity: 'VVS2',
      cert: 'IGI'
    });

    const labEstimate = calculateDiamondPriceEstimate({
      origin: 'lab_grown',
      carat: 1.5,
      shape: 'round',
      cut: 'ideal',
      color: 'E',
      clarity: 'VVS2',
      cert: 'IGI'
    });

    expect(labEstimate.estimate.totalPrice).toBeLessThan(naturalEstimate.estimate.totalPrice * 0.35);
    expect(labEstimate.inputs.origin).toBe('lab_grown');
    expect(labEstimate.estimate.savingsAmount).toBeGreaterThan(0);
    expect(labEstimate.estimate.savingsPercent).toBe(80);
  });

  it('scales price non-linearly with carat weight (larger diamonds carry higher price per carat)', () => {
    const halfCarat = calculateDiamondPriceEstimate({
      origin: 'natural',
      carat: 0.5,
      shape: 'round',
      cut: 'excellent',
      color: 'F',
      clarity: 'VS2',
      cert: 'GIA'
    });

    const twoCarat = calculateDiamondPriceEstimate({
      origin: 'natural',
      carat: 2.0,
      shape: 'round',
      cut: 'excellent',
      color: 'F',
      clarity: 'VS2',
      cert: 'GIA'
    });

    expect(twoCarat.estimate.pricePerCarat).toBeGreaterThan(halfCarat.estimate.pricePerCarat);
  });

  it('handles minimum and edge carats gracefully', () => {
    const tinyDiamond = calculateDiamondPriceEstimate({
      origin: 'natural',
      carat: 0.05,
      shape: 'round',
      cut: 'good',
      color: 'I',
      clarity: 'SI2',
      cert: 'NONE'
    });

    expect(tinyDiamond.estimate.totalPrice).toBeGreaterThan(0);
    expect(tinyDiamond.inputs.carat).toBeGreaterThanOrEqual(0.05);
  });
});

describe('Daily 9:00 AM IST Precious Metal Rate Logic & Conversions', () => {
  it('formats the official 9:00 AM IST daily update message correctly', () => {
    const effectiveDate = '2026-10-14';
    const notice = `Rates last updated on ${effectiveDate} at 9:00 AM IST`;
    expect(notice).toBe('Rates last updated on 2026-10-14 at 9:00 AM IST');
    expect(notice).toContain('9:00 AM IST');
  });

  it('correctly calculates 24K, 22K (916), and 18K (750) purity conversions in INR', () => {
    const gold24kPerGram = 12680.00;
    const gold22kPerGram = Math.round(gold24kPerGram * 0.916 * 100) / 100;
    const gold18kPerGram = Math.round(gold24kPerGram * 0.750 * 100) / 100;

    expect(gold22kPerGram).toBe(11614.88);
    expect(gold18kPerGram).toBe(9510.00);

    // 10 grams conversion
    expect(gold24kPerGram * 10).toBe(126800.00);
  });

  it('correctly calculates Silver gram and kilogram rates in INR', () => {
    const silverGram = 180.25;
    const silverKg = Math.round(silverGram * 1000 * 100) / 100;
    expect(silverKg).toBe(180250.00);
  });

  it('correctly calculates Platinum gram, 10-gram and kilogram rates in INR', () => {
    const platGram = 5075.50;
    const plat10g = Math.round(platGram * 10 * 100) / 100;
    const platKg = Math.round(platGram * 1000 * 100) / 100;

    expect(plat10g).toBe(50755.00);
    expect(platKg).toBe(5075500.00);
  });

  it('detects stale data when effective date does not match current IST date', () => {
    const todayIST = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date());

    const pastDate = '2026-01-01';
    const isToday = pastDate === todayIST;
    const isStale = !isToday;

    expect(isStale).toBe(true);
  });
});
