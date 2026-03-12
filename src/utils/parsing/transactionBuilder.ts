import { Transaction } from '../../types/Transaction';
import { SourceConfig } from '../../types/ColumnMapping';
import { parseDate } from './dateParser';
import { parseAbsoluteAmount, parseAmount } from './amountParser';
import { detectCategory, isInternalTransfer, isFee } from '../category/categoryDetector';
import { generateUniqueId } from '../idGenerator';
import { format, isValid } from 'date-fns';

const extractShopName = (description: string): string => {
  if (!description) return 'Unknown';

  let shopName = description
    .replace(/お客様番号:.*$/, '')
    .replace(/番号:.*$/, '')
    .replace(/\s*:\s*.*$/, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (shopName.length > 50) {
    shopName = shopName.substring(0, 50) + '...';
  }

  return shopName || 'Unknown';
};

export const buildTransaction = (
  row: any[],
  sourceType: string,
  sourceConfig: SourceConfig,
  filename?: string
): Transaction | null => {
  // Handle re-imported transaction result CSV — preserve all fields as-is
  if (sourceType === 'transaction_result') {
    const col = (key: string) => row[sourceConfig.columns[key] as number] || '';
    const dateStr = col('date');
    const time = col('time') || '12:00:00';
    const amountStr = col('amount');
    const type = (col('type') || 'expense') as 'income' | 'expense';
    const description = col('description');
    const category = col('category');
    const shopName = col('shopName');
    const source = col('source') || 'Unknown';

    if (!dateStr || !amountStr) return null;
    const parsedDate = parseDate(dateStr);
    if (!parsedDate || !isValid(parsedDate)) return null;
    const amount = Math.abs(parseAmount(amountStr));
    if (amount === 0) return null;

    return {
      id: generateUniqueId(sourceType),
      date: format(parsedDate, 'yyyy-MM-dd'),
      time,
      amount,
      description: description || `${source} Transaction`,
      category,
      shopName: shopName || 'Unknown',
      type,
      source,
      originalData: {
        rawRow: row,
        fileType: 'transaction_result',
        fileName: filename,
      },
    };
  }

  const columns = sourceConfig.columns;

  // Extract date
  let dateStr = '';
  if (typeof columns.date === 'number' && columns.date >= 0 && columns.date < row.length) {
    dateStr = row[columns.date] || '';
  }
  if (!dateStr || dateStr.trim() === '') return null;

  const parsedDate = parseDate(dateStr);
  if (!parsedDate || !isValid(parsedDate)) return null;

  // Extract description
  let description = '';
  if (typeof columns.description === 'number' && columns.description >= 0 && columns.description < row.length) {
    description = row[columns.description] || '';
  } else if (typeof (columns as any).notes === 'number') {
    const notesCol = (columns as any).notes as number;
    if (notesCol >= 0 && notesCol < row.length) {
      description = row[notesCol] || '';
    }
  }

  // For UFJ, fall back to summary column
  if (sourceType === 'ufj' && !description && row[1]) {
    description = row[1];
  }

  // Extract amount and determine type
  let amount = 0;
  let transactionType: 'income' | 'expense' = 'expense';

  if (typeof columns.amount === 'number' && columns.amount >= 0 && columns.amount < row.length) {
    const amountStr = row[columns.amount];
    const parsedAmt = parseAmount(amountStr);

    if (columns.type === 'expense') {
      transactionType = 'expense';
    } else if (columns.type === 'income') {
      transactionType = 'income';
    } else if (amountStr && amountStr.toString().trim().startsWith('-')) {
      transactionType = 'expense';
    } else {
      transactionType = parsedAmt >= 0 ? 'income' : 'expense';
    }
    amount = Math.abs(parsedAmt);
  } else {
    // Check for withdrawal/deposit columns (in amountColumns or columns directly)
    let withdrawalCol = -1;
    let depositCol = -1;

    if (sourceConfig.amountColumns &&
        typeof sourceConfig.amountColumns.withdrawal === 'number' &&
        typeof sourceConfig.amountColumns.deposit === 'number') {
      withdrawalCol = sourceConfig.amountColumns.withdrawal;
      depositCol = sourceConfig.amountColumns.deposit;
    } else if (typeof columns.withdrawal === 'number' &&
               typeof columns.deposit === 'number') {
      withdrawalCol = columns.withdrawal as number;
      depositCol = columns.deposit as number;
    }

    if (withdrawalCol < 0 || depositCol < 0) {
      return null;
    }

    const withdrawalStr = (withdrawalCol >= 0 && withdrawalCol < row.length) ? row[withdrawalCol] : '';
    const depositStr = (depositCol >= 0 && depositCol < row.length) ? row[depositCol] : '';

    const withdrawalAmount = parseAbsoluteAmount(withdrawalStr);
    const depositAmount = parseAbsoluteAmount(depositStr);

    if (withdrawalAmount > 0) {
      amount = withdrawalAmount;
      transactionType = 'expense';
    } else if (depositAmount > 0) {
      amount = depositAmount;
      transactionType = 'income';
    } else {
      return null;
    }
  }

  if (amount === 0) return null;

  // Skip internal transfers (but keep fees)
  if (isInternalTransfer(description) && !isFee(description)) {
    return null;
  }

  const shopName = extractShopName(description);
  const category = detectCategory(description, transactionType);
  const sourceName = sourceConfig.name || sourceType;

  return {
    id: generateUniqueId(sourceType),
    date: format(parsedDate, 'yyyy-MM-dd'),
    time: '12:00:00',
    amount,
    description: description || `${sourceName} Transaction`,
    category,
    shopName,
    type: transactionType,
    source: sourceName,
    originalData: {
      rawRow: row,
      fileType: sourceType,
      fileName: filename,
    },
  };
};
