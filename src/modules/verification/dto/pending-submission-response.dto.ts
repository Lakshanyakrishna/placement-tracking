import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PendingSubmissionResponseDto {
  @ApiProperty() submissionId: string;
  @ApiProperty() participationId: string;
  @ApiProperty() opportunityTitle: string;
  @ApiProperty() opportunityId: string;
  @ApiProperty() studentName: string;
  @ApiProperty() studentEmail: string;
  @ApiProperty() submittedAt: Date;
  @ApiPropertyOptional() description: string | null;
  @ApiProperty() fileCount: number;
}
