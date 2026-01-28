import { describe, it, expect } from 'vitest';
import { detectAndMergeDuplicates } from '../duplicateDetector';
import { Transaction } from '../../types/Transaction';

const makeTx = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: `tx_${Math.random()}`,
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

describe('detectAndMergeDuplicates', () => {
  it('returns empty array for empty input', () => {
    expect(detectAndMergeDuplicates([])).toEqual([]);
  });

  it('returns single transaction unchanged', () => {
    const txs = [makeTx({ id: 'tx_1' })];
    const result = detectAndMergeDuplicates(txs);
    expect(result).toHaveLength(1);
  });

  it('merges duplicates with same amount, date, and similar description', () => {
    const txs = [
      makeTx({ id: 'tx_1', description: 'スターバックスコーヒー渋谷店', amount: 500 }),
      makeTx({ id: 'tx_2', description: 'スターバックスコーヒー渋谷', amount: 500 }),
    ];
    const result = detectAndMergeDuplicates(txs);
    expect(result).toHaveLength(1);
  });

  it('keeps transactions with different amounts', () => {
    const txs = [
      makeTx({ id: 'tx_1', amount: 500 }),
      makeTx({ id: 'tx_2', amount: 1500 }),
    ];
    const result = detectAndMergeDuplicates(txs);
    expect(result).toHaveLength(2);
  });

  it('keeps transactions on different dates', () => {
    const txs = [
      makeTx({ id: 'tx_1', date: '2024-01-15' }),
      makeTx({ id: 'tx_2', date: '2024-02-15' }),
    ];
    const result = detectAndMergeDuplicates(txs);
    expect(result).toHaveLength(2);
  });

  it('keeps transactions with very different descriptions', () => {
    const txs = [
      makeTx({ id: 'tx_1', description: 'ABC Corporation', amount: 1000 }),
      makeTx({ id: 'tx_2', description: 'XYZ Restaurant', amount: 1000 }),
    ];
    const result = detectAndMergeDuplicates(txs);
    expect(result).toHaveLength(2);
  });

  it('uses longest description when merging', () => {
    const txs = [
      makeTx({ id: 'tx_1', description: 'スターバックスコーヒー渋谷', shopName: 'スタバ', amount: 500 }),
      makeTx({ id: 'tx_2', description: 'スターバックスコーヒー渋谷センター街', shopName: 'スターバックス', amount: 500 }),
    ];
    const result = detectAndMergeDuplicates(txs);
    expect(result).toHaveLength(1);
    expect(result[0].description).toBe('スターバックスコーヒー渋谷センター街');
    expect(result[0].shopName).toBe('スターバックス');
  });
});
