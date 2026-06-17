import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength, IsArray, IsObject } from 'class-validator';

export class CreateSubmissionDto {
  @ApiProperty({ example: 'uuid-of-participation' })
  @IsUUID()
  participationId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ type: Object, description: 'JSON object of external links' })
  @IsOptional()
  @IsObject()
  externalLinks?: Record<string, string>;
}
