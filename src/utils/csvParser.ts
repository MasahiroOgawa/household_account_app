import Papa from 'papaparse';
import { Transaction } from '../types/Transaction';
import { format, parse, isValid } from 'date-fns';

export const parseCSVFile = (file: File): Promise<Transaction[]> => {
  return new Promise((resolve, reject) => {
    // Check if this might be a Shift JIS encoded file (Orico KAL files)
    if (file.name.includes('KAL') || file.name.toLowerCase().includes('orico')) {
      console.log('Detected potential Orico KAL file, attempting Shift JIS decoding');
      parseShiftJISFile(file)
        .then(resolve)
        .catch((error) => {
          console.log('Shift JIS parsing failed, trying UTF-8:', error);
          // Fallback to regular UTF-8 parsing
          parseUTF8File(file).then(resolve).catch(reject);
        });
    } else {
      // Regular UTF-8 parsing for other files
      parseUTF8File(file).then(resolve).catch(reject);
    }
  });
};

const parseShiftJISFile = (file: File): Promise<Transaction[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        
        // Decode Shift JIS to UTF-8
        const decoder = new TextDecoder('shift_jis');
        const text = decoder.decode(arrayBuffer);
        
        console.log('Decoded Shift JIS text (first 500 chars):', text.substring(0, 500));
        
        // Parse the decoded text as CSV
        Papa.parse(text, {
          header: false,
          skipEmptyLines: true,
          complete: (results) => {
            try {
              console.log('Parsed CSV data (first 10 rows):', results.data.slice(0, 10));
              
              const transactions = parseOricoKALFile(results.data);
              console.log('Final parsed transactions:', transactions);
              
              if (transactions.length === 0) {
                reject(new Error('No valid transactions found in Shift JIS file'));
              } else {
                resolve(transactions);
              }
            } catch (error) {
              console.error('Error parsing Shift JIS CSV:', error);
              reject(error);
            }
          },
          error: (error) => {
            console.error('Papa Parse error for Shift JIS:', error);
            reject(error);
          }
        });
      } catch (error) {
        console.error('Error decoding Shift JIS:', error);
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file as ArrayBuffer'));
    };
    
    // Read as ArrayBuffer for proper encoding handling
    reader.readAsArrayBuffer(file);
  });
};

const parseUTF8File = (file: File): Promise<Transaction[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          console.log('UTF-8 CSV data (first 10 rows):', results.data.slice(0, 10));
          
          if (isOricoKALFile(results.data)) {
            console.log('Detected as Orico KAL file (UTF-8)');
            const transactions = parseOricoKALFile(results.data);
            resolve(transactions);
          } else {
            console.log('Parsing as regular CSV with headers');
            // Fall back to regular CSV parsing with headers
            Papa.parse(file, {
              header: true,
              skipEmptyLines: true,
              complete: (headerResults) => {
                try {
                  const transactions = headerResults.data.map((row: any, index: number) => {
                    return parseTransactionRow(row, index);
                  }).filter(Boolean) as Transaction[];
                  
                  resolve(transactions);
                } catch (error) {
                  reject(error);
                }
              },
              error: (error) => {
                reject(error);
              }
            });
          }
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

const isOricoKALFile = (data: any[][]): boolean => {
  if (!data || data.length < 5) return false;
  
  // Check for Orico-specific patterns in the first few rows
  const firstFewRows = data.slice(0, 15).map(row => row.join(' '));
  const text = firstFewRows.join(' ');
  
  console.log('Checking if Orico file, text sample:', text.substring(0, 200));
  
  return (
    text.includes('ご契約番号') ||
    text.includes('ご契約名称') ||
    text.includes('お支払日') ||
    text.includes('ご請求総額') ||
    text.includes('東京ガス') ||
    text.includes('ジェイアール') ||
    text.includes('アトレ') ||
    (text.includes('年') && text.includes('月') && text.includes('日'))
  );
};

const parseOricoKALFile = (data: any[][]): Transaction[] => {
  const transactions: Transaction[] = [];
  let transactionIndex = 0;
  
  console.log('Starting to parse Orico file, total rows:', data.length);
  
  // Look for the transaction data section
  let transactionStartIndex = -1;
  
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;
    
    const rowText = row.join(' ');
    console.log(`Row ${i}:`, row);
    
    // Look for the header row that indicates transaction data starts
    if (rowText.includes('ご利用年月日') || rowText.includes('利用年月日') || 
        (rowText.includes('年') && rowText.includes('月') && rowText.includes('日') && i > 5)) {
      transactionStartIndex = i + 1;
      console.log('Found transaction header at row:', i, 'Data starts at:', transactionStartIndex);
      break;
    }
  }
  
  // If we didn't find a clear header, start looking for date patterns from row 10
  if (transactionStartIndex === -1) {
    transactionStartIndex = 10;
    console.log('No clear header found, starting transaction search from row 10');
  }
  
  // Parse transaction rows
  for (let i = transactionStartIndex; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;
    
    console.log(`Parsing transaction row ${i}:`, row);
    
    const transaction = parseOricoTransactionRow(row, transactionIndex, i);
    if (transaction) {
      console.log('Successfully parsed transaction:', transaction);
      transactions.push(transaction);
      transactionIndex++;
    }
  }
  
  console.log('Total transactions found:', transactions.length);
  return transactions;
};

const parseOricoTransactionRow = (row: any[], index: number, rowNumber: number): Transaction | null => {
  try {
    console.log(`Attempting to parse row ${rowNumber}:`, row);
    
    // Skip if row is too short
    if (!row || row.length < 3) {
      console.log('Row too short, skipping');
      return null;
    }
    
    // Look for date pattern in first few columns
    let dateStr = '';
    let dateColumnIndex = -1;
    
    for (let i = 0; i < Math.min(4, row.length); i++) {
      if (row[i] && typeof row[i] === 'string') {
        // Look for Japanese date format: 2025年4月28日
        const dateMatch = row[i].match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
        if (dateMatch) {
          dateStr = row[i];
          dateColumnIndex = i;
          console.log('Found Japanese date:', dateStr, 'at column:', dateColumnIndex);
          break;
        }
        
        // Also look for other date formats
        const otherDateMatch = row[i].match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
        if (otherDateMatch) {
          dateStr = row[i];
          dateColumnIndex = i;
          console.log('Found standard date:', dateStr, 'at column:', dateColumnIndex);
          break;
        }
      }
    }
    
    if (!dateStr) {
      console.log('No date found in row, skipping');
      return null;
    }
    
    // Look for merchant name (usually next column after date)
    let merchantStr = '';
    if (dateColumnIndex + 1 < row.length) {
      merchantStr = row[dateColumnIndex + 1] || '';
    }
    
    // Look for amount in the row (scan all columns for numbers)
    let amount = 0;
    let amountStr = '';
    
    for (let i = 2; i < row.length; i++) {
      if (row[i] && typeof row[i] === 'string') {
        // Remove commas and try to parse as number
        const cleaned = row[i].replace(/[,\s]/g, '');
        const parsed = parseFloat(cleaned);
        if (!isNaN(parsed) && parsed > 0) {
          amount = parsed;
          amountStr = row[i];
          console.log('Found amount:', amount, 'from string:', amountStr, 'at column:', i);
          break;
        }
      } else if (typeof row[i] === 'number' && row[i] > 0) {
        amount = row[i];
        amountStr = row[i].toString();
        console.log('Found numeric amount:', amount, 'at column:', i);
        break;
      }
    }
    
    if (amount <= 0) {
      console.log('No valid amount found in row, skipping');
      return null;
    }
    
    // Parse date
    const parsedDate = parseOricoDate(dateStr);
    if (!parsedDate) {
      console.log('Could not parse date:', dateStr);
      return null;
    }
    
    // Extract shop name
    const shopName = extractOricoShopName(merchantStr);
    
    // Create description
    const description = merchantStr || 'Orico Transaction';
    
    // Categorize transaction
    const category = categorizeOricoTransaction(merchantStr, shopName);
    
    const transaction = {
      id: `orico_${Date.now()}_${index}_${Math.random()}`,
      date: format(parsedDate, 'yyyy-MM-dd'),
      time: '12:00:00',
      amount: amount,
      description: description,
      category: category,
      shopName: shopName,
      type: 'expense' as const,
      originalData: {
        rawRow: row,
        fileType: 'Orico KAL',
        rowNumber: rowNumber,
        encoding: 'Shift JIS'
      }
    };
    
    console.log('Created transaction:', transaction);
    return transaction;
    
  } catch (error) {
    console.error('Error parsing Orico transaction row:', error);
    return null;
  }
};

const parseOricoDate = (dateString: string): Date | null => {
  if (!dateString) return null;
  
  console.log('Parsing date:', dateString);
  
  // Handle Japanese date format: 2025年4月28日
  const japaneseMatch = dateString.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (japaneseMatch) {
    const [, year, month, day] = japaneseMatch;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (isValid(date)) {
      console.log('Successfully parsed Japanese date:', date);
      return date;
    }
  }
  
  // Handle other formats
  const formats = [
    'yyyy/MM/dd',
    'yyyy/M/d',
    'yyyy-MM-dd',
    'yyyy-M-d'
  ];

  for (const formatString of formats) {
    try {
      const parsed = parse(dateString, formatString, new Date());
      if (isValid(parsed)) {
        console.log('Successfully parsed date with format', formatString, ':', parsed);
        return parsed;
      }
    } catch (error) {
      continue;
    }
  }

  console.log('Could not parse date:', dateString);
  return null;
};

const extractOricoShopName = (merchantField: string): string => {
  if (!merchantField) return 'Unknown';
  
  // Clean up the merchant name
  let shopName = merchantField
    .replace(/お客様番号:.*$/, '') // Remove customer number
    .replace(/番号:.*$/, '') // Remove any number references
    .replace(/\s*:\s*.*$/, '') // Remove colon and everything after
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
  
  // If still too long, take first part
  if (shopName.length > 25) {
    shopName = shopName.substring(0, 25) + '...';
  }
  
  return shopName || 'Unknown';
};

const categorizeOricoTransaction = (merchantField: string, shopName: string): string => {
  const combined = (merchantField + ' ' + shopName).toLowerCase();
  
  // Utility companies
  if (combined.includes('東京ガス') || combined.includes('ガス')) {
    return 'Utilities';
  }
  if (combined.includes('東京電力') || combined.includes('電力') || combined.includes('電気')) {
    return 'Utilities';
  }
  if (combined.includes('水道')) {
    return 'Utilities';
  }
  
  // Transportation
  if (combined.includes('ジェイアール') || combined.includes('jr') || combined.includes('東日本')) {
    return 'Transportation';
  }
  if (combined.includes('地下鉄') || combined.includes('メトロ')) {
    return 'Transportation';
  }
  
  // Shopping
  if (combined.includes('アトレ') || combined.includes('デパート')) {
    return 'Shopping';
  }
  if (combined.includes('ヤキトンタチキ') || combined.includes('居酒屋')) {
    return 'Dining';
  }
  
  // Online services
  if (combined.includes('amazon') || combined.includes('アマゾン')) {
    return 'Online Shopping';
  }
  if (combined.includes('rakuten') || combined.includes('楽天')) {
    return 'Online Shopping';
  }
  
  return 'Other';
};

// Regular CSV parsing (fallback for non-Orico files)
const parseTransactionRow = (row: any, index: number): Transaction | null => {
  try {
    const dateField = findField(row, [
      'date', 'transaction_date', 'posted_date', 'Date', 'Transaction Date'
    ]);
    
    const amountField = findField(row, [
      'amount', 'Amount', 'debit', 'credit', 'Debit', 'Credit'
    ]);
    
    const descriptionField = findField(row, [
      'description', 'Description', 'memo', 'Memo', 'Details'
    ]);
    
    const merchantField = findField(row, [
      'merchant', 'Merchant', 'payee', 'Payee', 'shop', 'Shop Name'
    ]);

    if (!dateField || !amountField) {
      return null;
    }

    const parsedDate = parseDate(dateField);
    if (!parsedDate) {
      return null;
    }

    const amount = parseFloat(amountField.replace(/[^0-9.-]/g, ''));
    if (isNaN(amount)) {
      return null;
    }

    const type: 'income' | 'expense' = amount < 0 ? 'income' : 'expense';
    
    return {
      id: `txn_${Date.now()}_${index}`,
      date: format(parsedDate, 'yyyy-MM-dd'),
      time: format(parsedDate, 'HH:mm:ss'),
      amount: Math.abs(amount),
      description: descriptionField || 'Unknown transaction',
      category: 'Other',
      shopName: merchantField || 'Unknown',
      type,
      originalData: row
    };
  } catch (error) {
    console.error('Error parsing transaction row:', error);
    return null;
  }
};

const findField = (row: any, possibleKeys: string[]): string | null => {
  for (const key of possibleKeys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
      return row[key];
    }
  }
  return null;
};

const parseDate = (dateString: string): Date | null => {
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
      if (isValid(parsed)) {
        return parsed;
      }
    } catch (error) {
      continue;
    }
  }

  const nativeDate = new Date(dateString);
  return isValid(nativeDate) ? nativeDate : null;
};