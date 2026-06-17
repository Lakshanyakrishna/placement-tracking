import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class CreateBranchDto {
  @ApiProperty({ example: 'CSE', description: 'Unique branch code' })
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  @Matches(/^[A-Za-z0-9_]+$/, { message: 'Code must contain only letters, numbers, and underscores' })
  code: string;

  @ApiProperty({ example: 'Computer Science & Engineering', description: 'Branch name' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;
}
