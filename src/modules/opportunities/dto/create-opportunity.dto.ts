import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsBoolean, IsInt, Min, Max, IsEnum, MinLength, MaxLength, IsDateString, IsUrl, IsIn } from 'class-validator';
import { OpportunityType } from '../entities/opportunity.entity';

export enum VisibilityScope {
  GROUP = 'group',
  SECTION = 'section',
}

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

  @ApiPropertyOptional({ example: 'https://company.example.com/careers/apply' })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  applicationLink?: string;

  @ApiPropertyOptional({ example: 'https://zoom.us/j/1234567890', description: 'Zoom/meeting link or an assessment/test link for this opportunity' })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  meetingLink?: string;

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

  @ApiPropertyOptional({
    enum: VisibilityScope,
    description:
      'For team leaders / mentors only: which of their own scopes to publish under. Ignored for admins (always global). Server resolves the actual group/section id from the caller\'s own role assignments — this cannot be used to target someone else\'s group.',
  })
  @IsOptional()
  @IsIn(Object.values(VisibilityScope))
  visibilityScope?: VisibilityScope;
}
