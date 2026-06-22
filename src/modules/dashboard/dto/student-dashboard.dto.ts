import { ApiProperty } from '@nestjs/swagger';

export class StudentDashboardDto {
  @ApiProperty({ example: 8 }) assignedOpportunities: number;
  @ApiProperty({ example: 3 }) inProgress: number;
  @ApiProperty({ example: 2 }) submitted: number;
  @ApiProperty({ example: 2 }) verified: number;
  @ApiProperty({ example: 1 }) completed: number;
  @ApiProperty({ example: 5 }) availableOpportunities: number;
  @ApiProperty({ example: 1 }) rejected: number;
}
