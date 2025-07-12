import Papa from 'papaparse';
import { Transaction } from '../types/Transaction';

export const exportTransactionsToCSV = (transactions: Transaction[], filename: string = 'transactions.csv') => {
  const csvData = transactions.map(transaction => ({
    Date: transaction.date,
    Time: transaction.time,
    Amount: transaction.amount,
    Type: transaction.type,
    Description: transaction.description,
    Category: transaction.category,
    'Shop Name': transaction.shopName
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