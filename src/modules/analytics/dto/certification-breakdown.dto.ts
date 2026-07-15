import { ApiProperty } from '@nestjs/swagger';

export class CertificationOpportunityBreakdownDto {
  @ApiProperty() opportunityId: string;
  @ApiProperty() title: string;
  @ApiProperty() opportunityType: string;
  @ApiProperty() state: string;
  @ApiProperty() totalStudents: number;
  @ApiProperty() notStarted: number;
  @ApiProperty() inProgress: number;
  @ApiProperty() submitted: number;
  @ApiProperty() verified: number;
  @ApiProperty() completed: number;
  @ApiProperty() rejected: number;
  @ApiProperty() completionRate: number;
}

export class GroupCertificationSummaryDto {
  @ApiProperty() groupId: string;
  @ApiProperty() groupName: string;
  @ApiProperty({ nullable: true }) teamLeaderName: string | null;
  @ApiProperty({ type: [CertificationOpportunityBreakdownDto] }) certifications: CertificationOpportunityBreakdownDto[];
}
