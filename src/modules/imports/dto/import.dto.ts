import { ApiProperty } from '@nestjs/swagger';

export class ImportSummaryDto {
  @ApiProperty({ example: 50 })
  total: number;

  @ApiProperty({ example: 48 })
  validRows: number;

  @ApiProperty({ example: 2 })
  errorCount: number;
}

export class ValidationErrorDto {
  @ApiProperty({ example: 5 })
  row: number;

  @ApiProperty({ example: 'email' })
  column: string;

  @ApiProperty({ example: 'Email is required' })
  message: string;

  @ApiProperty({ example: 'user@example.com', nullable: true })
  value?: string;
}

export class ValidationResultDto {
  @ApiProperty({ example: false })
  valid: boolean;

  @ApiProperty({ type: ImportSummaryDto })
  summary: ImportSummaryDto;

  @ApiProperty({ type: [ValidationErrorDto] })
  errors: ValidationErrorDto[];
}

export class ImportResultDto {
  @ApiProperty({ example: 'students' })
  importType: string;

  @ApiProperty({ example: 'success', enum: ['success', 'partial', 'failed'] })
  status: string;

  @ApiProperty({ example: 50 })
  totalRows: number;

  @ApiProperty({ example: 48 })
  successCount: number;

  @ApiProperty({ example: 2 })
  failureCount: number;

  @ApiProperty({ type: [ValidationErrorDto] })
  errors: ValidationErrorDto[];

  @ApiProperty({ example: 'uuid' })
  importHistoryId: string;
}

export class ImportHistoryListItemDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'students' })
  importType: string;

  @ApiProperty({ example: 'students_2025_07_01.xlsx' })
  fileName: string;

  @ApiProperty({ example: 'success' })
  status: string;

  @ApiProperty({ example: 50 })
  totalRows: number;

  @ApiProperty({ example: 50 })
  successCount: number;

  @ApiProperty({ example: 0 })
  failureCount: number;

  @ApiProperty({ example: '2025-07-01T00:00:00.000Z' })
  importedAt: Date;

  @ApiProperty({ example: 'Admin User' })
  importedByName?: string;
}
