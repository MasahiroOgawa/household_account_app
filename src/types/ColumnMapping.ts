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
  typeValues?: {
    income: string;
    expense: string;
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
  internalTransferExclusions?: string[];
  feePatterns: string[];
}
