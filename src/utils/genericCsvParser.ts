import * as Papa from "papaparse";
import { Transaction } from "../types/Transaction";
import { format, parse, isValid } from "date-fns";
import { configLoader } from "./configLoader";

// Unique ID generator
let idCounter = 0;
const generateUniqueId = (prefix: string): string => {
  idCounter = (idCounter + 1) % 100000;
  return `${prefix}_${Date.now()}_${idCounter}_${Math.floor(Math.random() * 1000)}`;
};

// Parse date with multiple format support
const parseDate = (dateString: string, _dateFormat?: string): Date | null => {
  if (!dateString) return null;
  
  // Clean the date string
  dateString = dateString.trim();
  
  // Try Japanese date format (e.g., "2024年11月15日")
  if (dateString.includes('年') && dateString.includes('月') && dateString.includes('日')) {
    const japaneseMatch = dateString.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
    if (japaneseMatch) {
      const [, year, month, day] = japaneseMatch;
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (isValid(date)) return date;
    }
  }
  
  // Try YYYYMMDD format
  if (/^\d{8}$/.test(dateString)) {
    const year = dateString.substring(0, 4);
    const month = dateString.substring(4, 6);
    const day = dateString.substring(6, 8);
    const date = new Date(`${year}-${month}-${day}`);
    if (isValid(date)) return date;
  }
  
  // Try YYYY.MM.DD format
  if (/^\d{4}\.\d{2}\.\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split('.');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (isValid(date)) return date;
  }
  
  // Try common formats
  const formats = [
    "yyyy/MM/dd",
    "yyyy/M/d",
    "yyyy-MM-dd",
    "yyyy-M-d",
    "MM/dd/yyyy",
    "dd/MM/yyyy",
  ];
  
  for (const formatString of formats) {
    try {
      const parsed = parse(dateString, formatString, new Date());
      if (isValid(parsed)) return parsed;
    } catch (error) {
      continue;
    }
  }
  
  // Try native parsing as last resort
  const nativeDate = new Date(dateString);
  if (isValid(nativeDate)) return nativeDate;
  
  return null;
};

// Parse amount with various formats
const parseAmount = (amountString: string): number => {
  if (!amountString) return 0;
  
  // Remove currency symbols (including backslash which appears as yen in some encodings), spaces, and quotes
  let cleaned = amountString
    .replace(/[¥\\$€£]/g, '')  // Added backslash to handle \1,080 format
    .replace(/[\s"']/g, '')
    .replace(/,/g, '');
  
  // Handle parentheses for negative numbers
  if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
    cleaned = '-' + cleaned.slice(1, -1);
  }
  
  const amount = parseFloat(cleaned);
  return isNaN(amount) ? 0 : Math.abs(amount);
};

// Extract shop name from description
const extractShopName = (description: string): string => {
  if (!description) return "Unknown";
  
  // Clean up common patterns
  let shopName = description
    .replace(/お客様番号:.*$/, "")
    .replace(/番号:.*$/, "")
    .replace(/\s*:\s*.*$/, "")
    .replace(/\s+/g, " ")
    .trim();
  
  // Limit length
  if (shopName.length > 50) {
    shopName = shopName.substring(0, 50) + "...";
  }
  
  return shopName || "Unknown";
};

// Generic CSV parser based on configuration
export const parseGenericCSV = (
  data: any[][],
  sourceType: string,
  filename?: string
): Transaction[] => {
  const transactions: Transaction[] = [];
  
  // Get configuration for this source type
  const sourceConfig = configLoader.getSourceConfig(sourceType);
  if (!sourceConfig || !sourceConfig.columns) {
    console.error(`Configuration not found for source type: ${sourceType}`);
    return transactions;
  }
  
  const skipRows = sourceConfig.skipRows || 0;
  const columns = sourceConfig.columns;
  
  // console.log(`[parseGenericCSV] Parsing ${sourceType} CSV: ${data.length} rows`);
  // console.log(`[parseGenericCSV] Column config: date=${columns.date}, desc=${columns.description}, amount=${columns.amount || 'N/A'}, withdrawal=${columns.withdrawal || 'N/A'}, deposit=${columns.deposit || 'N/A'}`);
  // console.log(`[parseGenericCSV] Skip rows: ${skipRows}, Date format: ${sourceConfig.dateFormat}`);
  // console.log(`[parseGenericCSV] Sample data row ${skipRows}:`, data[skipRows]);
  
  
  let rowsProcessed = 0;
  let rowsSkipped = 0;
  
  // Process each row
  for (let i = skipRows; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) {
      rowsSkipped++;
      continue;
    }
    
    // Extract date
    let dateStr = '';
    if (typeof columns.date === 'number') {
      dateStr = row[columns.date] || '';
    }
    
    if (!dateStr || dateStr.trim() === '') {
      rowsSkipped++;
      continue;
    }
    
    const parsedDate = parseDate(dateStr, sourceConfig.dateFormat);
    if (!parsedDate || !isValid(parsedDate)) {
      // console.log(`[parseGenericCSV] Failed to parse date "${dateStr}" at row ${i}`);
      rowsSkipped++;
      continue;
    }
    rowsProcessed++;
    
    // Extract description
    let description = '';
    if (typeof columns.description === 'number') {
      description = row[columns.description] || '';
    } else if (typeof columns.notes === 'number') {
      description = row[columns.notes] || '';
    }
    
    // Extract amount
    let amount = 0;
    let transactionType: 'income' | 'expense' = 'expense';
    
    if (typeof columns.amount === 'number') {
      // Single amount column (can be positive or negative)
      const amountStr = row[columns.amount];
      const parsedAmount = parseAmount(amountStr);
      
      // Check if type is specified in config
      if (columns.type === 'expense') {
        transactionType = 'expense';
      } else if (columns.type === 'income') {
        transactionType = 'income';
      } else if (amountStr && amountStr.toString().trim().startsWith('-')) {
        // Check if original string indicated negative
        transactionType = 'expense';
      } else {
        // Determine type based on amount sign
        transactionType = parsedAmount >= 0 ? 'income' : 'expense';
      }
      amount = Math.abs(parsedAmount);
      
    } else if (typeof columns.withdrawal === 'number' && typeof columns.deposit === 'number') {
      // Separate withdrawal and deposit columns
      const withdrawalStr = row[columns.withdrawal] || '';
      const depositStr = row[columns.deposit] || '';
      
      const withdrawalAmount = parseAmount(withdrawalStr);
      const depositAmount = parseAmount(depositStr);
      
      if (withdrawalAmount > 0) {
        amount = withdrawalAmount;
        transactionType = 'expense';
      } else if (depositAmount > 0) {
        amount = depositAmount;
        transactionType = 'income';
      } else {
        continue; // Skip if no amount
      }
    } else {
      continue; // Can't determine amount
    }
    
    if (amount === 0) continue;
    
    // Check if this is an internal transfer to skip
    if (configLoader.isInternalTransfer(description) && !configLoader.isFee(description)) {
      // console.log(`Skipping internal transfer: ${description}`);
      continue;
    }
    
    // Extract shop name
    const shopName = extractShopName(description);

    // Detect category
    const category = configLoader.detectCategory(description, transactionType);
    
    // Determine source name
    const sourceName = sourceConfig.name || sourceType;
    
    // Create transaction
    const transaction: Transaction = {
      id: generateUniqueId(sourceType),
      date: format(parsedDate, "yyyy-MM-dd"),
      time: "12:00:00",
      amount: amount,
      description: description || `${sourceName} Transaction`,
      category: category,
      shopName: shopName,
      type: transactionType,
      source: sourceName,
      originalData: {
        rawRow: row,
        fileType: sourceType,
        fileName: filename
      }
    };
    
    transactions.push(transaction);
  }
  
  // console.log(`[parseGenericCSV] ${sourceType}: Parsed ${transactions.length} transactions from ${data.length} rows`);
  // console.log(`[parseGenericCSV] Rows processed: ${rowsProcessed}, Rows skipped: ${rowsSkipped}`);
  // console.log(`[parseGenericCSV] First 3 transactions:`, transactions.slice(0, 3).map(t => ({
  //   date: t.date,
  //   amount: t.amount,
  //   source: t.source
  // })));
  
  return transactions;
};

// Main CSV file parser
export const parseCSVFile = async (
  file: File,
  _onProgress?: (progress: number) => void
): Promise<Transaction[]> => {
  return new Promise((resolve, reject) => {
    const processFile = async () => {
    // console.log('='.repeat(60));
    // console.log(`[parseCSVFile] Starting to parse: ${file.name}`);
    // console.log(`[parseCSVFile] File size: ${file.size} bytes`);
    
    // First try to detect file type from filename alone
    const preliminaryType = configLoader.detectFileType([], file.name);
    
    // Determine encoding based on preliminary type or default
    let encoding = "UTF-8";
    if (preliminaryType) {
      const sourceConfig = configLoader.getSourceConfig(preliminaryType);
      // console.log(`[parseCSVFile] Source config for ${preliminaryType}:`, sourceConfig);
      if (sourceConfig?.encoding) {
        encoding = sourceConfig.encoding;
      }
    }
    
    // console.log(`[parseCSVFile] Parsing ${file.name} with encoding: ${encoding}, preliminary type: ${preliminaryType}`);
    
    // Handle encoding conversion for browser
    let fileContent: string;
    try {
      if (encoding.toLowerCase() === 'shift-jis' || encoding.toLowerCase() === 'shift_jis') {
        // Read file as ArrayBuffer and convert from Shift-JIS
        const arrayBuffer = await file.arrayBuffer();
        const decoder = new TextDecoder('shift-jis');
        fileContent = decoder.decode(arrayBuffer);
        // console.log(`[parseCSVFile] Decoded ${file.name} from Shift-JIS`);
      } else {
        // For UTF-8 and other encodings, read as text
        fileContent = await file.text();
        // console.log(`[parseCSVFile] Read ${file.name} as UTF-8`);
      }
    } catch (error) {
      console.error(`[parseCSVFile] Error reading file ${file.name}:`, error);
      // Fallback to default text reading
      fileContent = await file.text();
    }
    
    // Parse the string content with PapaParse
    Papa.parse(fileContent, {
      complete: (results) => {
        const data = results.data as any[][];
        // console.log(`[parseCSVFile] PapaParse complete - parsed ${data.length} rows`);
        // console.log(`[parseCSVFile] First 3 rows:`, data.slice(0, 3));
        
        const headers = data[0] || [];
        
        // Now detect file type with both headers and filename
        const detectedType = configLoader.detectFileType(headers, file.name);
        
        if (!detectedType) {
          console.error(`[parseCSVFile] ERROR: Could not detect file type for: ${file.name}`);
          console.error(`[parseCSVFile] Headers were:`, headers);
          resolve([]);
          return;
        }
        
        // console.log(`[parseCSVFile] Final detected file type: ${detectedType} for file: ${file.name}`);
        
        // Parse the transactions
        const transactions = parseGenericCSV(data, detectedType, file.name);
        // console.log(`[parseCSVFile] parseGenericCSV returned ${transactions.length} transactions`);
        // console.log(`[parseCSVFile] Transaction sources:`, transactions.map(t => t.source).filter((v, i, a) => a.indexOf(v) === i));
        resolve(transactions);
      },
      error: (error: any) => {
        console.error(`Error parsing CSV file ${file.name}:`, error);
        reject(error);
      }
    });
    };

    processFile();
  });
};

// Parse multiple CSV files
export const parseCSVFiles = async (
  files: File[],
  onProgress?: (current: number, total: number) => void
): Promise<Transaction[]> => {
  // console.log('='.repeat(80));
  // console.log(`[parseCSVFiles] Starting to parse ${files.length} files`);
  // console.log(`[parseCSVFiles] Files:`, files.map(f => `${f.name} (${f.size} bytes)`));
  
  const allTransactions: Transaction[] = [];
  
  for (let i = 0; i < files.length; i++) {
    try {
      // console.log(`[parseCSVFiles] Processing file ${i+1}/${files.length}: ${files[i].name}`);
      const transactions = await parseCSVFile(files[i]);
      // console.log(`[parseCSVFiles] Got ${transactions.length} transactions from ${files[i].name}`);
      allTransactions.push(...transactions);
      
      if (onProgress) {
        onProgress(i + 1, files.length);
      }
    } catch (error) {
      console.error(`[parseCSVFiles] Error processing file ${files[i].name}:`, error);
    }
  }
  
  // console.log(`[parseCSVFiles] TOTAL: ${allTransactions.length} transactions from all files`);
  // const sourceCounts: Record<string, number> = {};
  // allTransactions.forEach(t => {
  //   sourceCounts[t.source] = (sourceCounts[t.source] || 0) + 1;
  // });
  // console.log(`[parseCSVFiles] Transactions by source:`, sourceCounts);
  // console.log('='.repeat(80));
  
  return allTransactions;
};