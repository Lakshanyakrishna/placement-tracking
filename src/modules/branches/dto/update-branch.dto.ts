import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class UpdateBranchDto {
  @ApiPropertyOptional({ example: 'CSE', description: 'Unique branch code' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  @Matches(/^[A-Za-z0-9_]+$/, { message: 'Code must contain only letters, numbers, and underscores' })
  code?: string;

  @ApiPropertyOptional({ example: 'Computer Science & Engineering', description: 'Branch name' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name?: string;
}
