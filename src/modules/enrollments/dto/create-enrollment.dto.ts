import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsString, MaxLength, IsBoolean } from 'class-validator';

export class CreateEnrollmentDto {
  @ApiProperty({ example: 'uuid', description: 'User ID' })
  @IsUUID()
  userId: string;

  @ApiProperty({ example: 'uuid', description: 'Academic period ID' })
  @IsUUID()
  academicPeriodId: string;

  @ApiProperty({ example: 'uuid', description: 'Branch ID' })
  @IsUUID()
  branchId: string;

  @ApiProperty({ example: 'uuid', description: 'Section ID' })
  @IsUUID()
  sectionId: string;

  @ApiProperty({ example: 'uuid', description: 'Batch ID' })
  @IsUUID()
  batchId: string;

  @ApiPropertyOptional({ example: 'uuid', description: 'Group ID' })
  @IsOptional()
  @IsUUID()
  groupId?: string;

  @ApiPropertyOptional({ example: '001', description: 'Roll number', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  rollNumber?: string;

  @ApiPropertyOptional({ example: true, description: 'Whether the enrollment is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
