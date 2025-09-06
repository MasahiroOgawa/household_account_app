import * as Papa from "papaparse";
import { Transaction } from "../types/Transaction";
import { format, parse, isValid } from "date-fns";
import { mapToNewCategory } from "./categoryMapper";

// Constants for internal transfer detection
// Max description length for personal transfers - longer descriptions typically indicate business transactions
const MAX_PERSONAL_TRANSFER_LENGTH = 50;
// Max length for personal names to track - prevents storing very long text as personal names
const MAX_PERSONAL_NAME_LENGTH = 30;

// Unique ID generator using timestamp and counter
let idCounter = 0;
const generateUniqueId = (prefix: string): string => {
  idCounter = (idCounter + 1) % 100000;
  return `${prefix}_${Date.now()}_${idCounter}_${Math.floor(
    Math.random() * 1000
  )}`;
};

// CSV Parser class to encapsulate state and avoid global variables
class CSVParserState {
  private knownAccountNumbers = new Set<string>();
  private personalTransferNames = new Set<string>();

  extractAndStoreAccountNumber(filename: string): string | undefined {
    // Extract account number from UFJ filename pattern (e.g., 4614196_20250810131859.csv -> 4614196)
    const match = filename.match(/^(\d{7})_\d+\.csv$/i);
    if (match) {
      const accountNumber = match[1];
      this.knownAccountNumbers.add(accountNumber);
      return accountNumber;
    }
    return undefined;
  }

  addPersonalTransferName(name: string): void {
    if (name && name.length < MAX_PERSONAL_NAME_LENGTH) {
      this.personalTransferNames.add(name.toLowerCase());
    }
  }

  isUFJInternalTransfer(category: string, description: string): boolean {
    const combined = (
      (category || "") +
      " " +
      (description || "")
    ).toLowerCase();

    // Check for transfers between known account numbers (but not business transactions)
    const hasAccountNumberMatch = Array.from(this.knownAccountNumbers).some(
      (accNum) => combined.includes(accNum)
    );
    if (
      hasAccountNumberMatch &&
      combined.includes("振込") &&
      !combined.includes("手数料")
    ) {
      return true;
    }

    // Check for personal name transfers already tracked
    // Look for transfers with known personal names
    const hasPersonalName = Array.from(this.personalTransferNames).some(
      (name) => combined.includes(name)
    );
    if (
      hasPersonalName &&
      combined.includes("振込") &&
      !combined.includes("手数料")
    ) {
      return true; // Internal transfer to/from known personal account
    }

    // Check for simple internal transfers (but exclude legitimate business transactions)
    if (combined.includes("振込") && !combined.includes("手数料")) {
      // Exclude legitimate business/investment transactions
      if (
        combined.includes("ラクテン") ||
        combined.includes("rakuten") ||
        combined.includes("証券") ||
        combined.includes("投資") ||
        combined.includes("保険") ||
        combined.includes("生命") ||
        combined.includes("損保") ||
        combined.includes("insurance") ||
        combined.includes("給与") ||
        combined.includes("salary") ||
        combined.includes("会社") ||
        combined.includes("株式会社") ||
        combined.includes("（カ") ||
        combined.includes("（株") ||
        combined.includes("ワイズ") ||
        combined.includes("ペイメン") ||
        combined.includes("センシン") ||
        combined.includes("robo")
      ) {
        return false; // Not an internal transfer - legitimate business transaction
      }

      // Check if this matches a known personal transfer name
      const hasPersonalName = Array.from(this.personalTransferNames).some(
        (name) => combined.includes(name)
      );
      if (hasPersonalName) {
        return true; // Internal transfer to/from known personal account
      }

      // If it's a simple transfer with no clear business context, likely internal
      // This catches personal transfers without hardcoding names
      const hasBusinessIndicators =
        combined.includes("株") ||
        combined.includes("会社") ||
        combined.includes("（カ") ||
        combined.includes("（有") ||
        combined.includes("法人") ||
        combined.includes("Co") ||
        combined.includes("Ltd") ||
        combined.includes("Inc");

      if (
        !hasBusinessIndicators &&
        combined.length < MAX_PERSONAL_TRANSFER_LENGTH
      ) {
        return true; // Likely internal transfer
      }
    }

    return false;
  }

  isSMBCInternalTransfer(combinedDescription: string): boolean {
    const combined = combinedDescription.toLowerCase();

    // Check for transfers between known account numbers
    const hasAccountNumberMatch = Array.from(this.knownAccountNumbers).some(
      (accNum) => combined.includes(accNum)
    );
    if (
      hasAccountNumberMatch &&
      combined.includes("振込") &&
      !combined.includes("手数料")
    ) {
      return true;
    }

    // Check for personal name transfers with tracking (but exclude legitimate business income)
    if (combined.includes("振込") && !combined.includes("手数料")) {
      // For new transfers, add names to tracking if they look personal (short, no business indicators)
      if (
        !combined.includes("会社") &&
        !combined.includes("株式") &&
        !combined.includes("（カ") &&
        !combined.includes("法人") &&
        // Exclude salary and legitimate income
        !combined.includes("給与") &&
        !combined.includes("賞与") &&
        !combined.includes("給料") &&
        !combined.includes("salary") &&
        !combined.includes("ワイズ") &&
        !combined.includes("ペイメン") &&
        !combined.includes("証券") &&
        !combined.includes("投資") &&
        !combined.includes("保険") &&
        combinedDescription.length < MAX_PERSONAL_TRANSFER_LENGTH
      ) {
        const namePart = combinedDescription.replace(/[　\s]+/g, " ").trim();
        this.addPersonalTransferName(namePart);
        return true;
      }
    }

    // Check against known personal names
    const hasPersonalName = Array.from(this.personalTransferNames).some(
      (name) => combined.includes(name)
    );
    if (
      hasPersonalName &&
      combined.includes("振込") &&
      !combined.includes("手数料")
    ) {
      return true;
    }

    return false;
  }

  isJREInternalTransfer(description: string): boolean {
    if (!description) return false;
    const desc = description.toLowerCase();

    // Check for transfers between known account numbers
    const hasAccountNumberMatch = Array.from(this.knownAccountNumbers).some(
      (accNum) => desc.includes(accNum)
    );
    if (hasAccountNumberMatch) {
      return true;
    }

    // Check for simple bank transfers (but exclude business transactions)
    if (desc.includes("三菱ufj銀行") || desc.includes("三菱ｕｆｊ銀行")) {
      // Exclude legitimate business transactions
      if (
        desc.includes("会社") ||
        desc.includes("株式会社") ||
        desc.includes("（カ") ||
        desc.includes("（株") ||
        desc.includes("証券") ||
        desc.includes("投資") ||
        desc.includes("保険") ||
        desc.includes("給与")
      ) {
        return false; // Not an internal transfer - legitimate business transaction
      }

      // Simple personal transfers to UFJ are usually internal
      return true;
    }

    // Check for personal transfers and track them (but exclude legitimate business income)
    if (
      desc.length < MAX_PERSONAL_TRANSFER_LENGTH &&
      !desc.includes("会社") &&
      !desc.includes("株式") &&
      !desc.includes("（カ") &&
      !desc.includes("法人") &&
      // Exclude salary and legitimate income
      !desc.includes("給与") &&
      !desc.includes("賞与") &&
      !desc.includes("給料") &&
      !desc.includes("salary") &&
      !desc.includes("ワイズ") &&
      !desc.includes("ペイメン") &&
      !desc.includes("証券") &&
      !desc.includes("投資") &&
      !desc.includes("保険") &&
      // Must be a transfer to be considered internal
      desc.includes("振込")
    ) {
      // Track this name for cross-bank detection
      const namePart = description.replace(/[　\s]+/g, " ").trim();
      this.addPersonalTransferName(namePart);
      return true; // Internal transfer between own accounts
    }

    // Check against known personal transfer names
    const hasPersonalName = Array.from(this.personalTransferNames).some(
      (name) => desc.includes(name)
    );
    if (hasPersonalName) {
      return true; // Internal transfer to/from known personal account
    }

    return false;
  }
}

// Create a singleton instance for backward compatibility
const defaultParserState = new CSVParserState();

// Export a function to create a new parser instance for testing
export const createCSVParser = (): CSVParserState => new CSVParserState();

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

  // Utilities
  if (
    combined.includes("東京ガス") ||
    combined.includes("ガス") ||
    combined.includes("東京電力") ||
    combined.includes("電力") ||
    combined.includes("電気") ||
    combined.includes("水道")
  )
    return "Utilities";

  // Transportation
  if (
    combined.includes("ジェイアール") ||
    combined.includes("jr") ||
    combined.includes("東日本") ||
    combined.includes("地下鉄") ||
    combined.includes("メトロ") ||
    combined.includes("バス") ||
    combined.includes("タクシー")
  )
    return "Transportation";

  // Food & Dining
  if (
    combined.includes("スーパー") ||
    combined.includes("コンビニ") ||
    combined.includes("セブン") ||
    combined.includes("ローソン") ||
    combined.includes("ファミリーマート")
  )
    return "Groceries";

  if (
    combined.includes("レストラン") ||
    combined.includes("居酒屋") ||
    combined.includes("カフェ") ||
    combined.includes("食堂") ||
    combined.includes("ヤキトンタチキ")
  )
    return "Dining";

  // Shopping
  if (
    combined.includes("アトレ") ||
    combined.includes("デパート") ||
    combined.includes("ショッピング") ||
    combined.includes("モール")
  )
    return "Shopping";

  if (
    combined.includes("amazon") ||
    combined.includes("アマゾン") ||
    combined.includes("rakuten") ||
    combined.includes("楽天") ||
    combined.includes("メルカリ")
  )
    return "Online Shopping";

  // Entertainment & Hobby
  if (
    combined.includes("映画") ||
    combined.includes("シネマ") ||
    combined.includes("ゲーム") ||
    combined.includes("本屋") ||
    combined.includes("書店")
  )
    return "Hobby";

  // Health & Medical
  if (
    combined.includes("病院") ||
    combined.includes("クリニック") ||
    combined.includes("薬局") ||
    combined.includes("ドラッグ")
  )
    return "Healthcare";

  // Education
  if (
    combined.includes("学校") ||
    combined.includes("塾") ||
    combined.includes("教育") ||
    combined.includes("レッスン")
  )
    return "Education";

  return "Life";
};

// PayPay CSV parser
export const parsePayPayCSVFile = (data: any[][]): Transaction[] => {
  const transactions: Transaction[] = [];
  // let transactionIndex = 0;
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
    const oldCategory = categorizeOricoTransaction(merchantStr, shopName);
    const category = mapToNewCategory(oldCategory, description, shopName, Math.abs(amount), "PayPay");
    const transaction: Transaction = {
      id: generateUniqueId("paypay"),
      date: format(parsedDate!, "yyyy-MM-dd"),
      time: "12:00:00",
      amount: Math.abs(amount),
      description,
      category,
      shopName,
      type: "expense",
      source: "PayPay",
      originalData: {
        rawRow: row,
        fileType: "PayPay CSV",
        rowNumber: i,
        encoding: "UTF-8",
      },
    };
    transactions.push(transaction);
    // transactionIndex++;
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
  // let transactionIndex = 0;

  // Check if this is the new Orico format by looking at headers
  const header = data[0] || [];
  const isNewOricoFormat = header.some((col) => col && col.includes("利用日"));

  for (let i = 1; i < data.length; i++) {
    // skip header
    const row = data[i];
    if (!row || row.length < 5) continue;

    let dateStr, merchantStr, amountStr;

    if (isNewOricoFormat) {
      // New Orico format: "利用日/キャンセル日","利用店名・商品名","利用者","決済方法","支払区分","利用金額",...
      dateStr = row[0];
      merchantStr = row[1];
      amountStr = row[5]; // 利用金額
    } else {
      // Legacy format
      dateStr = row[0];
      merchantStr = row[1];
      amountStr = row[8] || row[5];
    }

    if (!dateStr || dateStr.trim() === "") continue; // skip rows with empty date
    if (!amountStr) continue;

    // Clean up amount: remove backslash, commas, quotes
    amountStr = amountStr.replace(/\\|"|,/g, "").trim();
    const parsedDate = parseDate(dateStr);
    const amount = parseFloat(amountStr);
    if (!isValid(parsedDate) || isNaN(amount)) continue;

    const shopName = extractOricoShopName(merchantStr);
    const description = merchantStr || "Orico Transaction";
    const oldCategory = categorizeOricoTransaction(merchantStr, shopName);
    const isKAL = row[1] && row[1].includes("KAL");
    const source = isKAL ? "KAL Card" : "Orico Card";
    const category = mapToNewCategory(oldCategory, description, shopName, Math.abs(amount), source);

    const transaction: Transaction = {
      id: generateUniqueId(`orico`),
      date: format(parsedDate!, "yyyy-MM-dd"),
      time: "12:00:00",
      amount: Math.abs(amount),
      description,
      category,
      shopName,
      type: "expense",
      source,
      originalData: {
        rawRow: row,
        fileType: "Orico/Detail CSV",
        rowNumber: i,
        encoding: "UTF-8",
      },
    };
    transactions.push(transaction);
    // transactionIndex++;
  }
  if (transactions.length === 0) {
    console.warn(
      "No valid transactions found in Orico/Detail CSV. First 5 rows:",
      data.slice(0, 5)
    );
  }
  return transactions;
};

// Helper function to check if a UFJ transaction is a transfer fee
const isUFJTransferFee = (category: string, description: string): boolean => {
  const combined = ((category || "") + " " + (description || "")).toLowerCase();
  return combined.includes("手数料") || combined.includes("振込手数料");
};

// UFJ CSV parser - handles quoted CSV with thousand separators
export const parseUFJCSVFile = (
  data: any[][],
  filename?: string
): Transaction[] => {
  // Extract and store account number from filename
  const accountNumber = filename
    ? defaultParserState.extractAndStoreAccountNumber(filename) ||
      filename.split("_")[0].replace(".csv", "")
    : "";
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
    let transactionType: "expense" | "income" = "expense";

    const parseAmount = (str: string): number => {
      if (!str || str.trim() === "") return 0;
      // Remove thousand separators and parse
      return parseFloat(str.replace(/,/g, "")) || 0;
    };

    const withdrawalAmount = parseAmount(withdrawalStr);
    const depositAmount = parseAmount(depositStr);

    if (withdrawalAmount > 0) {
      amount = withdrawalAmount;
      transactionType = "expense";
    } else if (depositAmount > 0) {
      amount = depositAmount;
      transactionType = "income";
    } else {
      continue; // Skip if no amount
    }

    if (isNaN(amount) || amount === 0) continue;

    // Skip internal transfers unless they are fees
    if (
      defaultParserState.isUFJInternalTransfer(categoryStr, descriptionStr) &&
      !isUFJTransferFee(categoryStr, descriptionStr)
    ) {
      continue; // Skip internal transfer
    }

    // Extract shop name and categorize
    const shopName = descriptionStr || categoryStr || "UFJ Transaction";
    const oldCategory = categorizeUFJTransaction(categoryStr, descriptionStr);
    const category = mapToNewCategory(oldCategory, `${categoryStr || ""} - ${descriptionStr || ""}`.trim(), shopName, Math.abs(amount), accountNumber ? `UFJ Bank (${accountNumber})` : "UFJ Bank");

    const transaction: Transaction = {
      id: generateUniqueId("ufj"),
      date: format(parsedDate!, "yyyy-MM-dd"),
      time: "12:00:00",
      amount: Math.abs(amount),
      description: `${categoryStr || ""} - ${descriptionStr || ""}`.trim(),
      category,
      shopName,
      type: transactionType,
      source: accountNumber ? `UFJ Bank (${accountNumber})` : "UFJ Bank",
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

// SMBC Bank CSV parser
export const parseSMBCCSVFile = (data: any[][]): Transaction[] => {
  const transactions: Transaction[] = [];

  // Skip header row if it exists
  const startRow =
    data[0] && data[0][0] && data[0][0].includes("年月日") ? 1 : 0;

  for (let i = startRow; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 5) continue;

    const dateStr = row[0]; // 年月日
    const withdrawalStr = row[1]; // お引出し
    const depositStr = row[2]; // お預入れ
    const descriptionStr = row[3]; // お取り扱い内容
    // const balanceStr = row[4]; // 残高 (not used)

    if (!dateStr || dateStr.trim() === "") continue;

    const parsedDate = parseDate(dateStr);
    if (!parsedDate || !isValid(parsedDate)) continue;

    // Parse amounts
    let amount = 0;
    let transactionType: "expense" | "income" = "expense";

    const parseAmount = (str: string): number => {
      if (!str || str.trim() === "") return 0;
      return parseFloat(str.replace(/,/g, "")) || 0;
    };

    const withdrawalAmount = parseAmount(withdrawalStr);
    const depositAmount = parseAmount(depositStr);

    if (withdrawalAmount > 0) {
      amount = withdrawalAmount;
      transactionType = "expense";
    } else if (depositAmount > 0) {
      amount = depositAmount;
      transactionType = "income";
    } else {
      continue; // Skip if no amount
    }

    if (isNaN(amount) || amount === 0) continue;

    // Skip internal transfers unless they are fees
    // For SMBC, need to check category + description together
    const combinedDescription = (
      (row[1] || "") +
      " " +
      (descriptionStr || "")
    ).trim();
    if (
      defaultParserState.isSMBCInternalTransfer(combinedDescription) &&
      !isSMBCTransferFee(combinedDescription)
    ) {
      continue; // Skip internal transfer
    }

    // Extract shop name and categorize
    const shopName = extractSMBCShopName(descriptionStr);
    const oldCategory = categorizeSMBCTransaction(descriptionStr);
    const category = mapToNewCategory(oldCategory, descriptionStr || "", shopName, Math.abs(amount), "SMBC Bank");

    const transaction: Transaction = {
      id: generateUniqueId("smbc"),
      date: format(parsedDate, "yyyy-MM-dd"),
      time: "12:00:00",
      amount: Math.abs(amount),
      description: descriptionStr || "SMBC Bank Transaction",
      category,
      shopName,
      type: transactionType,
      source: "SMBC Bank",
      originalData: {
        rawRow: row,
        fileType: "SMBC Bank CSV",
        rowNumber: i,
        encoding: "Shift-JIS",
      },
    };

    transactions.push(transaction);
  }

  return transactions;
};

// Helper function to check if a SMBC transaction is a transfer fee
const isSMBCTransferFee = (description: string): boolean => {
  if (!description) return false;
  const desc = description.toLowerCase();
  return desc.includes("振込手数料") || desc.includes("手数料");
};

// Extract shop name from SMBC description
const extractSMBCShopName = (description: string): string => {
  if (!description) return "SMBC Bank";

  // Remove common prefixes and clean up
  let shopName = description
    .replace(/^振込\s*/, "") // Remove "振込" prefix
    .replace(/^パソコン振込\s*/, "") // Remove "パソコン振込" prefix
    .replace(/\(.*?\)/g, "") // Remove content in parentheses
    .replace(/（.*?）/g, "") // Remove content in Japanese parentheses
    .replace(/\s+/g, " ")
    .trim();

  // For credit card transactions, extract the card name
  if (shopName.includes("オリコ")) {
    return "Orico Card Payment";
  }
  if (shopName.includes("ミツイスミトモカ")) {
    return "Mitsui Sumitomo Card Payment";
  }

  return shopName.substring(0, 30) || "SMBC Bank";
};

// Categorize SMBC transactions
const categorizeSMBCTransaction = (description: string): string => {
  if (!description) return "Other";
  const desc = description.toLowerCase();

  // Credit card payments
  if (desc.includes("オリコ") || desc.includes("orico")) {
    return "Credit Card Payment";
  }
  if (desc.includes("ミツイスミトモカ") || desc.includes("三井住友")) {
    return "Credit Card Payment";
  }

  // Bank fees
  if (desc.includes("振込手数料") || desc.includes("手数料")) {
    return "Bank Fee";
  }

  // Interest income
  if (desc.includes("利息") || desc.includes("普通預金利息")) {
    return "Interest Income";
  }

  // Insurance
  if (
    desc.includes("保険") ||
    desc.includes("ソンガイホケン") ||
    desc.includes("ソンガイ") ||
    desc.includes("生命") ||
    desc.includes("損保") ||
    desc.includes("insurance")
  ) {
    return "Insurance";
  }

  // Salary/Income from known companies
  if (
    desc.includes("ワイズ") ||
    desc.includes("ペイメンツ") ||
    desc.includes("ジャパン")
  ) {
    return "Salary";
  }

  // Bank transfers
  if (desc.includes("振込") || desc.includes("パソコン振込")) {
    return "Bank Transfer";
  }

  return "Other";
};

// Helper function to check if a JRE Bank transaction is a transfer fee
const isJRETransferFee = (description: string): boolean => {
  if (!description) return false;
  const desc = description.toLowerCase();
  return desc.includes("振込手数料") || desc.includes("手数料");
};

// JRE Bank CSV parser
export const parseJREBankCSVFile = (data: any[][]): Transaction[] => {
  const transactions: Transaction[] = [];

  // Skip header row if it exists
  const startRow =
    data[0] && data[0][0] && data[0][0].includes("取引日") ? 1 : 0;

  for (let i = startRow; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 4) continue;

    const dateStr = row[0]; // Date in YYYYMMDD format
    const amountStr = row[1]; // Amount (positive for income, negative for expense)
    // const balanceStr = row[2]; // Balance after transaction (not used)
    const descriptionStr = row[3]; // Transaction description

    if (!dateStr || dateStr.trim() === "") continue;

    // Parse date from YYYYMMDD format
    let parsedDate = null;
    if (dateStr.length === 8) {
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(4, 6);
      const day = dateStr.substring(6, 8);
      parsedDate = new Date(`${year}-${month}-${day}`);
    } else {
      parsedDate = parseDate(dateStr);
    }

    if (!parsedDate || !isValid(parsedDate)) continue;

    // Parse amount
    const amount = parseFloat(amountStr.replace(/,/g, ""));
    if (isNaN(amount)) continue;

    // Skip internal transfers unless they are fees
    if (
      defaultParserState.isJREInternalTransfer(descriptionStr) &&
      !isJRETransferFee(descriptionStr)
    ) {
      continue; // Skip internal transfer
    }

    // Determine transaction type based on amount sign
    const transactionType: "expense" | "income" =
      amount < 0 ? "expense" : "income";

    // Extract shop name and categorize
    const shopName = extractJREShopName(descriptionStr);
    const oldCategory = categorizeJRETransaction(descriptionStr);
    const category = mapToNewCategory(oldCategory, descriptionStr || "", shopName, Math.abs(amount), "JRE Bank");

    const transaction: Transaction = {
      id: generateUniqueId("jre"),
      date: format(parsedDate, "yyyy-MM-dd"),
      time: "12:00:00",
      amount: Math.abs(amount),
      description: descriptionStr || "JRE Bank Transaction",
      category,
      shopName,
      type: transactionType,
      source: "JRE Bank",
      originalData: {
        rawRow: row,
        fileType: "JRE Bank CSV",
        rowNumber: i,
        encoding: "Shift-JIS",
      },
    };

    transactions.push(transaction);
  }

  return transactions;
};

// Extract shop name from JRE Bank description
const extractJREShopName = (description: string): string => {
  if (!description) return "JRE Bank";

  // Remove account numbers and extra details
  let shopName = description
    .replace(/\d{7,}/g, "") // Remove long numbers (account numbers)
    .replace(/（.*?）/g, "") // Remove content in parentheses
    .replace(/振込手数料.*$/, "") // Remove fee descriptions
    .replace(/\s+/g, " ")
    .trim();

  // Extract main shop name from transfers
  if (shopName.includes("振込先")) {
    const parts = shopName.split(/\s+/);
    shopName =
      parts.find((p) => !p.includes("振込") && p.length > 2) || shopName;
  }

  return shopName.substring(0, 30) || "JRE Bank";
};

// Categorize JRE Bank transactions
const categorizeJRETransaction = (description: string): string => {
  const desc = description.toLowerCase();

  // Salary/Income
  if (desc.includes("給与") || desc.includes("賞与") || desc.includes("給料")) {
    return "Salary";
  }

  // Card payments
  if (desc.includes("カード") || desc.includes("card")) {
    return "Credit Card";
  }

  // ATM
  if (desc.includes("atm") || desc.includes("現金")) {
    return "ATM";
  }

  // Transfer
  if (desc.includes("振込") || desc.includes("振替")) {
    return "Bank Transfer";
  }

  // Fees
  if (desc.includes("手数料")) {
    return "Bank Fee";
  }

  // Utilities
  if (desc.includes("電気") || desc.includes("ガス") || desc.includes("水道")) {
    return "Utilities";
  }

  return "Other";
};

// Categorize UFJ transactions
const categorizeUFJTransaction = (
  category: string,
  description: string
): string => {
  const combined = ((category || "") + " " + (description || "")).toLowerCase();

  // Income categories
  if (
    combined.includes("給与") ||
    combined.includes("賞与") ||
    combined.includes("給料") ||
    combined.includes("賃金")
  ) {
    return "Salary";
  }

  if (combined.includes("配当") || combined.includes("利息")) {
    return "Investment Income";
  }

  if (
    combined.includes("ラクテン") ||
    combined.includes("rakuten") ||
    combined.includes("証券") ||
    combined.includes("投資") ||
    combined.includes("株式") ||
    combined.includes("fund")
  ) {
    return "Investment";
  }

  // Living expenses
  if (
    combined.includes("家賃") ||
    combined.includes("賃貸") ||
    combined.includes("管理費") ||
    combined.includes("共益費")
  ) {
    return "Rent";
  }

  if (
    combined.includes("電気") ||
    combined.includes("ガス") ||
    combined.includes("水道") ||
    combined.includes("電力")
  ) {
    return "Utilities";
  }

  // Financial services
  if (combined.includes("paypay") || combined.includes("ペイペイ")) {
    return "E-Money Transfer";
  }

  if (combined.includes("カード") || combined.includes("card")) {
    return "Credit Card";
  }

  // Bank operations
  if (combined.includes("振込") || combined.includes("振替")) {
    return "Bank Transfer";
  }

  if (
    combined.includes("atm") ||
    combined.includes("引出") ||
    combined.includes("預入")
  ) {
    return "ATM";
  }

  // Education
  if (
    combined.includes("学費") ||
    combined.includes("授業料") ||
    combined.includes("教育")
  ) {
    return "Education";
  }

  // Healthcare
  if (
    combined.includes("医療") ||
    combined.includes("病院") ||
    combined.includes("診療")
  ) {
    return "Healthcare";
  }

  // Insurance
  if (combined.includes("保険") || combined.includes("年金")) {
    return "Insurance";
  }

  // Tax
  if (
    combined.includes("税") ||
    combined.includes("所得税") ||
    combined.includes("住民税")
  ) {
    return "Tax";
  }

  return "Life";
};

// Detect file type from content or filename
const detectFileType = (filename: string, data: any[][]): string => {
  const name = filename.toLowerCase();

  // Check filename patterns
  if (name.includes("paypay")) return "paypay";
  if (name.includes("detail")) return "orico";
  if (name.includes("kal")) return "orico";
  if (name.includes("rb-torihiki") || name.includes("jre")) return "jre";
  if (name.includes("meisai")) return "smbc";

  // Check for UFJ pattern (numeric filename with timestamp)
  if (/\d+_\d+\.csv$/i.test(filename)) {
    return "ufj";
  }

  // Check header content if available
  if (data && data.length > 0) {
    const header = data[0];
    if (header && header.length >= 6) {
      const headerStr = header.join(" ");

      // Check for Orico card headers
      if (
        headerStr.includes("利用日") ||
        headerStr.includes("利用店名") ||
        headerStr.includes("決済方法") ||
        headerStr.includes("支払区分")
      ) {
        return "orico";
      }

      // UFJ typically has these columns - check for Japanese headers
      if (
        headerStr.includes("日付") ||
        headerStr.includes("摘要") ||
        headerStr.includes("支払") ||
        headerStr.includes("預") ||
        headerStr.includes("残高") ||
        headerStr.includes("入払")
      ) {
        return "ufj";
      }

      // SMBC has specific header columns
      if (
        headerStr.includes("お引出し") &&
        headerStr.includes("お預入れ") &&
        headerStr.includes("お取り扱い内容")
      ) {
        return "smbc";
      }
    }
  }

  return "unknown";
};

// Helper function to detect and decode text with proper encoding
const detectAndDecodeText = async (
  arrayBuffer: ArrayBuffer,
  filename?: string
): Promise<string> => {
  const uint8Array = new Uint8Array(arrayBuffer);
  const logPrefix = filename ? `[${filename}]` : "[Unknown file]";

  console.log(
    `${logPrefix} Detecting encoding for file (${uint8Array.length} bytes)`
  );

  // Check for UTF-8 BOM (0xEF, 0xBB, 0xBF)
  if (
    uint8Array.length >= 3 &&
    uint8Array[0] === 0xef &&
    uint8Array[1] === 0xbb &&
    uint8Array[2] === 0xbf
  ) {
    // File has UTF-8 BOM, decode as UTF-8
    console.log(`${logPrefix} UTF-8 BOM detected, using UTF-8 encoding`);
    const decoder = new TextDecoder("utf-8");
    return decoder.decode(arrayBuffer);
  }

  // Try UTF-8 first (most common for modern files)
  try {
    const decoder = new TextDecoder("utf-8", { fatal: true });
    const text = decoder.decode(arrayBuffer);
    console.log(`${logPrefix} Successfully decoded as UTF-8`);
    return text;
  } catch (e) {
    console.warn(
      `${logPrefix} UTF-8 decoding failed:`,
      e instanceof Error ? e.message : String(e)
    );

    // UTF-8 failed, try Shift-JIS for legacy Japanese files
    try {
      const decoder = new TextDecoder("shift-jis");
      const text = decoder.decode(arrayBuffer);
      console.log(`${logPrefix} Successfully decoded as Shift-JIS`);
      return text;
    } catch (e2) {
      console.warn(
        `${logPrefix} Shift-JIS decoding failed:`,
        e2 instanceof Error ? e2.message : String(e2)
      );

      // Final fallback to UTF-8 with error replacement
      console.log(`${logPrefix} Using UTF-8 fallback with error replacement`);
      const decoder = new TextDecoder("utf-8", { fatal: false });
      const text = decoder.decode(arrayBuffer);

      // Count and log replaced characters for debugging
      const replacedChars = (text.match(/\uFFFD/g) || []).length;
      if (replacedChars > 0) {
        console.warn(
          `${logPrefix} ${replacedChars} characters were replaced with � (U+FFFD) due to encoding issues`
        );
      }

      return text;
    }
  }
};

// Main CSV file parser with encoding detection
export const parseCSVFile = (file: File): Promise<Transaction[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;

        // Detect and decode text with proper encoding
        const csvText = await detectAndDecodeText(arrayBuffer, file.name);

        // Parse CSV
        Papa.parse(csvText, {
          header: false,
          skipEmptyLines: true,
          complete: (results) => {
            try {
              const fileType = detectFileType(
                file.name,
                results.data as any[][]
              );
              let transactions: Transaction[] = [];

              switch (fileType) {
                case "paypay":
                  transactions = parsePayPayCSVFile(results.data as any[][]);
                  break;
                case "orico":
                  transactions = parseOricoDetailCSVFile(
                    results.data as any[][]
                  );
                  break;
                case "ufj":
                  // Extract and store UFJ account number from filename for internal transfer detection
                  defaultParserState.extractAndStoreAccountNumber(file.name);
                  transactions = parseUFJCSVFile(
                    results.data as any[][],
                    file.name
                  );
                  break;
                case "jre":
                  transactions = parseJREBankCSVFile(results.data as any[][]);
                  break;
                case "smbc":
                  transactions = parseSMBCCSVFile(results.data as any[][]);
                  break;
                default:
                  console.warn(
                    `Unknown file type for ${file.name}, attempting generic parse`
                  );
                  transactions = parseOricoDetailCSVFile(
                    results.data as any[][]
                  );
              }

              if (transactions.length === 0) {
                reject(
                  new Error(`No valid transactions found in ${file.name}`)
                );
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
      reject(new Error("Failed to read file"));
    };

    // Read file as ArrayBuffer to handle encoding
    reader.readAsArrayBuffer(file);
  });
};
