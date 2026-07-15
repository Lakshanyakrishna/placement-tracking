import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AppConfigService } from '../../../config/config.service';
import { User } from '../../users/entities/user.entity';
import { Section } from '../../sections/entities/section.entity';
import { RoleAssignment } from '../../iam/entities/role-assignment.entity';
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

const MENTOR_COLUMNS: ColumnDefinition[] = [
  { key: 'name', label: 'Name', required: true, maxLength: 255 },
  { key: 'email', label: 'Email', required: true, maxLength: 320 },
  { key: 'contact_phone', label: 'Contact Phone', required: false, maxLength: 50 },
  { key: 'branch_code', label: 'Branch Code', required: true, maxLength: 20 },
  { key: 'section_code', label: 'Section Code', required: true, maxLength: 50 },
];

@Injectable()
export class MentorsImportService {
  private readonly logger = new Logger(MentorsImportService.name);
  private readonly defaultPasswordHash: string;

  constructor(
    private readonly excelParser: ExcelParserEngine,
    private readonly validator: ImportValidatorEngine,
    private readonly config: AppConfigService,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {
    const defaultPassword = process.env.SEED_PASSWORD || 'dev-only-password';
    this.defaultPasswordHash = bcrypt.hashSync(defaultPassword, config.auth.bcryptRounds);
  }

  async validate(file: ImportFile): Promise<ValidationResult> {
    const { rows, errors: parseErrors } = await this.excelParser.parse(file.buffer, MENTOR_COLUMNS);

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

    const duplicateErrors = this.validator.detectRowDuplicates(rows, ['email']);
    allErrors.push(...duplicateErrors);

    const sectionDuplicates = this.checkSectionDuplicates(cache, rows);
    allErrors.push(...sectionDuplicates);

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
        importType: ImportHistoryType.MENTORS,
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
          const email = (row.email as string).toLowerCase();
          let user = await manager.findOne(User, {
            where: { email },
          });

          if (!user) {
            user = manager.create(User, {
              email,
              passwordHash: this.defaultPasswordHash,
              name: row.name as string,
              contactPhone: (row.contact_phone as string) || null,
              isActive: true,
            });
            await manager.save(user);
          }

          const branchId = cache.branches.get(row.branch_code as string);
          if (!branchId) continue;

          const sectionId = cache.sections.get(`${branchId}|${row.section_code}`);
          if (!sectionId) continue;

          const existingRole = await manager.findOne(RoleAssignment, {
            where: {
              userId: user.id,
              role: 'mentor' as any,
              scopeType: 'section' as any,
              scopeId: sectionId,
            } as any,
          });

          if (!existingRole) {
            const roleAssignment = manager.create(RoleAssignment, {
              userId: user.id,
              role: 'mentor' as any,
              scopeType: 'section' as any,
              scopeId: sectionId,
              grantedBy: requestedBy,
              validFrom: new Date(),
              validTo: null,
            } as any);
            await manager.save(roleAssignment);
          }

          await manager.update(Section, { id: sectionId }, { mentorUserId: user.id });

          successCount++;
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          importErrors.push({
            row: row.rowNumber,
            column: 'email',
            message: `Failed to assign mentor: ${message}`,
            value: row.email as string,
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
      importType: 'mentors',
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

  private checkSectionDuplicates(
    cache: Awaited<ReturnType<ImportValidatorEngine['buildCache']>>,
    rows: ParsedRow[],
  ): ValidationError[] {
    const errors: ValidationError[] = [];
    const assigned = new Map<string, number>();

    for (const row of rows) {
      const branchId = cache.branches.get(row.branch_code as string);
      if (!branchId) continue;

      const sectionId = cache.sections.get(`${branchId}|${row.section_code}`);
      if (!sectionId) continue;

      const existingRow = assigned.get(sectionId);
      if (existingRow) {
        errors.push({
          row: row.rowNumber,
          column: 'section_code',
          message: `Section already has a mentor assigned on row ${existingRow}`,
          value: `${row.branch_code}-${row.section_code}`,
        });
      } else {
        assigned.set(sectionId, row.rowNumber);
      }
    }

    return errors;
  }
}
