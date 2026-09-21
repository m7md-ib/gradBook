import { describe, expect, it } from 'vitest';
import { slugify, generateAccessCode, paginate, formatCurrency } from '../index.js';

describe('slugify', () => {
  it('transliterates Arabic names into readable Latin slugs', () => {
    expect(slugify('محمد إبراهيم')).toBe('mhmd-abrahym');
  });

  it('lowercases and hyphenates English input', () => {
    expect(slugify('Sara Al Harbi 2026')).toBe('sara-al-harbi-2026');
  });

  it('strips characters that are neither letters nor numbers', () => {
    expect(slugify('!!!')).toBe('notebook');
  });

  it('caps length at 60 characters', () => {
    const long = 'a'.repeat(200);
    expect(slugify(long).length).toBeLessThanOrEqual(60);
  });
});

describe('generateAccessCode', () => {
  it('produces an 8-character code split into two groups of four', () => {
    const code = generateAccessCode();
    expect(code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  });

  it('is not the same every time', () => {
    const codes = new Set(Array.from({ length: 20 }, () => generateAccessCode()));
    expect(codes.size).toBeGreaterThan(1);
  });
});

describe('paginate', () => {
  it('computes total pages from total count and page size', () => {
    const result = paginate([1, 2, 3], 1, 3, 10);
    expect(result).toEqual({ items: [1, 2, 3], page: 1, pageSize: 3, total: 10, totalPages: 4 });
  });

  it('always reports at least one page even when there are zero results', () => {
    expect(paginate([], 1, 20, 0).totalPages).toBe(1);
  });
});

describe('formatCurrency', () => {
  it('converts cents to a whole-unit currency string', () => {
    expect(formatCurrency(4900, 'SAR', 'en')).toContain('49');
  });
});
