import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUrl, IsDateString, MinLength, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class RoundItemDto {
  @ApiProperty({ example: 'Round 1: Online Assessment' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ example: 'https://zoom.us/j/1234567890' })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  link?: string;

  @ApiPropertyOptional({ example: '2026-08-15T10:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional({ example: 'Bring your laptop and a valid ID.' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class SetRoundsDto {
  @ApiProperty({ type: [RoundItemDto] })
  @ValidateNested({ each: true })
  @Type(() => RoundItemDto)
  rounds: RoundItemDto[];
}
