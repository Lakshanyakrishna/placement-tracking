import { ApiProperty } from '@nestjs/swagger';
import { Branch } from '../entities/branch.entity';

export class BranchResponseDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'CSE' })
  code: string;

  @ApiProperty({ example: 'Computer Science & Engineering' })
  name: string;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  updatedAt: Date;

  static fromEntity(entity: Branch): BranchResponseDto {
    return {
      id: entity.id,
      code: entity.code,
      name: entity.name,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
