export interface SourceConfig {
  name: string;
  filename?: string[];
  columns: Record<string, number | string>;
  encoding: string;
  skipRows: number;
  dateFormat?: string;
  amountColumns?: {
    withdrawal: number;
    deposit: number;
  };
  accountNumberExtraction?: boolean;
}

export interface DetectionRule {
  headerPatterns: string[];
  fileNamePattern: string;
}

export interface ColumnMapping {
  sources: Record<string, SourceConfig>;
  customMappings?: Record<string, SourceConfig>;
  detectionRules: Record<string, DetectionRule>;
  internalTransferPatterns: string[];
  feePatterns: string[];
}
