import Papa from 'papaparse';
import { Transaction } from '../types/Transaction';
import { format, parse, isValid } from 'date-fns';

export const parseCSVFile = (file: File): Promise<Transaction[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const transactions = results.data.map((row: any, index: number) => {
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
  });
};

const parseTransactionRow = (row: any, index: number): Transaction | null => {
  try {
    // Try to identify common column patterns (English and Japanese)
    const dateField = findField(row, [
      'date', 'transaction_date', 'posted_date', 'Date', 'Transaction Date',
      '利用日/キャンセル日', '利用日', '取引日', '日付', '年月日'
    ]);
    
    const amountField = findField(row, [
      'amount', 'Amount', 'debit', 'credit', 'Debit', 'Credit',
      '利用金額', '金額', '支払金額', '当月支払金額', '支払総額'
    ]);
    
    const descriptionField = findField(row, [
      'description', 'Description', 'memo', 'Memo', 'Details',
      '利用店名・商品名', '摘要', '内容', '取引内容', '商品名'
    ]);
    
    const merchantField = findField(row, [
      'merchant', 'Merchant', 'payee', 'Payee', 'shop', 'Shop Name',
      '利用店名・商品名', '加盟店名', '店舗名', '利用店名'
    ]);

    if (!dateField || !amountField) {
      return null;
    }

    // Parse date
    const parsedDate = parseDate(dateField);
    if (!parsedDate) {
      return null;
    }

    // Parse amount - detect currency and convert if needed
    const { amount, currency } = parseAmountWithCurrency(amountField, row);
    if (isNaN(amount)) {
      return null;
    }

    // For Japanese credit card statements, amounts are typically expenses
    // unless specifically marked as refunds or credits
    const isRefund = descriptionField && (
      descriptionField.includes('返金') || 
      descriptionField.includes('キャンセル') ||
      descriptionField.includes('払戻') ||
      descriptionField.includes('refund') ||
      descriptionField.includes('credit')
    );
    
    const type: 'income' | 'expense' = (amount < 0 || isRefund) ? 'income' : 'expense';

    // Extract shop name from description if merchant field is same as description
    const shopName = extractShopName(merchantField || descriptionField || '');
    
    return {
      id: `txn_${Date.now()}_${index}`,
      date: format(parsedDate, 'yyyy-MM-dd'),
      time: format(parsedDate, 'HH:mm:ss'),
      amount: Math.abs(amount),
      description: descriptionField || 'Unknown transaction',
      category: categorizeTransaction(descriptionField || '', shopName),
      shopName: shopName,
      type,
      originalData: { ...row, detectedCurrency: currency }
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
  // Japanese date formats
  const formats = [
    'yyyy/MM/dd',
    'yyyy/M/d',
    'yyyy-MM-dd',
    'yyyy-M-d',
    'MM/dd/yyyy',
    'dd/MM/yyyy',
    'yyyy/MM/dd',
    'MM-dd-yyyy',
    'dd-MM-yyyy'
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

  // Try native Date parsing as fallback
  const nativeDate = new Date(dateString);
  return isValid(nativeDate) ? nativeDate : null;
};

const parseAmountWithCurrency = (amountString: string, row: any): { amount: number; currency: string } => {
  // Detect currency from the amount string or infer from language
  let currency = 'USD'; // default
  
  // Check for explicit currency symbols
  if (amountString.includes('¥') || amountString.includes('円')) {
    currency = 'JPY';
  } else if (amountString.includes('$')) {
    currency = 'USD';
  } else if (amountString.includes('€')) {
    currency = 'EUR';
  } else if (amountString.includes('£')) {
    currency = 'GBP';
  } else {
    // Infer currency from language/column headers
    const allText = Object.keys(row).join(' ') + ' ' + Object.values(row).join(' ');
    
    // Check for Japanese text patterns
    if (hasJapaneseText(allText)) {
      currency = 'JPY';
    } else if (hasChineseText(allText)) {
      currency = 'CNY';
    } else if (hasKoreanText(allText)) {
      currency = 'KRW';
    }
    // Default remains USD for English/unknown
  }
  
  // Remove currency symbols, commas, and whitespace
  const cleaned = amountString.replace(/[¥$€£円,\s]/g, '');
  
  // Handle parentheses (negative amounts)
  let amount: number;
  if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
    amount = -parseFloat(cleaned.slice(1, -1));
  } else {
    amount = parseFloat(cleaned);
  }
  
  return { amount, currency };
};

const hasJapaneseText = (text: string): boolean => {
  // Check for Hiragana, Katakana, or Kanji characters
  return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text);
};

const hasChineseText = (text: string): boolean => {
  // Check for Chinese characters (simplified/traditional)
  return /[\u4E00-\u9FFF]/.test(text) && !/[\u3040-\u309F\u30A0-\u30FF]/.test(text);
};

const hasKoreanText = (text: string): boolean => {
  // Check for Hangul characters
  return /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/.test(text);
};

const categorizeTransaction = (description: string, shopName: string): string => {
  const desc = (description + ' ' + shopName).toLowerCase();
  
  // Japanese store patterns
  if (desc.includes('イトーヨーカドー') || desc.includes('食料品') || desc.includes('スーパー') || desc.includes('マルエツ') || desc.includes('西友')) {
    return 'Groceries';
  }
  if (desc.includes('アトレ') || desc.includes('デパート') || desc.includes('百貨店') || desc.includes('伊勢丹') || desc.includes('高島屋')) {
    return 'Shopping';
  }
  if (desc.includes('ガソリン') || desc.includes('エネオス') || desc.includes('出光') || desc.includes('コスモ') || desc.includes('シェル')) {
    return 'Transportation';
  }
  if (desc.includes('レストラン') || desc.includes('カフェ') || desc.includes('マクドナルド') || desc.includes('スタバ') || desc.includes('吉野家') || desc.includes('すき家')) {
    return 'Dining';
  }
  if (desc.includes('薬局') || desc.includes('病院') || desc.includes('クリニック') || desc.includes('マツキヨ') || desc.includes('ドラッグ')) {
    return 'Healthcare';
  }
  if (desc.includes('電気') || desc.includes('ガス') || desc.includes('水道') || desc.includes('電話') || desc.includes('東京電力') || desc.includes('東京ガス')) {
    return 'Utilities';
  }
  if (desc.includes('給与') || desc.includes('賞与') || desc.includes('給料') || desc.includes('ボーナス')) {
    return 'Income';
  }
  if (desc.includes('コンビニ') || desc.includes('セブン') || desc.includes('ローソン') || desc.includes('ファミマ') || desc.includes('ファミリーマート')) {
    return 'Convenience Store';
  }
  if (desc.includes('電車') || desc.includes('バス') || desc.includes('タクシー') || desc.includes('jr') || desc.includes('地下鉄')) {
    return 'Transportation';
  }
  
  // English patterns (fallback)
  if (desc.includes('grocery') || desc.includes('supermarket') || desc.includes('food')) {
    return 'Groceries';
  }
  if (desc.includes('gas') || desc.includes('fuel') || desc.includes('petrol')) {
    return 'Transportation';
  }
  if (desc.includes('restaurant') || desc.includes('cafe') || desc.includes('dining')) {
    return 'Dining';
  }
  if (desc.includes('pharmacy') || desc.includes('medical') || desc.includes('hospital')) {
    return 'Healthcare';
  }
  if (desc.includes('utility') || desc.includes('electric') || desc.includes('water')) {
    return 'Utilities';
  }
  if (desc.includes('salary') || desc.includes('payroll') || desc.includes('wage')) {
    return 'Income';
  }
  
  return 'Other';
};

const extractShopName = (description: string): string => {
  if (!description) return 'Unknown';
  
  // For Japanese credit card statements, the shop name is usually the first part
  // Remove common suffixes and clean up
  let shopName = description
    .replace(/・.*$/, '') // Remove everything after ・
    .replace(/\s+.*$/, '') // Remove everything after first space
    .trim();
  
  // If still too long, take first few characters
  if (shopName.length > 20) {
    shopName = shopName.substring(0, 20) + '...';
  }
  
  return shopName || 'Unknown';
};