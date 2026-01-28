import { describe, it, expect } from 'vitest';
import { analyzeTransactionsForMapping, exportCategoryMapping } from '../categoryMappingGenerator';
import { Transaction } from '../../../types/Transaction';

const makeTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: 'test_1',
  date: '2024-01-15',
  time: '12:00:00',
  amount: 1000,
  description: 'Test Transaction',
  category: 'other_expense',
  shopName: 'Test Shop',
  type: 'expense',
  source: 'Test',
  ...overrides,
});

describe('analyzeTransactionsForMapping', () => {
  it('returns empty mappings for empty transactions', () => {
    const result = analyzeTransactionsForMapping([]);
    expect(Object.keys(result.mappings)).toHaveLength(0);
    expect(result.categories.income.length).toBeGreaterThan(0);
    expect(result.categories.expense.length).toBeGreaterThan(0);
  });

  it('generates mappings from transaction descriptions', () => {
    const transactions = [
      makeTransaction({ shopName: 'スターバックス', type: 'expense' }),
      makeTransaction({ shopName: 'セブンイレブン', type: 'expense' }),
    ];
    const result = analyzeTransactionsForMapping(transactions);
    expect(Object.keys(result.mappings)).toHaveLength(2);
    expect(result.mappings['スターバックス']).toBe('leisure');
    expect(result.mappings['セブンイレブン']).toBe('grocery');
  });

  it('deduplicates same shop names', () => {
    const transactions = [
      makeTransaction({ shopName: 'スターバックス', type: 'expense' }),
      makeTransaction({ id: 'test_2', shopName: 'スターバックス', type: 'expense' }),
    ];
    const result = analyzeTransactionsForMapping(transactions);
    expect(Object.keys(result.mappings)).toHaveLength(1);
  });

  it('classifies income transactions', () => {
    const transactions = [
      makeTransaction({ shopName: '給与振込', type: 'income' }),
    ];
    const result = analyzeTransactionsForMapping(transactions);
    expect(result.mappings['給与振込']).toBe('salary');
  });
});

describe('exportCategoryMapping', () => {
  it('returns valid JSON string', () => {
    const transactions = [makeTransaction({ shopName: 'Test' })];
    const json = exportCategoryMapping(transactions);
    const parsed = JSON.parse(json);
    expect(parsed).toHaveProperty('categories');
    expect(parsed).toHaveProperty('mappings');
  });
});
