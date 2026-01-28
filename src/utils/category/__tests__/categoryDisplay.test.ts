import { describe, it, expect } from 'vitest';
import { getCategoryDisplayName, getCategoryType, getAllCategories } from '../categoryDisplay';

describe('getCategoryDisplayName', () => {
  it('returns display name for known category', () => {
    expect(getCategoryDisplayName('salary')).toBe('Salary');
    expect(getCategoryDisplayName('grocery')).toBe('Grocery');
  });

  it('returns Japanese name for Japanese category', () => {
    expect(getCategoryDisplayName('食費')).toBe('食費');
  });

  it('formats unknown category with title case', () => {
    expect(getCategoryDisplayName('some_new_thing')).toBe('Some New Thing');
  });
});

describe('getCategoryType', () => {
  it('returns income for salary', () => {
    expect(getCategoryType('salary')).toBe('income');
  });

  it('returns expense for grocery', () => {
    expect(getCategoryType('grocery')).toBe('expense');
  });

  it('returns expense as default for unknown category', () => {
    expect(getCategoryType('unknown')).toBe('expense');
  });
});

describe('getAllCategories', () => {
  it('returns income and expense arrays', () => {
    const cats = getAllCategories();
    expect(cats.income).toContain('salary');
    expect(cats.expense).toContain('grocery');
    expect(cats.income.length).toBeGreaterThan(0);
    expect(cats.expense.length).toBeGreaterThan(0);
  });
});
