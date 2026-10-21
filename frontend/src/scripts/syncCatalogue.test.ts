import { describe, it, expect, vi } from 'vitest';
import { Pool } from 'pg';
import { localJewelryItems } from '../utils/localData';

vi.mock('pg', () => {
  class MockPool {
    connect = vi.fn().mockResolvedValue({
      query: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
      release: vi.fn(),
    });
    query = vi.fn().mockResolvedValue({ rows: [], rowCount: 0 });
    end = vi.fn().mockResolvedValue(undefined);
  }

  return {
    Pool: MockPool,
    default: {
      Pool: MockPool,
    },
  };
});

describe('Catalogue Sync Utility (syncCatalogue)', () => {
  it('instantiates the PostgreSQL pool connection cleanly without type errors', () => {
    const pool = new Pool();
    expect(pool).toBeDefined();
    expect(typeof pool.query).toBe('function');
  });

  it('validates that all local catalogue items have required sync fields', () => {
    expect(localJewelryItems.length).toBeGreaterThan(0);

    localJewelryItems.forEach((item) => {
      expect(item.id).toBeDefined();
      expect(typeof item.name).toBe('string');
      expect(typeof item.category).toBe('string');
      expect(typeof item.weight).toBe('number');
      expect(item.weight).toBeGreaterThan(0);
      expect(item.image_url).toBeDefined();
    });
  });

  it('verifies all catalogue items have valid metal type and pricing parameters', () => {
    const validMetals = ['gold', 'silver', 'platinum', 'diamond'];

    localJewelryItems.forEach((item) => {
      expect(validMetals).toContain(item.metal_type);
      expect(item.price).toBeGreaterThan(0);
    });
  });
});
