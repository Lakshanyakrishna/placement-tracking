import { ApiProperty } from '@nestjs/swagger';

export class AdminDashboardDto {
  @ApiProperty({ example: 500 }) totalStudents: number;
  @ApiProperty({ example: 25 }) totalOpportunities: number;
  @ApiProperty({ example: 12 }) activeOpportunities: number;
  @ApiProperty({ example: 1200 }) participations: number;
  @ApiProperty({ example: 300 }) submitted: number;
  @ApiProperty({ example: 200 }) verified: number;
  @ApiProperty({ example: 50 }) rejected: number;
  @ApiProperty({ example: 66.67 }) completionRate: number;
}
