import { describe, it, expect } from 'vitest';
import { sortTransactionsByDateTime, sortTransactionsByDateTimeAsc } from '../transactionUtils';
import { Transaction } from '../../types/Transaction';

const makeTx = (date: string, time: string): Transaction => ({
  id: `tx_${date}_${time}`,
  date,
  time,
  amount: 100,
  description: 'Test',
  category: 'other_expense',
  shopName: 'Shop',
  type: 'expense',
  source: 'Test',
});

describe('sortTransactionsByDateTime', () => {
  it('sorts newest first', () => {
    const txs = [
      makeTx('2024-01-01', '12:00:00'),
      makeTx('2024-03-01', '12:00:00'),
      makeTx('2024-02-01', '12:00:00'),
    ];
    const sorted = sortTransactionsByDateTime(txs);
    expect(sorted[0].date).toBe('2024-03-01');
    expect(sorted[2].date).toBe('2024-01-01');
  });

  it('does not mutate original array', () => {
    const txs = [makeTx('2024-01-01', '12:00:00')];
    const sorted = sortTransactionsByDateTime(txs);
    expect(sorted).not.toBe(txs);
  });
});

describe('sortTransactionsByDateTimeAsc', () => {
  it('sorts oldest first', () => {
    const txs = [
      makeTx('2024-03-01', '12:00:00'),
      makeTx('2024-01-01', '12:00:00'),
    ];
    const sorted = sortTransactionsByDateTimeAsc(txs);
    expect(sorted[0].date).toBe('2024-01-01');
    expect(sorted[1].date).toBe('2024-03-01');
  });
});
