import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, MinLength, MaxLength } from 'class-validator';

export class CreateGroupDto {
  @ApiProperty({ example: 'uuid', description: 'Section ID' })
  @IsUUID()
  sectionId: string;

  @ApiProperty({ example: 'Group Alpha', description: 'Group name' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;
}
