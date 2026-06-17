import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Group } from '../entities/group.entity';

export class GroupResponseDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'uuid' })
  sectionId: string;

  @ApiProperty({ example: 'Group Alpha' })
  name: string;

  @ApiPropertyOptional({ example: 'uuid' })
  teamLeaderUserId: string | null;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  updatedAt: Date;

  @ApiPropertyOptional({ example: 'A' })
  sectionCode?: string;

  @ApiPropertyOptional({ example: 'Computer Science & Engineering' })
  sectionName?: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  teamLeaderName?: string;

  static fromEntity(entity: Group): GroupResponseDto {
    return {
      id: entity.id,
      sectionId: entity.sectionId,
      name: entity.name,
      teamLeaderUserId: entity.teamLeaderUserId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      sectionCode: entity.section?.code,
      sectionName: entity.section?.branch?.name,
      teamLeaderName: entity.teamLeader?.name,
    };
  }
}
