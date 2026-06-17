import { ApiProperty } from '@nestjs/swagger';

export class TeamLeaderDashboardDto {
  @ApiProperty({ example: 2 }) assignedGroups: number;
  @ApiProperty({ example: 20 }) students: number;
  @ApiProperty({ example: 5 }) pendingVerifications: number;
  @ApiProperty({ example: 10 }) verified: number;
  @ApiProperty({ example: 3 }) rejected: number;
}
