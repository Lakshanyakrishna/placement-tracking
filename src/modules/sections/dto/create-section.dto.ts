import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, MinLength, MaxLength, IsOptional } from 'class-validator';

export class CreateSectionDto {
  @ApiProperty()
  @IsUUID()
  academicPeriodId: string;

  @ApiProperty()
  @IsUUID()
  branchId: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  code: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  mentorUserId?: string | null;
}
