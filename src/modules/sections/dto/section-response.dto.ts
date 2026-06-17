import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Section } from '../entities/section.entity';

export class SectionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  academicPeriodId: string;

  @ApiProperty()
  branchId: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  mentorUserId: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  branchName?: string;

  @ApiPropertyOptional()
  academicPeriodName?: string;

  @ApiPropertyOptional()
  mentorName?: string;

  static fromEntity(entity: Section): SectionResponseDto {
    return {
      id: entity.id,
      academicPeriodId: entity.academicPeriodId,
      branchId: entity.branchId,
      code: entity.code,
      mentorUserId: entity.mentorUserId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      branchName: entity.branch?.name,
      academicPeriodName: entity.academicPeriod?.label,
      mentorName: entity.mentor?.name,
    };
  }
}
