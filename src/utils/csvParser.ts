import * as Papa from "papaparse";
import { Transaction } from "../types/Transaction";
import { format, parse, isValid } from "date-fns";

// Unique ID generator using timestamp and counter
let idCounter = 0;
const generateUniqueId = (prefix: string): string => {
  idCounter = (idCounter + 1) % 100000;
  return `${prefix}_${Date.now()}_${idCounter}_${Math.floor(
    Math.random() * 1000
  )}`;
};

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
  const nativeDate = new Date(dateString);
  return isValid(nativeDate) ? nativeDate : null;
};

const extractOricoShopName = (merchantField: string): string => {
  if (!merchantField) return "Unknown";
  let shopName = merchantField
    .replace(/お客様番号:.*$/, "")
    .replace(/番号:.*$/, "")
    .replace(/\s*:\s*.*$/, "")
    .replace(/\s+/g, " ")
    .trim();
  if (shopName.length > 25) {
    shopName = shopName.substring(0, 25) + "...";
  }
  return shopName || "Unknown";
};

const categorizeOricoTransaction = (
  merchantField: string,
  shopName: string
): string => {
  const combined = (merchantField + " " + shopName).toLowerCase();
  if (combined.includes("東京ガス") || combined.includes("ガス"))
    return "Utilities";
  if (
    combined.includes("東京電力") ||
    combined.includes("電力") ||
    combined.includes("電気")
  )
    return "Utilities";
  if (combined.includes("水道")) return "Utilities";
  if (
    combined.includes("ジェイアール") ||
    combined.includes("jr") ||
    combined.includes("東日本")
  )
    return "Transportation";
  if (combined.includes("地下鉄") || combined.includes("メトロ"))
    return "Transportation";
  if (combined.includes("アトレ") || combined.includes("デパート"))
    return "Shopping";
  if (combined.includes("ヤキトンタチキ") || combined.includes("居酒屋"))
    return "Dining";
  if (combined.includes("amazon") || combined.includes("アマゾン"))
    return "Online Shopping";
  if (combined.includes("rakuten") || combined.includes("楽天"))
    return "Online Shopping";
  return "Other";
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
    if (typeof dateStr !== "string" || !dateStr.match(/\d+/)) continue;
    const parsedDate = parseDate(dateStr);
    const amount = parseFloat(amountStr);
    if (!isValid(parsedDate) || isNaN(amount)) continue;
    const shopName = extractOricoShopName(merchantStr);
    const description = merchantStr || "PayPay Transaction";
    const category = categorizeOricoTransaction(merchantStr, shopName);
    const transaction: Transaction = {
      id: generateUniqueId("paypay"),
      date: format(parsedDate!, "yyyy-MM-dd"),
      time: "12:00:00",
      amount: Math.abs(amount),
      description,
      category,
      shopName,
      type: "expense",
      originalData: {
        rawRow: row,
        fileType: "PayPay CSV",
        rowNumber: i,
        encoding: "UTF-8",
      },
    };
    transactions.push(transaction);
    transactionIndex++;
  }
  if (transactions.length === 0) {
    console.warn(
      "No valid transactions found. First 5 rows:",
      data.slice(0, 5)
    );
  }
  return transactions;
};

// Orico/Detail CSV parser
export const parseOricoDetailCSVFile = (data: any[][]): Transaction[] => {
  const transactions: Transaction[] = [];
  let transactionIndex = 0;
  for (let i = 1; i < data.length; i++) {
    // skip header
    const row = data[i];
    if (!row || row.length < 9) continue;
    const dateStr = row[0];
    if (!dateStr || dateStr.trim() === "") continue; // skip rows with empty date
    const merchantStr = row[1];
    // Try column 8 for amount (KAL format), fallback to column 5 (Orico format)
    let amountStr = row[8] || row[5];
    if (!amountStr) continue;
    // Clean up amount: remove backslash, commas, quotes
    amountStr = amountStr.replace(/\\|"|,/g, "").trim();
    const parsedDate = parseDate(dateStr);
    const amount = parseFloat(amountStr);
    if (!isValid(parsedDate) || isNaN(amount)) continue;
    const shopName = extractOricoShopName(merchantStr);
    const description = merchantStr || "Orico Transaction";
    const category = categorizeOricoTransaction(merchantStr, shopName);
    const transaction: Transaction = {
      id: generateUniqueId(`orico_${transactionIndex}`),
      date: format(parsedDate!, "yyyy-MM-dd"),
      time: "12:00:00",
      amount: Math.abs(amount),
      description,
      category,
      shopName,
      type: "expense",
      originalData: {
        rawRow: row,
        fileType: "Orico/Detail CSV",
        rowNumber: i,
        encoding: "UTF-8",
      },
    };
    transactions.push(transaction);
    transactionIndex++;
  }
  if (transactions.length === 0) {
    console.warn(
      "No valid transactions found in Orico/Detail CSV. First 5 rows:",
      data.slice(0, 5)
    );
  }
  return transactions;
};

// UFJ CSV parser - handles quoted CSV with thousand separators
export const parseUFJCSVFile = (data: any[][]): Transaction[] => {
  const transactions: Transaction[] = [];
  
  // Skip header row and process data
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 6) continue;
    
    const dateStr = row[0]; // Date column
    const categoryStr = row[1]; // Category/Type
    const descriptionStr = row[2]; // Description/Merchant
    const withdrawalStr = row[3]; // Withdrawal amount
    const depositStr = row[4]; // Deposit amount
    // const balanceStr = row[5]; // Balance (not used currently)
    
    if (!dateStr || dateStr.trim() === "") continue;
    
    const parsedDate = parseDate(dateStr);
    if (!isValid(parsedDate)) continue;
    
    // Parse amounts - handle thousand separators
    let amount = 0;
    let transactionType: 'expense' | 'income' = 'expense';
    
    const parseAmount = (str: string): number => {
      if (!str || str.trim() === "") return 0;
      // Remove thousand separators and parse
      return parseFloat(str.replace(/,/g, "")) || 0;
    };
    
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
    
    if (isNaN(amount) || amount === 0) continue;
    
    // Extract shop name and categorize
    const shopName = descriptionStr || categoryStr || "UFJ Transaction";
    const category = categorizeUFJTransaction(categoryStr, descriptionStr);
    
    const transaction: Transaction = {
      id: generateUniqueId("ufj"),
      date: format(parsedDate!, "yyyy-MM-dd"),
      time: "12:00:00",
      amount: Math.abs(amount),
      description: `${categoryStr || ''} - ${descriptionStr || ''}`.trim(),
      category,
      shopName,
      type: transactionType,
      originalData: {
        rawRow: row,
        fileType: "UFJ CSV",
        rowNumber: i,
        encoding: "Shift-JIS",
      },
    };
    
    transactions.push(transaction);
  }
  
  return transactions;
};

// Categorize UFJ transactions
const categorizeUFJTransaction = (category: string, description: string): string => {
  const combined = ((category || '') + ' ' + (description || '')).toLowerCase();
  
  // Check for PayPay transactions to avoid duplication
  if (combined.includes('paypay') || combined.includes('ペイペイ')) {
    return 'PayPay Transfer';
  }
  
  // ATM and bank transfers
  if (combined.includes('振込') || combined.includes('振替')) {
    return 'Transfer';
  }
  
  // Card payments
  if (combined.includes('カード') || combined.includes('card')) {
    return 'Card Payment';
  }
  
  // Income
  if (combined.includes('給与') || combined.includes('賞与') || combined.includes('給料')) {
    return 'Salary';
  }
  
  // Utilities
  if (combined.includes('電気') || combined.includes('ガス') || combined.includes('水道')) {
    return 'Utilities';
  }
  
  // Rent
  if (combined.includes('家賃') || combined.includes('賃貸')) {
    return 'Rent';
  }
  
  return 'Other';
};

// Detect file type from content or filename
const detectFileType = (filename: string, data: any[][]): string => {
  const name = filename.toLowerCase();
  
  // Check filename patterns
  if (name.includes('paypay')) return 'paypay';
  if (name.includes('detail')) return 'orico';
  if (name.includes('kal')) return 'orico';
  
  // Check for UFJ pattern (numeric filename with timestamp)
  if (/\d+_\d+\.csv$/i.test(filename)) {
    return 'ufj';
  }
  
  // Check header content if available
  if (data && data.length > 0) {
    const header = data[0];
    if (header && header.length >= 6) {
      // UFJ typically has these columns - check for Japanese headers
      const headerStr = header.join(' ');
      if (headerStr.includes('日付') || headerStr.includes('摘要') || 
          headerStr.includes('支払') || headerStr.includes('預') ||
          headerStr.includes('残高') || headerStr.includes('入払')) {
        return 'ufj';
      }
    }
  }
  
  return 'unknown';
};

// Helper function to decode Shift-JIS in browser
const decodeShiftJIS = async (arrayBuffer: ArrayBuffer): Promise<string> => {
  // For browser compatibility, we'll use TextDecoder with fallback
  try {
    // Try Shift-JIS if available in browser
    const decoder = new TextDecoder('shift-jis');
    return decoder.decode(arrayBuffer);
  } catch (e) {
    // Fallback to UTF-8 with replacement characters for unknown bytes
    const decoder = new TextDecoder('utf-8', { fatal: false });
    return decoder.decode(arrayBuffer);
  }
};

// Main CSV file parser with encoding detection
export const parseCSVFile = (file: File): Promise<Transaction[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // Try to detect if it's Shift-JIS encoded (common for Japanese bank files)
        let csvText: string;
        
        // Check if file contains Japanese characters (high byte values)
        const hasJapaneseChars = uint8Array.some(byte => byte > 0x7F);
        
        if (hasJapaneseChars) {
          // Try Shift-JIS first for Japanese files
          csvText = await decodeShiftJIS(arrayBuffer);
        } else {
          // Use UTF-8 for regular files
          csvText = new TextDecoder('utf-8').decode(uint8Array);
        }
        
        // Parse CSV
        Papa.parse(csvText, {
          header: false,
          skipEmptyLines: true,
          complete: (results) => {
            try {
              const fileType = detectFileType(file.name, results.data as any[][]);
              let transactions: Transaction[] = [];
              
              switch (fileType) {
                case 'paypay':
                  transactions = parsePayPayCSVFile(results.data as any[][]);
                  break;
                case 'orico':
                  transactions = parseOricoDetailCSVFile(results.data as any[][]);
                  break;
                case 'ufj':
                  transactions = parseUFJCSVFile(results.data as any[][]);
                  break;
                default:
                  console.warn(`Unknown file type for ${file.name}, attempting generic parse`);
                  transactions = parseOricoDetailCSVFile(results.data as any[][]);
              }
              
              if (transactions.length === 0) {
                reject(new Error(`No valid transactions found in ${file.name}`));
              } else {
                resolve(transactions);
              }
            } catch (error: any) {
              reject(error);
            }
          },
          error: (error: any) => {
            reject(error);
          },
        });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    // Read file as ArrayBuffer to handle encoding
    reader.readAsArrayBuffer(file);
  });
};
