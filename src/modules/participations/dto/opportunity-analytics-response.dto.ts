import { ApiProperty } from '@nestjs/swagger';

export class GroupRegistrationDto {
  @ApiProperty() groupId: string;
  @ApiProperty() groupName: string;
  @ApiProperty({ nullable: true }) teamLeaderName: string | null;
  @ApiProperty() registeredCount: number;
  @ApiProperty({ type: Object }) statusBreakdown: Record<string, number>;
}

export class OpportunityAnalyticsResponseDto {
  @ApiProperty() opportunityId: string;
  @ApiProperty() opportunityTitle: string;
  @ApiProperty() totalRegistered: number;
  @ApiProperty({ type: [GroupRegistrationDto] }) groups: GroupRegistrationDto[];
}
