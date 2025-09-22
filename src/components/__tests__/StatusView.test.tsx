import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusView } from '../StatusView';
import { Transaction } from '../../types/Transaction';

// Mock the date to ensure consistent test results
vi.useFakeTimers();
vi.setSystemTime(new Date('2024-08-11'));

describe('StatusView', () => {
  const createMockTransaction = (
    date: string,
    amount: number,
    type: 'income' | 'expense',
    category: string = 'Test'
  ): Transaction => ({
    id: `test-${date}-${amount}`,
    date,
    time: '12:00:00',
    description: 'Test transaction',
    amount,
    type,
    category,
    shopName: 'Test Shop',
    source: 'Test Bank',
    originalData: {}
  });

  describe('Monthly Bar Chart Calculations', () => {
    it('should calculate May 2024 totals correctly', () => {
      const transactions: Transaction[] = [
        // May 2024 transactions - matching the reported issue
        createMockTransaction('2024-05-01', 738747, 'income', 'Salary'),
        createMockTransaction('2024-05-15', 670430, 'expense', 'Shopping'),
        createMockTransaction('2024-05-20', 100000, 'income', 'Bonus'),
        // Other months
        createMockTransaction('2024-04-01', 500000, 'income', 'Salary'),
        createMockTransaction('2024-06-01', 600000, 'income', 'Salary'),
      ];

      const { container } = render(<StatusView transactions={transactions} />);

      // The component should show the correct totals for May
      // Total income for May: 738747 + 100000 = 838747
      // Total expenses for May: 670430
      
      // The totals should be consistent throughout the component
      expect(container.textContent).toContain('838'); // Income in thousands
      expect(container.textContent).toContain('670'); // Expenses in thousands
    });

    it('should handle large amounts (3M yen) correctly', () => {
      const transactions: Transaction[] = [
        createMockTransaction('2024-05-01', 3000000, 'income', 'Large Income'),
        createMockTransaction('2024-05-15', 3000000, 'expense', 'Large Expense'),
      ];

      const { container } = render(<StatusView transactions={transactions} />);

      // Should display 3000k (3M) correctly
      expect(container.textContent).toMatch(/3000k|3,000k|3M/i);
    });

    it('should show correct totals in legend', () => {
      const transactions: Transaction[] = [
        createMockTransaction('2024-05-01', 1000000, 'income'),
        createMockTransaction('2024-05-15', 800000, 'expense'),
        createMockTransaction('2024-06-01', 500000, 'income'),
        createMockTransaction('2024-06-15', 300000, 'expense'),
      ];

      render(<StatusView transactions={transactions} />);

      // Legend shows formatted totals
      // Total income: 1000000 + 500000 = 1500000
      // Total expenses: 800000 + 300000 = 1100000
      expect(screen.getByText(/Total: ¥1,500,000/)).toBeInTheDocument();
      expect(screen.getByText(/Total: ¥1,100,000/)).toBeInTheDocument();
    });
  });

  describe('Category Breakdown', () => {
    it('should calculate category totals correctly', () => {
      const transactions: Transaction[] = [
        createMockTransaction('2024-05-01', 500000, 'income', 'Salary'),
        createMockTransaction('2024-05-05', 200000, 'income', 'Bonus'),
        createMockTransaction('2024-05-10', 300000, 'income', 'Salary'),
        createMockTransaction('2024-05-15', 400000, 'expense', 'Food'),
        createMockTransaction('2024-05-20', 100000, 'expense', 'Food'),
        createMockTransaction('2024-05-25', 200000, 'expense', 'Transport'),
      ];

      const { container } = render(<StatusView transactions={transactions} />);

      // Income categories: Salary (800k), Bonus (200k)
      // Expense categories: Food (500k), Transport (200k)
      
      // Total income shown in center of pie chart
      expect(container.textContent).toContain('¥1000k'); // Total income
      expect(container.textContent).toContain('¥700k'); // Total expenses
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no transactions', () => {
      render(<StatusView transactions={[]} />);

      expect(screen.getByText('No transaction data')).toBeInTheDocument();
      expect(screen.getByText(/Upload some transaction files/)).toBeInTheDocument();
    });
  });
});