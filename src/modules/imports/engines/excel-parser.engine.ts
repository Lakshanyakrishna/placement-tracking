import { Injectable, BadRequestException } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { ColumnDefinition, ParsedRow } from '../interfaces/import-types';

@Injectable()
export class ExcelParserEngine {
  async parse(
    buffer: Buffer,
    columns: ColumnDefinition[],
    sheetIndex: number = 0,
  ): Promise<{
    rows: ParsedRow[];
    errors: Array<{ row: number; column: string; message: string; value?: string }>;
  }> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);

    const worksheet = workbook.worksheets[sheetIndex];
    if (!worksheet) {
      throw new BadRequestException('Excel file does not contain any worksheets');
    }

    const headerRow = worksheet.getRow(1);
    const headerMap = this.buildHeaderMap(headerRow, columns);
    const errors: Array<{ row: number; column: string; message: string; value?: string }> = [];
    const rows: ParsedRow[] = [];

    const missingColumns = columns
      .filter((col) => col.required && !headerMap.has(col.key))
      .map((col) => col.label);

    if (missingColumns.length > 0) {
      throw new BadRequestException(`Missing required columns: ${missingColumns.join(', ')}`);
    }

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;

      const parsed: ParsedRow = { rowNumber };
      let hasAnyValue = false;

      for (const col of columns) {
        const cellIndex = headerMap.get(col.key);
        if (cellIndex === undefined) continue;

        const cellValue = row.getCell(cellIndex).value;
        const strValue = this.normalizeCellValue(cellValue);

        if (col.required && !strValue) {
          errors.push({
            row: rowNumber,
            column: col.key,
            message: `${col.label} is required`,
          });
          continue;
        }

        if (strValue) {
          if (col.maxLength && strValue.length > col.maxLength) {
            errors.push({
              row: rowNumber,
              column: col.key,
              message: `${col.label} exceeds maximum length of ${col.maxLength}`,
              value: strValue,
            });
          }

          if (col.allowedValues && !col.allowedValues.includes(strValue)) {
            errors.push({
              row: rowNumber,
              column: col.key,
              message: `${col.label} must be one of: ${col.allowedValues.join(', ')}`,
              value: strValue,
            });
          }

          if (col.pattern && !col.pattern.test(strValue)) {
            errors.push({
              row: rowNumber,
              column: col.key,
              message: `${col.label} has invalid format`,
              value: strValue,
            });
          }
        }

        parsed[col.key] = strValue;
        if (strValue) hasAnyValue = true;
      }

      if (hasAnyValue) {
        rows.push(parsed);
      }
    });

    return { rows, errors };
  }

  private buildHeaderMap(headerRow: ExcelJS.Row, columns: ColumnDefinition[]): Map<string, number> {
    const map = new Map<string, number>();

    headerRow.eachCell((cell, colNumber) => {
      const headerText = this.normalizeCellValue(cell.value);
      if (!headerText) return;

      for (const col of columns) {
        if (col.label.toLowerCase() === headerText.toLowerCase()) {
          map.set(col.key, colNumber);
          break;
        }
      }
    });

    return map;
  }

  private normalizeCellValue(value: unknown): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object' && 'result' in (value as object)) {
      return String((value as { result: unknown }).result ?? '');
    }
    return String(value).trim();
  }
}
