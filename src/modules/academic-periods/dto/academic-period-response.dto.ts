import { ApiProperty } from '@nestjs/swagger';
import { AcademicPeriod, AcademicPeriodType } from '../entities/academic-period.entity';

export class AcademicPeriodResponseDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Semester 2 (2025-2026)' })
  label: string;

  @ApiProperty({ enum: AcademicPeriodType })
  type: AcademicPeriodType;

  @ApiProperty({ example: '2026-01-01' })
  startDate: Date;

  @ApiProperty({ example: '2026-12-31' })
  endDate: Date;

  @ApiProperty()
  isActive: boolean;

  static fromEntity(entity: AcademicPeriod): AcademicPeriodResponseDto {
    return {
      id: entity.id,
      label: entity.label,
      type: entity.type,
      startDate: entity.startDate,
      endDate: entity.endDate,
      isActive: entity.isActive,
    };
  }
}
