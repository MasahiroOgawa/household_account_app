import { Transaction } from '../types/Transaction';

/**
 * Sort transactions by date and time in descending order (newest first)
 */
export const sortTransactionsByDateTime = (transactions: Transaction[]): Transaction[] => {
  return [...transactions].sort((a, b) => {
    const dateTimeA = new Date(`${a.date}T${a.time}`);
    const dateTimeB = new Date(`${b.date}T${b.time}`);
    return dateTimeB.getTime() - dateTimeA.getTime();
  });
};

/**
 * Sort transactions by date and time in ascending order (oldest first)
 */
export const sortTransactionsByDateTimeAsc = (transactions: Transaction[]): Transaction[] => {
  return [...transactions].sort((a, b) => {
    const dateTimeA = new Date(`${a.date}T${a.time}`);
    const dateTimeB = new Date(`${b.date}T${b.time}`);
    return dateTimeA.getTime() - dateTimeB.getTime();
  });
};