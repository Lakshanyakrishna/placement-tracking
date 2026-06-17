import { ApiProperty } from '@nestjs/swagger';

export class MentorDashboardDto {
  @ApiProperty({ example: 3 }) assignedSections: number;
  @ApiProperty({ example: 90 }) totalStudents: number;
  @ApiProperty({ example: 6 }) opportunitiesActive: number;
  @ApiProperty({ example: 45 }) submitted: number;
  @ApiProperty({ example: 30 }) verified: number;
  @ApiProperty({ example: 8 }) rejected: number;
  @ApiProperty({ example: 66.67 }) completionRate: number;
}
