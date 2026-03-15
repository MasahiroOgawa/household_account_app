import Papa from 'papaparse';
import { zipSync, strToU8 } from 'fflate';
import { Transaction } from '../types/Transaction';
import { isBusinessCategory } from './category/subcategoryUtils';

const transactionsToCsv = (transactions: Transaction[]): string =>
  Papa.unparse(transactions.map(t => ({
    Date: t.date, Time: t.time, Amount: t.amount, Type: t.type,
    Description: t.description, Category: t.category, 'Shop Name': t.shopName, Source: t.source,
  })));

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const downloadZip = (files: Record<string, string>, zipFilename: string) => {
  const data: Record<string, Uint8Array> = {};
  for (const [name, content] of Object.entries(files)) {
    data[name] = strToU8(content);
  }
  const zipped = zipSync(data);
  downloadBlob(new Blob([zipped], { type: 'application/zip' }), zipFilename);
};

export const exportTransactionsToCSV = (transactions: Transaction[], filename: string = 'transactions.csv') => {
  const csv = transactionsToCsv(transactions);
  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), filename);
};

const groupByYear = (transactions: Transaction[]): Record<string, Transaction[]> =>
  transactions.reduce((groups, t) => {
    const year = t.date.slice(0, 4);
    (groups[year] ||= []).push(t);
    return groups;
  }, {} as Record<string, Transaction[]>);

export const exportTransactionsByYear = (transactions: Transaction[]) => {
  const byYear = groupByYear(transactions);
  const years = Object.keys(byYear).sort();
  if (years.length <= 1) {
    for (const [year, yearTxns] of Object.entries(byYear)) {
      exportTransactionsToCSV(yearTxns, `transactions_${year}.csv`);
    }
    return;
  }
  const files: Record<string, string> = {};
  for (const year of years) {
    files[`transactions_${year}.csv`] = transactionsToCsv(byYear[year]);
  }
  downloadZip(files, `transactions_${years[0]}-${years[years.length - 1]}.zip`);
};

export const exportTransactionsForTaxReturn = (transactions: Transaction[]) => {
  const businessOnly = transactions.filter(t => isBusinessCategory(t.category));
  const byYear = groupByYear(businessOnly);
  const years = Object.keys(byYear).sort();
  if (years.length === 0) return;
  if (years.length === 1) {
    exportTransactionsToCSV(byYear[years[0]], `kakutei_shinkoku_${years[0]}.csv`);
    return;
  }
  const files: Record<string, string> = {};
  for (const year of years) {
    files[`kakutei_shinkoku_${year}.csv`] = transactionsToCsv(byYear[year]);
  }
  downloadZip(files, `kakutei_shinkoku_${years[0]}-${years[years.length - 1]}.zip`);
};
