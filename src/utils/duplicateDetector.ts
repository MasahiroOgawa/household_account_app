import { Transaction } from '../types/Transaction';
import { isSameDay, differenceInMinutes, parseISO } from 'date-fns';
import { calculateStringSimilarity } from './levenshtein';

export const detectAndMergeDuplicates = (transactions: Transaction[]): Transaction[] => {
  const uniqueTransactions: Transaction[] = [];
  const processed = new Set<string>();

  transactions.forEach((transaction) => {
    if (processed.has(transaction.id)) {
      return;
    }

    const duplicates = transactions.filter((other) => {
      if (other.id === transaction.id || processed.has(other.id)) {
        return false;
      }
      return isDuplicate(transaction, other);
    });

    if (duplicates.length > 0) {
      const merged = mergeDuplicateTransactions([transaction, ...duplicates]);
      uniqueTransactions.push(merged);
      processed.add(transaction.id);
      duplicates.forEach(dup => processed.add(dup.id));
    } else {
      uniqueTransactions.push(transaction);
      processed.add(transaction.id);
    }
  });

  return uniqueTransactions;
};

const isDuplicate = (transaction1: Transaction, transaction2: Transaction): boolean => {
  if (Math.abs(transaction1.amount - transaction2.amount) > 0.01) {
    return false;
  }

  const date1 = parseISO(`${transaction1.date}T${transaction1.time}`);
  const date2 = parseISO(`${transaction2.date}T${transaction2.time}`);

  if (!isSameDay(date1, date2)) {
    return false;
  }

  const timeDifference = Math.abs(differenceInMinutes(date1, date2));
  if (timeDifference > 5) {
    return false;
  }

  const similarity = calculateStringSimilarity(
    transaction1.description.toLowerCase(),
    transaction2.description.toLowerCase()
  );

  return similarity > 0.7;
};

const mergeDuplicateTransactions = (transactions: Transaction[]): Transaction => {
  // Prefer transaction_result (re-imported) entry — it has user-edited categories
  const reImported = transactions.find(t => t.originalData?.fileType === 'transaction_result');
  const primary = reImported || transactions[0];

  const bestDescription = transactions.reduce((best, current) =>
    current.description.length > best.description.length ? current : best
  ).description;

  const bestShopName = transactions.reduce((best, current) =>
    current.shopName.length > best.shopName.length ? current : best
  ).shopName;

  return {
    ...primary,
    description: bestDescription,
    shopName: bestShopName,
    originalData: {
      ...primary.originalData,
      duplicateCount: transactions.length,
      mergedFrom: transactions.map(t => t.id),
    },
  };
};
