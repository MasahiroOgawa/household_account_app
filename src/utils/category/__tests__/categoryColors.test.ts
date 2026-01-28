import { describe, it, expect } from 'vitest';
import { getCategoryColor, getIncomeCategoryColor, DEFAULT_COLOR } from '../categoryColors';

describe('getCategoryColor', () => {
  it('returns color for known expense category', () => {
    expect(getCategoryColor('grocery')).toBe('#dc2626');
  });

  it('returns color for known income category', () => {
    expect(getCategoryColor('salary')).toBe('#3b82f6');
  });

  it('is case insensitive', () => {
    expect(getCategoryColor('Salary')).toBe('#3b82f6');
    expect(getCategoryColor('GROCERY')).toBe('#dc2626');
  });

  it('returns color for Japanese category', () => {
    expect(getCategoryColor('食費')).toBe('#ef4444');
  });

  it('returns default gray for unknown category', () => {
    expect(getCategoryColor('unknown_category')).toBe(DEFAULT_COLOR);
  });

  it('handles invest/investment aliases', () => {
    expect(getCategoryColor('invest')).toBe('#ef4444');
    // 'investment' is in legacy map with different color
    expect(getCategoryColor('investment')).toBe('#f97316');
  });
});

describe('getIncomeCategoryColor', () => {
  it('returns specific color for salary', () => {
    expect(getIncomeCategoryColor('salary')).toBe('#3b82f6');
  });

  it('returns specific color for Japanese salary', () => {
    expect(getIncomeCategoryColor('給与')).toBe('#3b82f6');
  });

  it('returns a blue shade for unknown income category', () => {
    const color = getIncomeCategoryColor('unknown_income', 0);
    expect(color).toBe('#3b82f6'); // first blue shade
  });

  it('cycles through blue shades for different indices', () => {
    const color0 = getIncomeCategoryColor('foo', 0);
    const color1 = getIncomeCategoryColor('foo', 1);
    expect(color0).not.toBe(color1);
  });
});
