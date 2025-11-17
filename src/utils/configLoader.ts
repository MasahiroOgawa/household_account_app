import categoryMappingDefault from '../../data/categoryMapping.json';
import { columnMappingData } from './columnMappingData';

export interface CategoryMapping {
  mappings: Record<string, string>;
  subcategories?: Record<string, string>;
  defaultCategory?: string | { income: string; expense: string };
  categories: {
    income?: string[] | Record<string, { name: string; color: string }>;
    expense?: string[] | Record<string, { name: string; color: string }>;
  } | Record<string, {
    name: string;
    type: 'income' | 'expense' | 'transfer';
    color: string;
  }>;
}

export interface ColumnMapping {
  sources: Record<string, {
    name: string;
    filename?: string[];
    columns: Record<string, number | string>;
    encoding: string;
    skipRows: number;
    dateFormat: string;
    amountColumns?: {
      withdrawal: number;
      deposit: number;
    };
    accountNumberExtraction?: boolean;
  }>;
  customMappings?: Record<string, any>;
  detectionRules: Record<string, {
    headerPatterns: string[];
    fileNamePattern: string;
  }>;
  internalTransferPatterns: string[];
  feePatterns: string[];
}

class ConfigLoader {
  private categoryMapping: CategoryMapping | null = null;
  private columnMapping: ColumnMapping | null = null;

  constructor() {
    this.loadConfigs();
  }

  private loadConfigs() {
    // ALWAYS use the hardcoded column mapping data to ensure PayPay and Orico work
    this.columnMapping = columnMappingData as ColumnMapping;
    
    // Use default category mapping
    this.categoryMapping = categoryMappingDefault as CategoryMapping;
  }

  getCategoryMapping(): CategoryMapping {
    if (!this.categoryMapping) {
      this.loadConfigs();
    }
    return this.categoryMapping!;
  }

  getColumnMapping(): ColumnMapping {
    if (!this.columnMapping) {
      this.loadConfigs();
    }
    return this.columnMapping!;
  }

  saveCategoryMapping(mapping: CategoryMapping) {
    this.categoryMapping = mapping;
    localStorage.setItem('categoryMapping', JSON.stringify(mapping));
  }

  saveColumnMapping(mapping: ColumnMapping) {
    this.columnMapping = mapping;
    localStorage.setItem('columnMapping', JSON.stringify(mapping));
  }

  // Helper method to detect category from description
  detectCategory(description: string, transactionType?: 'income' | 'expense'): string {
    const mapping = this.getCategoryMapping();

    // First check if there's an exact match in mappings
    if (mapping.mappings[description]) {
      const mappedCategory = mapping.mappings[description];
      // Check if this is a subcategory that needs further mapping
      if (mapping.subcategories && mapping.subcategories[mappedCategory]) {
        return mapping.subcategories[mappedCategory];
      }
      return mappedCategory;
    }

    // Second, check for prefix matches (description starts with keyword)
    // This handles cases like "三菱ＮＦＪ銀行 三島支店 普通預金..." matching "三菱ＮＦＪ銀行 三島支店"
    for (const [keyword, category] of Object.entries(mapping.mappings)) {
      if (description.startsWith(keyword)) {
        // Check if this is a subcategory that needs further mapping
        if (mapping.subcategories && mapping.subcategories[category]) {
          return mapping.subcategories[category];
        }
        return category;
      }
    }

    // Then check for partial matches (contains)
    const lowerDescription = description.toLowerCase();
    for (const [keyword, category] of Object.entries(mapping.mappings)) {
      if (lowerDescription.includes(keyword.toLowerCase())) {
        // Check if this is a subcategory that needs further mapping
        if (mapping.subcategories && mapping.subcategories[category]) {
          return mapping.subcategories[category];
        }
        return category;
      }
    }

    // If no mapping found and it's income, try to detect common income patterns
    if (transactionType === 'income') {
      // Check for ATM/withdrawal patterns
      if (lowerDescription.includes('atm') ||
          lowerDescription.includes('ａｔｍ') ||
          lowerDescription.includes('出金') ||
          lowerDescription.includes('引出') ||
          lowerDescription.includes('引き出') ||
          lowerDescription.includes('現金')) {
        return 'withdraw';
      }

      // Check for salary patterns
      if (lowerDescription.includes('給与') ||
          lowerDescription.includes('給料') ||
          lowerDescription.includes('賞与') ||
          lowerDescription.includes('salary') ||
          lowerDescription.includes('ボーナス')) {
        return 'salary';
      }

      // Check for refund patterns
      if (lowerDescription.includes('還付') ||
          lowerDescription.includes('税') ||
          lowerDescription.includes('refund')) {
        return 'country_refund';
      }

      if (lowerDescription.includes('返金') ||
          lowerDescription.includes('払戻')) {
        return 'company_refund';
      }

      // Check for bank transfer patterns (usually withdrawals)
      if (lowerDescription.includes('振込') ||
          lowerDescription.includes('振替')) {
        return 'withdraw';
      }
    }

    // Return appropriate default category
    if (mapping.defaultCategory) {
      if (typeof mapping.defaultCategory === 'object') {
        return transactionType === 'income'
          ? mapping.defaultCategory.income
          : mapping.defaultCategory.expense;
      }
      return mapping.defaultCategory;
    }

    // Final fallback
    return transactionType === 'income' ? 'other_income' : 'other_expense';
  }

  // Helper method to check if a transaction is an internal transfer
  isInternalTransfer(description: string): boolean {
    const mapping = this.getColumnMapping();
    const lowerDescription = description.toLowerCase();

    return mapping.internalTransferPatterns.some(pattern => 
      lowerDescription.includes(pattern.toLowerCase())
    );
  }

  // Helper method to check if a transaction is a fee
  isFee(description: string): boolean {
    const mapping = this.getColumnMapping();
    const lowerDescription = description.toLowerCase();

    return mapping.feePatterns.some(pattern => 
      lowerDescription.includes(pattern.toLowerCase())
    );
  }

  // Helper method to get source configuration
  getSourceConfig(sourceType: string) {
    const mapping = this.getColumnMapping();
    return mapping.sources[sourceType] || mapping.customMappings?.[sourceType];
  }

  // Helper method to detect file type based on headers or filename
  detectFileType(headers: string[], fileName: string): string | null {
    const mapping = this.getColumnMapping();

    // First check against filename patterns in sources
    for (const [sourceType, config] of Object.entries(mapping.sources)) {
      if (config.filename) {
        for (const pattern of config.filename) {
          // Convert glob pattern to regex
          const regexPattern = pattern
            .replace(/\./g, '\\.')
            .replace(/\*/g, '.*')
            .replace(/\(/g, '\\(')
            .replace(/\)/g, '\\)');
          const regex = new RegExp(regexPattern, 'i');
          if (regex.test(fileName)) {
            return sourceType;
          }
        }
      }
    }

    // Then check detection rules
    for (const [sourceType, rules] of Object.entries(mapping.detectionRules)) {
      // Check filename pattern
      if (rules.fileNamePattern) {
        const regex = new RegExp(rules.fileNamePattern, 'i');
        if (regex.test(fileName)) {
          return sourceType;
        }
      }

      // Check header patterns
      if (headers.length > 0 && rules.headerPatterns.length > 0) {
        const headerMatch = rules.headerPatterns.every(pattern => 
          headers.some(header => header && header.includes(pattern))
        );
        if (headerMatch) {
          return sourceType;
        }
      }
    }

    return null;
  }
}

// Export singleton instance
export const configLoader = new ConfigLoader();