import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AppConfigService } from '../../../config/config.service';
import { User } from '../../users/entities/user.entity';
import { Enrollment } from '../../enrollments/entities/enrollment.entity';
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
import { ImportHistory } from '../entities/import-history.entity';
import { ImportHistoryType, ImportHistoryStatus } from '../entities/import-history.entity';
import { AcademicPeriod } from '../../academic-periods/entities/academic-period.entity';
import { Batch } from '../../batches/entities/batch.entity';

const STUDENT_COLUMNS: ColumnDefinition[] = [
  { key: 'roll_number', label: 'Roll Number', required: true, maxLength: 50 },
  { key: 'name', label: 'Name', required: true, maxLength: 255 },
  { key: 'email', label: 'Email', required: true, maxLength: 320 },
  { key: 'contact_phone', label: 'Contact Phone', required: false, maxLength: 50 },
  { key: 'branch_code', label: 'Branch Code', required: true, maxLength: 20 },
  { key: 'section_code', label: 'Section Code', required: true, maxLength: 50 },
  { key: 'group_name', label: 'Group Name', required: true, maxLength: 100 },
];

@Injectable()
export class StudentsImportService {
  private readonly logger = new Logger(StudentsImportService.name);
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
    const { rows, errors: parseErrors } = await this.excelParser.parse(
      file.buffer,
      STUDENT_COLUMNS,
    );

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

    const duplicateErrors = this.validator.detectRowDuplicates(rows, ['roll_number', 'email']);
    allErrors.push(...duplicateErrors);

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
        importType: ImportHistoryType.STUDENTS,
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

      const activePeriod = await manager.findOne(AcademicPeriod, {
        where: { isActive: true },
      });
      if (!activePeriod) {
        throw new Error('No active academic period found');
      }

      const batch = await manager.findOne(Batch, {
        where: { academicYearId: activePeriod.academicYearId },
        order: { graduationYear: 'DESC' },
      });

      const validRows = validation.rows.filter(
        (r) => !validation.errors.some((e) => e.row === r.rowNumber),
      );

      let successCount = 0;
      const importErrors: ValidationError[] = [];

      for (const row of validRows) {
        try {
          const emailLower = (row.email as string).toLowerCase();
          let user = await manager.findOne(User, {
            where: { email: emailLower },
          });

          if (!user) {
            user = manager.create(User, {
              email: emailLower,
              passwordHash: this.defaultPasswordHash,
              name: row.name as string,
              contactPhone: (row.contact_phone as string) || null,
              isActive: true,
              mustChangePassword: true,
            });
            await manager.save(user);
          }

          const cache = await this.validator.buildCache();
          const branchId = cache.branches.get(row.branch_code as string);
          const sectionId = branchId
            ? cache.sections.get(`${branchId}|${row.section_code}`)
            : undefined;

          if (!branchId || !sectionId) {
            importErrors.push({
              row: row.rowNumber,
              column: 'branch_code',
              message: 'Invalid branch or section reference',
              value: `${row.branch_code}/${row.section_code}`,
            });
            continue;
          }

          let groupId: string | undefined;
          if (row.group_name) {
            groupId = cache.groups.get(`${sectionId}|${row.group_name}`) ?? undefined;
          }

          const existingEnrollment = await manager.findOne(Enrollment, {
            where: { userId: user.id, academicPeriodId: activePeriod.id },
          });

          if (!existingEnrollment) {
            const enrollment = manager.create(Enrollment, {
              userId: user.id,
              academicPeriodId: activePeriod.id,
              branchId,
              sectionId,
              batchId: batch?.id ?? '',
              groupId: groupId ?? null,
              rollNumber: row.roll_number as string,
              isActive: true,
            });
            await manager.save(enrollment);
          }

          successCount++;
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          importErrors.push({
            row: row.rowNumber,
            column: 'general',
            message: `Import failed: ${message}`,
            value: String(row.email ?? ''),
          });
        }
      }

      const failures = validRows.length - successCount + validation.errors.length;

      historyEntry.successCount = successCount;
      historyEntry.failureCount = failures;
      historyEntry.errors = [...validation.errors, ...importErrors];
      historyEntry.status =
        failures === 0
          ? ImportHistoryStatus.SUCCESS
          : successCount > 0
            ? ImportHistoryStatus.PARTIAL
            : ImportHistoryStatus.FAILED;

      await manager.save(historyEntry);
      return historyEntry;
    });

    return {
      importType: 'students',
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

      if (row.group_name) {
        const sectionId = branchId
          ? (cache.sections.get(`${branchId}|${row.section_code}`) ?? null)
          : null;
        this.validator.validateGroup(
          cache,
          row.rowNumber,
          sectionId,
          row.group_name as string,
          errors,
        );
      }

      const email = (row.email as string)?.toLowerCase();
      if (email) {
        const existingUserId = cache.usersByEmail.get(email);
        if (existingUserId) {
          const isEnrolled = cache.enrollments.has(existingUserId);
          if (isEnrolled) {
            errors.push({
              row: row.rowNumber,
              column: 'email',
              message: `Student with email "${email}" is already enrolled`,
              value: email,
            });
          }
        }
      }
    }

    return errors;
  }
}
