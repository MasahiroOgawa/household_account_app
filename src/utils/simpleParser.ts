import * as Papa from "papaparse";
import { Transaction } from "../types/Transaction";

// Simple amount parser
function parseAmount(str: string): number {
  if (!str) return 0;
  return parseFloat(str.toString().replace(/,/g, '').replace(/[^\d.-]/g, '')) || 0;
}

// Simple date formatter
function formatDate(dateStr: string): string {
  const parts = dateStr.split(/[\/\-\.]/);
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return dateStr;
}

// Generate unique ID
let idCounter = 0;
function generateId(type: string): string {
  idCounter++;
  return `${type}_${Date.now()}_${idCounter}`;
}

// Simple CSV parser that works
export async function parseCSVFile(file: File): Promise<Transaction[]> {
  
  // Read file content
  let fileContent: string;
  
  try {
    // Try to read as text first
    fileContent = await file.text();
    
    // Check if it looks like garbled text (Shift-JIS)
    if (fileContent.includes('�') || (fileContent.match(/[\ufffd]/g) || []).length > 5) {
      // Re-read as array buffer and decode
      const buffer = await file.arrayBuffer();
      const decoder = new TextDecoder('shift-jis', { fatal: false });
      fileContent = decoder.decode(buffer);
    }
  } catch (error) {
    return [];
  }
  
  // Parse CSV
  const parseResult = Papa.parse(fileContent);
  const data = parseResult.data as any[][];
  
  if (!data || data.length < 2) {
    return [];
  }
  
  const transactions: Transaction[] = [];
  const fileName = file.name.toLowerCase();
  
  // Detect file type and parse accordingly
  if (fileName.includes('ufj') || /^\d{7}_/.test(fileName)) {
    // UFJ Bank format
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row && row.length > 5) {
        const date = row[0];
        const description = row[2] || row[1] || '';
        const withdrawal = parseAmount(row[3]);
        const deposit = parseAmount(row[4]);
        
        if (date && (withdrawal > 0 || deposit > 0)) {
          transactions.push({
            id: generateId('ufj'),
            date: formatDate(date),
            time: '12:00:00',
            amount: withdrawal || deposit,
            description: description,
            category: withdrawal > 0 ? 'expense' : 'income',
            shopName: description.substring(0, 30),
            type: withdrawal > 0 ? 'expense' : 'income',
            source: 'UFJ Bank',
            originalData: { rawRow: row, fileType: 'ufj', fileName: file.name }
          });
        }
      }
    }
  } else if (fileName.includes('detail') || fileName.includes('paypay')) {
    // PayPay format
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row && row.length > 5) {
        const date = row[0];
        const description = row[1] || '';
        const amount = parseAmount(row[5]);
        
        if (date && amount > 0) {
          transactions.push({
            id: generateId('paypay'),
            date: formatDate(date),
            time: '12:00:00',
            amount: amount,
            description: description,
            category: 'shopping',
            shopName: description.substring(0, 30),
            type: 'expense',
            source: 'PayPay Card',
            originalData: { rawRow: row, fileType: 'paypay', fileName: file.name }
          });
        }
      }
    }
  } else if (fileName.includes('meisai') || fileName.includes('smbc')) {
    // SMBC/Orico format
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row && row.length > 3) {
        const date = row[0];
        const withdrawal = parseAmount(row[1]);
        const deposit = parseAmount(row[2]);
        const description = row[3] || '';
        
        if (date && (withdrawal > 0 || deposit > 0)) {
          transactions.push({
            id: generateId('smbc'),
            date: formatDate(date),
            time: '12:00:00',
            amount: withdrawal || deposit,
            description: description,
            category: withdrawal > 0 ? 'expense' : 'income',
            shopName: description.substring(0, 30),
            type: withdrawal > 0 ? 'expense' : 'income',
            source: 'SMBC Bank',
            originalData: { rawRow: row, fileType: 'smbc', fileName: file.name }
          });
        }
      }
    }
  } else if (fileName.includes('jre')) {
    // JRE Bank format
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row && row.length > 4) {
        const date = row[0];
        const withdrawal = parseAmount(row[1]);
        const deposit = parseAmount(row[2]);
        const description = row[4] || '';
        
        if (date && (withdrawal > 0 || deposit > 0)) {
          transactions.push({
            id: generateId('jre'),
            date: formatDate(date),
            time: '12:00:00',
            amount: withdrawal || deposit,
            description: description,
            category: withdrawal > 0 ? 'expense' : 'income',
            shopName: description.substring(0, 30),
            type: withdrawal > 0 ? 'expense' : 'income',
            source: 'JRE Bank',
            originalData: { rawRow: row, fileType: 'jre', fileName: file.name }
          });
        }
      }
    }
  }
  
  return transactions;
}

// Parse multiple files
export async function parseCSVFiles(files: File[]): Promise<Transaction[]> {
  const allTransactions: Transaction[] = [];
  
  for (const file of files) {
    try {
      const transactions = await parseCSVFile(file);
      allTransactions.push(...transactions);
    } catch (error) {
      // Silent error handling
    }
  }
  
  return allTransactions;
}