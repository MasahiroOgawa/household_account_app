import { Transaction } from '../types/Transaction';
import { parseISO, startOfMonth, endOfMonth, isWithinInterval, isValid } from 'date-fns';

export interface MonthlyTotals {
  income: number;
  expenses: number;
  transactions: Transaction[];
}

/**
 * Calculate monthly totals for a specific month
 * This function ensures consistent calculation across all components
 */
export const calculateMonthlyTotals = (
  transactions: Transaction[],
  monthStart: Date,
  monthEnd: Date
): MonthlyTotals => {
  const monthTransactions = transactions.filter(t => {
    try {
      // Parse the date - handle potential parsing errors
      const transactionDate = parseISO(t.date);
      
      // Validate the parsed date
      if (!isValid(transactionDate)) {
        console.warn(`Invalid date for transaction ${t.id}: ${t.date}`);
        return false;
      }
      
      // Check if transaction falls within the month
      return isWithinInterval(transactionDate, { start: monthStart, end: monthEnd });
    } catch (error) {
      console.error(`Error parsing date for transaction ${t.id}: ${t.date}`, error);
      return false;
    }
  });

  const income = monthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = monthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  return { income, expenses, transactions: monthTransactions };
};

/**
 * Get monthly totals for a specific year and month
 */
export const getMonthlyTotalsForYearMonth = (
  transactions: Transaction[],
  year: number,
  month: number
): MonthlyTotals => {
  const date = new Date(year, month - 1); // month is 0-indexed in Date constructor
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  
  return calculateMonthlyTotals(transactions, monthStart, monthEnd);
};