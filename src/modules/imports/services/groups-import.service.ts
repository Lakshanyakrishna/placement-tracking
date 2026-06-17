import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Group } from '../../groups/entities/group.entity';
import { ExcelParserEngine } from '../engines/excel-parser.engine';
import { ImportValidatorEngine } from '../engines/import-validator.engine';
import {
  ColumnDefinition,
  ValidationResult,
  ImportResult,
  ValidationError,
  ImportFile,
  ParsedRow,
} from '../interfaces/import-types';
import {
  ImportHistory,
  ImportHistoryType,
  ImportHistoryStatus,
} from '../entities/import-history.entity';

const GROUP_COLUMNS: ColumnDefinition[] = [
  { key: 'branch_code', label: 'Branch Code', required: true, maxLength: 20 },
  { key: 'section_code', label: 'Section Code', required: true, maxLength: 50 },
  { key: 'group_name', label: 'Group Name', required: true, maxLength: 100 },
];

@Injectable()
export class GroupsImportService {
  private readonly logger = new Logger(GroupsImportService.name);

  constructor(
    private readonly excelParser: ExcelParserEngine,
    private readonly validator: ImportValidatorEngine,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async validate(file: ImportFile): Promise<ValidationResult> {
    const { rows, errors: parseErrors } = await this.excelParser.parse(file.buffer, GROUP_COLUMNS);

    const allErrors = [...parseErrors];
    if (allErrors.length > 0) {
      return {
        valid: false,
        rows,
        errors: allErrors,
        summary: { total: rows.length, validRows: 0, errorCount: allErrors.length },
      };
    }

    const cache = await this.validator.buildCache();
    const rowErrors = this.validateRows(cache, rows);
    allErrors.push(...rowErrors);

    const duplicateErrors = this.validator.detectRowDuplicates(rows, [
      'branch_code',
      'section_code',
      'group_name',
    ]);
    allErrors.push(...duplicateErrors);

    const existingDuplicates = this.checkExistingInDb(cache, rows);
    allErrors.push(...existingDuplicates);

    const validRowCount = rows.length - new Set(allErrors.map((e) => e.row)).size;

    return {
      valid: allErrors.length === 0,
      rows,
      errors: allErrors,
      summary: { total: rows.length, validRows: validRowCount, errorCount: allErrors.length },
    };
  }

  async import(file: ImportFile, requestedBy: string): Promise<ImportResult> {
    const validation = await this.validate(file);

    const history = await this.dataSource.transaction(async (manager) => {
      const historyEntry = manager.create(ImportHistory, {
        importType: ImportHistoryType.GROUPS,
        fileName: file.originalname,
        status: ImportHistoryStatus.FAILED,
        totalRows: validation.summary.total,
        successCount: 0,
        failureCount: validation.summary.errorCount,
        errors: validation.errors,
        importedBy: requestedBy,
      });
      await manager.save(historyEntry);

      if (!validation.valid || validation.summary.validRows === 0) {
        return historyEntry;
      }

      const cache = await this.validator.buildCache();
      const validRows = validation.rows.filter(
        (r) => !validation.errors.some((e) => e.row === r.rowNumber),
      );

      let successCount = 0;
      const importErrors: ValidationError[] = [];

      for (const row of validRows) {
        try {
          const branchId = cache.branches.get(row.branch_code as string);
          if (!branchId) continue;

          const sectionId = cache.sections.get(`${branchId}|${row.section_code}`);
          if (!sectionId) continue;

          const existingGroupKey = `${sectionId}|${row.group_name}`;
          if (cache.groups.has(existingGroupKey)) continue;

          const group = manager.create(Group, {
            sectionId,
            name: row.group_name as string,
          });
          await manager.save(group);
          successCount++;
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          importErrors.push({
            row: row.rowNumber,
            column: 'group_name',
            message: `Failed to create group: ${message}`,
            value: row.group_name as string,
          });
        }
      }

      const totalFailures = validation.errors.length + importErrors.length;
      historyEntry.successCount = successCount;
      historyEntry.failureCount = totalFailures;
      historyEntry.errors = [...validation.errors, ...importErrors];
      historyEntry.status =
        totalFailures === 0
          ? ImportHistoryStatus.SUCCESS
          : successCount > 0
            ? ImportHistoryStatus.PARTIAL
            : ImportHistoryStatus.FAILED;

      await manager.save(historyEntry);
      return historyEntry;
    });

    return {
      importType: 'groups',
      status: history.status,
      totalRows: history.totalRows,
      successCount: history.successCount,
      failureCount: history.failureCount,
      errors: history.errors ?? [],
      importHistoryId: history.id,
    };
  }

  private validateRows(
    cache: Awaited<ReturnType<ImportValidatorEngine['buildCache']>>,
    rows: ParsedRow[],
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    for (const row of rows) {
      const branchId = this.validator.validateBranch(
        cache,
        row.rowNumber,
        row.branch_code as string,
        errors,
      );

      this.validator.validateSection(
        cache,
        row.rowNumber,
        branchId,
        row.branch_code as string,
        row.section_code as string,
        errors,
      );
    }

    return errors;
  }

  private checkExistingInDb(
    cache: Awaited<ReturnType<ImportValidatorEngine['buildCache']>>,
    rows: ParsedRow[],
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    for (const row of rows) {
      const branchId = cache.branches.get(row.branch_code as string);
      if (!branchId) continue;

      const sectionId = cache.sections.get(`${branchId}|${row.section_code}`);
      if (!sectionId) continue;

      const groupKey = `${sectionId}|${row.group_name}`;
      if (cache.groups.has(groupKey)) {
        errors.push({
          row: row.rowNumber,
          column: 'group_name',
          message: `Group "${row.group_name}" already exists in this section`,
          value: row.group_name as string,
        });
      }
    }

    return errors;
  }
}
