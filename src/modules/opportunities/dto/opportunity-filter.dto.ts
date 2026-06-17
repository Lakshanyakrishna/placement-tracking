import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsUUID, IsString } from 'class-validator';
import { OpportunityState, OpportunityType } from '../entities/opportunity.entity';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class OpportunityFilterDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: OpportunityType })
  @IsOptional()
  @IsEnum(OpportunityType)
  type?: OpportunityType;

  @ApiPropertyOptional({ enum: OpportunityState })
  @IsOptional()
  @IsEnum(OpportunityState)
  status?: OpportunityState;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  branch?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  section?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  batch?: string;
}
