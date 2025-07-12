import { Transaction } from '../types/Transaction';
import { isSameDay, differenceInMinutes, parseISO } from 'date-fns';

export const detectAndMergeDuplicates = (transactions: Transaction[]): Transaction[] => {
  const uniqueTransactions: Transaction[] = [];
  const processed = new Set<string>();

  transactions.forEach((transaction) => {
    if (processed.has(transaction.id)) {
      return;
    }

    // Find potential duplicates
    const duplicates = transactions.filter((other) => {
      if (other.id === transaction.id || processed.has(other.id)) {
        return false;
      }

      return isDuplicate(transaction, other);
    });

    if (duplicates.length > 0) {
      // Merge duplicates
      const merged = mergeDuplicateTransactions([transaction, ...duplicates]);
      uniqueTransactions.push(merged);
      
      // Mark all as processed
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
  // Check if amounts are the same
  if (Math.abs(transaction1.amount - transaction2.amount) > 0.01) {
    return false;
  }

  // Check if dates are the same
  const date1 = parseISO(`${transaction1.date}T${transaction1.time}`);
  const date2 = parseISO(`${transaction2.date}T${transaction2.time}`);

  if (!isSameDay(date1, date2)) {
    return false;
  }

  // Check if time difference is within 5 minutes
  const timeDifference = Math.abs(differenceInMinutes(date1, date2));
  if (timeDifference > 5) {
    return false;
  }

  // Check if descriptions are similar
  const similarity = calculateStringSimilarity(
    transaction1.description.toLowerCase(),
    transaction2.description.toLowerCase()
  );

  return similarity > 0.7; // 70% similarity threshold
};

const mergeDuplicateTransactions = (transactions: Transaction[]): Transaction => {
  const primary = transactions[0];
  
  // Use the most detailed description
  const bestDescription = transactions.reduce((best, current) => 
    current.description.length > best.description.length ? current : best
  ).description;

  // Use the most detailed shop name
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
      mergedFrom: transactions.map(t => t.id)
    }
  };
};

const calculateStringSimilarity = (str1: string, str2: string): number => {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) {
    return 1.0;
  }
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
};

const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
};