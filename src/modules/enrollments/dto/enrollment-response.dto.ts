import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Enrollment } from '../entities/enrollment.entity';

export class EnrollmentResponseDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'uuid' })
  userId: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  userName?: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  userEmail?: string;

  @ApiProperty({ example: 'uuid' })
  academicPeriodId: string;

  @ApiPropertyOptional({ example: '2025 Spring' })
  academicPeriodLabel?: string;

  @ApiProperty({ example: 'uuid' })
  branchId: string;

  @ApiPropertyOptional({ example: 'Computer Science' })
  branchName?: string;

  @ApiProperty({ example: 'uuid' })
  sectionId: string;

  @ApiPropertyOptional({ example: 'A' })
  sectionCode?: string;

  @ApiProperty({ example: 'uuid' })
  batchId: string;

  @ApiPropertyOptional({ example: '2024-2028' })
  batchLabel?: string;

  @ApiPropertyOptional({ example: 'uuid' })
  groupId?: string | null;

  @ApiPropertyOptional({ example: 'Group Alpha' })
  groupName?: string;

  @ApiPropertyOptional({ example: '001', maxLength: 50 })
  rollNumber?: string | null;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2025-01-15T00:00:00.000Z' })
  enrolledAt: Date;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  updatedAt: Date;

  static fromEntity(entity: Enrollment): EnrollmentResponseDto {
    return {
      id: entity.id,
      userId: entity.userId,
      userName: entity.user?.name,
      userEmail: entity.user?.email,
      academicPeriodId: entity.academicPeriodId,
      academicPeriodLabel: entity.academicPeriod?.label,
      branchId: entity.branchId,
      branchName: entity.branch?.name,
      sectionId: entity.sectionId,
      sectionCode: entity.section?.code,
      batchId: entity.batchId,
      batchLabel: entity.batch?.label,
      groupId: entity.groupId,
      groupName: entity.group?.name,
      rollNumber: entity.rollNumber,
      isActive: entity.isActive,
      enrolledAt: entity.enrolledAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
