import { describe, it, expect } from 'vitest';
import { getCategoryColor, getIncomeCategoryColor, DEFAULT_COLOR } from '../categoryColors';

describe('getCategoryColor', () => {
  it('returns color for known expense category', () => {
    expect(getCategoryColor('grocery')).toBe('#dc2626');
  });

  it('returns color for known income category', () => {
    expect(getCategoryColor('salary')).toBe('#2563eb');
  });

  it('is case insensitive', () => {
    expect(getCategoryColor('Salary')).toBe('#2563eb');
    expect(getCategoryColor('GROCERY')).toBe('#dc2626');
  });

  it('returns color for Japanese category', () => {
    expect(getCategoryColor('食費')).toBe('#ef4444');
  });

  it('returns default gray for unknown category', () => {
    expect(getCategoryColor('unknown_category')).toBe(DEFAULT_COLOR);
  });

  it('returns default for removed invest category', () => {
    expect(getCategoryColor('invest')).toBe(DEFAULT_COLOR);
    expect(getCategoryColor('investment')).toBe(DEFAULT_COLOR);
  });
});

describe('getIncomeCategoryColor', () => {
  it('returns specific color for salary', () => {
    expect(getIncomeCategoryColor('salary')).toBe('#2563eb');
  });

  it('returns specific color for Japanese salary', () => {
    expect(getIncomeCategoryColor('給与')).toBe('#2563eb');
  });

  it('returns distinct colors for different income categories', () => {
    const salary = getIncomeCategoryColor('salary');
    const revenue = getIncomeCategoryColor('revenue');
    const deposit = getIncomeCategoryColor('deposit');
    expect(salary).not.toBe(revenue);
    expect(salary).not.toBe(deposit);
    expect(revenue).not.toBe(deposit);
  });

  it('returns a fallback color for unknown income category', () => {
    const color = getIncomeCategoryColor('unknown_income', 0);
    expect(color).toBe('#2563eb');
  });

  it('cycles through distinct colors for different indices', () => {
    const color0 = getIncomeCategoryColor('foo', 0);
    const color1 = getIncomeCategoryColor('foo', 1);
    expect(color0).not.toBe(color1);
  });
});
