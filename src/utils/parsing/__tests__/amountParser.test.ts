import { describe, it, expect } from 'vitest';
import { parseAmount, parseAbsoluteAmount, isNegativeAmount } from '../amountParser';

describe('parseAmount', () => {
  it('returns 0 for empty string', () => {
    expect(parseAmount('')).toBe(0);
  });

  it('parses simple integer', () => {
    expect(parseAmount('1000')).toBe(1000);
  });

  it('parses number with commas', () => {
    expect(parseAmount('1,234,567')).toBe(1234567);
  });

  it('removes yen symbol', () => {
    expect(parseAmount('¥1,080')).toBe(1080);
  });

  it('removes backslash (yen in some encodings)', () => {
    expect(parseAmount('\\1,080')).toBe(1080);
  });

  it('removes dollar symbol', () => {
    expect(parseAmount('$99.99')).toBe(99.99);
  });

  it('handles negative numbers', () => {
    expect(parseAmount('-500')).toBe(-500);
  });

  it('handles parenthesized negatives', () => {
    expect(parseAmount('(500)')).toBe(-500);
  });

  it('returns 0 for non-numeric string', () => {
    expect(parseAmount('abc')).toBe(0);
  });

  it('handles whitespace and quotes', () => {
    expect(parseAmount(' "1,000" ')).toBe(1000);
  });
});

describe('parseAbsoluteAmount', () => {
  it('returns absolute value of negative amounts', () => {
    expect(parseAbsoluteAmount('-500')).toBe(500);
  });

  it('returns positive amounts unchanged', () => {
    expect(parseAbsoluteAmount('1000')).toBe(1000);
  });
});

describe('isNegativeAmount', () => {
  it('returns true for negative string', () => {
    expect(isNegativeAmount('-100')).toBe(true);
  });

  it('returns true for parenthesized string', () => {
    expect(isNegativeAmount('(100)')).toBe(true);
  });

  it('returns false for positive string', () => {
    expect(isNegativeAmount('100')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isNegativeAmount('')).toBe(false);
  });
});
