import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ParticipationStatus } from '../entities/participation.entity';

export class UpdateParticipationStatusDto {
  @ApiProperty({ enum: ParticipationStatus })
  @IsEnum(ParticipationStatus)
  status: ParticipationStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
