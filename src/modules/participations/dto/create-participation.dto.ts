import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateParticipationDto {
  @ApiProperty({ example: 'uuid-of-opportunity' })
  @IsUUID()
  opportunityId: string;
}
