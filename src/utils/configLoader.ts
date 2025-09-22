import categoryMappingDefault from '../../data/categoryMapping.json';
import { columnMappingData } from './columnMappingData';

export interface CategoryMapping {
  mappings: Record<string, string>;
  defaultCategory: string | { income: string; expense: string };
  categories: Record<string, {
    name: string;
    type: 'income' | 'expense' | 'transfer';
    color: string;
  }> | {
    income: Record<string, { name: string; color: string }>;
    expense: Record<string, { name: string; color: string }>;
  };
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
    // console.log('[ConfigLoader] Using hardcoded column mapping with sources:', Object.keys(this.columnMapping.sources));
    
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
      return mapping.mappings[description];
    }

    // Then check for partial matches
    const lowerDescription = description.toLowerCase();
    for (const [keyword, category] of Object.entries(mapping.mappings)) {
      if (lowerDescription.includes(keyword.toLowerCase())) {
        return category;
      }
    }

    // Return appropriate default category
    if (typeof mapping.defaultCategory === 'object') {
      return transactionType === 'income'
        ? mapping.defaultCategory.income
        : mapping.defaultCategory.expense;
    }
    return mapping.defaultCategory;
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

    // console.log(`Detecting file type for: ${fileName}`);
    // console.log(`Headers (first 5):`, headers.slice(0, 5));

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
            // console.log(`Filename matched pattern "${pattern}" for type: ${sourceType}`);
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
          // console.log(`Headers matched patterns for type: ${sourceType}`);
          return sourceType;
        }
      }
    }

    return null;
  }
}

// Export singleton instance
export const configLoader = new ConfigLoader();