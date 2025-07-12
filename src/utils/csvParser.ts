import Papa from 'papaparse';
import { Transaction } from '../types/Transaction';
import { format, parse, isValid } from 'date-fns';

// Helper functions
const parseDate = (dateString: string): Date | null => {
  if (!dateString) return null;
  const japaneseMatch = dateString.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (japaneseMatch) {
    const [, year, month, day] = japaneseMatch;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (isValid(date)) return date;
  }
  const formats = [
    'yyyy/MM/dd',
    'yyyy/M/d',
    'yyyy-MM-dd',
    'yyyy-M-d',
    'MM/dd/yyyy',
    'dd/MM/yyyy'
  ];
  for (const formatString of formats) {
    try {
      const parsed = parse(dateString, formatString, new Date());
      if (isValid(parsed)) return parsed;
    } catch (error) {
      continue;
    }
  }
  const nativeDate = new Date(dateString);
  return isValid(nativeDate) ? nativeDate : null;
};

const extractOricoShopName = (merchantField: string): string => {
  if (!merchantField) return 'Unknown';
  let shopName = merchantField
    .replace(/お客様番号:.*$/, '')
    .replace(/番号:.*$/, '')
    .replace(/\s*:\s*.*$/, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (shopName.length > 25) {
    shopName = shopName.substring(0, 25) + '...';
  }
  return shopName || 'Unknown';
};

const categorizeOricoTransaction = (merchantField: string, shopName: string): string => {
  const combined = (merchantField + ' ' + shopName).toLowerCase();
  if (combined.includes('東京ガス') || combined.includes('ガス')) return 'Utilities';
  if (combined.includes('東京電力') || combined.includes('電力') || combined.includes('電気')) return 'Utilities';
  if (combined.includes('水道')) return 'Utilities';
  if (combined.includes('ジェイアール') || combined.includes('jr') || combined.includes('東日本')) return 'Transportation';
  if (combined.includes('地下鉄') || combined.includes('メトロ')) return 'Transportation';
  if (combined.includes('アトレ') || combined.includes('デパート')) return 'Shopping';
  if (combined.includes('ヤキトンタチキ') || combined.includes('居酒屋')) return 'Dining';
  if (combined.includes('amazon') || combined.includes('アマゾン')) return 'Online Shopping';
  if (combined.includes('rakuten') || combined.includes('楽天')) return 'Online Shopping';
  return 'Other';
};

// PayPay CSV parser
export const parsePayPayCSVFile = (data: any[][]): Transaction[] => {
  const transactions: Transaction[] = [];
  let transactionIndex = 0;
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 3) continue;
    const dateStr = row[0];
    const merchantStr = row[1];
    const amountStr = row[2];
    if (typeof dateStr !== 'string' || !dateStr.match(/\d+/)) continue;
    const parsedDate = parseDate(dateStr);
    const amount = parseFloat(amountStr);
    if (!isValid(parsedDate) || isNaN(amount)) continue;
    const shopName = extractOricoShopName(merchantStr);
    const description = merchantStr || 'PayPay Transaction';
    const category = categorizeOricoTransaction(merchantStr, shopName);
    const transaction: Transaction = {
      id: `paypay_${Date.now()}_${transactionIndex}_${Math.random()}`,
      date: parsedDate ? format(parsedDate, 'yyyy-MM-dd') : '',
      time: '12:00:00',
      amount: Math.abs(amount),
      description,
      category,
      shopName,
      type: 'expense',
      originalData: {
        rawRow: row,
        fileType: 'PayPay CSV',
        rowNumber: i,
        encoding: 'UTF-8'
      }
    };
    transactions.push(transaction);
    transactionIndex++;
  }
  if (transactions.length === 0) {
    console.warn('No valid transactions found. First 5 rows:', data.slice(0, 5));
  }
  return transactions;
};

// Orico/Detail CSV parser
export const parseOricoDetailCSVFile = (data: any[][]): Transaction[] => {
  const transactions: Transaction[] = [];
  let transactionIndex = 0;
  for (let i = 1; i < data.length; i++) { // skip header
    const row = data[i];
    if (!row || row.length < 9) continue;
    const dateStr = row[0];
    if (!dateStr || dateStr.trim() === '') continue; // skip rows with empty date
    const merchantStr = row[1];
    // Try column 8 for amount (KAL format), fallback to column 5 (Orico format)
    let amountStr = row[8] || row[5];
    if (!amountStr) continue;
    // Clean up amount: remove backslash, commas, quotes
    amountStr = amountStr.replace(/\\|"|,/g, '').trim();
    const parsedDate = parseDate(dateStr);
    const amount = parseFloat(amountStr);
    if (!isValid(parsedDate) || isNaN(amount)) continue;
    const shopName = extractOricoShopName(merchantStr);
    const description = merchantStr || 'Orico Transaction';
    const category = categorizeOricoTransaction(merchantStr, shopName);
    const transaction: Transaction = {
      id: `orico_${Date.now()}_${transactionIndex}_${Math.random()}`,
      date: parsedDate ? format(parsedDate, 'yyyy-MM-dd') : '',
      time: '12:00:00',
      amount: Math.abs(amount),
      description,
      category,
      shopName,
      type: amount >= 0 ? 'expense' : 'income',
      originalData: {
        rawRow: row,
        fileType: 'Orico/Detail CSV',
        rowNumber: i,
        encoding: 'UTF-8'
      }
    };
    transactions.push(transaction);
    transactionIndex++;
  }
  if (transactions.length === 0) {
    console.warn('No valid transactions found in Orico/Detail CSV. First 5 rows:', data.slice(0, 5));
  }
  return transactions;
};

// Main CSV file parser
export const parseCSVFile = (file: File): Promise<Transaction[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          let transactions: Transaction[] = [];
          const name = file.name.toLowerCase();
          if (name.includes('paypay')) {
            transactions = parsePayPayCSVFile(results.data as any[][]);
          } else if (name.includes('detail') || name.includes('kal')) {
            transactions = parseOricoDetailCSVFile(results.data as any[][]);
          }
          resolve(transactions);
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};