import * as Papa from 'papaparse';
import { Transaction } from '../../types/Transaction';
import { configLoader } from '../config/configLoader';
import { readFileAsString } from './csvReader';
import { detectFileType } from './fileTypeDetector';
import { buildTransaction } from './transactionBuilder';

const parseRows = (
  data: any[][],
  sourceType: string,
  filename?: string
): Transaction[] => {
  const sourceConfig = configLoader.getColumnMapping().sources[sourceType];
  if (!sourceConfig || !sourceConfig.columns) {
    return [];
  }

  const skipRows = sourceConfig.skipRows || 0;
  const transactions: Transaction[] = [];

  for (let i = skipRows; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;

    const transaction = buildTransaction(row, sourceType, sourceConfig, filename);
    if (transaction) {
      transactions.push(transaction);
    }
  }

  return transactions;
};

export const parseCSVFile = async (file: File): Promise<Transaction[]> => {
  const fileContent = await readFileAsString(file);

  return new Promise((resolve, reject) => {
    Papa.parse(fileContent, {
      complete: (results) => {
        const data = results.data as any[][];
        const headers = data[0] || [];

        const detectedType = detectFileType(headers, file.name);
        if (!detectedType) {
          resolve([]);
          return;
        }

        const transactions = parseRows(data, detectedType, file.name);
        resolve(transactions);
      },
      error: (error: any) => {
        reject(error);
      },
    });
  });
};

export const parseCSVFiles = async (
  files: File[],
  onProgress?: (current: number, total: number) => void
): Promise<Transaction[]> => {
  const allTransactions: Transaction[] = [];

  for (let i = 0; i < files.length; i++) {
    try {
      const transactions = await parseCSVFile(files[i]);
      allTransactions.push(...transactions);
      if (onProgress) {
        onProgress(i + 1, files.length);
      }
    } catch (error) {
      console.error(`Error processing file ${files[i].name}:`, error);
    }
  }

  return allTransactions;
};
