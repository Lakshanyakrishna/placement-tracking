import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsBoolean, IsInt, Min, Max, IsEnum, MinLength, MaxLength, IsDateString } from 'class-validator';
import { OpportunityType } from '../entities/opportunity.entity';

export class CreateOpportunityDto {
  @ApiProperty({ example: 'Summer Internship 2026' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ example: 'A 3-month internship program for 3rd year students' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: OpportunityType, example: OpportunityType.INTERNSHIP })
  @IsEnum(OpportunityType)
  opportunityType: OpportunityType;

  @ApiProperty({ example: 'uuid-of-academic-period' })
  @IsUUID()
  academicPeriodId: string;

  @ApiPropertyOptional({ example: '2026-06-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  opensAt?: string;

  @ApiPropertyOptional({ example: '2026-08-31T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  closesAt?: string;

  @ApiPropertyOptional({ example: '7 days' })
  @IsOptional()
  @IsString()
  verificationDeadline?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  requireProof?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  maxSubmissions?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  allowGroupSubmission?: boolean;
}
