import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Branch } from '../../branches/entities/branch.entity';
import { Section } from '../../sections/entities/section.entity';
import { Group } from '../../groups/entities/group.entity';
import { User } from '../../users/entities/user.entity';
import { Enrollment } from '../../enrollments/entities/enrollment.entity';
import { ValidationError, ParsedRow } from '../interfaces/import-types';

interface LookupCache {
  branches: Map<string, string>;
  sections: Map<string, string>;
  groups: Map<string, string>;
  usersByEmail: Map<string, string>;
  enrollments: Set<string>;
}

@Injectable()
export class ImportValidatorEngine {
  constructor(
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(Section)
    private readonly sectionRepository: Repository<Section>,
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
  ) {}

  async buildCache(): Promise<LookupCache> {
    const [branches, sections, groups, users, enrollments] = await Promise.all([
      this.branchRepository.find({ select: ['id', 'code'] }),
      this.sectionRepository.find({ select: ['id', 'branchId', 'code'] }),
      this.groupRepository.find({ select: ['id', 'sectionId', 'name'] }),
      this.userRepository.find({ select: ['id', 'email'] }),
      this.enrollmentRepository.find({ select: ['userId'], where: { isActive: true } }),
    ]);

    const branchMap = new Map<string, string>();
    for (const b of branches) branchMap.set(b.code, b.id);

    const sectionMap = new Map<string, string>();
    for (const s of sections) sectionMap.set(`${s.branchId}|${s.code}`, s.id);

    const groupMap = new Map<string, string>();
    for (const g of groups) groupMap.set(`${g.sectionId}|${g.name}`, g.id);

    const userEmailMap = new Map<string, string>();
    for (const u of users) userEmailMap.set(u.email, u.id);

    const enrolledUserIds = new Set(enrollments.map((e) => e.userId));

    return {
      branches: branchMap,
      sections: sectionMap,
      groups: groupMap,
      usersByEmail: userEmailMap,
      enrollments: enrolledUserIds,
    };
  }

  validateBranch(
    cache: LookupCache,
    row: number,
    branchCode: string,
    errors: ValidationError[],
  ): string | null {
    if (!branchCode) {
      errors.push({ row, column: 'branch_code', message: 'Branch code is required' });
      return null;
    }

    const branchId = cache.branches.get(branchCode);
    if (!branchId) {
      errors.push({
        row,
        column: 'branch_code',
        message: `Branch "${branchCode}" not found in system`,
        value: branchCode,
      });
      return null;
    }

    return branchId;
  }

  validateSection(
    cache: LookupCache,
    row: number,
    branchId: string | null,
    branchCode: string,
    sectionCode: string,
    errors: ValidationError[],
  ): string | null {
    if (!sectionCode) {
      errors.push({ row, column: 'section_code', message: 'Section code is required' });
      return null;
    }

    if (!branchId) return null;

    const sectionId = cache.sections.get(`${branchId}|${sectionCode}`);
    if (!sectionId) {
      errors.push({
        row,
        column: 'section_code',
        message: `Section "${sectionCode}" not found for branch "${branchCode}"`,
        value: sectionCode,
      });
      return null;
    }

    return sectionId;
  }

  validateGroup(
    cache: LookupCache,
    row: number,
    sectionId: string | null,
    groupName: string,
    errors: ValidationError[],
  ): string | null {
    if (!groupName) {
      errors.push({ row, column: 'group_name', message: 'Group name is required' });
      return null;
    }

    if (!sectionId) return null;

    const groupId = cache.groups.get(`${sectionId}|${groupName}`);
    if (!groupId) {
      errors.push({
        row,
        column: 'group_name',
        message: `Group "${groupName}" not found in the specified section`,
        value: groupName,
      });
      return null;
    }

    return groupId;
  }

  validateEmail(
    cache: LookupCache,
    row: number,
    email: string,
    fieldName: string,
    errors: ValidationError[],
    _checkDuplicate: boolean = false,
  ): string | null {
    if (!email) {
      errors.push({ row, column: fieldName, message: 'Email is required' });
      return null;
    }

    const emailLower = email.toLowerCase();
    const userId = cache.usersByEmail.get(emailLower);

    if (!userId) {
      errors.push({
        row,
        column: fieldName,
        message: `User with email "${email}" not found in system`,
        value: email,
      });
      return null;
    }

    return userId;
  }

  detectRowDuplicates(rows: ParsedRow[], keyFields: string[]): ValidationError[] {
    const errors: ValidationError[] = [];
    const seen = new Map<string, number>();

    for (const row of rows) {
      const key = keyFields
        .map((k) => String(row[k] ?? ''))
        .join('|')
        .toLowerCase();
      if (!key || key === '|'.repeat(keyFields.length - 1)) continue;

      const existingRow = seen.get(key);
      if (existingRow) {
        errors.push({
          row: row.rowNumber,
          column: keyFields.join(', '),
          message: `Duplicate ${keyFields.join(', ')} combination (also appears on row ${existingRow})`,
          value: key,
        });
      } else {
        seen.set(key, row.rowNumber);
      }
    }

    return errors;
  }
}
