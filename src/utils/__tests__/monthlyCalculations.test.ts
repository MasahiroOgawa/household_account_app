import { describe, it, expect } from 'vitest';
import { calculateMonthlyTotals, getMonthlyTotalsForYearMonth } from '../monthlyCalculations';
import { Transaction } from '../../types/Transaction';

describe('monthlyCalculations', () => {
  const createMockTransaction = (
    date: string,
    amount: number,
    type: 'income' | 'expense'
  ): Transaction => ({
    id: `test-${date}-${amount}`,
    date,
    time: '12:00:00',
    description: 'Test transaction',
    amount,
    type,
    category: 'Test',
    shopName: 'Test Shop',
    source: 'Test Bank',
    originalData: {}
  });

  describe('calculateMonthlyTotals', () => {
    it('should calculate monthly totals correctly', () => {
      const transactions: Transaction[] = [
        createMockTransaction('2024-05-01', 100000, 'income'),
        createMockTransaction('2024-05-15', 50000, 'expense'),
        createMockTransaction('2024-05-20', 200000, 'income'),
        createMockTransaction('2024-05-25', 30000, 'expense'),
        createMockTransaction('2024-06-01', 150000, 'income'), // Different month
      ];

      const mayStart = new Date(2024, 4, 1); // May 1, 2024
      const mayEnd = new Date(2024, 4, 31, 23, 59, 59); // May 31, 2024

      const result = calculateMonthlyTotals(transactions, mayStart, mayEnd);

      expect(result.income).toBe(300000); // 100000 + 200000
      expect(result.expenses).toBe(80000); // 50000 + 30000
      expect(result.transactions).toHaveLength(4); // Only May transactions
    });

    it('should handle empty transaction list', () => {
      const transactions: Transaction[] = [];
      const mayStart = new Date(2024, 4, 1);
      const mayEnd = new Date(2024, 4, 31, 23, 59, 59);

      const result = calculateMonthlyTotals(transactions, mayStart, mayEnd);

      expect(result.income).toBe(0);
      expect(result.expenses).toBe(0);
      expect(result.transactions).toHaveLength(0);
    });

    it('should handle invalid dates gracefully', () => {
      const transactions: Transaction[] = [
        createMockTransaction('2024-05-01', 100000, 'income'),
        createMockTransaction('invalid-date', 50000, 'expense'), // Invalid date
        createMockTransaction('2024-05-20', 200000, 'income'),
      ];

      const mayStart = new Date(2024, 4, 1);
      const mayEnd = new Date(2024, 4, 31, 23, 59, 59);

      const result = calculateMonthlyTotals(transactions, mayStart, mayEnd);

      expect(result.income).toBe(300000); // Only valid transactions
      expect(result.expenses).toBe(0); // Invalid transaction ignored
      expect(result.transactions).toHaveLength(2);
    });

    it('should correctly filter transactions by date range', () => {
      const transactions: Transaction[] = [
        createMockTransaction('2024-04-30', 100000, 'income'), // April
        createMockTransaction('2024-05-01', 200000, 'income'), // May start
        createMockTransaction('2024-05-31', 300000, 'income'), // May end
        createMockTransaction('2024-06-01', 400000, 'income'), // June
      ];

      const mayStart = new Date(2024, 4, 1);
      const mayEnd = new Date(2024, 4, 31, 23, 59, 59);

      const result = calculateMonthlyTotals(transactions, mayStart, mayEnd);

      expect(result.income).toBe(500000); // Only May transactions
      expect(result.transactions).toHaveLength(2);
    });

    it('should handle large amounts correctly (3M yen test case)', () => {
      const transactions: Transaction[] = [
        createMockTransaction('2024-05-01', 3000000, 'income'),
        createMockTransaction('2024-05-15', 3000000, 'expense'),
      ];

      const mayStart = new Date(2024, 4, 1);
      const mayEnd = new Date(2024, 4, 31, 23, 59, 59);

      const result = calculateMonthlyTotals(transactions, mayStart, mayEnd);

      expect(result.income).toBe(3000000);
      expect(result.expenses).toBe(3000000);
    });
  });

  describe('getMonthlyTotalsForYearMonth', () => {
    it('should calculate totals for specific year and month', () => {
      const transactions: Transaction[] = [
        createMockTransaction('2024-05-01', 738747, 'income'),
        createMockTransaction('2024-05-15', 670430, 'expense'),
        createMockTransaction('2024-05-20', 100000, 'income'),
        createMockTransaction('2024-06-01', 150000, 'income'), // Different month
      ];

      const result = getMonthlyTotalsForYearMonth(transactions, 2024, 5);

      expect(result.income).toBe(838747); // 738747 + 100000
      expect(result.expenses).toBe(670430);
      expect(result.transactions).toHaveLength(3); // Only May transactions
    });

    it('should handle month boundaries correctly', () => {
      const transactions: Transaction[] = [
        createMockTransaction('2024-05-31', 100000, 'income'), // Last day of May
        createMockTransaction('2024-06-01', 200000, 'income'), // First day of June
      ];

      const mayResult = getMonthlyTotalsForYearMonth(transactions, 2024, 5);
      const juneResult = getMonthlyTotalsForYearMonth(transactions, 2024, 6);

      expect(mayResult.income).toBe(100000);
      expect(mayResult.transactions).toHaveLength(1);
      
      expect(juneResult.income).toBe(200000);
      expect(juneResult.transactions).toHaveLength(1);
    });
  });
});