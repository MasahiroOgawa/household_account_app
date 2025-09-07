import categoryMappingDefault from '../../data/categoryMapping.json';
import columnMappingDefault from '../../data/columnMapping.json';

export interface CategoryMapping {
  mappings: Record<string, string>;
  defaultCategory: string;
  categories: Record<string, {
    name: string;
    type: 'income' | 'expense' | 'transfer';
    color: string;
  }>;
}

export interface ColumnMapping {
  sources: Record<string, {
    name: string;
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
    // Try to load from localStorage first (for user customization)
    const savedCategoryMapping = localStorage.getItem('categoryMapping');
    const savedColumnMapping = localStorage.getItem('columnMapping');

    if (savedCategoryMapping) {
      try {
        this.categoryMapping = JSON.parse(savedCategoryMapping);
      } catch (e) {
        console.warn('Failed to parse saved category mapping, using default');
      }
    }

    if (savedColumnMapping) {
      try {
        this.columnMapping = JSON.parse(savedColumnMapping);
      } catch (e) {
        console.warn('Failed to parse saved column mapping, using default');
      }
    }

    // Use default configs if not found in localStorage
    if (!this.categoryMapping) {
      this.categoryMapping = categoryMappingDefault as CategoryMapping;
    }

    if (!this.columnMapping) {
      this.columnMapping = columnMappingDefault as ColumnMapping;
    }
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
  detectCategory(description: string): string {
    const mapping = this.getCategoryMapping();
    const lowerDescription = description.toLowerCase();

    for (const [keyword, category] of Object.entries(mapping.mappings)) {
      if (lowerDescription.includes(keyword.toLowerCase())) {
        return category;
      }
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
    const lowerFileName = fileName.toLowerCase();

    for (const [sourceType, rules] of Object.entries(mapping.detectionRules)) {
      // Check filename pattern
      if (rules.fileNamePattern && lowerFileName.includes(rules.fileNamePattern.toLowerCase())) {
        return sourceType;
      }

      // Check header patterns
      if (headers.length > 0 && rules.headerPatterns.length > 0) {
        const headerMatch = rules.headerPatterns.every(pattern => 
          headers.some(header => header.includes(pattern))
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