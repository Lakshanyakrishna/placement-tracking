import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsUUID, IsOptional, ArrayMinSize, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { TargetType } from '../entities/opportunity-target.entity';

export class TargetItemDto {
  @ApiProperty({ enum: TargetType })
  @IsEnum(TargetType)
  targetType: TargetType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  sectionId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  groupId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  batchId?: string;
}

export class SetTargetsDto {
  @ApiProperty({ type: [TargetItemDto] })
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TargetItemDto)
  targets: TargetItemDto[];
}
