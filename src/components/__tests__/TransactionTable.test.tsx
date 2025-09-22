import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TransactionTable } from '../TransactionTable';
import { Transaction } from '../../types/Transaction';

describe('TransactionTable', () => {
  const mockOnExport = vi.fn();

  const createMockTransaction = (
    date: string,
    amount: number,
    type: 'income' | 'expense',
    description: string = 'Test transaction'
  ): Transaction => ({
    id: `test-${date}-${amount}`,
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

  describe('Monthly Totals Calculation', () => {
    it('should calculate May 2024 totals correctly', () => {
      const transactions: Transaction[] = [
        // May 2024 transactions - matching the reported issue
        createMockTransaction('2024-05-01', 738747, 'income', 'Salary Payment'),
        createMockTransaction('2024-05-15', 670430, 'expense', 'Monthly Shopping'),
        createMockTransaction('2024-05-20', 100000, 'income', 'Bonus Payment'),
        // Other months
        createMockTransaction('2024-04-01', 500000, 'income'),
        createMockTransaction('2024-06-01', 600000, 'income'),
      ];

      render(<TransactionTable transactions={transactions} onExport={mockOnExport} />);

      // Check that May totals are displayed correctly
      // Income: 738747 + 100000 = 838747
      // Expenses: 670430
      expect(screen.getByText(/Income: ¥838,747/)).toBeInTheDocument();
      expect(screen.getByText(/Expenses: ¥670,430/)).toBeInTheDocument();
    });

    it('should show correct summary cards totals', () => {
      const transactions: Transaction[] = [
        createMockTransaction('2024-05-01', 1000000, 'income'),
        createMockTransaction('2024-05-15', 800000, 'expense'),
        createMockTransaction('2024-06-01', 500000, 'income'),
        createMockTransaction('2024-06-15', 300000, 'expense'),
      ];

      render(<TransactionTable transactions={transactions} onExport={mockOnExport} />);

      // Check summary cards
      // Total income: 1000000 + 500000 = 1500000
      // Total expenses: 800000 + 300000 = 1100000
      // Net amount: 1500000 - 1100000 = 400000
      // These should be in the summary cards at the top
      expect(screen.getByText('Total Income')).toBeInTheDocument();
      expect(screen.getByText('¥1,500,000')).toBeInTheDocument();
      
      expect(screen.getByText('Total Expenses')).toBeInTheDocument();
      expect(screen.getByText('¥1,100,000')).toBeInTheDocument();
      
      expect(screen.getByText('Net Amount')).toBeInTheDocument();
      expect(screen.getByText('¥400,000')).toBeInTheDocument();
    });

    it('should handle large amounts (3M yen) correctly', () => {
      const transactions: Transaction[] = [
        createMockTransaction('2024-05-01', 3000000, 'income', 'Large Income'),
        createMockTransaction('2024-05-15', 3000000, 'expense', 'Large Expense'),
      ];

      render(<TransactionTable transactions={transactions} onExport={mockOnExport} />);

      // Check that 3M amounts are displayed correctly
      expect(screen.getByText('¥3,000,000')).toBeInTheDocument(); // Total Income
      expect(screen.getAllByText('¥3,000,000')).toHaveLength(2); // Income and Expense

      // Check monthly breakdown
      expect(screen.getByText(/Income: ¥3,000,000/)).toBeInTheDocument();
      expect(screen.getByText(/Expenses: ¥3,000,000/)).toBeInTheDocument();
    });

    it('should group transactions by month correctly', () => {
      const transactions: Transaction[] = [
        createMockTransaction('2024-05-01', 100000, 'income'),
        createMockTransaction('2024-05-15', 50000, 'expense'),
        createMockTransaction('2024-06-01', 200000, 'income'),
        createMockTransaction('2024-06-15', 75000, 'expense'),
      ];

      render(<TransactionTable transactions={transactions} onExport={mockOnExport} />);

      // Check that months are displayed
      expect(screen.getByText('May 2024')).toBeInTheDocument();
      expect(screen.getByText('June 2024')).toBeInTheDocument();

      // Check transaction counts
      expect(screen.getByText('(2 transactions)')).toBeInTheDocument(); // May
      expect(screen.getAllByText('(2 transactions)')).toHaveLength(2); // May and June
    });

    it('should calculate net amounts correctly', () => {
      const transactions: Transaction[] = [
        createMockTransaction('2024-05-01', 1000000, 'income'),
        createMockTransaction('2024-05-15', 600000, 'expense'),
      ];

      render(<TransactionTable transactions={transactions} onExport={mockOnExport} />);

      // Net for May: 1000000 - 600000 = 400000
      expect(screen.getByText('Net: +¥400,000')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no transactions', () => {
      render(<TransactionTable transactions={[]} onExport={mockOnExport} />);

      expect(screen.getByText('No transactions yet')).toBeInTheDocument();
      expect(screen.getByText(/Upload a CSV file to get started/)).toBeInTheDocument();
    });
  });

  describe('Transaction Display', () => {
    it('should display individual transactions correctly', () => {
      const transactions: Transaction[] = [
        createMockTransaction('2024-05-01', 100000, 'income', 'Test Income'),
        createMockTransaction('2024-05-15', 50000, 'expense', 'Test Expense'),
      ];

      render(<TransactionTable transactions={transactions} onExport={mockOnExport} />);

      // Check that transaction descriptions are shown
      expect(screen.getByText('Test Income')).toBeInTheDocument();
      expect(screen.getByText('Test Expense')).toBeInTheDocument();

      // Check that amounts are shown with proper formatting
      expect(screen.getByText('+¥100,000')).toBeInTheDocument();
      expect(screen.getByText('-¥50,000')).toBeInTheDocument();
    });
  });
});