import { describe, it, expect } from 'vitest';
import { generatePledgeNumber } from './sequenceUtils';

describe('generatePledgeNumber', () => {
  const currentYear = new Date().getFullYear();

  it('generates initial pledge number when lastPledgeNumber is not provided', () => {
    expect(generatePledgeNumber()).toBe(`PL-${currentYear}-0001`);
  });

  it('generates initial pledge number with custom prefix', () => {
    expect(generatePledgeNumber(undefined, 'PJ')).toBe(`PJ-${currentYear}-0001`);
  });

  it('increments sequence number when in the same year', () => {
    const lastPledge = `PL-${currentYear}-0005`;
    expect(generatePledgeNumber(lastPledge)).toBe(`PL-${currentYear}-0006`);
  });

  it('pads sequence number to 4 digits', () => {
    const lastPledge = `PL-${currentYear}-0099`;
    expect(generatePledgeNumber(lastPledge)).toBe(`PL-${currentYear}-0100`);
  });

  it('resets sequence to 0001 if the last pledge was from a previous year', () => {
    const lastPledge = `PL-2020-0500`;
    expect(generatePledgeNumber(lastPledge)).toBe(`PL-${currentYear}-0001`);
  });

  it('falls back to default initial number when format is invalid', () => {
    expect(generatePledgeNumber('INVALID-FORMAT')).toBe(`PL-${currentYear}-0001`);
  });
});
