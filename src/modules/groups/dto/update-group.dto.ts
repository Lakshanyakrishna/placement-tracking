import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MinLength, MaxLength } from 'class-validator';

export class UpdateGroupDto {
  @ApiPropertyOptional({ description: 'Section ID' })
  @IsOptional()
  @IsUUID()
  sectionId?: string;

  @ApiPropertyOptional({ example: 'Group Alpha', description: 'Group name' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: 'Team leader user ID' })
  @IsOptional()
  @IsUUID()
  teamLeaderUserId?: string;
}
