import { ApiProperty } from '@nestjs/swagger';
import { Group } from '../../groups/entities/group.entity';

export class TeamLeaderGroupResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() sectionId: string;
  @ApiProperty() name: string;
  @ApiProperty({ nullable: true }) teamLeaderUserId: string | null;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
  @ApiProperty({ example: 'A' }) sectionCode?: string;

  static fromEntity(group: Group): TeamLeaderGroupResponseDto {
    return {
      id: group.id,
      sectionId: group.sectionId,
      name: group.name,
      teamLeaderUserId: group.teamLeaderUserId,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
      sectionCode: (group as any).section?.code,
    };
  }
}
