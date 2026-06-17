export interface ImportFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

export interface ValidationError {
  row: number;
  column: string;
  message: string;
  value?: string;
}

export interface ValidationResult {
  valid: boolean;
  rows: ParsedRow[];
  errors: ValidationError[];
  summary: {
    total: number;
    validRows: number;
    errorCount: number;
  };
}

export interface ImportResult {
  importType: string;
  status: string;
  totalRows: number;
  successCount: number;
  failureCount: number;
  errors: ValidationError[];
  importHistoryId: string;
}

export interface ParsedRow {
  rowNumber: number;
  [key: string]: unknown;
}

export interface ColumnDefinition {
  key: string;
  label: string;
  required: boolean;
  maxLength?: number;
  allowedValues?: string[];
  pattern?: RegExp;
}
