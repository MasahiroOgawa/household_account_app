import Papa from 'papaparse';
import { Transaction } from '../types/Transaction';
import { isBusinessCategory } from './category/subcategoryUtils';

export const exportTransactionsToCSV = (transactions: Transaction[], filename: string = 'transactions.csv') => {
  const csvData = transactions.map(transaction => ({
    Date: transaction.date,
    Time: transaction.time,
    Amount: transaction.amount,
    Type: transaction.type,
    Description: transaction.description,
    Category: transaction.category,
    'Shop Name': transaction.shopName,
    Source: transaction.source
  }));

  const csv = Papa.unparse(csvData);

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

const groupByYear = (transactions: Transaction[]): Record<string, Transaction[]> =>
  transactions.reduce((groups, t) => {
    const year = t.date.slice(0, 4);
    (groups[year] ||= []).push(t);
    return groups;
  }, {} as Record<string, Transaction[]>);

export const exportTransactionsByYear = (transactions: Transaction[]) => {
  const byYear = groupByYear(transactions);
  for (const [year, yearTransactions] of Object.entries(byYear)) {
    exportTransactionsToCSV(yearTransactions, `transactions_${year}.csv`);
  }
};

export const exportTransactionsForTaxReturn = (transactions: Transaction[]) => {
  const businessOnly = transactions.filter(t => isBusinessCategory(t.category));
  const byYear = groupByYear(businessOnly);
  for (const [year, yearTransactions] of Object.entries(byYear)) {
    exportTransactionsToCSV(yearTransactions, `kakutei_shinkoku_${year}.csv`);
  }
};
