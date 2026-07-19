import { ApiProperty } from '@nestjs/swagger';
import { OpportunityRound } from '../entities/opportunity-round.entity';

export class RoundResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() opportunityId: string;
  @ApiProperty() title: string;
  @ApiProperty({ nullable: true }) link: string | null;
  @ApiProperty({ nullable: true }) scheduledAt: Date | null;
  @ApiProperty() notes: string;
  @ApiProperty() sequence: number;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;

  static fromEntity(round: OpportunityRound): RoundResponseDto {
    return {
      id: round.id,
      opportunityId: round.opportunityId,
      title: round.title,
      link: round.link,
      scheduledAt: round.scheduledAt,
      notes: round.notes,
      sequence: round.sequence,
      createdAt: round.createdAt,
      updatedAt: round.updatedAt,
    };
  }
}
