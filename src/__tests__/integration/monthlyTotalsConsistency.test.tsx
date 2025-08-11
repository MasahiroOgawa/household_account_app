import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { StatusView } from '../../components/StatusView';
import { TransactionTable } from '../../components/TransactionTable';
import { Transaction } from '../../types/Transaction';
import { getMonthlyTotalsForYearMonth } from '../../utils/monthlyCalculations';

// Mock the date to ensure consistent test results
vi.useFakeTimers();
vi.setSystemTime(new Date('2024-08-11'));

describe('Monthly Totals Consistency Integration Tests', () => {
  const createMockTransaction = (
    date: string,
    amount: number,
    type: 'income' | 'expense',
    description: string = 'Test transaction'
  ): Transaction => ({
    id: `test-${date}-${amount}-${Math.random()}`,
    date,
    time: '12:00:00',
    description,
    amount,
    type,
    category: 'Test',
    shopName: 'Test Shop',
    source: 'Test Bank',
    originalData: {}
  });

  describe('StatusView and TransactionTable consistency', () => {
    it('should show identical May 2024 totals in both views', () => {
      const transactions: Transaction[] = [
        // May 2024 transactions - testing the reported issue
        createMockTransaction('2024-05-01', 738747, 'income', 'Salary'),
        createMockTransaction('2024-05-15', 670430, 'expense', 'Shopping'),
        createMockTransaction('2024-05-20', 100000, 'income', 'Bonus'),
        // April 2024
        createMockTransaction('2024-04-01', 500000, 'income', 'April Income'),
        createMockTransaction('2024-04-15', 300000, 'expense', 'April Expense'),
        // June 2024
        createMockTransaction('2024-06-01', 600000, 'income', 'June Income'),
        createMockTransaction('2024-06-15', 400000, 'expense', 'June Expense'),
      ];

      // Render both components with the same data
      const statusView = render(<StatusView transactions={transactions} />);
      const transactionTable = render(
        <TransactionTable transactions={transactions} onExport={() => {}} />
      );

      // Calculate expected May totals using the shared function
      const mayTotals = getMonthlyTotalsForYearMonth(transactions, 2024, 5);
      expect(mayTotals.income).toBe(838747); // 738747 + 100000
      expect(mayTotals.expenses).toBe(670430);

      // Check StatusView shows correct May totals
      // The bar chart should show these values
      const statusViewContent = statusView.container.textContent || '';
      expect(statusViewContent).toContain('838'); // Income in thousands
      expect(statusViewContent).toContain('670'); // Expenses in thousands

      // Check TransactionTable shows correct May totals
      const transactionTableContent = transactionTable.container.textContent || '';
      expect(transactionTableContent).toContain('Income: ¥838,747');
      expect(transactionTableContent).toContain('Expenses: ¥670,430');

      // Clean up
      statusView.unmount();
      transactionTable.unmount();
    });

    it('should handle 3M yen amounts consistently', () => {
      const transactions: Transaction[] = [
        createMockTransaction('2024-05-01', 3000000, 'income', 'Large Income'),
        createMockTransaction('2024-05-15', 3000000, 'expense', 'Large Expense'),
        createMockTransaction('2024-05-20', 500000, 'income', 'Additional Income'),
      ];

      const statusView = render(<StatusView transactions={transactions} />);
      const transactionTable = render(
        <TransactionTable transactions={transactions} onExport={() => {}} />
      );

      // Calculate expected May totals
      const mayTotals = getMonthlyTotalsForYearMonth(transactions, 2024, 5);
      expect(mayTotals.income).toBe(3500000); // 3M + 500k
      expect(mayTotals.expenses).toBe(3000000); // 3M

      // Both views should show the same totals
      const statusViewContent = statusView.container.textContent || '';
      const transactionTableContent = transactionTable.container.textContent || '';

      // StatusView shows in thousands
      expect(statusViewContent).toContain('3500'); // 3500k income
      expect(statusViewContent).toContain('3000'); // 3000k expenses

      // TransactionTable shows formatted
      expect(transactionTableContent).toContain('Income: ¥3,500,000');
      expect(transactionTableContent).toContain('Expenses: ¥3,000,000');

      // Clean up
      statusView.unmount();
      transactionTable.unmount();
    });

    it('should show consistent totals across multiple months', () => {
      const transactions: Transaction[] = [
        // April 2024
        createMockTransaction('2024-04-01', 1000000, 'income'),
        createMockTransaction('2024-04-15', 500000, 'expense'),
        // May 2024
        createMockTransaction('2024-05-01', 2000000, 'income'),
        createMockTransaction('2024-05-15', 1000000, 'expense'),
        // June 2024
        createMockTransaction('2024-06-01', 1500000, 'income'),
        createMockTransaction('2024-06-15', 750000, 'expense'),
      ];

      // Test each month's consistency
      const months = [
        { year: 2024, month: 4, expectedIncome: 1000000, expectedExpenses: 500000 },
        { year: 2024, month: 5, expectedIncome: 2000000, expectedExpenses: 1000000 },
        { year: 2024, month: 6, expectedIncome: 1500000, expectedExpenses: 750000 },
      ];

      months.forEach(({ year, month, expectedIncome, expectedExpenses }) => {
        const totals = getMonthlyTotalsForYearMonth(transactions, year, month);
        expect(totals.income).toBe(expectedIncome);
        expect(totals.expenses).toBe(expectedExpenses);
      });

      // Both views should process all months correctly
      const statusView = render(<StatusView transactions={transactions} />);
      const transactionTable = render(
        <TransactionTable transactions={transactions} onExport={() => {}} />
      );

      // Verify total income and expenses match
      const totalIncome = 4500000; // 1M + 2M + 1.5M
      const totalExpenses = 2250000; // 500k + 1M + 750k

      // StatusView legend shows totals
      expect(statusView.getByText(`Total: ¥${totalIncome.toLocaleString()}`)).toBeInTheDocument();
      expect(statusView.getByText(`Total: ¥${totalExpenses.toLocaleString()}`)).toBeInTheDocument();

      // TransactionTable summary cards show totals
      expect(transactionTable.getByText(`¥${totalIncome.toLocaleString()}`)).toBeInTheDocument();
      expect(transactionTable.getByText(`¥${totalExpenses.toLocaleString()}`)).toBeInTheDocument();

      // Clean up
      statusView.unmount();
      transactionTable.unmount();
    });

    it('should handle edge cases consistently', () => {
      const transactions: Transaction[] = [
        // End of month transaction
        createMockTransaction('2024-05-31', 100000, 'income'),
        // Start of month transaction
        createMockTransaction('2024-06-01', 200000, 'income'),
        // Invalid date (should be filtered out)
        { ...createMockTransaction('invalid-date', 300000, 'income'), date: 'invalid-date' },
      ];

      const mayTotals = getMonthlyTotalsForYearMonth(transactions, 2024, 5);
      const juneTotals = getMonthlyTotalsForYearMonth(transactions, 2024, 6);

      expect(mayTotals.income).toBe(100000);
      expect(juneTotals.income).toBe(200000);

      // Both views should handle invalid dates gracefully
      const statusView = render(<StatusView transactions={transactions} />);
      const transactionTable = render(
        <TransactionTable transactions={transactions} onExport={() => {}} />
      );

      // Should not crash and should show valid transactions only
      expect(statusView.container).toBeTruthy();
      expect(transactionTable.container).toBeTruthy();

      // Clean up
      statusView.unmount();
      transactionTable.unmount();
    });
  });

  describe('Data accuracy verification', () => {
    it('should not double-count or miss transactions at month boundaries', () => {
      const transactions: Transaction[] = [
        createMockTransaction('2024-04-30', 100000, 'income'), // Last day of April
        createMockTransaction('2024-05-01', 200000, 'income'), // First day of May
        createMockTransaction('2024-05-31', 300000, 'income'), // Last day of May
        createMockTransaction('2024-06-01', 400000, 'income'), // First day of June
      ];

      const aprilTotals = getMonthlyTotalsForYearMonth(transactions, 2024, 4);
      const mayTotals = getMonthlyTotalsForYearMonth(transactions, 2024, 5);
      const juneTotals = getMonthlyTotalsForYearMonth(transactions, 2024, 6);

      // Each transaction should be counted exactly once
      expect(aprilTotals.income).toBe(100000);
      expect(mayTotals.income).toBe(500000); // 200000 + 300000
      expect(juneTotals.income).toBe(400000);

      // Total should equal sum of all transactions
      const totalIncome = aprilTotals.income + mayTotals.income + juneTotals.income;
      expect(totalIncome).toBe(1000000); // 100k + 200k + 300k + 400k
    });

    it('should maintain precision with decimal amounts', () => {
      const transactions: Transaction[] = [
        createMockTransaction('2024-05-01', 123456.78, 'income'),
        createMockTransaction('2024-05-15', 987654.32, 'expense'),
      ];

      const mayTotals = getMonthlyTotalsForYearMonth(transactions, 2024, 5);
      
      expect(mayTotals.income).toBeCloseTo(123456.78, 2);
      expect(mayTotals.expenses).toBeCloseTo(987654.32, 2);
    });
  });
});