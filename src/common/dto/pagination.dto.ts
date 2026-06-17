import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max, IsString, MinLength, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Page number (1-based)', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Sort field (e.g. "name", "-createdAt" for descending)' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  sort?: string = '-createdAt';

  @ApiPropertyOptional({ description: 'Search term for full-text search' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}

export class PaginationMetaDto {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export function createPaginationMeta(total: number, query: PaginationQueryDto): PaginationMetaDto {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const totalPages = Math.ceil(total / limit) || 1;
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

export function parseSort(
  sort: string | undefined,
  defaultSort: string = '-createdAt',
): { field: string; direction: 'ASC' | 'DESC' } {
  const raw = sort || defaultSort;
  const direction = raw.startsWith('-') ? 'DESC' : 'ASC';
  const field = raw.replace(/^-/, '');
  return { field, direction };
}
